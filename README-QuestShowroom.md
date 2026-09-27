# Quest XR Showroom - Production-Grade Expo + React Native XR

A premium XR Product Showroom for Meta Quest using ReactVision Viro, featuring GLB model loading, spatial UI, controller/hand interactions, and professional lighting.

## Features

- **GLB Model Loading**: Real 3D models with optimized rendering
- **Professional Lighting**: 4 lighting modes (Studio, Dramatic, Ambient, Product)
- **Spatial Control Panel**: Floating UI optimized for Quest interaction
- **Controller & Hand Tracking**: Full Quest input support
- **Model Interactions**: Rotate, scale, animate, inspect
- **Horizon OS Native**: Optimized for Quest 2/3/Pro

## Project Structure

```
src/xr/
├── QuestShowroomScene.tsx       # Main VR scene
├── QuestShowroomNavigator.tsx   # VR navigator wrapper
├── components/
│   ├── LightingRig.tsx          # Professional lighting system
│   ├── ModelPedestal.tsx        # GLB model display with pedestal
│   ├── FloatingControlPanel.tsx # Spatial UI controls
│   └── InfoPanel.tsx            # Product information display
├── state/
│   └── useQuestShowroomStore.ts # Zustand state management
└── utils/
    ├── horizon.ts               # Horizon OS detection utilities
    └── assetPreload.ts          # GLB asset loading helpers

app/
└── quest-showroom.tsx           # Expo Router entry point

assets/
└── models/
    └── showroom-model.glb       # Placeholder for your GLB model
```

## Installation & Setup

### Prerequisites

- Meta Quest 2, 3, or Pro
- Android SDK with NDK
- Expo SDK ~54
- React Native 0.81+

### Install Dependencies

```bash
bun install
# or
npm install
```

### Add Your GLB Model

1. Place your GLB file in `assets/models/showroom-model.glb`
2. Or update `ModelPedestal.tsx` to use a remote URL:
   ```tsx
   modelSource="https://example.com/model.glb"
   ```

### Recommended Test Models

- [Khronos Damaged Helmet](https://github.com/KhronosGroup/glTF-Sample-Models/tree/main/2.0/DamagedHelmet)
- [Khronos Boom Box](https://github.com/KhronosGroup/glTF-Sample-Models/tree/main/2.0/BoomBox)

## Development Commands

```bash
# TypeScript check
npm run typecheck

# Lint
npm run lint

# Prebuild for Quest
npm run quest:prebuild

# Build Quest APK
npm run quest:build

# Build debug version
npm run quest:build:debug

# Install on Quest
npm run quest:install

# Launch on Quest
npm run quest:launch

# Stream logs
npm run quest:logs

# Full dev cycle (prebuild + run)
npm run quest:debug
```

## Usage

### Launching the Showroom

1. **From Main App**: Navigate to `/quest-showroom` route
2. **Direct Launch**: Use the Quest app launcher

### Controls

| Action | Controller | Hand Tracking |
|--------|-----------|---------------|
| Select/Click | Trigger/A button | Pinch gesture |
| Navigate | Thumbstick | Point + pinch |
| Rotate Model | Control Panel buttons | Tap rotate buttons |
| Scale Model | Control Panel buttons | Tap scale buttons |
| Exit VR | Menu button | System gesture |

### Lighting Modes

- **Studio**: Balanced 3-point lighting for product photography
- **Dramatic**: High contrast for visual impact
- **Ambient**: Soft, even lighting
- **Product**: Optimized for material detail

## GLB Model Optimization

### Performance Targets

| Device | Max GLB Size | Texture Resolution | Draw Calls |
|--------|-------------|-------------------|------------|
| Quest 2 | < 5MB | 1K max | < 50 |
| Quest 3 | < 10MB | 2K max | < 100 |
| Quest Pro | < 10MB | 2K max | < 100 |

### Optimization Checklist

- [ ] Use Draco compression
- [ ] Combine materials (texture atlasing)
- [ ] Bake lighting where possible
- [ ] Remove hidden geometry
- [ ] Use LODs for complex models
- [ ] Limit bones/joints in animations

## Architecture

### State Management

```typescript
// Zustand store for showroom state
const store = useQuestShowroomStore();

// Available actions
store.setAnimationState('rotate');
store.setLightingMode('dramatic');
store.rotateModel('y', 45);
store.scaleModel(1.2);
```

### Platform Detection

```typescript
import { isQuest, hasOpenXRSupport } from './src/xr/utils/horizon';

if (isQuest()) {
  // Enable VR-specific features
}

if (hasOpenXRSupport()) {
  // Use OpenXR native modules
}
```

### Adding Custom Models

1. Update `ModelPedestal.tsx`:
   ```tsx
   <ModelPedestal
     modelSource={require('./assets/models/my-model.glb')}
     position={[0, -0.5, -3]}
   />
   ```

2. Adjust scale if needed:
   ```tsx
   // In useQuestShowroomStore.ts DEFAULT_TRANSFORM
   scale: [0.5, 0.5, 0.5]  // For large models
   ```

## Troubleshooting

### Black Screen on Launch

1. Check `adb logcat` for native errors
2. Verify GLB model loaded correctly
3. Check OpenXR module is linked

### Controller Not Responding

1. Ensure controllers are paired
2. Check `ViroController` is rendered
3. Verify hand tracking permissions in AndroidManifest

### GLB Not Loading

1. Verify file path is correct
2. Check file size is under limits
3. Try remote URL first to isolate asset issue

### Performance Issues

1. Reduce lighting shadow map sizes
2. Lower GLB texture resolution
3. Disable unused animations
4. Use `memo()` on scene components

## Known Limitations

- Requires physical Quest device (no simulator)
- Hand tracking requires Quest 2+ with hand tracking enabled
- Passthrough not yet implemented
- Multiplayer/networking not included

## Future Enhancements

- [ ] Passthrough AR mode
- [ ] Multiplayer synchronization
- [ ] Custom shader support
- [ ] Physics interactions
- [ ] Voice commands
- [ ] Accessibility features

## Credits

- Built with [ReactVision Viro](https://github.com/ReactVision/viro)
- [Expo](https://expo.dev) for React Native tooling
- GLB sample models from [Khronos Group](https://github.com/KhronosGroup/glTF-Sample-Models)

## License

MIT - See LICENSE file
