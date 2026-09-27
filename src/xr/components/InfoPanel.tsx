/**
 * InfoPanel - Spatial information display for Quest XR Showroom
 *
 * Shows product details, controls help, and app info
 */

import React, { memo } from "react";
import {
  ViroFlexView,
  ViroText,
  ViroBox,
  ViroMaterials,
  ViroNode,
} from "@reactvision/react-viro";
import { useQuestShowroomStore } from "../state/useQuestShowroomStore";

ViroMaterials.createMaterials({
  infoPanelBg: {
    lightingModel: "Constant",
    diffuseColor: "rgba(17, 24, 39, 0.95)",
  },
  infoAccent: {
    lightingModel: "Constant",
    diffuseColor: "#3B82F6",
  },
});

interface InfoPanelProps {
  position?: [number, number, number];
}

const InfoPanelComponent: React.FC<InfoPanelProps> = ({
  position = [1.5, 0, -2],
}) => {
  const isVisible = useQuestShowroomStore((state) => state.isInfoPanelVisible);

  if (!isVisible) return null;

  return (
    <ViroNode position={position}>
      {/* Panel Background */}
      <ViroBox
        position={[0, 0, 0]}
        scale={[1.2, 1.4, 0.05]}
        materials={["infoPanelBg"]}
      />

      {/* Header */}
      <ViroText
        text="XR Product Showroom"
        position={[0, 0.55, 0.06]}
        scale={[0.12, 0.12, 0.12]}
        color="#3B82F6"
        style={{ fontWeight: "bold" }}
      />

      {/* Divider */}
      <ViroBox
        position={[0, 0.45, 0.06]}
        scale={[1, 0.01, 0.01]}
        materials={["infoAccent"]}
      />

      {/* Product Info */}
      <ViroText
        text="Product: Premium Headset"
        position={[-0.4, 0.35, 0.06]}
        scale={[0.08, 0.08, 0.08]}
        color="#FFFFFF"
      />
      <ViroText
        text="Model: Quest Pro Edition"
        position={[-0.4, 0.25, 0.06]}
        scale={[0.06, 0.06, 0.06]}
        color="#9CA3AF"
      />

      {/* Controls Help */}
      <ViroText
        text="Controls:"
        position={[-0.4, 0.1, 0.06]}
        scale={[0.08, 0.08, 0.08]}
        color="#3B82F6"
        style={{ fontWeight: "bold" }}
      />

      <ViroText
        text="• Trigger/A - Select/Click"
        position={[-0.3, 0, 0.06]}
        scale={[0.05, 0.05, 0.05]}
        color="#D1D5DB"
      />
      <ViroText
        text="• Thumbstick - Navigate"
        position={[-0.3, -0.08, 0.06]}
        scale={[0.05, 0.05, 0.05]}
        color="#D1D5DB"
      />
      <ViroText
        text="• Hand pinch - Tap gesture"
        position={[-0.3, -0.16, 0.06]}
        scale={[0.05, 0.05, 0.05]}
        color="#D1D5DB"
      />

      {/* Status */}
      <ViroText
        text="Status: Ready"
        position={[-0.4, -0.35, 0.06]}
        scale={[0.06, 0.06, 0.06]}
        color="#10B981"
      />

      {/* Footer */}
      <ViroBox
        position={[0, -0.6, 0.06]}
        scale={[1, 0.01, 0.01]}
        materials={["infoAccent"]}
      />
      <ViroText
        text="Powered by React Native + Viro"
        position={[0, -0.7, 0.06]}
        scale={[0.04, 0.04, 0.04]}
        color="#6B7280"
      />
    </ViroNode>
  );
};

export const InfoPanel = memo(InfoPanelComponent);
export default InfoPanel;
