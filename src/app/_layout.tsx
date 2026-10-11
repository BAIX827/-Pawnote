import React from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StoreProvider } from "../data/store";
import { useFonts } from "expo-font";
import ReminderSync from "../components/ReminderSync";
export default function RootLayout() {
  // Headline faces ship inside the app (no font CDN, so they work in mainland China and abroad).
  // They load in the background; system fonts show until they arrive.
  useFonts({
    ZCOOLQingKeHuangYou_400Regular: require("../../assets/fonts/ZCOOLQingKeHuangYou-Subset.ttf"),
    ArchivoBlack_400Regular: require("../../assets/fonts/ArchivoBlack-Regular.ttf"),
  });
  return (
    <SafeAreaProvider>
      <StoreProvider>
        <StatusBar style="dark" />
        <ReminderSync />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: "#FFF3DF" },
            animation: "none",
          }}
        />
      </StoreProvider>
    </SafeAreaProvider>
  );
}
