import {
  ViroARScene,
  ViroARSceneNavigator,
  ViroAmbientLight,
  ViroMaterials,
  ViroNode,
  ViroText,
  Viro3DObject,
  ViroTrackingReason,
  ViroTrackingStateConstants,
  ViroScene,
  ViroVRSceneNavigator,
} from '@reactvision/react-viro';
import { useState } from 'react';
import { NativeModules, StyleSheet, TextStyle } from 'react-native';

ViroMaterials.createMaterials({
  viberLabel: {
    diffuseColor: '#6D28D9',
    lightingModel: 'Lambert',
  },
});

/**
 * True on builds that shipped the QUEST / OpenXR native module (landed on
 * ReactVision/viro master as commit afd193a, unreleased as of v2.54.0).
 */
export const viroQuestAvailable =
  typeof NativeModules.VRModuleOpenXR === 'object' && NativeModules.VRModuleOpenXR !== null;

function ViroARVibeScene() {
  const [tracking, setTracking] = useState(false);

  const onTrackingUpdated = (state: ViroTrackingStateConstants, _reason: ViroTrackingReason) => {
    setTracking(state === ViroTrackingStateConstants.TRACKING_NORMAL);
  };

  return (
    <ViroARScene onTrackingUpdated={onTrackingUpdated}>
      <ViroAmbientLight color="#ffffff" intensity={250} />
      <ViroNode position={[0, -0.5, -1.2]}>
        <Viro3DObject
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          source={require('@/assets/models/demo.glb')}
          type="GLB"
          scale={[0.25, 0.25, 0.25]}
          rotation={[0, 30, 0]}
        />
        <ViroText
          text={tracking ? 'Viro Vibe AR' : 'Look around to start tracking…'}
          position={[0, 0.35, 0]}
          scale={[0.4, 0.4, 0.4]}
          style={textStyle}
          materials={['viberLabel']}
        />
      </ViroNode>
    </ViroARScene>
  );
}

function ViroVRVibeScene() {
  return (
    <ViroScene>
      <ViroAmbientLight color="#ffffff" intensity={300} />
      <ViroNode position={[0, 0, -2]}>
        <Viro3DObject
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          source={require('@/assets/models/demo.glb')}
          type="GLB"
          scale={[0.5, 0.5, 0.5]}
          rotation={[0, 30, 0]}
        />
        <ViroText
          text="Viro Quest — OpenXR"
          position={[0, 0.8, 0]}
          scale={[0.6, 0.6, 0.6]}
          style={textStyle}
          materials={['viberLabel']}
        />
      </ViroNode>
    </ViroScene>
  );
}

const textStyle: TextStyle = {
  fontFamily: 'Arial',
  fontSize: 22,
  color: '#ffffff',
  textAlignVertical: 'center',
  textAlign: 'center',
};

export function ViroARExperience() {
  return (
    <ViroARSceneNavigator
      autofocus
      initialScene={{ scene: ViroARVibeScene }}
      style={styles.nav}
    />
  );
}

export function ViroQuestExperience() {
  return (
    <ViroVRSceneNavigator
      vrModeEnabled
      initialScene={{ scene: ViroVRVibeScene }}
      style={styles.nav}
    />
  );
}

const styles = StyleSheet.create({
  nav: { flex: 1 },
});
