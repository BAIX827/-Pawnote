import { t } from "../i18n";
import React from "react";
import { Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import { colors, Icon, shadow, Sticker, Wobble } from "./ui";

export default function Neighborhood({ work }: { work: boolean }) {
  const districts = [
    {
      label: t("爪册小屋"),
      route: "/profile" as const,
      icon: "book-open" as const,
      color: colors.orange,
      height: 96,
      tilt: -2,
    },
    {
      label: work ? t("毛孩公司") : t("联合学院"),
      route: "/life" as const,
      icon: work ? ("briefcase" as const) : ("book" as const),
      color: colors.jade,
      height: 136,
      tilt: 1,
    },
    {
      label: t("爪友圈"),
      route: "/circle" as const,
      icon: "message-circle" as const,
      color: colors.lavender,
      height: 110,
      tilt: 2,
    },
  ];
  return (
    <View
      style={[
        {
          backgroundColor: colors.sky,
          borderRadius: 24,
          borderWidth: 1.5,
          borderColor: colors.edge,
          overflow: "hidden",
        },
        shadow(5),
      ]}
    >
      <View style={{ padding: 18, paddingBottom: 0 }}>
        <Sticker bg={colors.paper} rotate={-2}>
          {t("毛孩市 · 生活地图")}
        </Sticker>
      </View>
      <Wobble degrees={10} style={{ position: "absolute", right: 26, top: 20 }}>
        <View
          style={{
            width: 54,
            height: 54,
            backgroundColor: colors.yellow,
            borderRadius: 27,
            borderWidth: 1.5,
            borderColor: colors.edge,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon name="sun" color={colors.ink} size={26} />
        </View>
      </Wobble>
      {[
        { left: "22%" as const, top: 62, w: 62 },
        { left: "52%" as const, top: 38, w: 44 },
      ].map((c) => (
        <View
          key={c.left}
          pointerEvents="none"
          style={{
            position: "absolute",
            left: c.left,
            top: c.top,
            width: c.w,
            height: 18,
            borderRadius: 9,
            backgroundColor: colors.paper,
            borderWidth: 1.5,
            borderColor: colors.edge,
          }}
        />
      ))}
      <View
        style={{
          flexDirection: "row",
          alignItems: "flex-end",
          gap: 10,
          paddingTop: 54,
          paddingHorizontal: 16,
        }}
      >
        {districts.map((d) => (
          <Pressable
            key={d.route}
            accessibilityRole="button"
            accessibilityLabel={t("前往{place}", { place: d.label })}
            onPress={() => router.push(d.route)}
            style={({ pressed }) => ({
              flex: 1,
              alignItems: "center",
              transform: [{ translateY: pressed ? 4 : 0 }],
            })}
          >
            <View style={{ width: "100%", maxWidth: 180 }}>
              <View
                style={{
                  height: 20,
                  backgroundColor: colors.ink,
                  borderTopLeftRadius: 20,
                  borderTopRightRadius: 20,
                  marginHorizontal: -5,
                  transform: [{ rotate: `${d.tilt}deg` }],
                }}
              />
              <View
                style={{
                  height: d.height,
                  backgroundColor: d.color,
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingTop: 12,
                  borderWidth: 2,
                  borderBottomWidth: 0,
                  borderColor: colors.edge,
                }}
              >
                <Icon name={d.icon} size={22} color="#FFFBF1" />
                <View style={{ flexDirection: "row", gap: 9 }}>
                  {[0, 1].map((i) => (
                    <View
                      key={i}
                      style={{
                        width: 16,
                        height: 20,
                        backgroundColor: colors.yellow,
                        borderWidth: 1.5,
                        borderColor: colors.edge,
                      }}
                    />
                  ))}
                </View>
                <View
                  style={{
                    width: 26,
                    height: 30,
                    backgroundColor: colors.ink,
                    borderTopLeftRadius: 13,
                    borderTopRightRadius: 13,
                  }}
                />
              </View>
            </View>
          </Pressable>
        ))}
      </View>
      <View
        style={{
          backgroundColor: colors.green,
          borderTopWidth: 2,
          borderColor: colors.edge,
          flexDirection: "row",
          gap: 10,
          paddingHorizontal: 16,
          paddingVertical: 10,
        }}
      >
        {districts.map((d) => (
          <Text
            key={d.route}
            style={{
              flex: 1,
              textAlign: "center",
              fontSize: 12,
              color: colors.ink,
              fontWeight: "700",
            }}
          >
            {d.label} ↗
          </Text>
        ))}
      </View>
    </View>
  );
}
