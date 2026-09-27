/**
 * Horizon OS / Meta Quest Utilities
 *
 * Platform detection and Horizon-safe guards
 */

import { NativeModules, Platform } from "react-native";

/**
 * Detect if running on actual Quest hardware
 * Checks Build.MANUFACTURER, BRAND, and MODEL via Platform.constants
 */
export function isQuest(): boolean {
  if (Platform.OS !== "android") return false;

  try {
    const constants = Platform.constants as any;
    if (!constants) return false;

    const manufacturer = String(
      (constants as any).Manufacturer || "",
    ).toLowerCase();
    const brand = String((constants as any).Brand || "").toLowerCase();
    const model = String((constants as any).Model || "").toLowerCase();

    return (
      manufacturer.includes("oculus") ||
      manufacturer.includes("meta") ||
      brand.includes("oculus") ||
      brand.includes("meta") ||
      model.includes("quest")
    );
  } catch {
    return false;
  }
}

/**
 * Check if running on Horizon OS (Quest's operating system)
 * This is true for Quest 1/2/3/Pro running Horizon OS
 */
export function isHorizonOS(): boolean {
  return isQuest();
}

/**
 * Check if OpenXR native module is available
 * This indicates Horizon OS VR support is properly linked
 */
export function hasOpenXRSupport(): boolean {
  try {
    return (
      typeof NativeModules.VRModuleOpenXR === "object" &&
      NativeModules.VRModuleOpenXR !== null
    );
  } catch {
    return false;
  }
}

/**
 * Check if hand tracking is available on this device
 */
export function hasHandTracking(): boolean {
  return isQuest() && hasOpenXRSupport();
}

/**
 * Get device-specific context for conditional rendering
 */
export function getDeviceContext(): {
  isQuest: boolean;
  isHorizonOS: boolean;
  hasOpenXR: boolean;
  hasHandTracking: boolean;
  deviceType: "quest1" | "quest2" | "quest3" | "questpro" | "other";
} {
  const quest = isQuest();
  const horizon = isHorizonOS();
  const openxr = hasOpenXRSupport();
  const hand = hasHandTracking();

  // Detect specific Quest model
  let deviceType: "quest1" | "quest2" | "quest3" | "questpro" | "other" =
    "other";
  if (quest) {
    const model = String(Platform.constants?.Model || "").toLowerCase();
    if (model.includes("quest 3") || model.includes("quest3")) {
      deviceType = "quest3";
    } else if (model.includes("quest 2") || model.includes("quest2")) {
      deviceType = "quest2";
    } else if (model.includes("quest pro") || model.includes("questpro")) {
      deviceType = "questpro";
    } else if (model.includes("quest")) {
      deviceType = "quest1";
    }
  }

  return {
    isQuest: quest,
    isHorizonOS: horizon,
    hasOpenXR: openxr,
    hasHandTracking: hand,
    deviceType,
  };
}

/**
 * Horizon-safe console logging
 * Prevents log spam in production VR builds
 */
export function horizonLog(...args: any[]) {
  if (__DEV__ || !isQuest()) {
    console.log("[Quest]", ...args);
  }
}

/**
 * Assert Horizon OS context for VR-only features
 * Throws if not on Quest (use for debugging only)
 */
export function assertHorizon(context: string): void {
  if (!isQuest()) {
    throw new Error(`Horizon OS required for: ${context}`);
  }
}
