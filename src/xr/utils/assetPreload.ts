/**
 * Asset Preloading Utilities for XR Showroom
 *
 * Handles GLB model loading, texture caching, and asset optimization hints
 */

import { Asset } from "expo-asset";
import { horizonLog } from "./horizon";

export interface GLBModelConfig {
  uri: string | number; // require() or URL
  scale?: [number, number, number];
  position?: [number, number, number];
  rotation?: [number, number, number];
  animation?: boolean;
}

export interface PreloadResult {
  uri: string;
  loaded: boolean;
  size?: number;
  error?: string;
}

/**
 * Preload a GLB model asset
 * Returns a local URI ready for Viro3DObject
 */
export async function preloadGLBModel(
  modelSource: string | number,
): Promise<PreloadResult> {
  try {
    horizonLog("Preloading GLB model...", typeof modelSource);

    let asset: Asset | null = null;

    if (typeof modelSource === "number") {
      // Local require() - e.g., require("./assets/models/showroom-model.glb")
      asset = Asset.fromModule(modelSource);
    } else {
      // Remote URL
      asset = Asset.fromURI(modelSource);
    }

    await asset.downloadAsync();

    horizonLog("GLB preloaded successfully:", asset.localUri ?? "unknown");

    return {
      uri: asset.localUri ?? asset.uri,
      loaded: true,
      size: asset.height, // expo-asset uses height for binary size sometimes
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    horizonLog("GLB preload failed:", errorMsg);

    return {
      uri: "",
      loaded: false,
      error: errorMsg,
    };
  }
}

/**
 * Batch preload multiple assets
 */
export async function preloadAssets(
  assets: (string | number)[],
): Promise<PreloadResult[]> {
  const results = await Promise.all(
    assets.map((asset) => preloadGLBModel(asset)),
  );

  const successCount = results.filter((r) => r.loaded).length;
  horizonLog(`Preloaded ${successCount}/${assets.length} assets`);

  return results;
}

/**
 * Recommended GLB sources for testing
 */
export const RECOMMENDED_GLB_SOURCES = {
  // Free models from Khronos Group glTF Sample Models
  khronosDamagedHelmet:
    "https://github.com/KhronosGroup/glTF-Sample-Models/raw/main/2.0/DamagedHelmet/glTF-Binary/DamagedHelmet.glb",

  // Sketchfab (requires API key for direct download)
  // Use these as placeholders - replace with your own models

  // Local placeholder path
  localPlaceholder: require("../../../assets/models/showroom-model.glb"),
};

/**
 * Check if a GLB is optimized for Quest
 * Returns warnings if model may have performance issues
 */
export function checkGLBOptimization(uri: string): {
  warnings: string[];
  recommendations: string[];
} {
  const warnings: string[] = [];
  const recommendations: string[] = [];

  // Size check (Quest performs best with < 10MB GLBs)
  if (uri.includes("http") && !uri.includes("optimized")) {
    warnings.push("Remote GLB may not be optimized for Quest");
    recommendations.push("Consider using Draco compression");
    recommendations.push("Target < 5MB for fast loading on Quest 2");
    recommendations.push("Target < 10MB for Quest 3");
  }

  // Texture resolution hints
  recommendations.push("Use 1K-2K textures maximum per material");
  recommendations.push("Combine materials to reduce draw calls");
  recommendations.push("Use texture atlasing where possible");

  return { warnings, recommendations };
}

/**
 * Asset loading state for UI feedback
 */
export type AssetLoadState =
  | "idle"
  | "loading"
  | "loaded"
  | "error"
  | "fallback";

export interface AssetState {
  state: AssetLoadState;
  progress: number;
  error?: string;
  uri?: string;
}
