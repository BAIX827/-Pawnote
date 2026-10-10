import React from "react";
import { useLocalSearchParams } from "expo-router";
import Shell from "../components/Shell";
import Onboarding from "../screens/Onboarding";
export default function Screen() {
  const { edit } = useLocalSearchParams<{ edit: string }>();
  return (
    <Shell>
      <Onboarding editing={edit === "1"} />
    </Shell>
  );
}
