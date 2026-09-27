// Custom bundle entry point.
// Registers both the Expo Router "main" component and the "VRQuestScene" root
// that VRActivity mounts. VRQuestScene must be registered at bundle-init time
// (not lazily) so that VRActivity can mount it regardless of whether the
// Expo Router navigation tree has rendered yet.

import 'expo-router/entry';

import { AppRegistry } from 'react-native';
import VRQuestScene from './components/viro-quest-vr';

AppRegistry.registerComponent('VRQuestScene', () => VRQuestScene);
