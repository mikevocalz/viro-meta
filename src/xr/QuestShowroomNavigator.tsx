/**
 * QuestShowroomNavigator - VR Scene Navigator for the XR Product Showroom
 *
 * Wraps the scene in ViroVRSceneNavigator with Quest/Horizon OS optimizations.
 * This is the entry point for VR mode on Quest devices.
 */

import React, { useRef, useCallback } from "react";
import { ViroVRSceneNavigator, ViroController } from "@reactvision/react-viro";
import { findNodeHandle, NativeModules } from "react-native";
import { QuestShowroomScene } from "./QuestShowroomScene";
import { horizonLog, isQuest, hasOpenXRSupport } from "./utils/horizon";
import { useQuestShowroomStore } from "./state/useQuestShowroomStore";

interface QuestShowroomNavigatorProps {
  // Optional model source to pass to the scene
  modelSource?: string | number;
  // Callback when user requests exit
  onExitVR?: () => void;
}

const { VRLauncher, VRModuleOpenXR } = NativeModules;

export function QuestShowroomNavigator({
  modelSource,
  onExitVR,
}: QuestShowroomNavigatorProps) {
  const navRef = useRef<any>(null);

  // Store actions for hand tracking
  const setPressed = useQuestShowroomStore((state) => state.setPressed);

  // Check Quest compatibility on mount
  const questReady = isQuest() && hasOpenXRSupport();

  // Handle hand tracking updates
  const onHandUpdate = useCallback(
    (event: any) => {
      const { left, right } = event.nativeEvent;

      // Use pinch strength to detect "click" gestures
      if (left?.pinchStrength && left.pinchStrength > 0.8) {
        setPressed(true, "left");
      } else if (right?.pinchStrength && right.pinchStrength > 0.8) {
        setPressed(true, "right");
      } else {
        setPressed(false, undefined);
      }

      // Log hand positions in dev mode
      if (__DEV__ && (left || right)) {
        horizonLog("Hand tracking:", { left: !!left, right: !!right });
      }
    },
    [setPressed],
  );

  // Handle controller click for exit
  const onExitClick = useCallback(() => {
    horizonLog("Exit VR requested");

    // Try to recenter tracking before exit
    try {
      if (VRModuleOpenXR && navRef.current) {
        const viewTag = findNodeHandle(navRef.current);
        if (viewTag != null) {
          VRModuleOpenXR.recenterTracking?.(viewTag);
        }
      }
    } catch (e) {
      horizonLog("Recenter failed:", e);
    }

    // Call exit callback
    onExitVR?.();

    // Exit VR scene via native module
    try {
      VRLauncher?.exitVRScene?.();
    } catch (e) {
      horizonLog("Exit VR failed:", e);
    }
  }, [onExitVR]);

  if (!questReady) {
    // Return a fallback scene for non-Quest platforms
    return (
      <ViroVRSceneNavigator
        vrModeEnabled={false}
        initialScene={{
          scene: () => (
            <QuestShowroomScene
              modelSource={
                modelSource ??
                "https://github.com/KhronosGroup/glTF-Sample-Models/raw/main/2.0/DamagedHelmet/glTF-Binary/DamagedHelmet.glb"
              }
            />
          ),
        }}
        style={{ flex: 1 }}
      />
    );
  }

  return (
    <ViroVRSceneNavigator
      ref={navRef}
      vrModeEnabled
      passthroughEnabled={false}
      handTrackingEnabled
      onHandUpdate={onHandUpdate}
      initialScene={{
        scene: () => <QuestShowroomScene modelSource={modelSource} />,
      }}
      style={{ flex: 1 }}
    >
      {/* Left Controller */}
      <ViroController
        reticleVisibility={true}
        controllerVisibility={true}
        onClick={onExitClick}
      />

      {/* Right Controller */}
      <ViroController
        reticleVisibility={true}
        controllerVisibility={true}
        onClick={onExitClick}
      />
    </ViroVRSceneNavigator>
  );
}

export default QuestShowroomNavigator;
