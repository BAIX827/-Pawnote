import * as Haptics from "expo-haptics";

// A light tick on presses, the selection tick on picks, and the success pattern on a saved diary (docs/01 8.46).
export type Buzz = "tap" | "select" | "success";
export function buzz(kind: Buzz = "tap") {
  const run =
    kind === "success" ? Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      : kind === "select" ? Haptics.selectionAsync()
        : Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  run.catch(() => {});
}
