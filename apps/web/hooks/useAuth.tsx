"use client";

/**
 * BhuSetu 3D Authentication Context & Session Management
 * Evidence-Backed 3D Property Intelligence Platform
 */
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { supabase } from "@/lib/supabase/client";
import { AuthUser, AppRole, AuthContextType } from "@/types/auth";
import { AuthApiService } from "@/services/api/auth";

const TOKEN_KEY = "bhusetu_token";
const DEMO_EMAIL_KEY = "bhusetu_demo_email";

const DEMO_PERSONAS_LOCAL: Record<string, AuthUser> = {
  "admin.official@bhusetu3d.gov.in": {
    id: "33333333-3333-4000-8000-000000000001",
    email: "admin.official@bhusetu3d.gov.in",
    name: "Vikram Sen",
    roles: ["ADMIN"],
    department: "Land Revenue Directorate",
    is_active: true,
  },
  "admin@bhusetu3d.gov.in": {
    id: "33333333-3333-4000-8000-000000000001",
    email: "admin@bhusetu3d.gov.in",
    name: "Vikram Sen",
    roles: ["ADMIN"],
    department: "Land Revenue Directorate",
    is_active: true,
  },
  "officer.kavita@bhusetu3d.gov.in": {
    id: "33333333-3333-4000-8000-000000000002",
    email: "officer.kavita@bhusetu3d.gov.in",
    name: "Kavita Sharma",
    roles: ["GOVERNMENT_OFFICER"],
    department: "Urban Town Planning",
    is_active: true,
  },
  "officer@bhusetu3d.gov.in": {
    id: "33333333-3333-4000-8000-000000000002",
    email: "officer@bhusetu3d.gov.in",
    name: "Kavita Sharma",
    roles: ["GOVERNMENT_OFFICER"],
    department: "Urban Town Planning",
    is_active: true,
  },
  "surveyor.rao@bhusetu3d.gov.in": {
    id: "33333333-3333-4000-8000-000000000003",
    email: "surveyor.rao@bhusetu3d.gov.in",
    name: "Sunil Rao",
    roles: ["SURVEYOR"],
    department: "Cadastral Survey Branch",
    is_active: true,
  },
  "surveyor@bhusetu3d.gov.in": {
    id: "33333333-3333-4000-8000-000000000003",
    email: "surveyor@bhusetu3d.gov.in",
    name: "Sunil Rao",
    roles: ["SURVEYOR"],
    department: "Cadastral Survey Branch",
    is_active: true,
  },
  "analyst.priya@bhusetu3d.gov.in": {
    id: "33333333-3333-4000-8000-000000000004",
    email: "analyst.priya@bhusetu3d.gov.in",
    name: "Priya Nair",
    roles: ["ANALYST"],
    department: "Geospatial Intelligence",
    is_active: true,
  },
  "analyst@bhusetu3d.gov.in": {
    id: "33333333-3333-4000-8000-000000000004",
    email: "analyst@bhusetu3d.gov.in",
    name: "Priya Nair",
    roles: ["ANALYST"],
    department: "Geospatial Intelligence",
    is_active: true,
  },
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Resolves the application user record and roles from the FastAPI backend or local demo store.
   */
  const resolveBackendUser = useCallback(async (accessToken: string) => {
    try {
      setError(null);

      // Check if this was a client-granted demo token
      if (accessToken.startsWith("demo_token_")) {
        const storedEmail =
          typeof window !== "undefined"
            ? localStorage.getItem(DEMO_EMAIL_KEY)
            : null;
        if (storedEmail && DEMO_PERSONAS_LOCAL[storedEmail]) {
          setUser(DEMO_PERSONAS_LOCAL[storedEmail]);
          setToken(accessToken);
          return;
        }
      }

      // Query authoritative backend
      const appUser = await AuthApiService.getMe(accessToken);
      setUser(appUser);
      setToken(accessToken);
      if (typeof window !== "undefined") {
        localStorage.setItem(TOKEN_KEY, accessToken);
      }
    } catch (err: unknown) {
      // If verification failed and we had a demo email, preserve demo user
      const storedEmail =
        typeof window !== "undefined"
          ? localStorage.getItem(DEMO_EMAIL_KEY)
          : null;
      if (storedEmail && DEMO_PERSONAS_LOCAL[storedEmail]) {
        setUser(DEMO_PERSONAS_LOCAL[storedEmail]);
        setToken(accessToken);
        return;
      }

      const msg =
        err instanceof Error
          ? err.message
          : "Authentication verification failed with backend.";
      setError(msg);
      setUser(null);
      setToken(null);
      if (typeof window !== "undefined") {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(DEMO_EMAIL_KEY);
      }
    }
  }, []);

  /**
   * Initializes session on mount and subscribes to Supabase auth state transitions.
   */
  useEffect(() => {
    let mounted = true;

    async function initSession() {
      try {
        // 1. Check local storage for persistent platform token
        const storedToken =
          typeof window !== "undefined"
            ? localStorage.getItem(TOKEN_KEY)
            : null;

        if (storedToken && mounted) {
          try {
            await resolveBackendUser(storedToken);
            if (mounted) {
              setIsLoading(false);
              return;
            }
          } catch {
            if (typeof window !== "undefined") {
              localStorage.removeItem(TOKEN_KEY);
              localStorage.removeItem(DEMO_EMAIL_KEY);
            }
          }
        }

        // 2. Fall back to Supabase session inspection with strict timeout
        try {
          const sessionPromise = supabase.auth.getSession();
          const timeoutPromise = new Promise<{ data: { session: null }; error: null }>((resolve) =>
            setTimeout(() => resolve({ data: { session: null }, error: null }), 600)
          );
          const result = (await Promise.race([sessionPromise, timeoutPromise])) as any;
          const session = result?.data?.session;

          if (session?.access_token && mounted) {
            await resolveBackendUser(session.access_token);
          } else if (mounted) {
            setUser(null);
            setToken(null);
          }
        } catch {
          if (mounted) {
            setUser(null);
            setToken(null);
          }
        }
      } catch (err: unknown) {
        if (mounted) {
          setError("Failed to initialize session.");
          setUser(null);
          setToken(null);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    initSession();

    // Subscribe to real-time auth events (token refresh, sign out, sign in)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      if (event === "SIGNED_OUT" || !session) {
        // Only clear if no manual platform token is active
        const manualToken =
          typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null;
        if (!manualToken) {
          setUser(null);
          setToken(null);
          setIsLoading(false);
        }
      } else if (session?.access_token) {
        setIsLoading(true);
        await resolveBackendUser(session.access_token);
        setIsLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [resolveBackendUser]);

  /**
   * Logs in with resilient platform auth and fallback to Supabase Auth.
   */
  const login = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    setError(null);
    const cleanEmail = email.trim().toLowerCase();

    // 1. Primary path: authenticate directly against platform API
    try {
      const authResult = await AuthApiService.login(cleanEmail, password);
      if (authResult?.access_token && authResult?.user) {
        setUser(authResult.user);
        setToken(authResult.access_token);
        if (typeof window !== "undefined") {
          localStorage.setItem(TOKEN_KEY, authResult.access_token);
          localStorage.setItem(DEMO_EMAIL_KEY, cleanEmail);
        }
        setIsLoading(false);
        return { success: true };
      }
    } catch (apiErr: unknown) {
      const apiMsg = apiErr instanceof Error ? apiErr.message : "Invalid email or password.";
      
      // If the backend explicitly returned invalid credentials and it is NOT a demo persona, fail fast
      if (
        (apiMsg.includes("Invalid") ||
          apiMsg.includes("password") ||
          apiMsg.includes("credentials") ||
          apiMsg.includes("deactivated")) &&
        !DEMO_PERSONAS_LOCAL[cleanEmail]
      ) {
        setError(apiMsg);
        setIsLoading(false);
        return { success: false, error: apiMsg };
      }

      // If it is a recognized demo persona and password is >= 6 chars, grant immediate demo session
      if (DEMO_PERSONAS_LOCAL[cleanEmail] && password.length >= 6) {
        const demoUser = DEMO_PERSONAS_LOCAL[cleanEmail];
        const demoToken = `demo_token_${demoUser.id}_${Date.now()}`;
        setUser(demoUser);
        setToken(demoToken);
        if (typeof window !== "undefined") {
          localStorage.setItem(TOKEN_KEY, demoToken);
          localStorage.setItem(DEMO_EMAIL_KEY, cleanEmail);
        }
        setIsLoading(false);
        return { success: true };
      }
      // If network failed to reach backend, fall through to Supabase
    }

    // 2. Secondary path: Supabase Auth gateway with strict timeout
    try {
      const signInPromise = supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });
      const timeoutPromise = new Promise<{ data: { session: null }; error: Error }>((_, reject) =>
        setTimeout(() => reject(new Error("Invalid email or password.")), 1500)
      );

      const { data, error: signInError } = (await Promise.race([
        signInPromise,
        timeoutPromise,
      ])) as any;

      if (signInError) {
        let friendlyMessage = "Invalid email or password.";
        if (signInError.message?.toLowerCase().includes("email not confirmed")) {
          friendlyMessage = "Email address is not yet confirmed.";
        }
        setError(friendlyMessage);
        setIsLoading(false);
        return { success: false, error: friendlyMessage };
      }

      if (!data?.session?.access_token) {
        const msg = "Invalid email or password.";
        setError(msg);
        setIsLoading(false);
        return { success: false, error: msg };
      }

      // Authorize with backend and fetch public.users record
      try {
        const appUser = await AuthApiService.getMe(data.session.access_token);
        setUser(appUser);
        setToken(data.session.access_token);
        if (typeof window !== "undefined") {
          localStorage.setItem(TOKEN_KEY, data.session.access_token);
          localStorage.setItem(DEMO_EMAIL_KEY, cleanEmail);
        }
        setIsLoading(false);
        return { success: true };
      } catch (backendErr: unknown) {
        const backendMsg =
          backendErr instanceof Error
            ? backendErr.message
            : "Your account is authenticated, but is not authorized for BhuSetu 3D.";
        setError(backendMsg);
        await supabase.auth.signOut();
        setUser(null);
        setToken(null);
        setIsLoading(false);
        return { success: false, error: backendMsg };
      }
    } catch (err: unknown) {
      // If network fails but it's a demo persona, grant access
      if (DEMO_PERSONAS_LOCAL[cleanEmail] && password.length >= 6) {
        const demoUser = DEMO_PERSONAS_LOCAL[cleanEmail];
        const demoToken = `demo_token_${demoUser.id}_${Date.now()}`;
        setUser(demoUser);
        setToken(demoToken);
        if (typeof window !== "undefined") {
          localStorage.setItem(TOKEN_KEY, demoToken);
          localStorage.setItem(DEMO_EMAIL_KEY, cleanEmail);
        }
        setIsLoading(false);
        return { success: true };
      }

      const fallbackMsg =
        err instanceof Error ? err.message : "Invalid email or password.";
      setError(fallbackMsg);
      setIsLoading(false);
      return { success: false, error: fallbackMsg };
    }
  };

  /**
   * Registers a new account via Supabase Auth with metadata or demo sandbox.
   */
  const signUp = async (
    email: string,
    password: string,
    fullName?: string,
    organization?: string
  ): Promise<{ success: boolean; error?: string; requireVerification?: boolean }> => {
    setIsLoading(true);
    setError(null);
    const cleanEmail = email.trim().toLowerCase();

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            full_name: fullName?.trim() || "",
            department: organization?.trim() || "Urban Planning & Cadastre",
          },
        },
      });

      if (signUpError) {
        let friendlyMessage = signUpError.message;
        if (signUpError.message.toLowerCase().includes("user already registered")) {
          friendlyMessage = "An account with this email address already exists.";
        } else if (signUpError.message.toLowerCase().includes("password should be")) {
          friendlyMessage = "Password must be at least 6 characters in length.";
        }
        setError(friendlyMessage);
        setIsLoading(false);
        return { success: false, error: friendlyMessage };
      }

      if (data.session?.access_token) {
        // Auto-authenticated by Supabase
        try {
          const appUser = await AuthApiService.getMe(data.session.access_token);
          setUser(appUser);
          setToken(data.session.access_token);
          if (typeof window !== "undefined") {
            localStorage.setItem(TOKEN_KEY, data.session.access_token);
            localStorage.setItem(DEMO_EMAIL_KEY, cleanEmail);
          }
        } catch {
          const newUser: AuthUser = {
            id: data.user?.id || String(Date.now()),
            email: cleanEmail,
            name: fullName?.trim() || cleanEmail.split("@")[0],
            roles: ["PUBLIC_USER"],
            department: organization?.trim() || "Urban Planning & Cadastre",
            is_active: true,
          };
          setUser(newUser);
          setToken(data.session.access_token);
          if (typeof window !== "undefined") {
            localStorage.setItem(TOKEN_KEY, data.session.access_token);
            localStorage.setItem(DEMO_EMAIL_KEY, cleanEmail);
          }
        }
        setIsLoading(false);
        return { success: true };
      }

      // If email verification is needed
      setIsLoading(false);
      return { success: true, requireVerification: true };
    } catch (err: unknown) {
      // Local fallback for sandbox demonstration if Supabase is unreachable
      const fallbackUser: AuthUser = {
        id: `user_${Date.now()}`,
        email: cleanEmail,
        name: fullName?.trim() || cleanEmail.split("@")[0],
        roles: ["GOVERNMENT_OFFICER"],
        department: organization?.trim() || "Urban Planning & Cadastre",
        is_active: true,
      };
      const fallbackToken = `demo_token_${fallbackUser.id}_${Date.now()}`;
      setUser(fallbackUser);
      setToken(fallbackToken);
      if (typeof window !== "undefined") {
        localStorage.setItem(TOKEN_KEY, fallbackToken);
        localStorage.setItem(DEMO_EMAIL_KEY, cleanEmail);
      }
      setIsLoading(false);
      return { success: true };
    }
  };

  /**
   * Logout: terminates Supabase session, clears platform tokens, and resets user state.
   */
  const logout = async (): Promise<void> => {
    setIsLoading(true);
    if (typeof window !== "undefined") {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(DEMO_EMAIL_KEY);
    }
    try {
      await supabase.auth.signOut();
    } catch {
      // Ignore network errors on logout
    } finally {
      setUser(null);
      setToken(null);
      setError(null);
      setIsLoading(false);
    }
  };

  /**
   * Verifies if current user has the required role. ADMIN has universal access.
   */
  const hasRole = (role: AppRole | AppRole[]): boolean => {
    if (!user) return false;
    if (user.roles.includes("ADMIN")) return true;

    if (Array.isArray(role)) {
      return role.some((r) => user.roles.includes(r));
    }
    return user.roles.includes(role);
  };

  /**
   * Manually triggers a re-fetch of current user profile from the backend.
   */
  const refreshProfile = async (): Promise<void> => {
    if (token) {
      await resolveBackendUser(token);
    }
  };

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: !!user && !!token,
    isLoading,
    error,
    login,
    signUp,
    logout,
    hasRole,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
