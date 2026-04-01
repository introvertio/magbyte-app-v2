"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

// Define the store's state and actions
interface TokenState {
  token: string | null;
  logout: () => void;
  setToken: (token: string | null) => void;
}

// Create the store with persist middleware
export const useTokenStore = create<TokenState>()(
  persist(
    (set) => ({
      token: null,
      setToken: (newToken) => {
        set({ token: newToken });
      },
      logout: () => {
        set({ token: null });
      },
    }),
    {
      name: "auth", // name of the item in localStorage
    }
  )
);

