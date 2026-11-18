import Shell from "../components/Shell";
import MomentRelay from "../screens/MomentRelay";
import Community from "../screens/Community";
import { useLocalSearchParams } from "expo-router";
export default function Screen() {
  const params = useLocalSearchParams<{ relay?: string; moment?: string }>();
  return (
    <Shell>
      {params.relay !== undefined || params.moment !== undefined ? (
        <MomentRelay />
      ) : (
        <Community />
      )}
    </Shell>
  );
}
