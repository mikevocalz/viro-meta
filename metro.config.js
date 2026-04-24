const { getDefaultConfig } = require('expo/metro-config');
const { resolve: defaultResolver } = require('metro-resolver');
const fs = require('fs');
const path = require('path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

const babylonAssetExts = ['glb', 'gltf', 'bin', 'env', 'hdr', 'ktx', 'ktx2', 'dds', 'basis'];
config.resolver.assetExts = Array.from(
  new Set([...(config.resolver.assetExts ?? []), ...babylonAssetExts]),
);
config.resolver.sourceExts = Array.from(
  new Set([...(config.resolver.sourceExts ?? []), 'mjs', 'cjs']),
);

// Metro rejects URL specifiers; short-circuit to an empty shim so Babylon
// loaders can fetch remote GLBs at runtime instead of at bundle time.
const httpsShim = path.join(__dirname, 'babylon', 'https-shim.js');
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (/^https?:\/\//.test(moduleName)) {
    return { type: 'sourceFile', filePath: httpsShim };
  }
  return defaultResolver(context, moduleName, platform);
};

// WebXR on Quest + iOS Safari requires a secure origin on the LAN.
const keyFile = path.join(__dirname, '.ssl', 'key.pem');
const certFile = path.join(__dirname, '.ssl', 'cert.pem');
if (fs.existsSync(keyFile) && fs.existsSync(certFile)) {
  config.server = config.server ?? {};
  config.server.https = {
    key: fs.readFileSync(keyFile),
    cert: fs.readFileSync(certFile),
  };
}

module.exports = config;
