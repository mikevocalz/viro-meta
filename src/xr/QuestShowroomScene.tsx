/**
 * QuestShowroomScene - Main VR Scene for the XR Product Showroom
 *
 * This is the primary scene component that renders when the user enters VR mode.
 * It includes:
 * - GLB model on pedestal
 * - Professional lighting rig
 * - Floating control panel
 * - Info panel
 * - Horizon OS optimizations
 */

import React, { useEffect } from "react";
import {
  ViroScene,
  Viro360Image,
  ViroSkyBox,
  ViroCamera,
} from "@reactvision/react-viro";
import { ModelPedestal } from "./components/ModelPedestal";
import { LightingRig } from "./components/LightingRig";
import { FloatingControlPanel } from "./components/FloatingControlPanel";
import { InfoPanel } from "./components/InfoPanel";
import { horizonLog, getDeviceContext } from "./utils/horizon";

// Default environment - dark studio
const ENVIRONMENT_SOURCE = {
  // Use a dark gradient skybox for studio feel
  nx: require("../../assets/textures/studio_nx.jpg"),
  ny: require("../../assets/textures/studio_ny.jpg"),
  nz: require("../../assets/textures/studio_nz.jpg"),
  px: require("../../assets/textures/studio_px.jpg"),
  py: require("../../assets/textures/studio_py.jpg"),
  pz: require("../../assets/textures/studio_pz.jpg"),
};

// Fallback to solid color if textures missing
const FALLBACK_BG_COLOR = "#0A0A0F";

interface QuestShowroomSceneProps {
  // Optional model source override
  modelSource?: string | number;
}

export function QuestShowroomScene({ modelSource }: QuestShowroomSceneProps) {
  // Log device context on mount
  useEffect(() => {
    const device = getDeviceContext();
    horizonLog("QuestShowroomScene mounted:", device);

    // Warn if not on Quest
    if (!device.isQuest) {
      console.warn(
        "[QuestShowroom] Not running on Quest hardware. VR features may be limited.",
      );
    }
  }, []);

  // Try to use environment, fallback to color
  const hasEnvironmentTextures = (() => {
    try {
      require("../../assets/textures/studio_px.jpg");
      return true;
    } catch {
      return false;
    }
  })();

  return (
    <ViroScene>
      {/* Camera setup - comfortable viewing position */}
      <ViroCamera position={[0, 0, 0]} rotation={[0, 0, 0]} active />

      {/* Environment / Background */}
      {hasEnvironmentTextures ? (
        <ViroSkyBox source={ENVIRONMENT_SOURCE} />
      ) : (
        // Fallback: render a solid color sphere or use default skybox
        // Viro360Image requires an actual image source, not a color
        <Viro360Image
          source={{
            uri: "https://raw.githubusercontent.com/ViroCommunity/assets/main/skybox/studio.jpg",
          }}
        />
      )}

      {/* Professional Lighting */}
      <LightingRig />

      {/* GLB Model on Pedestal */}
      <ModelPedestal modelSource={modelSource} position={[0, -0.5, -3]} />

      {/* Spatial Control Panel */}
      <FloatingControlPanel position={[0, 1.2, -2.5]} />

      {/* Info Panel */}
      <InfoPanel position={[2, 0.5, -3]} />
    </ViroScene>
  );
}

export default QuestShowroomScene;
