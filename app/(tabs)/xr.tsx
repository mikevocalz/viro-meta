import { Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function XRScreen() {
  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <Stack.Screen options={{ title: 'XR' }} />
      <View style={styles.container}>
        <Text style={styles.title}>Quest VR</Text>
        <Text style={styles.body}>
          On Meta Quest, the VR experience launches automatically via VRActivity.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root:      { flex: 1, backgroundColor: '#07080D' },
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  title:     { color: '#F1F5F9', fontSize: 24, fontWeight: '700', marginBottom: 12 },
  body:      { color: '#64748B', fontSize: 14, textAlign: 'center', lineHeight: 22 },
});
