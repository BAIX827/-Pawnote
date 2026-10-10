import React from "react";
import {
  Image,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TextStyle,
  View,
  ViewStyle,
} from "react-native";
import type Feather from "@expo/vector-icons/Feather";
import Icon from "./Icon";
import { Pet } from "../domain/types";
import { speciesEmoji } from "../domain/pet-profile";
export { default as Icon } from "./Icon";
export const colors = {
  bg: "#FAF9F6",
  paper: "#FFFFFF",
  ink: "#263830",
  muted: "#7E847E",
  orange: "#E8743C",
  pale: "#FCEDDD",
  line: "#EAE9E2",
  green: "#EAF0E5",
};
export const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.paper,
    borderRadius: 22,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.line,
  },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  between: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  stack: { gap: 20 },
  h1: { fontSize: 32, lineHeight: 43, fontWeight: "700", color: colors.ink },
  h2: { fontSize: 21, lineHeight: 30, fontWeight: "700", color: colors.ink },
  body: { fontSize: 15, lineHeight: 25, color: colors.ink },
  small: { fontSize: 12, lineHeight: 20, color: colors.muted },
  muted: { fontSize: 14, lineHeight: 23, color: colors.muted },
  input: {
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: "#FCFCFA",
    borderRadius: 13,
    paddingHorizontal: 15,
    paddingVertical: 14,
    fontSize: 15,
    color: colors.ink,
    minHeight: 48,
  },
  divider: { height: 1, backgroundColor: colors.line },
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
    tone === "primary" ? "#FFFFFF" : tone === "danger" ? "#AE4434" : colors.ink;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        {
          minHeight: 46,
          paddingHorizontal: 18,
          paddingVertical: 12,
          borderRadius: 13,
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "row",
          gap: 8,
          backgroundColor:
            tone === "primary"
              ? colors.orange
              : tone === "soft"
                ? colors.green
                : tone === "danger"
                  ? "#FFF0ED"
                  : "transparent",
          opacity: disabled ? 0.4 : pressed ? 0.75 : 1,
        },
        style,
      ]}
    >
      {icon && <Icon name={icon} size={17} color={fg} />}
      <Text style={{ color: fg, fontWeight: "600", fontSize: 14 }}>
        {label}
      </Text>
    </Pressable>
  );
}
export function Chip({
  label,
  active,
  onPress,
}: {
  label: string;
  active?: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable
      accessibilityRole={onPress ? "button" : "text"}
      accessibilityLabel={label}
      accessibilityState={{ selected: active }}
      aria-selected={active}
      onPress={onPress}
      style={{
        minHeight: onPress ? 44 : 28,
        paddingHorizontal: 14,
        paddingVertical: 9,
        borderRadius: 10,
        backgroundColor: active ? colors.ink : "#F3F3EF",
        justifyContent: "center",
      }}
    >
      <Text style={{ fontSize: 13, color: active ? "#FFF" : colors.ink }}>
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
        fontWeight: "600",
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
      placeholderTextColor="#9A9E97"
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
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<TextStyle>;
}) {
  return (
    <Text
      style={[
        {
          color: "#658263",
          fontSize: 12,
          backgroundColor: colors.green,
          paddingVertical: 5,
          paddingHorizontal: 10,
          borderRadius: 6,
          alignSelf: "flex-start",
        },
        style,
      ]}
    >
      {children}
    </Text>
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
  return pet.avatar || demo ? (
    <Image
      source={pet.avatar ? { uri: pet.avatar } : demoPhoto}
      style={{ width: size, height: size, borderRadius: size / 2 }}
    />
  ) : (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: colors.pale,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text style={{ fontSize: size * 0.5 }}>
        {speciesEmoji(pet)}
      </Text>
    </View>
  );
}
export function Empty({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle: string;
  action?: React.ReactNode;
}) {
  return (
    <Card style={{ alignItems: "center", paddingVertical: 42, gap: 12 }}>
      <Icon name="feather" size={32} color={colors.orange} />
      <Text style={styles.h2}>{title}</Text>
      <Text style={[styles.muted, { textAlign: "center" }]}>{subtitle}</Text>
      {action}
    </Card>
  );
}
