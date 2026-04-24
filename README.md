# viro-meta — Babylon Vibe XR

Expo Router + React Native 0.81 app with a Babylon.js v9 + Babylon GUI WebXR
demo that builds for iOS, Android, and Meta Horizon OS (Quest 2 / Pro / 3 / 3s).

## Quick start

```bash
bun install
bun run start          # dev server
bun run start:https    # dev server over HTTPS (requires ./.ssl/key.pem + cert.pem)
```

Open the **XR** tab to see the Babylon scene. Tap **Enter XR** to request an
`immersive-vr` session.

## Quest / Horizon OS build

`app.json` wires `expo-horizon-core` with Horizon-specific features (headtracking,
passthrough, hand-tracking) and `com.oculus.intent.category.VR` so the build
lands on the VR home panel. To produce an APK for sideloading:

```bash
bun run quest   # expo run:android --variant release --device
```

## Metro + HTTPS

`metro.config.js` uses the latest `metro` / `metro-resolver` to:

1. Register `.glb`, `.gltf`, `.bin`, `.env`, `.hdr`, `.ktx`, `.ktx2`, `.basis`
   as asset extensions so `require('@/assets/models/demo.glb')` works.
2. Short-circuit `https://` / `http://` imports to a shim so Babylon loaders can
   fetch remote assets at runtime.
3. Enable HTTPS on the Metro dev server when `./.ssl/key.pem` and
   `./.ssl/cert.pem` are present (required for WebXR on LAN).

Generate self-signed dev certs:

```bash
mkdir -p .ssl && openssl req -x509 -newkey rsa:4096 -nodes \
  -keyout .ssl/key.pem -out .ssl/cert.pem -days 365 \
  -subj "/CN=localhost"
```

## Assets

- `assets/models/demo.glb` — a minimal glTF 2.0 unit cube with a PBR material.
  Swap for any GLB / glTF; it will be loaded via Babylon's `SceneLoader`.

## Reset starter

`bun run reset-project` moves the starter code to `app-example/`.
