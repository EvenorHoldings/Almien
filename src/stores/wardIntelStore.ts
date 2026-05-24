import { create } from 'zustand';

interface WardIntelState {
  openWardId: number | null;
  open: (id: number) => void;
  close: () => void;
}

export const useWardIntelStore = create<WardIntelState>((set) => ({
  openWardId: null,
  open: (id) => set({ openWardId: id }),
  close: () => set({ openWardId: null }),
}));
