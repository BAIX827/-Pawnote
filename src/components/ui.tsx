import React, { useEffect, useState } from "react";
import {
  AccessibilityInfo,
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
// Orange pop (docs/12): flat clashing blocks, thick black outlines, hard offset shadows.
export const colors = {
  bg: "#FFF3DF",
  paper: "#FFFFFF",
  ink: "#111111",
  muted: "#5C534A",
  orange: "#FF7A1A",
  pale: "#FFD3E5",
  line: "#111111",
  edge: "#111111",
  green: "#C6F432",
  jade: "#FF7A1A",
  lavender: "#B9A6FF",
  lilac: "#DDD2FF",
  yellow: "#C6F432",
  pink: "#FF9EC7",
  sky: "#B9A6FF",
};
// Bundled display faces (assets/fonts, SIL OFL): ZCOOL QingKe HuangYou for headlines, Archivo
// Black for numerals and Latin. The headline face is subset to common Chinese plus every
// character in the interface; rarer characters (in pet names, say) fall back to the system face,
// which iOS and Android do on their own and the web does through the stack below.
const cjkFallback = '"PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Noto Sans SC", sans-serif';
export const display = Platform.select({
  web: `ZCOOLQingKeHuangYou_400Regular, ${cjkFallback}`,
  default: "ZCOOLQingKeHuangYou_400Regular",
}) as string;
export const numeric = Platform.select({
  web: `ArchivoBlack_400Regular, ${cjkFallback}`,
  default: "ArchivoBlack_400Regular",
}) as string;
/** A hard, unblurred offset shadow in ink. */
export const shadow = (size = 4): ViewStyle => ({
  boxShadow: `${size}px ${size}px 0px ${colors.ink}`,
});
export const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.paper,
    borderRadius: 14,
    padding: 20,
    borderWidth: 2.5,
    borderColor: colors.ink,
    boxShadow: `4px 4px 0px ${colors.ink}`,
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
    fontSize: 38,
    lineHeight: 46,
    fontWeight: "400",
    color: colors.ink,
    fontFamily: display,
  },
  h2: {
    fontSize: 21,
    lineHeight: 30,
    fontWeight: "400",
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
    borderWidth: 2.5,
    borderColor: colors.edge,
    backgroundColor: colors.paper,
    borderRadius: 14,
    paddingHorizontal: 15,
    paddingVertical: 13,
    fontSize: 15,
    color: colors.ink,
    minHeight: 48,
  },
  divider: { height: 2.5, backgroundColor: colors.ink },
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
          borderWidth: flat ? 0 : 2.5,
          borderColor: colors.ink,
          backgroundColor:
            tone === "primary"
              ? colors.green
              : tone === "soft"
                ? colors.paper
                : tone === "danger"
                  ? colors.pink
                  : "transparent",
          opacity: disabled ? 0.4 : flat && pressed ? 0.6 : 1,
        },
        !flat && shadow(pressed ? 1 : 3),
        !flat && pressed && { transform: [{ translateX: 2 }, { translateY: 2 }] },
        style,
      ]}
    >
      {icon && <Icon name={icon} size={17} color={colors.ink} />}
      <Text
        style={{
          color: colors.ink,
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
  // Only the default black chip needs light text; every colour block in this palette takes ink.
  const light = color !== colors.ink;
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
        borderWidth: 2.5,
        borderColor: colors.ink,
        backgroundColor: active ? color : colors.paper,
        justifyContent: "center",
      }}
    >
      <Text
        style={{
          fontSize: 13,
          fontWeight: active ? "800" : "500",
          color: active && !light ? colors.green : colors.ink,
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
/** A tilted colour block that reads like a stamp: a small caption over one big word. */
export function Stamp({
  top,
  main,
  color = colors.lavender,
  size = 84,
  rotate = 4,
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
          minWidth: size,
          minHeight: size * 0.86,
          paddingHorizontal: 8,
          borderRadius: 12,
          borderWidth: 2.5,
          borderColor: colors.ink,
          backgroundColor: color,
          alignItems: "center",
          justifyContent: "center",
          transform: [{ rotate: `${rotate}deg` }],
        },
        shadow(3),
        style,
      ]}
    >
      <Text style={{ fontSize: Math.max(10, size * 0.14), letterSpacing: 1, color: colors.ink, fontWeight: "700" }}>
        {top}
      </Text>
      <Text
        numberOfLines={1}
        style={{
          fontSize: size * 0.36,
          lineHeight: size * 0.44,
          color: colors.ink,
          fontFamily: /^[\x20-\x7E—]+$/.test(main) ? numeric : display,
        }}
      >
        {main}
      </Text>
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
            borderWidth: 2.5,
            borderColor: colors.edge,
            borderRadius: 14,
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
            borderRightWidth: 2.5,
            borderBottomWidth: 2.5,
            borderColor: colors.ink,
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
/** A strip of text that scrolls sideways forever; it holds still when the device asks for reduced motion. */
export function Ticker({
  text,
  color = colors.green,
  background = colors.ink,
  height = 28,
}: {
  text: string;
  color?: string;
  background?: string;
  height?: number;
}) {
  const [x] = useState(() => new Animated.Value(0));
  const [width, setWidth] = useState(0);
  const [still, setStill] = useState(false);
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setStill).catch(() => {});
    const sub = AccessibilityInfo.addEventListener("reduceMotionChanged", setStill);
    return () => sub.remove();
  }, []);
  useEffect(() => {
    if (!width || still) {
      x.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.timing(x, {
        toValue: -width,
        duration: width * 28,
        easing: Easing.linear,
        useNativeDriver: Platform.OS !== "web",
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [width, still, x]);
  const label = { color, fontFamily: numeric, fontSize: 12, letterSpacing: 1 } as const;
  return (
    <View
      accessible
      accessibilityLabel={text}
      style={{ backgroundColor: background, height, justifyContent: "center", overflow: "hidden" }}
    >
      <Animated.View style={{ position: "absolute", left: 0, width: 4000, flexDirection: "row", transform: [{ translateX: x }] }}>
        <Text
          numberOfLines={1}
          style={[label, { paddingRight: 8, flexShrink: 0 }]}
          onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
        >
          {text}
        </Text>
        <Text numberOfLines={1} style={[label, { paddingRight: 8, flexShrink: 0 }]}>
          {text}
        </Text>
      </Animated.View>
    </View>
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
    borderWidth: 2.5,
    borderColor: colors.ink,
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
/** The app's paw print drawn in house colours: an orange pad and four toes, outlined in ink. */
export function PawMark({
  size = 32,
  fill = colors.orange,
  outline = colors.ink,
}: {
  size?: number;
  fill?: string;
  outline?: string;
}) {
  const border = Math.max(1.5, size / 18);
  const toe = size * 0.24;
  const toes = [
    { left: 0.02, top: 0.3 },
    { left: 0.22, top: 0.06 },
    { left: 0.54, top: 0.06 },
    { left: 0.74, top: 0.3 },
  ];
  return (
    <View accessible={false} style={{ width: size, height: size }}>
      {toes.map((p, i) => (
        <View
          key={i}
          style={{
            position: "absolute",
            left: p.left * size,
            top: p.top * size,
            width: toe,
            height: toe * 1.2,
            borderRadius: toe,
            backgroundColor: fill,
            borderWidth: border,
            borderColor: outline,
          }}
        />
      ))}
      <View
        style={{
          position: "absolute",
          left: size * 0.22,
          top: size * 0.46,
          width: size * 0.56,
          height: size * 0.48,
          borderTopLeftRadius: size * 0.28,
          borderTopRightRadius: size * 0.28,
          borderBottomLeftRadius: size * 0.22,
          borderBottomRightRadius: size * 0.22,
          backgroundColor: fill,
          borderWidth: border,
          borderColor: outline,
        }}
      />
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
        <PawMark size={52} />
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
          borderWidth: 2.5,
          borderColor: colors.ink,
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
          fontWeight: "400",
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
        borderWidth: 2.5,
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
          borderRightWidth: value > 0 && value < 100 ? 2.5 : 0,
          borderColor: colors.ink,
        }}
      />
    </View>
  );
}
