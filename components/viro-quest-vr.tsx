/**
 * VRQuestScene — root component mounted by VRActivity on Quest.
 * Registered in index.js as "VRQuestScene".
 * Launch: NativeModules.VRLauncher.launchVRScene()
 * Exit:   NativeModules.VRLauncher.exitVRScene()
 */

import {
  Viro3DObject,
  ViroAmbientLight,
  ViroAnimations,
  ViroBox,
  ViroDirectionalLight,
  ViroMaterials,
  ViroNode,
  ViroScene,
  ViroText,
  ViroVRSceneNavigator,
} from '@reactvision/react-viro';
import { useCallback, useRef, useState } from 'react';
import { BackHandler, findNodeHandle, NativeModules, StyleSheet, Vibration } from 'react-native';
import { ViroClickStateTypes } from '@reactvision/react-viro';
import { useVRSceneStore } from '@/store/vr-scene-store';

// ── Inline ports of ReactVision/viro PR #474 hooks ────────────────────────────
// Remove these and import from @reactvision/react-viro once v2.55.0 ships.

function useAnySourceHover(): readonly [boolean, (h: boolean, _p: unknown, src: unknown) => void] {
  const map = useRef<Record<string, boolean>>({});
  const [hovered, setHovered] = useState(false);
  const onHover = useCallback((h: boolean, _p: unknown, src: unknown) => {
    const key = String(src ?? 'default');
    if (map.current[key] === h) return;
    map.current[key] = h;
    setHovered(Object.values(map.current).some(Boolean));
  }, []);
  return [hovered, onHover] as const;
}

function useAnySourcePressed(): readonly [boolean, (s: number, _p: unknown, src: unknown) => void] {
  const map = useRef<Record<string, boolean>>({});
  const [pressed, setPressed] = useState(false);
  const onClickState = useCallback((s: number, _p: unknown, src: unknown) => {
    if (s !== ViroClickStateTypes.CLICK_DOWN && s !== ViroClickStateTypes.CLICK_UP) return;
    const next = s === ViroClickStateTypes.CLICK_DOWN;
    const key = String(src ?? 'default');
    if (map.current[key] === next) return;
    map.current[key] = next;
    setPressed(Object.values(map.current).some(Boolean));
  }, []);
  return [pressed, onClickState] as const;
}

// ── Native module wrappers ────────────────────────────────────────────────────
const VRLauncher     = NativeModules.VRLauncher     as { exitVRScene(): void }         | undefined;
const VRModuleOpenXR = NativeModules.VRModuleOpenXR as { recenterTracking(tag: number): void } | undefined;

// ── Animations ────────────────────────────────────────────────────────────────
ViroAnimations.registerAnimations({
  spinY:     { properties: { rotateY: '+=360' }, duration: 5000, easing: 'Linear' },
  pulseUp:   { properties: { scaleX: 1.12, scaleY: 1.12, scaleZ: 1.12 }, duration: 800, easing: 'EaseInEaseOut' },
  pulseDown: { properties: { scaleX: 1.0,  scaleY: 1.0,  scaleZ: 1.0  }, duration: 800, easing: 'EaseInEaseOut' },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  pulseLoop: [['pulseUp', 'pulseDown']] as any,

});

// ── Materials ─────────────────────────────────────────────────────────────────
ViroMaterials.createMaterials({
  btnIdle:           { diffuseColor: '#2D1B69', lightingModel: 'Constant' },
  btnHover:          { diffuseColor: '#6D28D9', lightingModel: 'Constant' },
  btnPressed:        { diffuseColor: '#8B5CF6', lightingModel: 'Constant' },
  btnDangerIdle:     { diffuseColor: '#7F1D1D', lightingModel: 'Constant' },
  btnDangerHover:    { diffuseColor: '#B91C1C', lightingModel: 'Constant' },
  btnDangerPressed:  { diffuseColor: '#EF4444', lightingModel: 'Constant' },
  btnInfoIdle:       { diffuseColor: '#1E3A5F', lightingModel: 'Constant' },
  btnInfoHover:      { diffuseColor: '#1D4ED8', lightingModel: 'Constant' },
  btnInfoPressed:    { diffuseColor: '#3B82F6', lightingModel: 'Constant' },
  btnSuccessIdle:    { diffuseColor: '#052E16', lightingModel: 'Constant' },
  btnSuccessHover:   { diffuseColor: '#059669', lightingModel: 'Constant' },
  btnSuccessPressed: { diffuseColor: '#10B981', lightingModel: 'Constant' },
  consoleBg:         { diffuseColor: '#0A0F1E', lightingModel: 'Constant' },
  groundRing:        { diffuseColor: '#1E1B4B', lightingModel: 'Constant' },
});

// ── Shared text styles ────────────────────────────────────────────────────────
/* eslint-disable @typescript-eslint/no-explicit-any */
const labelStyle: any = { fontFamily: 'Arial', fontSize: 20, color: '#FFFFFF', textAlign: 'center', textAlignVertical: 'center' };
const dimStyle:   any = { fontFamily: 'Arial', fontSize: 14, color: '#64748B', textAlign: 'center', textAlignVertical: 'center' };
/* eslint-enable @typescript-eslint/no-explicit-any */

// ── SpatialButton ─────────────────────────────────────────────────────────────
// Buttons are wider (w=0.44) and taller (h=0.16) for comfortable ray pointing.
// Both ViroBox and ViroText carry event handlers: ViroText sits in front (z+0.018)
// and intercepts the ray first; ViroBox covers edge areas the text doesn't reach.
// A 60 ms hover grace period stops flicker when the ray transitions between the two
// geometries. A 300 ms click debounce stops double-fire from both geometries.

type Variant = 'primary' | 'danger' | 'info' | 'success';

type SpatialButtonProps = {
  label: string;
  position: [number, number, number];
  onPress: () => void;
  variant?: Variant;
  w?: number;
  h?: number;
};

function SpatialButton({ label, position, onPress, variant = 'primary', w = 0.44, h = 0.16 }: SpatialButtonProps) {
  const [isHovered, onHover]      = useAnySourceHover();
  const [isPressed, onClickState] = useAnySourcePressed();
  const lastFire = useRef(0);

  const pfx = variant === 'danger'  ? 'btnDanger'
            : variant === 'info'    ? 'btnInfo'
            : variant === 'success' ? 'btnSuccess'
            : 'btn';
  const mat = isPressed ? `${pfx}Pressed` : isHovered ? `${pfx}Hover` : `${pfx}Idle`;

  // Debounced fire — called by onClick on every surface that can receive a ray hit.
  // 200 ms window prevents double-fire when two surfaces respond to the same trigger.
  const fire = useCallback(() => {
    const now = Date.now();
    if (now - lastFire.current > 200) {
      lastFire.current = now;
      Vibration.vibrate(30);
      onPress();
    }
  }, [onPress]);

  // ViroBox is the primary hit surface.
  // ViroText sits z+0.016 in front and can intercept the ray first on Quest.
  // Both carry onClick so whichever the controller ray hits first fires the action.
  // onHover / onClickState go on the box for visual state; text needs no state handlers.
  return (
    <ViroNode position={position}>
      <ViroBox
        scale={[w, h, 0.03]}
        materials={[mat]}
        onHover={onHover}
        onClickState={onClickState}
        onClick={fire}
        onFuse={{ callback: fire, timeToFuse: 800 }}
      />
      <ViroText
        text={label}
        position={[0, 0, 0.016]}
        scale={[0.17, 0.17, 0.17]}
        style={labelStyle}
        onClick={fire}
      />
    </ViroNode>
  );
}

// ── ShowroomScene ─────────────────────────────────────────────────────────────
type ShowroomProps = {
  sceneNavigator: unknown;
  onTogglePassthrough: () => void;
  onRecenter: () => void;
};

function ShowroomScene({ onTogglePassthrough, onRecenter }: ShowroomProps) {
  const { mode, scale, passthrough, setMode, scaleUp, scaleDown, reset, togglePassthrough } =
    useVRSceneStore();

  const exitVR = useCallback(() => {
    VRLauncher?.exitVRScene();
    BackHandler.exitApp();
  }, []);

  const handlePassthrough = useCallback(() => {
    togglePassthrough();
    onTogglePassthrough();
  }, [togglePassthrough, onTogglePassthrough]);

  return (
    <ViroScene>
      <ViroAmbientLight color="#8899CC" intensity={180} />
      <ViroDirectionalLight color="#FFFFFF" direction={[0.2, -1, -0.5]} intensity={400} />
      <ViroDirectionalLight color="#4466FF" direction={[-1, 0, 0.5]}    intensity={120} />

      {/* ── Hero GLB model (center) ── */}
      <ViroNode
        position={[0, 0.15, -2.5]}
        scale={[scale, scale, scale]}
        animation={{ name: 'spinY', run: mode === 'rotate', loop: true }}
      >
        <ViroNode animation={{ name: 'pulseLoop', run: mode === 'pulse', loop: true }}>
          {/* eslint-disable-next-line @typescript-eslint/no-require-imports */}
          <Viro3DObject
            source={require('@/assets/models/demo.glb')}
            type="GLB"
            animation={{ name: 'Take 001', run: mode === 'idle', loop: true }}
          />
        </ViroNode>
      </ViroNode>
      <ViroText text="DEMO  GLB  MODEL" position={[0, 0.88, -2.5]} scale={[0.33, 0.33, 0.33]} style={labelStyle} />
      <ViroText text={`${mode.toUpperCase()}  ×${scale.toFixed(2)}`} position={[0, 0.66, -2.5]} scale={[0.21, 0.21, 0.21]} style={dimStyle} />
      <ViroBox  position={[0, -0.62, -2.5]} scale={[1.3, 0.012, 1.3]} materials={['groundRing']} />

      {/* ── Kenney character (left) — animation driven by showroom mode ── */}
      {/* eslint-disable-next-line @typescript-eslint/no-require-imports */}
      <Viro3DObject
        source={require('@/assets/models/character-male-d.glb')}
        type="GLB"
        position={[-1.6, -0.62, -2.5]}
        scale={[4.5, 4.5, 4.5]}
        rotation={[0, 180, 0]}
        animation={{
          name: mode === 'rotate' ? 'walk' : mode === 'pulse' ? 'emote-yes' : 'idle',
          run: true,
          loop: true,
        }}
      />
      <ViroText text="MINI CHARACTER" position={[-1.6, 1.10, -2.5]} scale={[0.30, 0.30, 0.30]} style={labelStyle} />
      <ViroText
        text={mode === 'rotate' ? 'WALK' : mode === 'pulse' ? 'EMOTE YES' : 'IDLE'}
        position={[-1.6, 0.88, -2.5]} scale={[0.20, 0.20, 0.20]} style={dimStyle}
      />
      <ViroBox position={[-1.6, -0.625, -2.5]} scale={[1.1, 0.01, 1.1]} materials={['groundRing']} />

<ViroNode position={[0, -0.70, -1.60]}>
        <ViroBox scale={[1.55, 1.0, 0.02]} materials={['consoleBg']} />
        <ViroText text="SHOWROOM  CONTROLS" position={[0, 0.42, 0.016]} scale={[0.19, 0.19, 0.19]} style={dimStyle} />

        <SpatialButton label="Rotate"  position={[-0.48,  0.24, 0.016]} onPress={() => setMode('rotate')} />
        <SpatialButton label="Stop"    position={[ 0,     0.24, 0.016]} variant="info"    onPress={() => setMode('idle')} />
        <SpatialButton label="Pulse"   position={[ 0.48,  0.24, 0.016]} onPress={() => setMode('pulse')} />

        <SpatialButton label="Scale +" position={[-0.48,  0.04, 0.016]} variant="info"    onPress={scaleUp} />
        <SpatialButton label="Reset"   position={[ 0,     0.04, 0.016]} variant="success" onPress={reset} />
        <SpatialButton label="Scale -" position={[ 0.48,  0.04, 0.016]} variant="info"    onPress={scaleDown} />

        <SpatialButton
          label={passthrough ? 'Passthrough ON' : 'Passthrough'}
          position={[-0.48, -0.16, 0.016]} variant="info" onPress={handlePassthrough}
        />
        <SpatialButton label="Recenter" position={[ 0,    -0.16, 0.016]} variant="success" onPress={onRecenter} />
        <SpatialButton label="Exit VR"  position={[ 0.48, -0.16, 0.016]} variant="danger"  onPress={exitVR} />

        <ViroText
          text="Point + trigger  ·  pinch to interact"
          position={[0, -0.42, 0.016]} scale={[0.13, 0.13, 0.13]} style={dimStyle}
        />
      </ViroNode>
    </ViroScene>
  );
}

// ── VRQuestScene (AppRegistry root) ──────────────────────────────────────────
export default function VRQuestScene() {
  const { passthrough, togglePassthrough } = useVRSceneStore();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const navRef = useRef<any>(null);

  const recenter = useCallback(() => {
    try {
      const tag = findNodeHandle(navRef.current);
      if (tag !== null) VRModuleOpenXR?.recenterTracking(tag);
    } catch {
      // viewTag unavailable on this build — silent fail
    }
  }, []);

  return (
    <ViroVRSceneNavigator
      ref={navRef}
      vrModeEnabled
      passthroughEnabled={passthrough}
      handTrackingEnabled
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      initialScene={{
        scene: ShowroomScene,
        passProps: { onTogglePassthrough: togglePassthrough, onRecenter: recenter },
      } as any}
      style={StyleSheet.absoluteFill}
    />
  );
}
