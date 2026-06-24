import { create } from "zustand";

interface ClaimsUiState {
  latestReference: string | null;
  setLatestReference: (reference: string | null) => void;
}

export const useClaimsStore = create<ClaimsUiState>((set) => ({
  latestReference: null,
  setLatestReference: (latestReference) => set({ latestReference })
}));
