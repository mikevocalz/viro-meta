/**
 * ModelPedestal - GLB Model Display with Interactive Pedestal
 *
 * Features:
 * - GLB model loading with Viro3DObject
 * - Animated idle rotation
 * - Scale/rotation controls
 * - Interactive selection
 * - Visual feedback on hover/selection
 */

import React, { useCallback, useEffect, useRef, memo } from "react";
import {
  Viro3DObject,
  ViroNode,
  ViroBox,
  ViroMaterials,
} from "@reactvision/react-viro";
import { useQuestShowroomStore } from "../state/useQuestShowroomStore";
import { horizonLog } from "../utils/horizon";

interface ModelPedestalProps {
  modelSource?: string | number;
  position?: [number, number, number];
}

// Fallback model - use Khronos Damaged Helmet if no local model
const FALLBACK_MODEL =
  "https://github.com/KhronosGroup/glTF-Sample-Models/raw/main/2.0/DamagedHelmet/glTF-Binary/DamagedHelmet.glb";

// Try to use local model, fallback to remote
const DEFAULT_MODEL = (() => {
  try {
    // Attempt to require local model
    return require("../../../assets/models/showroom-model.glb");
  } catch {
    horizonLog("Local GLB not found, using fallback");
    return FALLBACK_MODEL;
  }
})();

// Register materials for the pedestal
ViroMaterials.createMaterials({
  pedestalMetal: {
    lightingModel: "Blinn",
    diffuseColor: "#2A2A2A",
    shininess: 0.8,
  },
  pedestalGlow: {
    lightingModel: "Constant",
    diffuseColor: "#4F46E5",
  },
  selectionHighlight: {
    lightingModel: "Constant",
    diffuseColor: "rgba(99, 102, 241, 0.3)",
  },
});

const ModelPedestalComponent: React.FC<ModelPedestalProps> = ({
  modelSource = DEFAULT_MODEL,
  position = [0, -1, -3],
}) => {
  const modelRef = useRef<any>(null);
  const animationRef = useRef<number>(0);

  // Store selectors
  const transform = useQuestShowroomStore((state) => state.modelTransform);
  const animationState = useQuestShowroomStore((state) => state.animationState);
  const isSelected = useQuestShowroomStore((state) => state.isModelSelected);
  const isHovering = useQuestShowroomStore((state) => state.isHovering);

  // Store actions
  const setSelected = useQuestShowroomStore((state) => state.setModelSelected);
  const setHovering = useQuestShowroomStore((state) => state.setHovering);
  const setPressed = useQuestShowroomStore((state) => state.setPressed);
  const updateProgress = useQuestShowroomStore(
    (state) => state.updateAnimationProgress,
  );

  // Handle model click
  const onClick = useCallback(
    (event: any) => {
      horizonLog("Model clicked:", event?.source);
      setSelected(!isSelected);
    },
    [isSelected, setSelected],
  );

  // Handle hover
  const onHover = useCallback(
    (isHovering: boolean, position: any, source: any) => {
      setHovering(isHovering, source?.source);
    },
    [setHovering],
  );

  // Handle touch/press
  const onTouch = useCallback(
    (event: any) => {
      const { touchState, source } = event;
      setPressed(touchState === "touchDown", source);
    },
    [setPressed],
  );

  // Animation loop for idle rotation
  useEffect(() => {
    let frameId: number;
    let lastTime = performance.now();

    const animate = (time: number) => {
      const delta = time - lastTime;
      lastTime = time;

      if (animationState === "rotate" || animationState === "idle") {
        animationRef.current += delta * 0.02;
        updateProgress(animationRef.current % 360);
      } else if (animationState === "inspect") {
        // Slower, more deliberate rotation for inspection
        animationRef.current += delta * 0.005;
        updateProgress(animationRef.current % 360);
      }

      frameId = requestAnimationFrame(animate);
    };

    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, [animationState, updateProgress]);

  // Calculate animated rotation
  const animatedRotation: [number, number, number] =
    animationState === "none"
      ? transform.rotation
      : [
          transform.rotation[0],
          transform.rotation[1] + animationRef.current,
          transform.rotation[2],
        ];

  // Model URI handling
  const modelUri =
    typeof modelSource === "number"
      ? modelSource // Local require
      : modelSource; // String URI

  return (
    <ViroNode position={position}>
      {/* Pedestal Base */}
      <ViroBox
        position={[0, -0.5, 0]}
        scale={[1.2, 0.1, 1.2]}
        materials={["pedestalMetal"]}
      />

      {/* Selection glow ring (shows when selected) */}
      {isSelected && (
        <ViroBox
          position={[0, -0.48, 0]}
          scale={[1.3, 0.05, 1.3]}
          materials={["pedestalGlow"]}
        />
      )}

      {/* Hover glow (shows when hovering) */}
      {isHovering && !isSelected && (
        <ViroBox
          position={[0, -0.48, 0]}
          scale={[1.25, 0.05, 1.25]}
          materials={["pedestalGlow"]}
          opacity={0.5}
        />
      )}

      {/* GLB Model */}
      <ViroNode
        position={[0, 0, 0]}
        rotation={animatedRotation}
        scale={transform.scale}
      >
        <Viro3DObject
          ref={modelRef}
          source={modelUri}
          type="GLB"
          position={[0, 0, 0]}
          scale={[1, 1, 1]}
          onClick={onClick}
          onHover={onHover}
          onTouch={onTouch}
          animation={{
            name: "idle",
            run: animationState !== "none",
            loop: true,
          }}
          opacity={isHovering ? 0.9 : 1}
        />
      </ViroNode>

      {/* Selection highlight box around model */}
      {isSelected && (
        <ViroBox
          position={[0, 0.5, 0]}
          scale={[1.5, 1.5, 1.5]}
          materials={["selectionHighlight"]}
          opacity={0.3}
        />
      )}
    </ViroNode>
  );
};

export const ModelPedestal = memo(ModelPedestalComponent);
export default ModelPedestal;
