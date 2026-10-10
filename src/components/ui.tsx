import React, { useEffect, useState } from "react";
import {
  Animated,
  Easing,
  Image,
  Platform,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from "react-native";
import type Feather from "@expo/vector-icons/Feather";
import Icon from "./Icon";
import { Pet } from "../domain/types";
import { speciesEmoji } from "../domain/pet-profile";
import { t } from "../i18n";
export { default as Icon } from "./Icon";
export const colors = {
  bg: "#FBF5EC",
  paper: "#FFFDF9",
  ink: "#5A493F",
  muted: "#A59486",
  orange: "#F2958A",
  pale: "#FDE7E0",
  line: "#F0E4D4",
  edge: "#EBDCC8",
  green: "#DCEEDA",
  jade: "#7DB89E",
  lavender: "#A99CDA",
  lilac: "#EDE7F8",
  yellow: "#FBE6A6",
  pink: "#F9D3DB",
  sky: "#D3E8F4",
};
// Rounded system typefaces give headlines a soft, picture-book voice without shipping a font file.
export const display = Platform.select({
  ios: "Yuanti SC",
  android: "sans-serif-medium",
  default:
    '"Yuanti SC", "YouYuan", "HarmonyOS Sans SC", ui-rounded, "PingFang SC", sans-serif',
}) as string;
/** A soft, diffuse shadow; larger sizes float higher off the page. */
export const shadow = (size = 4, _tint?: string): ViewStyle => ({
  boxShadow: `0px ${size * 2}px ${size * 6}px rgba(150, 110, 80, 0.16)`,
});
export const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.paper,
    borderRadius: 28,
    padding: 22,
    borderWidth: 1.5,
    borderColor: colors.edge,
    boxShadow: "0px 8px 24px rgba(150, 110, 80, 0.16)",
  },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  between: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  stack: { gap: 24 },
  h1: {
    fontSize: 36,
    lineHeight: 46,
    fontWeight: "700",
    color: colors.ink,
    fontFamily: display,
  },
  h2: {
    fontSize: 21,
    lineHeight: 30,
    fontWeight: "700",
    color: colors.ink,
    fontFamily: display,
  },
  body: { fontSize: 15, lineHeight: 26, color: colors.ink },
  small: { fontSize: 12, lineHeight: 20, color: colors.muted },
  muted: { fontSize: 14, lineHeight: 23, color: colors.muted },
  caps: {
    fontSize: 11,
    lineHeight: 16,
    letterSpacing: 2,
    fontWeight: "700",
    color: colors.ink,
  },
  input: {
    borderWidth: 1.5,
    borderColor: colors.edge,
    backgroundColor: colors.paper,
    borderRadius: 18,
    paddingHorizontal: 15,
    paddingVertical: 13,
    fontSize: 15,
    color: colors.ink,
    minHeight: 48,
  },
  divider: { height: 1.5, backgroundColor: colors.edge },
});
export function Button({
  label,
  onPress,
  icon,
  tone = "primary",
  disabled,
  style,
}: {
  label: string;
  onPress: () => void;
  icon?: React.ComponentProps<typeof Feather>["name"];
  tone?: "primary" | "soft" | "plain" | "danger";
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const fg =
    tone === "primary" ? "#FFFFFF" : tone === "danger" ? "#C0564A" : colors.ink;
  const flat = tone === "plain";
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        {
          minHeight: 46,
          paddingHorizontal: flat ? 10 : 18,
          paddingVertical: 11,
          borderRadius: 999,
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "row",
          gap: 8,
          backgroundColor:
            tone === "primary"
              ? colors.orange
              : tone === "soft"
                ? colors.yellow
                : tone === "danger"
                  ? colors.pale
                  : "transparent",
          opacity: disabled ? 0.4 : flat && pressed ? 0.6 : 1,
        },
        !flat && shadow(pressed ? 1 : 3),
        !flat && pressed && { transform: [{ scale: 0.97 }] },
        style,
      ]}
    >
      {icon && <Icon name={icon} size={17} color={fg} />}
      <Text
        style={{
          color: fg,
          fontWeight: "700",
          fontSize: 14,
          textDecorationLine: flat ? "underline" : "none",
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
export function Chip({
  label,
  active,
  onPress,
  color = colors.ink,
}: {
  label: string;
  active?: boolean;
  onPress?: () => void;
  color?: string;
}) {
  const light = color !== colors.ink && color !== colors.lavender && color !== colors.jade && color !== colors.orange;
  return (
    <Pressable
      accessibilityRole={onPress ? "button" : "text"}
      accessibilityLabel={label}
      accessibilityState={{ selected: active }}
      aria-selected={active}
      onPress={onPress}
      style={{
        minHeight: onPress ? 44 : 28,
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 999,
        borderWidth: 1.5,
        borderColor: active ? color : colors.edge,
        backgroundColor: active ? color : colors.paper,
        justifyContent: "center",
      }}
    >
      <Text
        style={{
          fontSize: 13,
          fontWeight: active ? "800" : "500",
          color: active && !light ? "#FFF" : colors.ink,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
export function Label({ children }: { children: React.ReactNode }) {
  return (
    <Text
      style={{
        fontSize: 14,
        fontWeight: "700",
        color: colors.ink,
        marginBottom: 9,
      }}
    >
      {children}
    </Text>
  );
}
export function Field(props: TextInputProps) {
  return (
    <TextInput
      placeholderTextColor="#A39C8C"
      {...props}
      style={[
        styles.input,
        props.multiline && { textAlignVertical: "top" },
        props.style,
      ]}
    />
  );
}
export function Card({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return <View style={[styles.card, style]}>{children}</View>;
}
export function Tag({
  children,
  bg = colors.green,
  color = colors.ink,
  style,
}: {
  children: React.ReactNode;
  bg?: string;
  color?: string;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View
      style={[
        {
          backgroundColor: bg,
          paddingVertical: 3,
          paddingHorizontal: 10,
          borderRadius: 999,
          alignSelf: "flex-start",
        },
        style,
      ]}
    >
      <Text style={{ color, fontSize: 12, fontWeight: "700", lineHeight: 18 }}>
        {children}
      </Text>
    </View>
  );
}
/** A watercolour wash: a soft blot of colour that bleeds past its own edge. */
export function Wash({
  color,
  size = 160,
  style,
}: {
  color: string;
  size?: number;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View
      pointerEvents="none"
      style={[
        {
          position: "absolute",
          width: size,
          height: size * 0.82,
          borderRadius: size / 2,
          backgroundColor: color,
          opacity: 0.55,
          boxShadow: `0px 0px ${size * 0.35}px ${size * 0.14}px ${color}`,
        },
        style,
      ]}
    />
  );
}
/** A tilted label, like a price sticker slapped on a zine page. */
export function Sticker({
  children,
  bg = colors.yellow,
  color = colors.ink,
  rotate = -3,
  style,
}: {
  children: React.ReactNode;
  bg?: string;
  color?: string;
  rotate?: number;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View
      style={[
        {
          alignSelf: "flex-start",
          backgroundColor: bg,
          borderRadius: 999,
          paddingHorizontal: 12,
          paddingVertical: 5,
          transform: [{ rotate: `${rotate}deg` }],
        },
        style,
      ]}
    >
      <Text style={[styles.caps, { color }]}>{children}</Text>
    </View>
  );
}
export function Tape({
  color = colors.yellow,
  rotate = -4,
  width = 74,
  style,
}: {
  color?: string;
  rotate?: number;
  width?: number;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View
      pointerEvents="none"
      style={[
        {
          position: "absolute",
          top: -11,
          left: "50%",
          marginLeft: -width / 2,
          width,
          height: 22,
          backgroundColor: color,
          opacity: 0.85,
          borderLeftWidth: 2,
          borderRightWidth: 2,
          borderColor: "#FFFFFF88",
          borderStyle: "dashed",
          transform: [{ rotate: `${rotate}deg` }],
        },
        style,
      ]}
    />
  );
}
/** A round rubber stamp with two lines of text. */
export function Stamp({
  top,
  main,
  color = colors.orange,
  size = 84,
  rotate = -12,
  style,
}: {
  top: string;
  main: string;
  color?: string;
  size?: number;
  rotate?: number;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View
      accessibilityLabel={`${top} ${main}`}
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: 2.5,
          borderColor: color,
          padding: 4,
          transform: [{ rotate: `${rotate}deg` }],
        },
        style,
      ]}
    >
      <View
        style={{
          flex: 1,
          borderRadius: size / 2,
          borderWidth: 1,
          borderColor: color,
          borderStyle: "dashed",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text style={{ fontSize: size * 0.11, letterSpacing: 1, color, fontWeight: "700" }}>
          {top}
        </Text>
        <Text
          numberOfLines={1}
          style={{
            fontSize: size * 0.22,
            lineHeight: size * 0.3,
            color,
            fontWeight: "700",
            fontFamily: display,
          }}
        >
          {main}
        </Text>
      </View>
    </View>
  );
}
/** A speech bubble; the tail side says who is talking. */
export function Bubble({
  children,
  bg = colors.paper,
  tail = "left",
  style,
}: {
  children: React.ReactNode;
  bg?: string;
  tail?: "left" | "right" | "none";
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={style}>
      <View
        style={[
          {
            backgroundColor: bg,
            borderWidth: 1.5,
            borderColor: colors.edge,
            borderRadius: 26,
            padding: 18,
          },
          shadow(4),
        ]}
      >
        {children}
      </View>
      {tail !== "none" && (
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            bottom: -9,
            [tail]: 34,
            width: 20,
            height: 20,
            backgroundColor: bg,
            borderRightWidth: 1.5,
            borderBottomWidth: 1.5,
            borderColor: colors.edge,
            borderBottomRightRadius: 5,
            transform: [{ rotate: "45deg" }],
          }}
        />
      )}
    </View>
  );
}
/** Gently rocks its child, so a sticker or stamp feels freshly stuck on. */
export function Wobble({
  children,
  degrees = 4,
  style,
}: {
  children: React.ReactNode;
  degrees?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const [t] = useState(() => new Animated.Value(0));
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(t, {
          toValue: 1,
          duration: 1800,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: Platform.OS !== "web",
        }),
        Animated.timing(t, {
          toValue: 0,
          duration: 1800,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: Platform.OS !== "web",
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [t]);
  return (
    <Animated.View
      style={[
        style,
        {
          transform: [
            {
              rotate: t.interpolate({
                inputRange: [0, 1],
                outputRange: [`-${degrees}deg`, `${degrees}deg`],
              }),
            },
          ],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}
export const demoPhoto = require("../../assets/demo-cat.jpg");
export function Avatar({
  pet,
  size = 48,
  demo = false,
}: {
  pet: Pet;
  size?: number;
  demo?: boolean;
}) {
  const frame = {
    width: size,
    height: size,
    borderRadius: size / 2,
    borderWidth: 2,
    borderColor: "#FFFFFF",
  };
  return pet.avatar || demo ? (
    <Image source={pet.avatar ? { uri: pet.avatar } : demoPhoto} style={frame} />
  ) : (
    <View
      style={[
        frame,
        {
          backgroundColor: colors.pink,
          alignItems: "center",
          justifyContent: "center",
        },
      ]}
    >
      <Text style={{ fontSize: size * 0.48 }}>{speciesEmoji(pet)}</Text>
    </View>
  );
}
export function Empty({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <Card
      style={{
        alignItems: "center",
        paddingVertical: 38,
        gap: 14,
        backgroundColor: colors.lilac,
        borderStyle: "dashed",
        boxShadow: "none",
      }}
    >
      <Wobble>
        <Text style={{ fontSize: 44 }}>🐾</Text>
      </Wobble>
      <Text style={[styles.h2, { textAlign: "center" }]}>{title}</Text>
      {subtitle && (
        <Text style={[styles.muted, { textAlign: "center" }]}>{subtitle}</Text>
      )}
      {action}
    </Card>
  );
}

export function Heading({
  title,
  eyebrow,
  action,
  accent = colors.yellow,
}: {
  title: string;
  eyebrow: string;
  action?: React.ReactNode;
  accent?: string;
}) {
  return (
    <View
      style={[styles.between, { flexWrap: "wrap", alignItems: "flex-end" }]}
    >
      <View style={{ gap: 10 }}>
        <Sticker bg={accent} rotate={-2}>
          {eyebrow}
        </Sticker>
        <View>
          <View
            pointerEvents="none"
            style={{
              position: "absolute",
              left: -4,
              right: -8,
              bottom: 5,
              height: 14,
              backgroundColor: accent,
              borderRadius: 7,
              transform: [{ rotate: "-1deg" }],
            }}
          />
          <Text style={[styles.h1, { fontSize: 40, lineHeight: 50 }]}>{title}</Text>
        </View>
      </View>
      {action}
    </View>
  );
}
export function Portrait({
  pet,
  demo,
  size = 110,
  rotate = 4,
  tape = colors.pink,
}: {
  pet: Pet;
  demo?: boolean;
  size?: number;
  rotate?: number;
  tape?: string;
}) {
  return (
    <View
      style={[
        {
          padding: 7,
          paddingBottom: 10,
          backgroundColor: "#FFFFFF",
          transform: [{ rotate: `${rotate}deg` }],
          borderRadius: 6,
        },
        shadow(4),
      ]}
    >
      <Tape color={tape} rotate={-rotate * 2} width={size * 0.55} />
      {pet.avatar || demo ? (
        <Image
          source={pet.avatar ? { uri: pet.avatar } : demoPhoto}
          style={{ width: size, height: size, backgroundColor: colors.pale }}
        />
      ) : (
        <View
          style={{
            width: size,
            height: size,
            backgroundColor: colors.pale,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Text style={{ fontSize: size * 0.58 }}>{speciesEmoji(pet)}</Text>
        </View>
      )}
      <Text
        numberOfLines={1}
        style={{
          width: size,
          fontSize: 11,
          textAlign: "center",
          color: colors.ink,
          marginTop: 7,
          letterSpacing: 1,
          fontFamily: display,
          fontWeight: "700",
        }}
      >
        {pet.name}
      </Text>
    </View>
  );
}
export function Meter({
  value,
  color = colors.jade,
}: {
  value: number;
  color?: string;
}) {
  return (
    <View
      accessibilityLabel={t("等级进度 {n}%", { n: value })}
      style={{
        height: 18,
        backgroundColor: colors.paper,
        borderRadius: 9,
        borderWidth: 1.5,
        borderColor: colors.edge,
        overflow: "hidden",
        flexDirection: "row",
      }}
    >
      <View
        style={{
          height: "100%",
          width: `${value}%`,
          backgroundColor: color,
          borderRadius: 9,
        }}
      />
    </View>
  );
}
