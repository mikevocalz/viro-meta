// @reactvision/react-viro ships its own Expo config plugin that wires up the
// :react_viro / :viro_renderer / :gvr_common / :arcore_client subprojects
// directly. The package's `android/` root is just a buildscript stub with no
// Android library plugin applied, so RN's autolinker can't find any variants
// when it tries to register :reactvision_react-viro. Skip its android +
// ios autolinking and let Viro's own plugin do the wiring.
module.exports = {
  dependencies: {
    '@reactvision/react-viro': {
      platforms: {
        android: null,
        ios: null,
      },
    },
  },
};
