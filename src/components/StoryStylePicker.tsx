import React from "react";
import { View } from "react-native";
import { Route, STYLES, StoryStyle } from "../domain/types";
import { t } from "../i18n";
import { Chip, colors } from "./ui";

export const storyColors: Record<StoryStyle, string> = {
  diary: colors.yellow,
  life: colors.green,
  social: colors.pink,
  news: colors.sky,
};

export default function StoryStylePicker({
  route,
  selected,
  onSelect,
  children,
}: {
  route: Route;
  selected: StoryStyle;
  onSelect: (style: StoryStyle) => void;
  children?: React.ReactNode;
}) {
  const labels: Record<StoryStyle, string> = {
    diary: t("内心独白"),
    life: route === "work" ? t("打工日记") : t("校园日记"),
    social: t("爪友圈动态"),
    news: t("爪报"),
  };
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
      {STYLES.map((style) => (
        <Chip
          key={style}
          label={labels[style]}
          color={storyColors[style]}
          active={selected === style}
          onPress={() => onSelect(style)}
        />
      ))}
      {children}
    </View>
  );
}
