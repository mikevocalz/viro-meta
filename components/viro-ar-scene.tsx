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
} from '@reactvision/react-viro';
import { useState } from 'react';
import { NativeModules, Pressable, StyleSheet, Text, View } from 'react-native';

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


// eslint-disable-next-line @typescript-eslint/no-explicit-any
const textStyle: any = {
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
    <View style={styles.panel}>
      <Text style={styles.panelTitle}>Viro Quest — OpenXR</Text>
      <Text style={styles.panelBody}>
        Tap below to launch the immersive VR experience in a dedicated VRActivity.
        The VR scene supports scene switching, passthrough, and hand tracking.
      </Text>
      <Pressable
        style={styles.launchBtn}
        onPress={() => NativeModules.VRLauncher?.launchVRScene()}
      >
        <Text style={styles.launchBtnText}>Launch VR Scene</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  nav: { flex: 1 },
  panel: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingHorizontal: 32,
  },
  panelTitle: {
    color: '#E5E7EB',
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  panelBody: {
    color: '#9CA3AF',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  launchBtn: {
    marginTop: 8,
    backgroundColor: '#7C3AED',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  launchBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
