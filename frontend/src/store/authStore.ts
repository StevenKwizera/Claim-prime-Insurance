import { create } from "zustand";
import { AUTH_STORAGE_KEY } from "@/constants/auth";
import { backendService } from "@/services/backend";
import { User } from "@/types";

interface AuthState {
  user: User | null;
  token: string | null;
  loginAs: (input: { email: string; password: string }) => Promise<User>;
  updateProfile: (patch: Partial<Pick<User, "name" | "department">>) => void;
  logout: () => void;
}

function normalizeLegacyAdminRole(user: User): User;
function normalizeLegacyAdminRole(user: User | null): User | null;
function normalizeLegacyAdminRole(user: User | null) {
  if (!user) {
    return user;
  }
  return (user as unknown as { role: string }).role === "super-admin" ? { ...user, role: "admin" as const } : user;
}

const loadSession = () => {
  if (typeof window === "undefined") {
    return { user: null, token: null };
  }

  const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) {
    return { user: null, token: null };
  }

  try {
    const session = JSON.parse(raw) as { user: User | null; token: string | null };
    return { ...session, user: normalizeLegacyAdminRole(session.user) };
  } catch {
    return { user: null, token: null };
  }
};

const persistSession = (session: { user: User | null; token: string | null }) => {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
  }
};

const session = loadSession();

export const useAuthStore = create<AuthState>((set) => ({
  user: session.user,
  token: session.token,
  loginAs: async ({ email, password }) => {
    const result = await backendService.login({ email, password });
    if (result.type === "otp_required") {
      throw new Error(result.message);
    }
    const user = normalizeLegacyAdminRole(result.user);
    persistSession({ user, token: result.token });
    set({ user, token: result.token });
    return user;
  },
  updateProfile: (patch) => {
    set((state) => {
      if (!state.user) return state;
      const user = { ...state.user, ...patch };
      persistSession({ user, token: state.token });
      return { user };
    });
  },
  logout: () => {
    persistSession({ user: null, token: null });
    set({ user: null, token: null });
  }
}));
