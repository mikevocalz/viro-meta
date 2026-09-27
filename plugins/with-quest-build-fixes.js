// Expo config plugin: apply the patches the Quest build needs that aren't
// supplied by @reactvision/react-viro / expo-horizon-core out of the box.
//
//   1. android/app/build.gradle:
//      - missingDimensionStrategy "device", "mobile"  (so libraries with no
//        flavor fall back to the mobile variant when the app is questRelease)
//      - jniLibs.pickFirsts to dedupe libarcore_sdk_c.so / libarcore_sdk_jni.so
//        (Babylon RN ships its own copy alongside Viro's :arcore_client)
//      - configurations.all { exclude com.google.ar:core } so dex merge
//        doesn't see two versions of Anchor$CloudAnchorState
//   2. android/app/src/main/AndroidManifest.xml:
//      - tools:replace="android:value" on com.google.ar.core /
//        com.google.ar.core.min_apk_version to override Viro's :arcore_client
//        defaults that conflict with the Maven com.google.ar:core coordinates.
//      - Quest optional uses-features (handtracking, trackedkeyboard, passthrough)
//        that expo-horizon-core does not inject
//      - Package visibility queries for Horizon system apps (vrshell, systemux)
//      - com.oculus.ossplash metadata
const { withAppBuildGradle, withAndroidManifest } = require('@expo/config-plugins');

const MISSING_DIM_MARKER = 'missingDimensionStrategy "device"';
const PICK_FIRST_MARKER = 'libarcore_sdk_c.so';
const EXCLUDE_MARKER = "exclude group: 'com.google.ar', module: 'core'";

const withQuestBuildFixes = (config) => {
  config = withAppBuildGradle(config, (cfg) => {
    let src = cfg.modResults.contents;

    if (!src.includes(MISSING_DIM_MARKER)) {
      src = src.replace(
        /(defaultConfig\s*\{\s*\n\s*applicationId)/,
        `defaultConfig {\n        missingDimensionStrategy "device", "mobile"\n        applicationId`,
      );
    }

    if (!src.includes(PICK_FIRST_MARKER)) {
      src = src.replace(
        /useLegacyPackaging enableLegacyPackaging\.toBoolean\(\)\n/,
        (match) =>
          `${match}            pickFirsts += [\n                'lib/*/libarcore_sdk_c.so',\n                'lib/*/libarcore_sdk_jni.so',\n            ]\n`,
      );
    }

    if (!src.includes(EXCLUDE_MARKER)) {
      src = src.replace(
        /(^dependencies\s*\{)/m,
        `configurations.all {\n    exclude group: 'com.google.ar', module: 'core'\n}\n\n$1`,
      );
    }

    cfg.modResults.contents = src;
    return cfg;
  });

  config = withAndroidManifest(config, (cfg) => {
    const { manifest } = cfg.modResults;
    const application = manifest.application?.[0];
    if (!application) return cfg;

    // ARCore — override Viro's :arcore_client defaults
    application['meta-data'] = application['meta-data'] ?? [];
    upsertMeta(application['meta-data'], 'com.google.ar.core', 'optional');
    upsertMeta(application['meta-data'], 'com.google.ar.core.min_apk_version', '240350000');

    // Quest — ossplash (expo-horizon-core does not add this)
    upsertMeta(application['meta-data'], 'com.oculus.ossplash', 'true');

    // Quest — optional features (android.hardware.vr.headtracking is added by expo-horizon-core)
    manifest['uses-feature'] = manifest['uses-feature'] ?? [];
    upsertUsesFeature(manifest['uses-feature'], 'oculus.software.handtracking', false);
    upsertUsesFeature(manifest['uses-feature'], 'oculus.software.trackedkeyboard', false);
    upsertUsesFeature(manifest['uses-feature'], 'com.oculus.feature.PASSTHROUGH', false);

    // Quest — package visibility queries for Horizon system apps
    if (!manifest.queries) manifest.queries = [];
    if (!manifest.queries.length) manifest.queries.push({});
    manifest.queries[0].package = manifest.queries[0].package ?? [];
    upsertQueryPackage(manifest.queries[0].package, 'com.oculus.vrshell');
    upsertQueryPackage(manifest.queries[0].package, 'com.oculus.systemux');

    return cfg;
  });

  return config;
};

function upsertMeta(metaArray, name, value) {
  const existing = metaArray.find((m) => m.$['android:name'] === name);
  const replaceAttr = { 'tools:replace': 'android:value' };
  if (existing) {
    existing.$['android:value'] = value;
    Object.assign(existing.$, replaceAttr);
  } else {
    metaArray.push({
      $: { 'android:name': name, 'android:value': value, ...replaceAttr },
    });
  }
}

function upsertUsesFeature(featArray, name, required) {
  const existing = featArray.find((f) => f.$['android:name'] === name);
  if (existing) {
    existing.$['android:required'] = String(required);
  } else {
    featArray.push({ $: { 'android:name': name, 'android:required': String(required) } });
  }
}

function upsertQueryPackage(pkgArray, name) {
  if (!pkgArray.find((p) => p.$['android:name'] === name)) {
    pkgArray.push({ $: { 'android:name': name } });
  }
}

module.exports = withQuestBuildFixes;
