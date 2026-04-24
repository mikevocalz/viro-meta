import { useEngine, EngineView } from '@babylonjs/react-native';
import {
  ArcRotateCamera,
  Camera,
  Color3,
  Color4,
  DirectionalLight,
  HemisphericLight,
  Mesh,
  MeshBuilder,
  PBRMaterial,
  Quaternion,
  Scene,
  SceneLoader,
  StandardMaterial,
  Vector3,
  WebXRDefaultExperience,
  WebXRSessionManager,
  WebXRState,
} from '@babylonjs/core';
import '@babylonjs/loaders/glTF';
import {
  AdvancedDynamicTexture,
  Button,
  Control,
  Rectangle,
  StackPanel,
  TextBlock,
} from '@babylonjs/gui';
import { Asset } from 'expo-asset';
import { useEffect, useRef, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';

const REMOTE_GLB =
  'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/BoxTextured/glTF-Binary/BoxTextured.glb';

type Props = {
  preferRemote?: boolean;
};

export function BabylonXRScene({ preferRemote = false }: Props) {
  const engine = useEngine();
  const [camera, setCamera] = useState<Camera>();
  const [xrSession, setXrSession] = useState<WebXRSessionManager>();
  const [statusText, setStatusText] = useState('Booting Babylon v9…');
  const rootRef = useRef<Mesh | undefined>(undefined);

  useEffect(() => {
    if (!engine) return;

    const scene = new Scene(engine);
    scene.clearColor = new Color4(0.04, 0.05, 0.09, 1);
    scene.ambientColor = new Color3(0.2, 0.2, 0.3);

    const cam = new ArcRotateCamera(
      'mainCam',
      Math.PI / 2,
      Math.PI / 2.6,
      3.2,
      new Vector3(0, 0.6, 0),
      scene,
    );
    cam.minZ = 0.01;
    cam.wheelPrecision = 50;
    cam.lowerRadiusLimit = 1.2;
    cam.upperRadiusLimit = 8;
    setCamera(cam);

    const hemi = new HemisphericLight('hemi', new Vector3(0, 1, 0), scene);
    hemi.intensity = 0.75;
    hemi.groundColor = new Color3(0.15, 0.1, 0.25);

    const sun = new DirectionalLight('sun', new Vector3(-0.4, -0.8, -0.5), scene);
    sun.intensity = 1.1;

    // Ground plate so the cube casts onto something in XR.
    const ground = MeshBuilder.CreateGround('floor', { width: 8, height: 8 }, scene);
    const groundMat = new StandardMaterial('floorMat', scene);
    groundMat.diffuseColor = new Color3(0.08, 0.09, 0.15);
    groundMat.specularColor = new Color3(0.05, 0.05, 0.08);
    ground.material = groundMat;
    ground.position.y = -0.5;

    // Halo mesh we animate to give the scene a "vibe".
    const halo = MeshBuilder.CreateTorus('halo', { diameter: 1.8, thickness: 0.02 }, scene);
    const haloMat = new PBRMaterial('haloMat', scene);
    haloMat.albedoColor = new Color3(0.2, 0.95, 0.9);
    haloMat.emissiveColor = new Color3(0.1, 0.5, 0.55);
    haloMat.metallic = 0.9;
    haloMat.roughness = 0.2;
    halo.material = haloMat;
    halo.position.y = 0.6;

    scene.registerBeforeRender(() => {
      halo.rotation.y += 0.005;
      if (rootRef.current) {
        rootRef.current.rotation.y += 0.003;
      }
    });

    loadDemoModel(scene, preferRemote)
      .then((root) => {
        rootRef.current = root;
        setStatusText('Model loaded — tap "Enter XR" to launch');
      })
      .catch((err) => {
        console.warn('[BabylonXR] load failed', err);
        setStatusText(`Load error: ${String(err?.message ?? err)}`);
      });

    let disposeXRListener: () => void = () => {};
    const gui = buildGui(scene, {
      onEnterXR: () => {
        enterXR(scene, setStatusText, setXrSession)
          .then((cleanup) => {
            disposeXRListener();
            disposeXRListener = cleanup;
          })
          .catch((err) => {
            setStatusText(`XR error: ${String((err as Error).message ?? err)}`);
          });
      },
      onResetPose: () => {
        const root = rootRef.current;
        if (!root) return;
        root.rotation = Vector3.Zero();
        root.position = new Vector3(0, 0.2, 0);
      },
    });

    return () => {
      disposeXRListener();
      gui.dispose();
      scene.dispose();
    };
  }, [engine, preferRemote]);

  return (
    <View style={styles.root}>
      <EngineView
        style={styles.engine}
        camera={camera}
        displayFrameRate={Platform.OS === 'android'}
      />
      <StatusOverlay text={statusText} xr={xrSession} />
    </View>
  );
}

async function loadDemoModel(scene: Scene, preferRemote: boolean): Promise<Mesh> {
  const sources = preferRemote
    ? [REMOTE_GLB, await resolveBundledGlbUri()]
    : [await resolveBundledGlbUri(), REMOTE_GLB];

  let lastError: unknown;
  for (const uri of sources) {
    if (!uri) continue;
    try {
      const result = await SceneLoader.ImportMeshAsync('', '', uri, scene);
      const root = (result.meshes[0] as Mesh) ?? new Mesh('root', scene);
      root.position = new Vector3(0, 0.2, 0);
      root.scaling = new Vector3(0.9, 0.9, 0.9);
      root.rotationQuaternion = Quaternion.Identity();
      return root;
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError ?? new Error('No GLB source succeeded');
}

async function resolveBundledGlbUri(): Promise<string | undefined> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const glbModule = require('@/assets/models/demo.glb');
    const asset = Asset.fromModule(glbModule);
    if (!asset.localUri) {
      await asset.downloadAsync();
    }
    return asset.localUri ?? asset.uri;
  } catch (err) {
    console.warn('[BabylonXR] bundled GLB unavailable', err);
    return undefined;
  }
}

const XR_STATE_TEXT: Partial<Record<WebXRState, string>> = {
  [WebXRState.IN_XR]: 'In XR — have fun',
  [WebXRState.NOT_IN_XR]: 'Exited XR',
  [WebXRState.ENTERING_XR]: 'Entering XR…',
  [WebXRState.EXITING_XR]: 'Exiting XR…',
};

async function enterXR(
  scene: Scene,
  setStatusText: (t: string) => void,
  setXrSession: (s: WebXRSessionManager | undefined) => void,
): Promise<() => void> {
  const supported = await WebXRSessionManager.IsSessionSupportedAsync('immersive-vr');
  if (!supported) {
    setStatusText('immersive-vr not supported on this device');
    return () => {};
  }

  const xr = (await scene.createDefaultXRExperienceAsync({
    disableTeleportation: false,
    uiOptions: { sessionMode: 'immersive-vr', referenceSpaceType: 'local-floor' },
  })) as WebXRDefaultExperience;

  const sub = xr.baseExperience.onStateChangedObservable.add((state) => {
    const msg = XR_STATE_TEXT[state];
    if (msg) setStatusText(msg);
  });
  setXrSession(xr.baseExperience.sessionManager);

  return () => {
    if (sub) xr.baseExperience.onStateChangedObservable.remove(sub);
  };
}

function buildGui(
  scene: Scene,
  handlers: { onEnterXR: () => void; onResetPose: () => void },
) {
  const ui = AdvancedDynamicTexture.CreateFullscreenUI('BabylonGuiOverlay', true, scene);

  const panel = new StackPanel('vibePanel');
  panel.width = '280px';
  panel.isVertical = true;
  panel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
  panel.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
  panel.paddingRight = '16px';
  panel.paddingTop = '24px';
  ui.addControl(panel);

  const card = new Rectangle('card');
  card.height = '88px';
  card.thickness = 0;
  card.cornerRadius = 14;
  card.background = 'rgba(12, 14, 22, 0.78)';
  panel.addControl(card);

  const title = new TextBlock('title', 'Babylon Vibe XR');
  title.color = 'white';
  title.fontSize = 20;
  title.fontWeight = '600';
  title.top = '-16px';
  card.addControl(title);

  const subtitle = new TextBlock('sub', 'Babylon v9 • GUI • WebXR');
  subtitle.color = '#9CA3AF';
  subtitle.fontSize = 13;
  subtitle.top = '14px';
  card.addControl(subtitle);

  const enterBtn = Button.CreateSimpleButton('enter', 'Enter XR');
  enterBtn.height = '56px';
  enterBtn.color = 'white';
  enterBtn.fontSize = 18;
  enterBtn.cornerRadius = 12;
  enterBtn.thickness = 0;
  enterBtn.paddingTop = '12px';
  enterBtn.background = '#6D28D9';
  enterBtn.onPointerUpObservable.add(handlers.onEnterXR);
  panel.addControl(enterBtn);

  const resetBtn = Button.CreateSimpleButton('reset', 'Reset Pose');
  resetBtn.height = '48px';
  resetBtn.color = 'white';
  resetBtn.fontSize = 15;
  resetBtn.cornerRadius = 12;
  resetBtn.thickness = 0;
  resetBtn.paddingTop = '8px';
  resetBtn.background = '#0EA5E9';
  resetBtn.onPointerUpObservable.add(handlers.onResetPose);
  panel.addControl(resetBtn);

  return ui;
}

function StatusOverlay({ text, xr }: { text: string; xr?: WebXRSessionManager }) {
  return (
    <View pointerEvents="none" style={styles.statusWrap}>
      <View style={styles.statusPill}>
        <View style={[styles.dot, xr ? styles.dotOn : styles.dotOff]} />
        <Text style={styles.statusText}>{text}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#07080D' },
  engine: { flex: 1 },
  statusWrap: {
    position: 'absolute',
    left: 16,
    top: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(12, 14, 22, 0.72)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusText: { color: '#E5E7EB', fontSize: 12, fontWeight: '500' },
  dot: { width: 10, height: 10, borderRadius: 5 },
  dotOn: { backgroundColor: '#22d3ee' },
  dotOff: { backgroundColor: '#f59e0b' },
});
