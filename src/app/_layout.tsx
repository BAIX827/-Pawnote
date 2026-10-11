import React from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StoreProvider } from "../data/store";
import { useFonts } from "expo-font";
import { ZCOOLQingKeHuangYou_400Regular } from "@expo-google-fonts/zcool-qingke-huangyou";
import { ArchivoBlack_400Regular } from "@expo-google-fonts/archivo-black";
export default function RootLayout() {
  // Headline faces load in the background; system fonts show until they arrive.
  useFonts({ ZCOOLQingKeHuangYou_400Regular, ArchivoBlack_400Regular });
  return (
    <SafeAreaProvider>
      <StoreProvider>
        <StatusBar style="dark" />
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
