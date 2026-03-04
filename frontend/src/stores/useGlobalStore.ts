import { create } from 'zustand';

interface GlobalState {
  siderCollapsed: boolean;
  toggleSider: () => void;
  setSiderCollapsed: (collapsed: boolean) => void;
}

export const useGlobalStore = create<GlobalState>((set) => ({
  siderCollapsed: false,
  toggleSider: () => set((state) => ({ siderCollapsed: !state.siderCollapsed })),
  setSiderCollapsed: (collapsed: boolean) => set({ siderCollapsed: collapsed }),
}));
