"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Sidebar } from "@/components/layout/Sidebar";
import {
  Users,
  CheckCircle2,
  Mail,
  Building,
  ArrowLeft,
  Search,
  UserPlus,
  X,
  Eye,
  EyeOff,
  Shield,
  KeyRound,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface UserPersona {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  clearance: string;
  status: string;
  badgeColor: string;
  capabilities: string;
}

const ROLE_CONFIG: Record<string, { badge: string; clearance: string; capabilities: string }> = {
  ADMIN: {
    badge: "bg-[#B56E48]/20 text-[#E09F67] border-[#B56E48]/40",
    clearance: "Level 4 (Super Admin)",
    capabilities: "Full system administration, user management, audit trails, GIS parameters, and all module access.",
  },
  GOVERNMENT_OFFICER: {
    badge: "bg-[#176C68]/20 text-[#2EB8B0] border-[#176C68]/40",
    clearance: "Level 3 (Review & Seal)",
    capabilities: "Statutory verification review, KMC Section 321 enforcement notices, evidence review, and legal sign-offs.",
  },
  SURVEYOR: {
    badge: "bg-[#2A443B]/30 text-[#4ADE80] border-[#2A443B]/60",
    clearance: "Level 2 (Field Operations)",
    capabilities: "Cadastral field survey capture, terrestrial laser scanning, drone photogrammetry upload, and field verification notes.",
  },
  ANALYST: {
    badge: "bg-[#253248]/30 text-[#60A5FA] border-[#253248]/60",
    clearance: "Level 2 (Spatial Analytics)",
    capabilities: "Topological conflict analysis, AI spatial investigator, 4D temporal changes, and explainable quality scoring.",
  },
};

const INITIAL_PERSONAS: UserPersona[] = [
  {
    id: "33333333-3333-4000-8000-000000000001",
    name: "Vikram Sen",
    email: "admin.official@bhusetu3d.gov.in",
    role: "ADMIN",
    department: "Land Revenue Directorate",
    clearance: "Level 4 (Super Admin)",
    status: "Active Institutional",
    badgeColor: ROLE_CONFIG.ADMIN.badge,
    capabilities: ROLE_CONFIG.ADMIN.capabilities,
  },
  {
    id: "33333333-3333-4000-8000-000000000002",
    name: "Kavita Sharma",
    email: "officer.kavita@bhusetu3d.gov.in",
    role: "GOVERNMENT_OFFICER",
    department: "Urban Town Planning",
    clearance: "Level 3 (Review & Seal)",
    status: "Active Institutional",
    badgeColor: ROLE_CONFIG.GOVERNMENT_OFFICER.badge,
    capabilities: ROLE_CONFIG.GOVERNMENT_OFFICER.capabilities,
  },
  {
    id: "33333333-3333-4000-8000-000000000003",
    name: "Sunil Rao",
    email: "surveyor.rao@bhusetu3d.gov.in",
    role: "SURVEYOR",
    department: "Cadastral Survey Branch",
    clearance: "Level 2 (Field Operations)",
    status: "Active Institutional",
    badgeColor: ROLE_CONFIG.SURVEYOR.badge,
    capabilities: ROLE_CONFIG.SURVEYOR.capabilities,
  },
  {
    id: "33333333-3333-4000-8000-000000000004",
    name: "Priya Nair",
    email: "analyst.priya@bhusetu3d.gov.in",
    role: "ANALYST",
    department: "Geospatial Intelligence",
    clearance: "Level 2 (Spatial Analytics)",
    status: "Active Institutional",
    badgeColor: ROLE_CONFIG.ANALYST.badge,
    capabilities: ROLE_CONFIG.ANALYST.capabilities,
  },
];

interface AddUserForm {
  name: string;
  email: string;
  role: string;
  department: string;
  password: string;
}

const EMPTY_FORM: AddUserForm = {
  name: "",
  email: "",
  role: "GOVERNMENT_OFFICER",
  department: "",
  password: "",
};

function AddUserModal({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: (persona: UserPersona) => void;
}) {
  const [form, setForm] = useState<AddUserForm>(EMPTY_FORM);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const update = (field: keyof AddUserForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setFormError(null);
  };

  const validate = (): string | null => {
    if (!form.name.trim()) return "Full name is required.";
    if (!form.email.trim() || !form.email.includes("@")) return "A valid email address is required.";
    if (!form.department.trim()) return "Department is required.";
    if (form.password.length < 8) return "Password must be at least 8 characters.";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validate();
    if (err) { setFormError(err); return; }

    setIsSubmitting(true);
    setFormError(null);

    try {
      // Attempt to create user via backend API
      // In production this would be: POST /api/v1/auth/register or /api/v1/users
      // For now we optimistically add locally and show success
      await new Promise((r) => setTimeout(r, 600)); // simulate API call

      const roleConfig = ROLE_CONFIG[form.role] || ROLE_CONFIG.GOVERNMENT_OFFICER;
      const newPersona: UserPersona = {
        id: `user_${Date.now()}`,
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        role: form.role,
        department: form.department.trim(),
        clearance: roleConfig.clearance,
        status: "Active Institutional",
        badgeColor: roleConfig.badge,
        capabilities: roleConfig.capabilities,
      };

      onAdd(newPersona);
      onClose();
    } catch {
      setFormError("Failed to create user. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Panel */}
      <div className="relative z-10 w-full max-w-lg bg-[#0F1210] border border-[rgba(244,240,232,0.12)] rounded-[14px] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[rgba(244,240,232,0.08)] bg-[#121614]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded bg-[#B56E48]/15 border border-[#B56E48]/30">
              <UserPlus className="w-4 h-4 text-[#E09F67]" />
            </div>
            <div>
              <h2 className="text-sm font-bold font-mono text-[#F4F0E8] uppercase tracking-wide">
                Add New Evaluator
              </h2>
              <p className="text-[11px] text-[#77867C] font-sans mt-0.5">
                Provision institutional access credentials
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded hover:bg-[rgba(244,240,232,0.06)] text-[#94A3B8] hover:text-[#F4F0E8] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {formError && (
            <div className="flex items-center gap-2.5 p-3 rounded-[6px] bg-rose-950/30 border border-rose-500/30 text-rose-400 text-xs font-mono">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* Full Name */}
          <div>
            <label className="block text-[11px] font-mono font-semibold text-[#77867C] uppercase tracking-wider mb-1.5">
              Full Name *
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              placeholder="e.g. Arjun Mehta"
              className="w-full bg-[#141816] border border-[rgba(244,240,232,0.12)] rounded-[6px] px-3 py-2 text-sm font-sans text-[#F4F0E8] placeholder:text-[#4A5568] outline-none focus:border-[#B56E48] transition-colors"
              autoComplete="off"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-[11px] font-mono font-semibold text-[#77867C] uppercase tracking-wider mb-1.5">
              Institutional Email *
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 w-3.5 h-3.5 text-[#4A5568]" />
              <input
                type="email"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                placeholder="officer@bhusetu3d.gov.in"
                className="w-full bg-[#141816] border border-[rgba(244,240,232,0.12)] rounded-[6px] pl-9 pr-3 py-2 text-sm font-mono text-[#F4F0E8] placeholder:text-[#4A5568] outline-none focus:border-[#B56E48] transition-colors"
                autoComplete="off"
              />
            </div>
          </div>

          {/* Role */}
          <div>
            <label className="block text-[11px] font-mono font-semibold text-[#77867C] uppercase tracking-wider mb-1.5">
              Assigned Role *
            </label>
            <div className="relative">
              <Shield className="absolute left-3 top-2.5 w-3.5 h-3.5 text-[#4A5568]" />
              <select
                value={form.role}
                onChange={(e) => update("role", e.target.value)}
                className="w-full bg-[#141816] border border-[rgba(244,240,232,0.12)] rounded-[6px] pl-9 pr-3 py-2 text-sm font-mono text-[#F4F0E8] outline-none focus:border-[#B56E48] transition-colors appearance-none cursor-pointer"
              >
                <option value="ADMIN">ADMIN — Level 4 (Super Admin)</option>
                <option value="GOVERNMENT_OFFICER">GOVERNMENT OFFICER — Level 3 (Review & Seal)</option>
                <option value="SURVEYOR">SURVEYOR — Level 2 (Field Operations)</option>
                <option value="ANALYST">ANALYST — Level 2 (Spatial Analytics)</option>
              </select>
            </div>
            {form.role && (
              <p className="text-[10px] text-[#77867C] font-sans mt-1.5 leading-relaxed">
                {ROLE_CONFIG[form.role]?.capabilities}
              </p>
            )}
          </div>

          {/* Department */}
          <div>
            <label className="block text-[11px] font-mono font-semibold text-[#77867C] uppercase tracking-wider mb-1.5">
              Department / Branch *
            </label>
            <div className="relative">
              <Building className="absolute left-3 top-2.5 w-3.5 h-3.5 text-[#4A5568]" />
              <input
                type="text"
                value={form.department}
                onChange={(e) => update("department", e.target.value)}
                placeholder="e.g. Urban Town Planning"
                className="w-full bg-[#141816] border border-[rgba(244,240,232,0.12)] rounded-[6px] pl-9 pr-3 py-2 text-sm font-sans text-[#F4F0E8] placeholder:text-[#4A5568] outline-none focus:border-[#B56E48] transition-colors"
                autoComplete="off"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-[11px] font-mono font-semibold text-[#77867C] uppercase tracking-wider mb-1.5">
              Temporary Password *
            </label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-2.5 w-3.5 h-3.5 text-[#4A5568]" />
              <input
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={(e) => update("password", e.target.value)}
                placeholder="Min. 8 characters"
                className="w-full bg-[#141816] border border-[rgba(244,240,232,0.12)] rounded-[6px] pl-9 pr-10 py-2 text-sm font-mono text-[#F4F0E8] placeholder:text-[#4A5568] outline-none focus:border-[#B56E48] transition-colors"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-2.5 text-[#4A5568] hover:text-[#94A3B8] transition-colors"
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
            <p className="text-[10px] text-[#4A5568] font-sans mt-1">
              User will be prompted to change this on first login.
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-[6px] border border-[rgba(244,240,232,0.12)] text-sm font-mono text-[#94A3B8] hover:text-[#F4F0E8] hover:border-[rgba(244,240,232,0.20)] transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 rounded-[6px] bg-[#B56E48] hover:bg-[#C47B50] disabled:opacity-50 disabled:cursor-not-allowed text-sm font-mono font-bold text-[#F4F0E8] transition-all flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-[#F4F0E8]/30 border-t-[#F4F0E8] rounded-full animate-spin" />
                  <span>Provisioning...</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Provision Access</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminUsersPage() {
  const { user } = useAuth();
  const isAdmin = user?.roles?.includes("ADMIN") ?? false;

  const [searchTerm, setSearchTerm] = useState("");
  const [personas, setPersonas] = useState<UserPersona[]>(INITIAL_PERSONAS);
  const [showAddModal, setShowAddModal] = useState(false);

  const filteredPersonas = personas.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddUser = (newPersona: UserPersona) => {
    setPersonas((prev) => [...prev, newPersona]);
  };

  return (
    <ProtectedRoute requiredRole="ADMIN" moduleName="User Directory">
      <div className="flex-1 flex overflow-hidden select-none bg-[#0F1210] min-h-[calc(100vh-4rem)]">
        <Sidebar />

        <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6 space-y-5 sm:space-y-6 bg-[#0F1210]">
          {/* Header */}
          <div className="border-b border-[rgba(244,240,232,0.08)] pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <Link
                  href="/admin"
                  className="text-xs font-mono text-[#94A3B8] hover:text-[#F4F0E8] flex items-center gap-1"
                >
                  <ArrowLeft className="w-3 h-3" />
                  <span>Admin Hub</span>
                </Link>
                <span className="text-xs font-mono text-[#6F7772]">/</span>
                <span className="text-xs font-mono px-2 py-0.5 rounded-[3px] bg-[#1C1613] text-[#E09F67] border border-[#B56E48]/35 font-bold uppercase">
                  USER DIRECTORY
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#F4F0E8] font-mono">
                User Access &amp; Evaluator Directory
              </h1>
              <p className="text-xs sm:text-sm text-[#CBD5E1] mt-1 font-sans">
                Authoritative institutional profiles, active role assignments, and permission clearance levels.
              </p>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              {/* Search */}
              <div className="relative flex-1 md:flex-none">
                <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search user, email, role..."
                  className="pl-9 pr-4 py-2 rounded-[6px] bg-[#141816] border border-[rgba(244,240,232,0.12)] text-xs font-mono text-[#F4F0E8] placeholder:text-[#6F7772] outline-none w-full md:w-64 focus:border-[rgba(244,240,232,0.24)] transition-colors"
                />
              </div>

              {/* Add User Button — ADMIN only */}
              {isAdmin && (
                <button
                  onClick={() => setShowAddModal(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-[6px] bg-[#B56E48] hover:bg-[#C47B50] text-sm font-mono font-bold text-[#F4F0E8] transition-all shadow-sm shrink-0"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Add User</span>
                  <span className="sm:hidden">Add</span>
                </button>
              )}
            </div>
          </div>

          {/* Stats row */}
          <div className="flex items-center gap-4 text-xs font-mono text-[#77867C]">
            <span>
              <span className="text-[#F4F0E8] font-bold">{personas.length}</span> total evaluators
            </span>
            <span>·</span>
            <span>
              <span className="text-[#F4F0E8] font-bold">
                {personas.filter((p) => p.status === "Active Institutional").length}
              </span>{" "}
              active
            </span>
            {searchTerm && (
              <>
                <span>·</span>
                <span>
                  <span className="text-[#E09F67] font-bold">{filteredPersonas.length}</span> matching
                  &ldquo;{searchTerm}&rdquo;
                </span>
              </>
            )}
          </div>

          {/* User Cards */}
          <div className="space-y-4">
            {filteredPersonas.length === 0 ? (
              <div className="text-center py-12 text-[#4A5568] font-mono text-sm">
                <Users className="w-8 h-8 mx-auto mb-3 opacity-40" />
                <p>No evaluators found matching &ldquo;{searchTerm}&rdquo;</p>
              </div>
            ) : (
              filteredPersonas.map((persona) => (
                <div
                  key={persona.id}
                  className={`p-5 rounded-[12px] bg-[#121614] border transition-all flex flex-col md:flex-row md:items-start justify-between gap-4 ${
                    persona.id === user?.id
                      ? "border-[#B56E48]/40 shadow-[0_0_0_1px_rgba(181,110,72,0.15)]"
                      : "border-[rgba(244,240,232,0.08)] hover:border-[rgba(244,240,232,0.14)]"
                  }`}
                >
                  <div className="space-y-2 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="text-base font-bold font-mono text-[#F4F0E8]">{persona.name}</h3>
                      <span className={`text-xs font-mono px-2.5 py-0.5 rounded border font-bold uppercase ${persona.badgeColor}`}>
                        {persona.role}
                      </span>
                      <span className="text-xs font-mono text-[#94A3B8]">
                        Clearance: <strong className="text-[#CBD5E1]">{persona.clearance}</strong>
                      </span>
                      {persona.id === user?.id && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#B56E48]/15 text-[#E09F67] border border-[#B56E48]/30 font-semibold uppercase">
                          YOU
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-mono text-[#CBD5E1]">
                      <span className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-[#94A3B8]" />
                        {persona.email}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Building className="w-3.5 h-3.5 text-[#94A3B8]" />
                        {persona.department}
                      </span>
                      <span className="text-[#94A3B8] font-mono text-[10px]">UUID: {persona.id}</span>
                    </div>

                    <p className="text-xs text-[#94A3B8] font-sans leading-relaxed pt-1">
                      {persona.capabilities}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="px-2.5 py-1 rounded bg-[#161B18] border border-[rgba(244,240,232,0.10)] text-xs font-mono text-[#2EB8B0] flex items-center gap-1.5 font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#2EB8B0]" />
                      {persona.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </main>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <AddUserModal
          onClose={() => setShowAddModal(false)}
          onAdd={handleAddUser}
        />
      )}
    </ProtectedRoute>
  );
}
