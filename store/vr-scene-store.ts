import { create } from 'zustand';

export type ModelMode = 'idle' | 'rotate' | 'pulse';

interface VRSceneState {
  mode: ModelMode;
  scale: number;
  passthrough: boolean;
  setMode: (mode: ModelMode) => void;
  scaleUp: () => void;
  scaleDown: () => void;
  reset: () => void;
  togglePassthrough: () => void;
}

export const useVRSceneStore = create<VRSceneState>((set) => ({
  mode: 'idle',
  scale: 0.5,
  passthrough: false,
  setMode: (mode) => set({ mode }),
  scaleUp: () => set((s) => ({ scale: Math.min(s.scale * 1.25, 2.0) })),
  scaleDown: () => set((s) => ({ scale: Math.max(s.scale * 0.8, 0.1) })),
  reset: () => set({ mode: 'idle', scale: 0.5 }),
  togglePassthrough: () => set((s) => ({ passthrough: !s.passthrough })),
}));
