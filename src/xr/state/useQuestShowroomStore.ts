/**
 * QuestShowroomStore - Zustand state management for the XR Product Showroom
 *
 * Handles:
 * - Model animation states
 * - UI panel visibility
 * - Lighting modes
 * - Model transforms (rotation, scale)
 * - Interaction state
 */

import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

export type LightingMode = "studio" | "dramatic" | "ambient" | "product";
export type AnimationState = "idle" | "rotate" | "inspect" | "none";

interface ModelTransform {
  rotation: [number, number, number];
  scale: [number, number, number];
  position: [number, number, number];
}

interface QuestShowroomState {
  // UI State
  isControlPanelVisible: boolean;
  isInfoPanelVisible: boolean;
  activeLightingMode: LightingMode;

  // Model State
  animationState: AnimationState;
  modelTransform: ModelTransform;
  isModelSelected: boolean;
  modelAnimationProgress: number;

  // Interaction State
  isHovering: boolean;
  isPressed: boolean;
  lastInteractionSource: "left" | "right" | "gaze" | null;

  // Actions
  toggleControlPanel: () => void;
  toggleInfoPanel: () => void;
  setLightingMode: (mode: LightingMode) => void;
  setAnimationState: (state: AnimationState) => void;
  resetModelTransform: () => void;
  rotateModel: (axis: "y" | "x", degrees: number) => void;
  scaleModel: (factor: number) => void;
  setModelSelected: (selected: boolean) => void;
  setHovering: (hovering: boolean, source?: "left" | "right" | "gaze") => void;
  setPressed: (pressed: boolean, source?: "left" | "right" | "gaze") => void;
  updateAnimationProgress: (progress: number) => void;
}

const DEFAULT_TRANSFORM: ModelTransform = {
  position: [0, 0, -2],
  rotation: [0, 0, 0],
  scale: [1, 1, 1],
};

export const useQuestShowroomStore = create<QuestShowroomState>()(
  subscribeWithSelector((set, get) => ({
    // Initial State
    isControlPanelVisible: true,
    isInfoPanelVisible: false,
    activeLightingMode: "studio",
    animationState: "idle",
    modelTransform: { ...DEFAULT_TRANSFORM },
    isModelSelected: false,
    modelAnimationProgress: 0,
    isHovering: false,
    isPressed: false,
    lastInteractionSource: null,

    // Actions
    toggleControlPanel: () =>
      set((state) => ({ isControlPanelVisible: !state.isControlPanelVisible })),

    toggleInfoPanel: () =>
      set((state) => ({ isInfoPanelVisible: !state.isInfoPanelVisible })),

    setLightingMode: (mode) => set({ activeLightingMode: mode }),

    setAnimationState: (state) => {
      set({ animationState: state });
      // Auto-reset progress on state change
      if (state !== "inspect") {
        set({ modelAnimationProgress: 0 });
      }
    },

    resetModelTransform: () =>
      set({
        modelTransform: { ...DEFAULT_TRANSFORM },
        animationState: "idle",
        isModelSelected: false,
      }),

    rotateModel: (axis, degrees) =>
      set((state) => {
        const newRotation: [number, number, number] = [...state.modelTransform.rotation];
        const axisIndex = axis === "y" ? 1 : axis === "x" ? 0 : 2;
        newRotation[axisIndex] = (newRotation[axisIndex] + degrees) % 360;
        return {
          modelTransform: {
            ...state.modelTransform,
            rotation: newRotation,
          },
        };
      }),

    scaleModel: (factor) =>
      set((state) => {
        const currentScale = state.modelTransform.scale;
        const newScale: [number, number, number] = [
          Math.max(0.5, Math.min(3, currentScale[0] * factor)),
          Math.max(0.5, Math.min(3, currentScale[1] * factor)),
          Math.max(0.5, Math.min(3, currentScale[2] * factor)),
        ];
        return {
          modelTransform: {
            ...state.modelTransform,
            scale: newScale,
          },
        };
      }),

    setModelSelected: (selected) => set({ isModelSelected: selected }),

    setHovering: (hovering, source) =>
      set({
        isHovering: hovering,
        lastInteractionSource: source ?? get().lastInteractionSource,
      }),

    setPressed: (pressed, source) =>
      set({
        isPressed: pressed,
        lastInteractionSource: source ?? get().lastInteractionSource,
      }),

    updateAnimationProgress: (progress) =>
      set({ modelAnimationProgress: progress }),
  }))
);

// Selectors for performance
export const selectModelTransform = (state: QuestShowroomState) =>
  state.modelTransform;
export const selectAnimationState = (state: QuestShowroomState) =>
  state.animationState;
export const selectIsModelSelected = (state: QuestShowroomState) =>
  state.isModelSelected;
export const selectLightingMode = (state: QuestShowroomState) =>
  state.activeLightingMode;
