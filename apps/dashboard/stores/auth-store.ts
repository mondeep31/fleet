import { create } from "zustand";
import {
  clearAuth,
  getStoredUser,
  getToken,
  setAuth,
  syncTokenCookie,
  type StoredUser,
} from "@/lib/auth";

interface AuthState {
  token: string | null;
  user: StoredUser | null;
  hydrated: boolean;
  hydrate: () => void;
  setSession: (token: string, user: StoredUser) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  hydrated: false,
  hydrate: () => {
    const token = getToken();
    const user = getStoredUser();
    if (token) {
      syncTokenCookie(token);
    }
    set({ token, user, hydrated: true });
  },
  setSession: (token, user) => {
    setAuth(token, user);
    set({ token, user, hydrated: true });
  },
  logout: () => {
    clearAuth();
    set({ token: null, user: null, hydrated: true });
    if (typeof window !== "undefined") {
      window.location.assign("/login");
    }
  },
}));

export const selectIsAuthenticated = (state: AuthState) => Boolean(state.token);
