import { create } from "zustand";
import { persist } from "zustand/middleware";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

type AdminStore = {
  principal: string | null;
  isAdmin: boolean | null;
  lastVerified: number | null;

  setPrincipal: (principal: string | null) => void;
  setAdminStatus: (isAdmin: boolean) => void;
  clearAuth: () => void;
  hasValidSession: () => boolean;
  getStoredAdminStatus: () => boolean | null;
};

export const useAdminStore = create<AdminStore>()(
  persist(
    (set, get) => ({
      principal: null,
      isAdmin: null,
      lastVerified: null,

      setPrincipal: (principal) => set({ principal }),

      setAdminStatus: (isAdmin) => set({ isAdmin, lastVerified: Date.now() }),

      clearAuth: () =>
        set({ principal: null, isAdmin: null, lastVerified: null }),

      hasValidSession: () => {
        const { isAdmin, lastVerified } = get();
        if (isAdmin === null || lastVerified === null) return false;
        return Date.now() - lastVerified < THIRTY_DAYS_MS;
      },

      getStoredAdminStatus: () => get().isAdmin,
    }),
    {
      name: "aldo-admin-store",
      partialize: (state) => ({
        principal: state.principal,
        isAdmin: state.isAdmin,
        lastVerified: state.lastVerified,
      }),
    },
  ),
);
