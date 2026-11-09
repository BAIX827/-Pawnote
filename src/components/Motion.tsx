import React, { useEffect, useRef, useState } from "react";
import { AccessibilityInfo, Animated, Easing, Platform, Pressable, PressableProps, StyleProp, ViewStyle } from "react-native";
import { buzz, Buzz } from "../platform/haptics";

// Tap feedback (docs/01 8.46): a quick squeeze on press, a small pop when something becomes selected,
// all under 0.25 s and switched off when the device asks for reduced motion (haptics stay).
const native = Platform.OS !== "web";

export function useReducedMotion() {
  const [still, setStill] = useState(false);
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setStill).catch(() => {});
    const sub = AccessibilityInfo.addEventListener("reduceMotionChanged", setStill);
    return () => sub.remove();
  }, []);
  return still;
}

/** Runs `kick` on the value whenever `on` turns from false to true (not on first render). */
function useKick(on: boolean | undefined, still: boolean, kick: (v: Animated.Value) => Animated.CompositeAnimation, rest = 1) {
  const [v] = useState(() => new Animated.Value(rest));
  const was = useRef(on);
  useEffect(() => {
    const turnedOn = !!on && !was.current;
    was.current = on;
    if (!turnedOn || still) return;
    v.setValue(rest);
    const a = kick(v);
    a.start();
    return () => { a.stop(); v.setValue(rest); };
  }, [on, still, v, kick, rest]);
  return v;
}

const pop = (v: Animated.Value) => Animated.sequence([
  Animated.timing(v, { toValue: 1.1, duration: 90, easing: Easing.out(Easing.quad), useNativeDriver: native }),
  Animated.spring(v, { toValue: 1, friction: 4, tension: 220, useNativeDriver: native }),
]);
const hop = (v: Animated.Value) => Animated.sequence([
  Animated.timing(v, { toValue: -5, duration: 100, easing: Easing.out(Easing.quad), useNativeDriver: native }),
  Animated.spring(v, { toValue: 0, friction: 4, tension: 200, useNativeDriver: native }),
]);

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * A Pressable that squeezes while held and pops when `selected` turns on. Give it a plain style object
 * (no pressed callback, no transform of its own); `haptic` picks the phone tick, false for none.
 */
export function Tap({ style, selected, haptic = "tap", onPress, onPressIn, onPressOut, children, ...rest }:
  Omit<PressableProps, "style"> & { style?: StyleProp<ViewStyle>; selected?: boolean; haptic?: Buzz | false }) {
  const still = useReducedMotion();
  const [press] = useState(() => new Animated.Value(1));
  const popped = useKick(selected, still, pop);
  const to = (value: number) => {
    if (still || !onPress || rest.disabled) return;
    Animated.spring(press, { toValue: value, friction: 5, tension: value < 1 ? 400 : 260, useNativeDriver: native }).start();
  };
  return (
    <AnimatedPressable
      {...rest}
      onPressIn={(e) => { to(0.94); onPressIn?.(e); }}
      onPressOut={(e) => { to(1); onPressOut?.(e); }}
      onPress={onPress && ((e) => { if (haptic) buzz(haptic); onPress(e); })}
      style={[style, { transform: [{ scale: Animated.multiply(press, popped) }] }]}
    >
      {children as React.ReactNode}
    </AnimatedPressable>
  );
}

// Every screen mounts its own tab bar, so remember which tab was lit last and hop only when that changes.
let litTab: string | undefined;

/** Lifts the tab bar icon you just switched to and lets it drop back; the first tab after launch stays put. */
export function Hop({ tab, on, children }: { tab: string; on: boolean; children: React.ReactNode }) {
  const still = useReducedMotion();
  const [y] = useState(() => new Animated.Value(0));
  useEffect(() => {
    if (!on || litTab === tab) return;
    const first = litTab === undefined;
    litTab = tab;
    if (first || still) return;
    const a = hop(y);
    a.start();
    return () => { a.stop(); y.setValue(0); };
  }, [on, tab, still, y]);
  return <Animated.View style={{ transform: [{ translateY: y }] }}>{children}</Animated.View>;
}

/** Slides the toast up into place and fades it out before it goes away. */
export function useToastMotion(message: string) {
  const still = useReducedMotion();
  // Keep the last words on screen while the toast fades out after the store has cleared them.
  const [last, setLast] = useState(message);
  const [gone, setGone] = useState(!message);
  if (message && message !== last) setLast(message);
  if (message && gone) setGone(false);
  const [v] = useState(() => new Animated.Value(0));
  useEffect(() => {
    if (still) { v.setValue(message ? 1 : 0); return; }
    const a = message
      ? Animated.spring(v, { toValue: 1, friction: 7, tension: 140, useNativeDriver: native })
      : Animated.timing(v, { toValue: 0, duration: 180, easing: Easing.in(Easing.quad), useNativeDriver: native });
    if (message) v.setValue(0);
    a.start(({ finished }) => { if (finished && !message) setGone(true); });
    return () => a.stop();
  }, [message, still, v]);
  const style = {
    opacity: v,
    transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) }],
  };
  return { shown: message || (gone || still ? "" : last), style };
}
