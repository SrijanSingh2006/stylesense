import { create } from "zustand";
export type Role =
  | "customer"
  | "product_manager"
  | "operations_manager"
  | "admin";
export interface AccountUser {
  id: number;
  customer_id: number | null;
  full_name: string;
  email: string;
  role: Role;
  account_status: string;
  email_verified: boolean;
  avatar_url: string | null;
  phone: string | null;
  onboarding_completed: boolean;
  permissions: string[];
  created_at: string;
  last_login_at: string | null;
}
export interface AuthReply {
  access_token: string;
  csrf_token: string;
  expires_in: number;
  user: AccountUser;
}
interface AuthState {
  user: AccountUser | null;
  accessToken: string | null;
  csrfToken: string | null;
  revision: number;
  status: "restoring" | "authenticated" | "anonymous";
  accept: (reply: AuthReply) => void;
  clear: () => void;
  updateUser: (user: AccountUser) => void;
}
// Deliberately no persist middleware: authentication material never enters browser storage.
export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  csrfToken: null,
  status: "restoring",
  revision: 0,
  accept: (r) =>
    set((s) => ({
      user: r.user,
      accessToken: r.access_token,
      csrfToken: r.csrf_token,
      status: "authenticated",
      revision: s.revision + 1,
    })),
  clear: () =>
    set((s) => ({
      user: null,
      accessToken: null,
      csrfToken: null,
      status: "anonymous",
      revision: s.revision + 1,
    })),
  updateUser: (user) => set({ user }),
}));
export function can(user: AccountUser | null, permission: string) {
  return !!user && user.permissions.includes(permission);
}
export function homeFor(user: AccountUser) {
  if (user.role === "admin") return "/admin";
  if (user.role === "product_manager") return "/dashboard";
  if (user.role === "operations_manager") return "/operations";
  return user.onboarding_completed ? "/account" : "/onboarding";
}
export function safeDestination(path: unknown) {
  return typeof path === "string" &&
    path.startsWith("/") &&
    !path.startsWith("//") &&
    !path.includes("\\")
    ? path
    : null;
}
