import Constants from 'expo-constants';
import { useState } from 'react';
import {
  NativeModules,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// ── Capability detection (module-level, stable) ───────────────────────────────
const isQuest =
  typeof NativeModules.VRLauncher === 'object' && NativeModules.VRLauncher !== null;
const hasOpenXR =
  typeof NativeModules.VRModuleOpenXR === 'object' && NativeModules.VRModuleOpenXR !== null;
const buildMode = __DEV__ ? 'Debug' : 'Release';

// ── StatusRow ─────────────────────────────────────────────────────────────────
function StatusRow({ label, value, ok }: { label: string; value: string; ok?: boolean }) {
  return (
    <View style={S.row}>
      <View style={[S.dot, ok === true ? S.dotGreen : ok === false ? S.dotRed : S.dotNeutral]} />
      <Text style={S.rowLabel}>{label}</Text>
      <Text style={[S.rowValue, ok === false && S.rowValueWarn]}>{value}</Text>
    </View>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const [debugOpen, setDebugOpen] = useState(false);

  return (
    <SafeAreaView style={S.safe}>
      <ScrollView
        style={S.root}
        contentContainerStyle={S.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={S.header}>
          <View style={S.badge}>
            <Text style={S.badgeText}>XR</Text>
          </View>
          <Text style={S.title}>HorizonXR Showcase</Text>
          <Text style={S.subtitle}>Meta Quest  ReactVision Viro  OpenXR</Text>
        </View>

        {/* Device status */}
        <View style={S.card}>
          <Text style={S.cardTitle}>Device Status</Text>
          <StatusRow label="Platform"       value={Platform.OS}                                   ok={undefined} />
          <StatusRow label="Quest / Horizon" value={isQuest   ? 'Detected'   : 'Not detected'}    ok={isQuest} />
          <StatusRow label="OpenXR Runtime"  value={hasOpenXR ? 'Available'  : 'Unavailable'}      ok={hasOpenXR} />
          <StatusRow label="Build mode"      value={buildMode}                                     ok={undefined} />
          <StatusRow label="Viro patch"      value="2.54.0 + PR #474"                              ok={undefined} />
        </View>

        {/* CTA or fallback */}
        {isQuest ? (
          <>
            <Text style={S.ctaHint}>Quest headset detected. Ready for immersive VR.</Text>
            <Pressable
              style={({ pressed }) => [S.launchBtn, pressed && S.launchBtnDown]}
              onPress={() => NativeModules.VRLauncher?.launchVRScene?.()}
              android_ripple={{ color: '#A78BFA', borderless: false }}
            >
              <Text style={S.launchBtnTitle}>Launch VR Showcase</Text>
              <Text style={S.launchBtnSub}>Opens immersive VR scene via VRActivity</Text>
            </Pressable>
          </>
        ) : (
          <View style={S.card}>
            <Text style={S.cardTitle}>Not on Quest</Text>
            <Text style={S.fallbackText}>
              This experience requires a Meta Quest / Horizon OS headset. Sideload the APK
              and launch from the headset to enter the VR showroom.
            </Text>
            <Text style={[S.fallbackText, { marginTop: 8 }]}>
              Use the AR tab on this device for the Viro AR camera experience.
            </Text>
          </View>
        )}

        {/* Debug toggle */}
        <Pressable
          onPress={() => setDebugOpen((o) => !o)}
          style={S.debugToggle}
          hitSlop={12}
        >
          <Text style={S.debugToggleText}>{debugOpen ? 'Hide' : 'Show'} Debug Info</Text>
        </Pressable>

        {debugOpen && (
          <View style={S.card}>
            {([
              ['VRLauncher',       String(!!NativeModules.VRLauncher)],
              ['VRModuleOpenXR',   String(!!NativeModules.VRModuleOpenXR)],
              ['Platform.OS',      Platform.OS],
              ['Platform.Version', String(Platform.Version)],
              ['__DEV__',          String(__DEV__)],
              ['expo version',     Constants.expoConfig?.version ?? '?'],
            ] as [string, string][]).map(([k, v]) => (
              <Text key={k} style={S.debugLine}>
                <Text style={S.debugKey}>{k}: </Text>{v}
              </Text>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const S = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: '#070B14' },
  root:    { flex: 1 },
  content: { padding: 20, paddingBottom: 48 },

  header:    { alignItems: 'center', marginBottom: 28, paddingTop: 8 },
  badge:     {
    width: 68, height: 68, borderRadius: 18,
    backgroundColor: '#6D28D9',
    alignItems: 'center', justifyContent: 'center', marginBottom: 14,
    shadowColor: '#7C3AED', shadowOpacity: 0.5, shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 }, elevation: 8,
  },
  badgeText: { color: '#fff', fontSize: 22, fontWeight: '800', letterSpacing: 2 },
  title:     { color: '#F1F5F9', fontSize: 26, fontWeight: '700', textAlign: 'center' },
  subtitle:  { color: '#475569', fontSize: 13, marginTop: 6, textAlign: 'center' },

  card:      {
    backgroundColor: '#0F172A', borderRadius: 16,
    padding: 16, marginBottom: 16,
    borderWidth: 1, borderColor: '#1E293B',
  },
  cardTitle: {
    color: '#475569', fontSize: 10, fontWeight: '700',
    letterSpacing: 1.8, textTransform: 'uppercase', marginBottom: 12,
  },

  row:          { flexDirection: 'row', alignItems: 'center', paddingVertical: 7, gap: 10 },
  dot:          { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  dotGreen:     { backgroundColor: '#10B981' },
  dotRed:       { backgroundColor: '#EF4444' },
  dotNeutral:   { backgroundColor: '#1E293B' },
  rowLabel:     { flex: 1, color: '#94A3B8', fontSize: 14 },
  rowValue:     { color: '#64748B', fontSize: 13 },
  rowValueWarn: { color: '#F59E0B' },

  ctaHint:      { color: '#475569', fontSize: 12, textAlign: 'center', marginBottom: 10 },
  launchBtn:    {
    backgroundColor: '#5B21B6', borderRadius: 16,
    paddingVertical: 20, paddingHorizontal: 24,
    alignItems: 'center', marginBottom: 20,
    borderWidth: 1, borderColor: '#7C3AED',
    shadowColor: '#6D28D9', shadowOpacity: 0.6, shadowRadius: 20,
    shadowOffset: { width: 0, height: 6 }, elevation: 10,
  },
  launchBtnDown:  { backgroundColor: '#4C1D95', borderColor: '#6D28D9' },
  launchBtnTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  launchBtnSub:   { color: '#A78BFA', fontSize: 12, marginTop: 5 },

  fallbackText:    { color: '#475569', fontSize: 14, lineHeight: 22 },

  debugToggle:     { alignItems: 'center', paddingVertical: 10, marginBottom: 4 },
  debugToggleText: { color: '#1E293B', fontSize: 12 },
  debugLine:       { color: '#475569', fontSize: 12, lineHeight: 20 },
  debugKey:        { color: '#334155' },
});
