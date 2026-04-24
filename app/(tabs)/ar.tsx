import {
  ViroARExperience,
  ViroQuestExperience,
  viroQuestAvailable,
} from '@/components/viro-ar-scene';
import Constants from 'expo-constants';
import { Stack } from 'expo-router';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const isQuestBuild =
  (Constants.expoConfig?.extra?.target ?? process.env.EXPO_PUBLIC_TARGET) === 'quest';

export default function ARScreen() {
  if (Platform.OS === 'web') {
    return (
      <SafeAreaView style={styles.root} edges={['top']}>
        <Stack.Screen options={{ title: 'Viro AR' }} />
        <View style={styles.fallback}>
          <Text style={styles.fallbackTitle}>Viro is native-only</Text>
          <Text style={styles.fallbackBody}>Run on iOS, Android, or a Quest build.</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (isQuestBuild || viroQuestAvailable) {
    return (
      <SafeAreaView style={styles.root} edges={['top']}>
        <Stack.Screen options={{ title: 'Viro Quest' }} />
        <ViroQuestExperience />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <Stack.Screen options={{ title: 'Viro AR' }} />
      <ViroARExperience />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#07080D' },
  fallback: { flex: 1, padding: 24, alignItems: 'center', justifyContent: 'center', gap: 12 },
  fallbackTitle: { color: '#E5E7EB', fontSize: 18, fontWeight: '600' },
  fallbackBody: { color: '#9CA3AF', fontSize: 13, textAlign: 'center' },
});
