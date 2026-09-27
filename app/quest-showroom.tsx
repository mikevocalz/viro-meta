/**
 * Quest Showroom - Expo Router Entry Point
 *
 * This page launches the XR Product Showroom in VR mode.
 * It handles:
 * - Platform detection (Quest vs mobile)
 * - VR scene initialization
 * - Error boundaries and fallbacks
 */

import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { QuestShowroomNavigator } from "../src/xr/QuestShowroomNavigator";
import { getDeviceContext, horizonLog } from "../src/xr/utils/horizon";

export default function QuestShowroomPage() {
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deviceInfo, setDeviceInfo] = useState<ReturnType<
    typeof getDeviceContext
  > | null>(null);

  // Check device capabilities on mount
  useEffect(() => {
    const checkDevice = async () => {
      try {
        const context = getDeviceContext();
        setDeviceInfo(context);
        horizonLog("Device context:", context);

        // Short delay for UX
        await new Promise((r) => setTimeout(r, 500));
        setIsReady(true);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to initialize");
      }
    };

    checkDevice();
  }, []);

  // Handle exit from VR
  const handleExitVR = useCallback(() => {
    horizonLog("Exiting VR showroom");
    router.back();
  }, [router]);

  // Show loading state
  if (!isReady) {
    return (
      <View style={styles.container}>
        <StatusBar style="light" />
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Initializing XR Showroom...</Text>
        {deviceInfo && (
          <Text style={styles.deviceText}>
            {deviceInfo.isQuest ? "Quest detected" : "Non-Quest device"}
          </Text>
        )}
      </View>
    );
  }

  // Show error state
  if (error) {
    return (
      <View style={styles.container}>
        <StatusBar style="light" />
        <Text style={styles.errorText}>Error: {error}</Text>
        <TouchableOpacity style={styles.button} onPress={() => router.back()}>
          <Text style={styles.buttonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // If not on Quest, show informational UI
  if (!deviceInfo?.isQuest) {
    return (
      <View style={styles.container}>
        <StatusBar style="light" />
        <Text style={styles.title}>XR Product Showroom</Text>
        <Text style={styles.subtitle}>Meta Quest Required</Text>
        <Text style={styles.description}>
          This experience requires a Meta Quest headset (Quest 2, Quest 3, or
          Quest Pro).
          {"\n\n"}
          Current device: {deviceInfo?.deviceType}
          {"\n"}
          OpenXR support: {deviceInfo?.hasOpenXR ? "Yes" : "No"}
        </Text>
        <TouchableOpacity style={styles.button} onPress={() => router.back()}>
          <Text style={styles.buttonText}>Return to App</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Render the VR navigator for Quest
  return (
    <View style={styles.vrContainer}>
      <StatusBar hidden />
      <QuestShowroomNavigator onExitVR={handleExitVR} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0A0A0F",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  vrContainer: {
    flex: 1,
    backgroundColor: "#000000",
  },
  loadingText: {
    color: "#E5E7EB",
    fontSize: 18,
    marginTop: 16,
  },
  deviceText: {
    color: "#6B7280",
    fontSize: 14,
    marginTop: 8,
  },
  title: {
    color: "#3B82F6",
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 8,
  },
  subtitle: {
    color: "#E5E7EB",
    fontSize: 20,
    marginBottom: 16,
  },
  description: {
    color: "#9CA3AF",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 24,
  },
  errorText: {
    color: "#EF4444",
    fontSize: 16,
    marginBottom: 16,
    textAlign: "center",
  },
  button: {
    backgroundColor: "#3B82F6",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
