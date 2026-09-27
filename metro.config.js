const { getDefaultConfig } = require('expo/metro-config');
const fs = require('fs');
const path = require('path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// 3D model formats for Viro/React Native
config.resolver.assetExts = Array.from(
  new Set([...(config.resolver.assetExts ?? []), 'glb', 'gltf', 'bin']),
);
config.resolver.sourceExts = Array.from(
  new Set([...(config.resolver.sourceExts ?? []), 'mjs', 'cjs']),
);

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
