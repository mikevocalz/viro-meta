/**
 * LightingRig - Professional lighting setup for the XR Product Showroom
 *
 * Provides multiple lighting modes optimized for product visualization:
 * - Studio: Balanced 3-point lighting
 * - Dramatic: High contrast for visual impact
 * - Ambient: Soft, even lighting
 * - Product: Optimized for material detail
 */

import React, { memo } from "react";
import {
  ViroAmbientLight,
  ViroDirectionalLight,
  ViroSpotLight,
} from "@reactvision/react-viro";
import {
  useQuestShowroomStore,
  LightingMode,
} from "../state/useQuestShowroomStore";

interface LightingRigProps {
  mode?: LightingMode;
}

// Lighting configurations for each mode
const LIGHTING_CONFIGS: Record<LightingMode, React.ReactNode> = {
  studio: (
    <>
      {/* Key Light - Main illumination */}
      <ViroDirectionalLight
        color="#FFFFFF"
        direction={[0.5, -1, 0.5]}
        intensity={1.2}
        castsShadow
        shadowMapSize={2048}
        shadowNearZ={0.1}
        shadowFarZ={10}
        shadowOpacity={0.4}
      />
      {/* Fill Light - Softens shadows */}
      <ViroDirectionalLight
        color="#E8F4FF"
        direction={[-0.5, -0.8, -0.3]}
        intensity={0.6}
        castsShadow={false}
      />
      {/* Rim Light - Separates subject from background */}
      <ViroDirectionalLight
        color="#FFE4B5"
        direction={[0, -0.3, -1]}
        intensity={0.4}
        castsShadow={false}
      />
      {/* Ambient base */}
      <ViroAmbientLight color="#F5F5F5" intensity={0.3} />
    </>
  ),

  dramatic: (
    <>
      {/* Strong key with warm tint */}
      <ViroDirectionalLight
        color="#FFF8E7"
        direction={[0.7, -1, 0.3]}
        intensity={1.8}
        castsShadow
        shadowMapSize={2048}
        shadowNearZ={0.1}
        shadowFarZ={10}
        shadowOpacity={0.7}
      />
      {/* Cool fill from opposite side */}
      <ViroDirectionalLight
        color="#B8D4E3"
        direction={[-0.8, -0.5, -0.2]}
        intensity={0.3}
        castsShadow={false}
      />
      {/* Low ambient */}
      <ViroAmbientLight color="#2A2A3A" intensity={0.15} />
    </>
  ),

  ambient: (
    <>
      {/* Soft overhead */}
      <ViroDirectionalLight
        color="#FFFFFF"
        direction={[0, -1, 0]}
        intensity={0.8}
        castsShadow
        shadowMapSize={1024}
        shadowNearZ={0.1}
        shadowFarZ={10}
        shadowOpacity={0.2}
      />
      {/* Strong ambient */}
      <ViroAmbientLight color="#FFFFFF" intensity={0.7} />
      {/* Soft fill from all sides */}
      <ViroDirectionalLight
        color="#F0F8FF"
        direction={[1, -0.5, 0]}
        intensity={0.3}
        castsShadow={false}
      />
      <ViroDirectionalLight
        color="#F0F8FF"
        direction={[-1, -0.5, 0]}
        intensity={0.3}
        castsShadow={false}
      />
    </>
  ),

  product: (
    <>
      {/* Neutral key light for accurate colors */}
      <ViroSpotLight
        position={[2, 3, 2]}
        color="#FFFFFF"
        direction={[-0.5, -1, -0.5]}
        intensity={1.5}
        innerAngle={20}
        outerAngle={45}
        castsShadow
        shadowMapSize={4096}
        shadowNearZ={0.1}
        shadowFarZ={10}
        shadowOpacity={0.3}
      />
      {/* Detail light from side */}
      <ViroSpotLight
        position={[-2, 2, 1]}
        color="#F8F8FF"
        direction={[0.7, -0.5, -0.3]}
        intensity={0.8}
        innerAngle={15}
        outerAngle={40}
        castsShadow={false}
      />
      {/* Soft ambient */}
      <ViroAmbientLight color="#F8F8FF" intensity={0.4} />
      {/* Backlight for edge definition */}
      <ViroDirectionalLight
        color="#E6E6FA"
        direction={[0, 0.2, -1]}
        intensity={0.5}
        castsShadow={false}
      />
    </>
  ),
};

const LightingRigComponent: React.FC<LightingRigProps> = ({ mode }) => {
  // Always call hook unconditionally
  const storeMode = useQuestShowroomStore((state) => state.activeLightingMode);
  const activeMode = mode ?? storeMode;

  return <>{LIGHTING_CONFIGS[activeMode]}</>;
};

// Memoize to prevent re-renders when store changes unrelated properties
export const LightingRig = memo(LightingRigComponent);

export default LightingRig;
