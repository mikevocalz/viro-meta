// Expo config plugin: tell every device-flavored variant to fall back to a
// flavor-less library (no `device` dimension) when matching dependencies.
// Required because @reactvision/react-viro and other RN libs publish a single
// variant, but expo-horizon-core adds a `device` flavor dimension to the app
// project — without this the Quest variant fails to resolve.
const { withAppBuildGradle } = require('@expo/config-plugins');

const FLAVORS_REGEX = /productFlavors\s*\{[^}]*\}/m;
const MARKER = 'missingDimensionStrategy "device"';

const withMissingDeviceDimension = (config) =>
  withAppBuildGradle(config, (cfg) => {
    if (cfg.modResults.contents.includes(MARKER)) return cfg;

    cfg.modResults.contents = cfg.modResults.contents.replace(
      FLAVORS_REGEX,
      (match) =>
        `${match}\n    defaultConfig {\n        missingDimensionStrategy "device", "mobile"\n    }`,
    );
    return cfg;
  });

module.exports = withMissingDeviceDimension;
