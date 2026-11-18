import { useLocalSearchParams } from "expo-router";
import Shell from "../components/Shell";
import Onboarding from "../screens/Onboarding";
export default function Screen() {
  const { edit, add, next, relaySetup } = useLocalSearchParams<{ edit?: string; add?: string; next?: string; relaySetup?: string }>();
  return (
    <Shell>
      <Onboarding editing={edit === "1"} adding={add === "1"} writeAfterSetup={next === "record" || relaySetup === "1"} />
    </Shell>
  );
}
