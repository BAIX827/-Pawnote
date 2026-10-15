import React from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StoreProvider } from "../data/store";
import { useFonts } from "expo-font";
import { fonts } from "../platform/fonts";
import { loadLang } from "../i18n";
import ReminderSync from "../components/ReminderSync";
export default function RootLayout() {
  React.useEffect(() => {
    void loadLang();
  }, []);
  // Headline faces load in the background; system fonts show until they arrive.
  useFonts(fonts);
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
