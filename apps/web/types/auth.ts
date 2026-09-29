/**
 * BhuSetu 3D Frontend Authentication Types
 * Team: TANTRAKATHA | SIH 2026 (SIH26011)
 * Phase 2: Authentication, Authorization & Application Shell
 */

export type AppRole =
  | "ADMIN"
  | "SURVEYOR"
  | "GOVERNMENT_OFFICER"
  | "PLANNER"
  | "ANALYST"
  | "PUBLIC_USER";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  roles: AppRole[];
  department?: string | null;
  is_active: boolean;
}

export interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (
    email: string,
    password: string,
    fullName?: string,
    organization?: string
  ) => Promise<{ success: boolean; error?: string; requireVerification?: boolean }>;
  logout: () => Promise<void>;
  hasRole: (role: AppRole | AppRole[]) => boolean;
  hasPermission: (permission: any) => boolean;
  refreshProfile: () => Promise<void>;
}
