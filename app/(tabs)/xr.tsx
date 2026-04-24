import { BabylonXRScene } from '@/components/babylon-xr-scene';
import { Stack } from 'expo-router';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function XRScreen() {
  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <Stack.Screen options={{ title: 'Babylon Vibe XR' }} />
      <BabylonXRScene />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#07080D' },
});
