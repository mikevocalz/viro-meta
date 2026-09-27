#!/usr/bin/env node
// Applies upstream changes from ReactVision/viro PR #473 (Meta Horizon OS support)
// to the installed @reactvision/react-viro package (v2.54.0 on npm, not yet published).
// Also downloads the updated AAR binaries that include OpenXR/Quest support.
//
// Idempotent: each replacement is guarded by a sentinel check.

const fs = require("node:fs");
const path = require("node:path");
const https = require("node:https");

const PKG = path.join(
  __dirname,
  "..",
  "node_modules",
  "@reactvision",
  "react-viro",
);

if (!fs.existsSync(PKG)) {
  console.log("[patch-viro] @reactvision/react-viro not found, skipping");
  process.exit(0);
}

let patched = 0;

// Apply a string replacement only if `sentinel` is NOT already in the file,
// replacing `search` with `replace`. Warns if search is not found.
function patch(relPath, sentinel, search, replace) {
  const full = path.join(PKG, relPath);
  if (!fs.existsSync(full)) return;
  const src = fs.readFileSync(full, "utf-8");
  if (src.includes(sentinel)) return; // already applied
  if (!src.includes(search)) {
    console.warn(
      `[patch-viro] Could not apply patch to ${relPath}: search string not found`,
    );
    return;
  }
  fs.writeFileSync(full, src.replace(search, replace), "utf-8");
  patched++;
}

// ── 1. dist/plugins/withViro.d.ts — add QUEST to XrMode ──────────────────────
patch(
  "dist/plugins/withViro.d.ts",
  '"QUEST"', // sentinel
  '"GVR" | "AR" | "OVR_MOBILE"',
  '"GVR" | "AR" | "OVR_MOBILE" | "QUEST"',
);

// ── 2. dist/plugins/withViroAndroid.js — QUEST in xRMode filters ─────────────
patch(
  "dist/plugins/withViroAndroid.js",
  // sentinel: QUEST already in first filter
  '"AR", "GVR", "OVR_MOBILE", "QUEST"].includes(mode))',
  '["AR", "GVR", "OVR_MOBILE"].includes(mode))',
  '["AR", "GVR", "OVR_MOBILE", "QUEST"].includes(mode))',
);
patch(
  "dist/plugins/withViroAndroid.js",
  '"AR", "GVR", "OVR_MOBILE", "QUEST"].includes(viroPlugin[1]',
  '["AR", "GVR", "OVR_MOBILE"].includes(viroPlugin[1]',
  '["AR", "GVR", "OVR_MOBILE", "QUEST"].includes(viroPlugin[1]',
);

// ── 3. dist/plugins/withViroAndroid.js — Quest manifest + VRActivity + chain fix
patch(
  "dist/plugins/withViroAndroid.js",
  "withViroQuestActivity", // sentinel
  // Replace broken withViroAndroid (no config= chaining) with full new impl
  `const withViroAndroid = (config, props) => {
    (0, config_plugins_1.withPlugins)(config, [[withBranchAndroid, props]]);
    withViroProjectBuildGradle(config);
    withViroManifest(config);
    withViroSettingsGradle(config);
    withViroAppBuildGradle(config);
    return config;
};
exports.withViroAndroid = withViroAndroid;`,
  `const withViroQuestActivity = (config) => {
    const viroPluginEntry = config?.plugins?.find((plugin) => Array.isArray(plugin) && plugin[0] === "@reactvision/react-viro");
    let xrModes = ["AR", "GVR"];
    if (Array.isArray(viroPluginEntry)) {
        const xrMode = viroPluginEntry[1]?.android?.xRMode;
        if (Array.isArray(xrMode)) xrModes = xrMode.filter((m) => ["AR", "GVR", "OVR_MOBILE", "QUEST"].includes(m));
        else if (typeof xrMode === "string" && ["AR", "GVR", "OVR_MOBILE", "QUEST"].includes(xrMode)) xrModes = [xrMode];
    }
    if (!xrModes.includes("QUEST")) return config;
    config = (0, config_plugins_1.withDangerousMod)(config, ["android", async (config) => {
        const packageName = config?.android?.package ?? "";
        const activityDir = path_1.default.join(config.modRequest.platformProjectRoot, "app", "src", "main", "java", ...packageName.split("."));
        if (!fs_1.default.existsSync(activityDir)) fs_1.default.mkdirSync(activityDir, { recursive: true });
        const activityPath = path_1.default.join(activityDir, "VRActivity.kt");
        if (!fs_1.default.existsSync(activityPath)) {
            fs_1.default.writeFileSync(activityPath, \`package \${packageName}\\n\\nimport android.app.Activity\\nimport android.app.Application\\nimport android.os.Bundle\\nimport com.facebook.react.ReactActivity\\nimport com.facebook.react.ReactActivityDelegate\\nimport com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled\\nimport com.facebook.react.defaults.DefaultReactActivityDelegate\\n\\nclass VRActivity : ReactActivity() {\\n    private var lifecycleCallbacks: Application.ActivityLifecycleCallbacks? = null\\n    override fun getMainComponentName(): String = "VRQuestScene"\\n    override fun createReactActivityDelegate(): ReactActivityDelegate = DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)\\n    override fun onCreate(savedInstanceState: Bundle?) {\\n        super.onCreate(savedInstanceState)\\n        val callbacks = object : Application.ActivityLifecycleCallbacks {\\n            override fun onActivityResumed(other: Activity) { if (other !== this@VRActivity && !isFinishing && !isDestroyed) finish() }\\n            override fun onActivityCreated(a: Activity, b: Bundle?) {}\\n            override fun onActivityStarted(a: Activity) {}\\n            override fun onActivityPaused(a: Activity) {}\\n            override fun onActivityStopped(a: Activity) {}\\n            override fun onActivitySaveInstanceState(a: Activity, b: Bundle) {}\\n            override fun onActivityDestroyed(a: Activity) {}\\n        }\\n        application.registerActivityLifecycleCallbacks(callbacks)\\n        lifecycleCallbacks = callbacks\\n    }\\n    override fun onDestroy() { lifecycleCallbacks?.let { application.unregisterActivityLifecycleCallbacks(it) }; lifecycleCallbacks = null; super.onDestroy() }\\n}\\n\`, "utf-8");
        }
        return config;
    }]);
    config = (0, config_plugins_1.withAndroidManifest)(config, async (config) => {
        const app = config.modResults.manifest.application?.[0];
        if (!app) return config;
        if (!app.activity) app.activity = [];
        if (!app.activity.some((a) => a.$?.["android:name"] === ".VRActivity")) {
            app.activity.push({ $: { "android:name": ".VRActivity", "android:screenOrientation": "landscape", "android:exported": "false", "android:configChanges": "keyboard|keyboardHidden|orientation|screenSize|uiMode", "android:launchMode": "singleTask" }, "intent-filter": [{ action: [{ $: { "android:name": "android.intent.action.MAIN" } }], category: [{ $: { "android:name": "com.oculus.intent.category.VR" } }] }] });
        }
        return config;
    });
    return config;
};
const withViroAndroid = (config, props) => {
    config = withBranchAndroid(config, props);
    config = withViroProjectBuildGradle(config);
    config = withViroManifest(config);
    config = withViroSettingsGradle(config);
    config = withViroAppBuildGradle(config);
    config = withViroQuestActivity(config, props);
    return config;
};
exports.withViroAndroid = withViroAndroid;`,
);

// Also add Quest manifest block (Quest features + permissions) before old return
patch(
  "dist/plugins/withViroAndroid.js",
  'viroPluginConfig.includes("QUEST")', // sentinel: Quest manifest block already present
  "    return newConfig;\n});\nconst withViroQuestActivity",
  `    // Quest-specific features and permissions
    if (viroPluginConfig.includes("QUEST")) {
        contents.manifest["uses-feature"].push({ $: { "android:name": "android.hardware.vr.headtracking", "android:required": "true", "android:version": "1" } });
        contents.manifest["uses-feature"].push({ $: { "android:name": "oculus.software.handtracking", "android:required": "false" } });
        contents.manifest["uses-feature"].push({ $: { "android:name": "com.oculus.feature.PASSTHROUGH", "android:required": "false" } });
        const existingPermissions = (contents.manifest["uses-permission"] || []).map((p) => p.$?.["android:name"]);
        if (!existingPermissions.includes("com.oculus.permission.HAND_TRACKING")) contents.manifest["uses-permission"].push({ $: { "android:name": "com.oculus.permission.HAND_TRACKING" } });
        if (!existingPermissions.includes("com.oculus.permission.EYE_TRACKING")) contents.manifest["uses-permission"].push({ $: { "android:name": "com.oculus.permission.EYE_TRACKING" } });
    }
    return newConfig;
});\nconst withViroQuestActivity`,
);

// ── 4. components/Types/ViroEvents.ts ─────────────────────────────────────────
patch(
  "components/Types/ViroEvents.ts",
  'QUEST = "quest"', // sentinel
  'GEAR_VR = "ovr-mobile",\n}',
  'GEAR_VR = "ovr-mobile",\n  QUEST = "quest",\n}',
);
patch(
  "components/Types/ViroEvents.ts",
  "ViroHandUpdateEvent", // sentinel
  "  error: Error;\n};\n\n/** ===========================================================================\n * Viro Animation Events",
  `  error: Error;
};

export type ViroJoint = { position: Viro3DPoint; radius: number; };
export type ViroHandJoints = {
  wrist: ViroJoint; thumbMetacarpal: ViroJoint; thumbProximal: ViroJoint; thumbDistal: ViroJoint; thumbTip: ViroJoint;
  indexMetacarpal: ViroJoint; indexProximal: ViroJoint; indexIntermediate: ViroJoint; indexDistal: ViroJoint; indexTip: ViroJoint;
  middleMetacarpal: ViroJoint; middleProximal: ViroJoint; middleIntermediate: ViroJoint; middleDistal: ViroJoint; middleTip: ViroJoint;
  ringMetacarpal: ViroJoint; ringProximal: ViroJoint; ringIntermediate: ViroJoint; ringDistal: ViroJoint; ringTip: ViroJoint;
  littleMetacarpal: ViroJoint; littleProximal: ViroJoint; littleIntermediate: ViroJoint; littleDistal: ViroJoint; littleTip: ViroJoint;
};
export type ViroHandPinchEvent = { hand: "left" | "right"; position: Viro3DPoint; pinchStrength: number; };
export type ViroHandUpdateEvent = { left: ViroHandJoints | null; right: ViroHandJoints | null; };

/** ===========================================================================
 * Viro Animation Events`,
);

// ── 5. dist/components/Types/ViroEvents.js ────────────────────────────────────
patch(
  "dist/components/Types/ViroEvents.js",
  "QUEST", // sentinel
  '    ViroPlatformTypes["GEAR_VR"] = "ovr-mobile";\n})',
  '    ViroPlatformTypes["GEAR_VR"] = "ovr-mobile";\n    ViroPlatformTypes["QUEST"] = "quest";\n})',
);

// ── 6. dist/components/Types/ViroEvents.d.ts ──────────────────────────────────
patch(
  "dist/components/Types/ViroEvents.d.ts",
  'QUEST = "quest"', // sentinel
  '    GEAR_VR = "ovr-mobile"\n}',
  '    GEAR_VR = "ovr-mobile",\n    QUEST = "quest"\n}',
);
patch(
  "dist/components/Types/ViroEvents.d.ts",
  "ViroHandUpdateEvent", // sentinel
  "    error: Error;\n};\n/** ===========================================================================\n * Viro Animation Events",
  `    error: Error;
};
export type ViroJoint = { position: Viro3DPoint; radius: number; };
export type ViroHandJoints = {
    wrist: ViroJoint; thumbMetacarpal: ViroJoint; thumbProximal: ViroJoint; thumbDistal: ViroJoint; thumbTip: ViroJoint;
    indexMetacarpal: ViroJoint; indexProximal: ViroJoint; indexIntermediate: ViroJoint; indexDistal: ViroJoint; indexTip: ViroJoint;
    middleMetacarpal: ViroJoint; middleProximal: ViroJoint; middleIntermediate: ViroJoint; middleDistal: ViroJoint; middleTip: ViroJoint;
    ringMetacarpal: ViroJoint; ringProximal: ViroJoint; ringIntermediate: ViroJoint; ringDistal: ViroJoint; ringTip: ViroJoint;
    littleMetacarpal: ViroJoint; littleProximal: ViroJoint; littleIntermediate: ViroJoint; littleDistal: ViroJoint; littleTip: ViroJoint;
};
export type ViroHandPinchEvent = { hand: "left" | "right"; position: Viro3DPoint; pinchStrength: number; };
export type ViroHandUpdateEvent = { left: ViroHandJoints | null; right: ViroHandJoints | null; };
/** ===========================================================================
 * Viro Animation Events`,
);

// ── 7. components/ViroVRSceneNavigator.tsx ────────────────────────────────────
patch(
  "components/ViroVRSceneNavigator.tsx",
  "ViroHandUpdateEvent", // sentinel
  'import { ViroExitViroEvent } from "./Types/ViroEvents";',
  'import { ViroExitViroEvent, ViroHandUpdateEvent } from "./Types/ViroEvents";',
);
patch(
  "components/ViroVRSceneNavigator.tsx",
  "VRModuleOpenXR", // sentinel
  "const ViroSceneNavigatorModule = NativeModules.VRTSceneNavigatorModule;\n\ntype State",
  `const ViroSceneNavigatorModule = NativeModules.VRTSceneNavigatorModule;
const VRModuleOpenXR = NativeModules.VRModuleOpenXR as {
  recenterTracking: (viewTag: number) => void;
  setPassthroughEnabled: (viewTag: number, enabled: boolean) => void;
} | undefined;

type State`,
);
patch(
  "components/ViroVRSceneNavigator.tsx",
  "passthroughEnabled", // sentinel
  "  multisamplingEnabled?: boolean;\n};",
  `  multisamplingEnabled?: boolean;
  passthroughEnabled?: boolean;
  handTrackingEnabled?: boolean;
  onHandUpdate?: (event: NativeSyntheticEvent<ViroHandUpdateEvent>) => void;
};`,
);

// ── 8b. dist/index.d.ts — export hand tracking types ─────────────────────────
patch(
  "dist/index.d.ts",
  'ViroHandUpdateEvent } from "./components/Types/ViroEvents"', // sentinel
  'ViroMonocularDepthSupportResult, ViroMonocularDepthModelAvailableResult, ViroMonocularDepthPreferenceResult } from "./components/Types/ViroEvents"',
  'ViroMonocularDepthSupportResult, ViroMonocularDepthModelAvailableResult, ViroMonocularDepthPreferenceResult, ViroJoint, ViroHandJoints, ViroHandPinchEvent, ViroHandUpdateEvent } from "./components/Types/ViroEvents"',
);
patch(
  "dist/index.d.ts",
  "ViroHandUpdateEvent, };", // sentinel
  "ViroMonocularDepthSupportResult, ViroMonocularDepthModelAvailableResult, ViroMonocularDepthPreferenceResult, };",
  "ViroMonocularDepthSupportResult, ViroMonocularDepthModelAvailableResult, ViroMonocularDepthPreferenceResult, ViroJoint, ViroHandJoints, ViroHandPinchEvent, ViroHandUpdateEvent, };",
);

// ── 8c. dist/index.js — export hand tracking types ───────────────────────────
patch(
  "dist/index.js",
  "ViroHandUpdateEvent", // sentinel (in export)
  "ViroMonocularDepthSupportResult: exports_ViroEvents.ViroMonocularDepthSupportResult,\n    ViroMonocularDepthModelAvailableResult: exports_ViroEvents.ViroMonocularDepthModelAvailableResult,\n    ViroMonocularDepthPreferenceResult: exports_ViroEvents.ViroMonocularDepthPreferenceResult,",
  "ViroMonocularDepthSupportResult: exports_ViroEvents.ViroMonocularDepthSupportResult,\n    ViroMonocularDepthModelAvailableResult: exports_ViroEvents.ViroMonocularDepthModelAvailableResult,\n    ViroMonocularDepthPreferenceResult: exports_ViroEvents.ViroMonocularDepthPreferenceResult,\n    ViroJoint: exports_ViroEvents.ViroJoint,\n    ViroHandJoints: exports_ViroEvents.ViroHandJoints,\n    ViroHandPinchEvent: exports_ViroEvents.ViroHandPinchEvent,\n    ViroHandUpdateEvent: exports_ViroEvents.ViroHandUpdateEvent,",
);

// ── 9. dist/components/ViroVRSceneNavigator.d.ts ──────────────────────────────
patch(
  "dist/components/ViroVRSceneNavigator.d.ts",
  "ViroHandUpdateEvent", // sentinel
  'import { ViroExitViroEvent } from "./Types/ViroEvents";',
  'import { ViroExitViroEvent, ViroHandUpdateEvent } from "./Types/ViroEvents";',
);
patch(
  "dist/components/ViroVRSceneNavigator.d.ts",
  "passthroughEnabled", // sentinel
  "    multisamplingEnabled?: boolean;\n};",
  `    multisamplingEnabled?: boolean;
    passthroughEnabled?: boolean;
    handTrackingEnabled?: boolean;
    onHandUpdate?: (event: NativeSyntheticEvent<ViroHandUpdateEvent>) => void;
};`,
);

// ── 10. v2.55.0 — New platform detection utilities and hooks ─────────────────
// Add isQuest / hasOpenXRSupport exports to dist/index.js
patch(
  "dist/index.js",
  "isQuest",
  "exports.ViroHandUpdateEvent = exports_ViroEvents.ViroHandUpdateEvent;",
  `exports.ViroHandUpdateEvent = exports_ViroEvents.ViroHandUpdateEvent;
exports.isQuest = exports_ViroEvents.isQuest;
exports.hasOpenXRSupport = exports_ViroEvents.hasOpenXRSupport;`,
);

// Add useAnySourceHover / useAnySourcePressed to index.js
patch(
  "dist/index.js",
  "useAnySourceHover",
  "ViroQuad: ViroQuad,",
  `ViroQuad: ViroQuad,
  useAnySourceHover: require("./components/ViroUtils").useAnySourceHover,
  useAnySourcePressed: require("./components/ViroUtils").useAnySourcePressed,`,
);

// Add ViroXRSceneNavigator and StudioSceneNavigator exports
patch(
  "dist/index.js",
  "ViroXRSceneNavigator",
  "ViroVRSceneNavigator: ViroVRSceneNavigator,",
  `ViroVRSceneNavigator: ViroVRSceneNavigator,
  ViroXRSceneNavigator: require("./components/ViroXRSceneNavigator").ViroXRSceneNavigator,
  StudioSceneNavigator: require("./components/StudioSceneNavigator").StudioSceneNavigator,`,
);

// Add TypeScript declarations for v2.55.0 exports to dist/index.d.ts
patch(
  "dist/index.d.ts",
  "isQuest",
  "export type { ViroHandUpdateEvent } from",
  `export type { ViroHandUpdateEvent } from "./components/Types/ViroEvents";
export declare const isQuest: boolean;
export declare const hasOpenXRSupport: boolean;
export declare function useAnySourceHover(): [boolean, (event: any) => void];
export declare function useAnySourcePressed(): [boolean, (event: any) => void];`,
);

// Add ViroXRSceneNavigator and StudioSceneNavigator to d.ts
patch(
  "dist/index.d.ts",
  "ViroXRSceneNavigator",
  "export { ViroVRSceneNavigator };",
  `export { ViroVRSceneNavigator };
export { ViroXRSceneNavigator } from "./components/ViroXRSceneNavigator";
export { StudioSceneNavigator } from "./components/StudioSceneNavigator";`,
);

console.log(
  `[patch-viro] applied ${patched} patches to @reactvision/react-viro`,
);

// ── 10. Patch expo ReactActivityDelegateWrapper.kt to swallow AssertionError
// during VRActivity/MainActivity dual-activity lifecycle transitions ─────────
(function patchExpo() {
  const expoWrapper = path.join(
    __dirname,
    "..",
    "node_modules",
    "expo",
    "android",
    "src",
    "main",
    "java",
    "expo",
    "modules",
    "ReactActivityDelegateWrapper.kt",
  );
  if (!fs.existsSync(expoWrapper)) {
    console.log(
      "[patch-expo] ReactActivityDelegateWrapper.kt not found, skipping",
    );
    return;
  }
  const src = fs.readFileSync(expoWrapper, "utf-8");
  if (src.includes("// PATCH-EXPO-VR-TRANSITION")) {
    console.log("[patch-expo] already applied");
    return;
  }
  const oldBlock = `      if (delayLoadAppHandler != null) {
        try {
          // For the delay load case, we may enter a different call flow than react-native.
          // For example, Activity stopped before delay load finished.
          // In this case, we should catch the exceptions.
          delegate.onPause()
        } catch (e: Exception) {
          Log.e(TAG, "Exception occurred during onPause with delayed app loading", e)
        }
      } else {
        delegate.onPause()
      }`;

  const newBlock = `      // PATCH-EXPO-VR-TRANSITION
      try {
        delegate.onPause()
      } catch (e: AssertionError) {
        // Swallow assertion errors from ReactHost when pausing an activity
        // that is no longer current (e.g. MainActivity paused while VRActivity
        // is active). This is required for ViroReact dual-activity VR scenes.
        Log.w(TAG, "Swallowed exception during onPause for VR transition", e)
      } catch (e: Exception) {
        if (delayLoadAppHandler != null) {
          Log.e(TAG, "Exception occurred during onPause with delayed app loading", e)
        } else {
          throw e
        }
      }`;

  if (!src.includes(oldBlock)) {
    console.warn(
      "[patch-expo] Could not find expected onPause block in ReactActivityDelegateWrapper.kt",
    );
    return;
  }
  fs.writeFileSync(expoWrapper, src.replace(oldBlock, newBlock), "utf-8");
  console.log(
    "[patch-expo] applied VR transition fix to ReactActivityDelegateWrapper.kt",
  );
})();

// ── 9. Download updated AARs (v2.55.0 release commit) ──────────────────────────
const MERGE_SHA = "fe03994d35097b59584b6b3c6b607c6a160f926a";
const AARS = [
  {
    url: `https://raw.githubusercontent.com/ReactVision/viro/${MERGE_SHA}/android/react_viro/react_viro-release.aar`,
    dest: path.join(PKG, "android", "react_viro", "react_viro-release.aar"),
    expectedSize: 0, // Size will be checked at runtime
  },
  {
    url: `https://raw.githubusercontent.com/ReactVision/viro/${MERGE_SHA}/android/viro_renderer/viro_renderer-release.aar`,
    dest: path.join(
      PKG,
      "android",
      "viro_renderer",
      "viro_renderer-release.aar",
    ),
    expectedSize: 0, // Size will be checked at runtime
  },
];

for (const { url, dest, expectedSize } of AARS) {
  const existing = fs.existsSync(dest) ? fs.statSync(dest).size : 0;
  if (existing === expectedSize) {
    console.log(`[patch-viro] AAR up-to-date: ${path.basename(dest)}`);
    continue;
  }
  console.log(`[patch-viro] downloading ${path.basename(dest)}...`);
  const tmp = dest + ".tmp";
  const file = fs.createWriteStream(tmp);
  https
    .get(url, (res) => {
      if (res.statusCode !== 200) {
        console.warn(
          `[patch-viro] HTTP ${res.statusCode} for ${path.basename(dest)}, skipping`,
        );
        file.close();
        fs.unlink(tmp, () => {});
        return;
      }
      res.pipe(file);
      file.on("finish", () => {
        file.close();
        fs.renameSync(tmp, dest);
        console.log(`[patch-viro] updated ${path.basename(dest)}`);
      });
    })
    .on("error", (err) => {
      console.warn(
        `[patch-viro] error downloading ${path.basename(dest)}: ${err.message}`,
      );
      fs.unlink(tmp, () => {});
    });
}
