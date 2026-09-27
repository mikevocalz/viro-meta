/**
 * FloatingControlPanel - Spatial UI for Quest XR Showroom
 *
 * Features:
 * - 3D positioned control panel in front of user
 * - Large buttons sized for controller/finger interaction
 * - Visual feedback on hover/selection
 * - Multiple sections: Animation, View, Lighting, Info
 */

import React, { memo, useCallback } from "react";
import {
  ViroFlexView,
  ViroText,
  ViroBox,
  ViroButton,
  ViroMaterials,
  ViroNode,
} from "@reactvision/react-viro";
import { useQuestShowroomStore } from "../state/useQuestShowroomStore";
import { horizonLog } from "../utils/horizon";

// Panel materials
ViroMaterials.createMaterials({
  panelBackground: {
    lightingModel: "Constant",
    diffuseColor: "rgba(15, 23, 42, 0.9)",
  },
  buttonDefault: {
    lightingModel: "Constant",
    diffuseColor: "#3B82F6",
  },
  buttonHover: {
    lightingModel: "Constant",
    diffuseColor: "#60A5FA",
  },
  buttonPressed: {
    lightingModel: "Constant",
    diffuseColor: "#2563EB",
  },
  buttonSecondary: {
    lightingModel: "Constant",
    diffuseColor: "#6B7280",
  },
  textWhite: {
    lightingModel: "Constant",
    diffuseColor: "#FFFFFF",
  },
  textAccent: {
    lightingModel: "Constant",
    diffuseColor: "#60A5FA",
  },
});

interface FloatingControlPanelProps {
  position?: [number, number, number];
}

const FloatingControlPanelComponent: React.FC<FloatingControlPanelProps> = ({
  position = [0, 1, -2],
}) => {
  // Store selectors
  const isVisible = useQuestShowroomStore((state) => state.isControlPanelVisible);
  const animationState = useQuestShowroomStore((state) => state.animationState);
  const lightingMode = useQuestShowroomStore((state) => state.activeLightingMode);
  const isInfoVisible = useQuestShowroomStore((state) => state.isInfoPanelVisible);

  // Store actions
  const setAnimationState = useQuestShowroomStore((state) => state.setAnimationState);
  const setLightingMode = useQuestShowroomStore((state) => state.setLightingMode);
  const toggleInfoPanel = useQuestShowroomStore((state) => state.toggleInfoPanel);
  const resetModelTransform = useQuestShowroomStore((state) => state.resetModelTransform);
  const rotateModel = useQuestShowroomStore((state) => state.rotateModel);
  const scaleModel = useQuestShowroomStore((state) => state.scaleModel);

  // Button handlers with logging
  const handleAnimate = useCallback(() => {
    const nextState = animationState === "rotate" ? "idle" : "rotate";
    horizonLog("Animation button:", animationState, "→", nextState);
    setAnimationState(nextState);
  }, [animationState, setAnimationState]);

  const handleInspect = useCallback(() => {
    horizonLog("Inspect mode enabled");
    setAnimationState("inspect");
  }, [setAnimationState]);

  const handleReset = useCallback(() => {
    horizonLog("Reset model transform");
    resetModelTransform();
  }, [resetModelTransform]);

  const handleRotateLeft = useCallback(() => {
    rotateModel("y", -45);
  }, [rotateModel]);

  const handleRotateRight = useCallback(() => {
    rotateModel("y", 45);
  }, [rotateModel]);

  const handleScaleUp = useCallback(() => {
    scaleModel(1.2);
  }, [scaleModel]);

  const handleScaleDown = useCallback(() => {
    scaleModel(0.8);
  }, [scaleModel]);

  const handleToggleInfo = useCallback(() => {
    horizonLog("Toggle info panel");
    toggleInfoPanel();
  }, [toggleInfoPanel]);

  const handleLightingChange = useCallback(() => {
    const modes = ["studio", "dramatic", "ambient", "product"] as const;
    const currentIndex = modes.indexOf(lightingMode);
    const nextMode = modes[(currentIndex + 1) % modes.length];
    horizonLog("Lighting mode:", lightingMode, "→", nextMode);
    setLightingMode(nextMode);
  }, [lightingMode, setLightingMode]);

  if (!isVisible) return null;

  return (
    <ViroNode position={position}>
      {/* Panel Background */}
      <ViroBox
        position={[0, 0, 0]}
        scale={[1.4, 0.8, 0.05]}
        materials={["panelBackground"]}
      />

      {/* Title */}
      <ViroText
        text="XR Showroom Controls"
        position={[0, 0.3, 0.06]}
        scale={[0.15, 0.15, 0.15]}
        color="#FFFFFF"
        style={{ fontSize: 24, fontWeight: "bold" }}
      />

      {/* Animation Row */}
      <ViroFlexView
        position={[-0.5, 0.15, 0.06]}
        scale={[0.4, 0.15, 0.05]}
        backgroundColor="transparent"
      >
        <ViroButton
          source={null}
          onClick={handleAnimate}
          scale={[0.4, 0.15, 0.05]}
          materials={[animationState === "rotate" ? "buttonPressed" : "buttonDefault"]}
        />
      </ViroFlexView>
      <ViroText
        text={animationState === "rotate" ? "⏹ Stop" : "▶ Rotate"}
        position={[-0.5, 0.15, 0.08]}
        scale={[0.08, 0.08, 0.08]}
        color="#FFFFFF"
      />

      {/* Inspect Button */}
      <ViroFlexView
        position={[0, 0.15, 0.06]}
        scale={[0.4, 0.15, 0.05]}
        backgroundColor="transparent"
      >
        <ViroButton
          source={null}
          onClick={handleInspect}
          scale={[0.4, 0.15, 0.05]}
          materials={[animationState === "inspect" ? "buttonPressed" : "buttonSecondary"]}
        />
      </ViroFlexView>
      <ViroText
        text="🔍 Inspect"
        position={[0, 0.15, 0.08]}
        scale={[0.08, 0.08, 0.08]}
        color="#FFFFFF"
      />

      {/* Reset Button */}
      <ViroFlexView
        position={[0.5, 0.15, 0.06]}
        scale={[0.4, 0.15, 0.05]}
        backgroundColor="transparent"
      >
        <ViroButton
          source={null}
          onClick={handleReset}
          scale={[0.4, 0.15, 0.05]}
          materials={["buttonSecondary"]}
        />
      </ViroFlexView>
      <ViroText
        text="↺ Reset"
        position={[0.5, 0.15, 0.08]}
        scale={[0.08, 0.08, 0.08]}
        color="#FFFFFF"
      />

      {/* Rotation Controls */}
      <ViroText
        text="Rotate:"
        position={[-0.6, -0.05, 0.08]}
        scale={[0.06, 0.06, 0.06]}
        color="#9CA3AF"
      />
      <ViroFlexView
        position={[-0.3, -0.05, 0.06]}
        scale={[0.2, 0.12, 0.05]}
      >
        <ViroButton
          source={null}
          onClick={handleRotateLeft}
          scale={[0.2, 0.12, 0.05]}
          materials={["buttonDefault"]}
        />
      </ViroFlexView>
      <ViroText
        text="←"
        position={[-0.3, -0.05, 0.08]}
        scale={[0.08, 0.08, 0.08]}
        color="#FFFFFF"
      />

      <ViroFlexView
        position={[0.3, -0.05, 0.06]}
        scale={[0.2, 0.12, 0.05]}
      >
        <ViroButton
          source={null}
          onClick={handleRotateRight}
          scale={[0.2, 0.12, 0.05]}
          materials={["buttonDefault"]}
        />
      </ViroFlexView>
      <ViroText
        text="→"
        position={[0.3, -0.05, 0.08]}
        scale={[0.08, 0.08, 0.08]}
        color="#FFFFFF"
      />

      {/* Scale Controls */}
      <ViroText
        text="Scale:"
        position={[-0.6, -0.25, 0.08]}
        scale={[0.06, 0.06, 0.06]}
        color="#9CA3AF"
      />
      <ViroFlexView
        position={[-0.3, -0.25, 0.06]}
        scale={[0.2, 0.12, 0.05]}
      >
        <ViroButton
          source={null}
          onClick={handleScaleDown}
          scale={[0.2, 0.12, 0.05]}
          materials={["buttonDefault"]}
        />
      </ViroFlexView>
      <ViroText
        text="−"
        position={[-0.3, -0.25, 0.08]}
        scale={[0.08, 0.08, 0.08]}
        color="#FFFFFF"
      />

      <ViroFlexView
        position={[0.3, -0.25, 0.06]}
        scale={[0.2, 0.12, 0.05]}
      >
        <ViroButton
          source={null}
          onClick={handleScaleUp}
          scale={[0.2, 0.12, 0.05]}
          materials={["buttonDefault"]}
        />
      </ViroFlexView>
      <ViroText
        text="+"
        position={[0.3, -0.25, 0.08]}
        scale={[0.08, 0.08, 0.08]}
        color="#FFFFFF"
      />

      {/* Lighting & Info Row */}
      <ViroFlexView
        position={[-0.4, -0.45, 0.06]}
        scale={[0.5, 0.12, 0.05]}
      >
        <ViroButton
          source={null}
          onClick={handleLightingChange}
          scale={[0.5, 0.12, 0.05]}
          materials={["buttonSecondary"]}
        />
      </ViroFlexView>
      <ViroText
        text={`💡 ${lightingMode.charAt(0).toUpperCase() + lightingMode.slice(1)}`}
        position={[-0.4, -0.45, 0.08]}
        scale={[0.06, 0.06, 0.06]}
        color="#FFFFFF"
      />

      <ViroFlexView
        position={[0.4, -0.45, 0.06]}
        scale={[0.4, 0.12, 0.05]}
      >
        <ViroButton
          source={null}
          onClick={handleToggleInfo}
          scale={[0.4, 0.12, 0.05]}
          materials={[isInfoVisible ? "buttonPressed" : "buttonSecondary"]}
        />
      </ViroFlexView>
      <ViroText
        text={isInfoVisible ? "ℹ Hide Info" : "ℹ Show Info"}
        position={[0.4, -0.45, 0.08]}
        scale={[0.06, 0.06, 0.06]}
        color="#FFFFFF"
      />
    </ViroNode>
  );
};

export const FloatingControlPanel = memo(FloatingControlPanelComponent);
export default FloatingControlPanel;
