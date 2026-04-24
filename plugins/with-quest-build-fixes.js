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
    const application = cfg.modResults.manifest.application?.[0];
    if (!application) return cfg;
    application['meta-data'] = application['meta-data'] ?? [];
    upsertMeta(application['meta-data'], 'com.google.ar.core', 'optional');
    upsertMeta(application['meta-data'], 'com.google.ar.core.min_apk_version', '240350000');
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

module.exports = withQuestBuildFixes;
