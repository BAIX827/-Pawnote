import { t } from "../i18n";
import { Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import { colors, Icon, shadow, Sticker, Wobble } from "./ui";

// The town only holds places the tab bar doesn't, so it never repeats it (docs/01 8.37).
export default function Neighborhood() {
  const districts = [
    {
      label: t("邮局"),
      route: "/mail" as const,
      icon: "mail" as const,
      color: colors.pink,
      height: 96,
      tilt: -2,
    },
    {
      label: t("算命屋"),
      route: "/pawsona" as const,
      icon: "zap" as const,
      color: colors.lavender,
      height: 136,
      tilt: 1,
    },
    {
      label: t("唱片行"),
      route: "/sounds" as const,
      icon: "mic" as const,
      color: colors.mint,
      height: 110,
      tilt: 2,
    },
  ];
  return (
    <View
      style={[
        {
          backgroundColor: colors.sky,
          borderRadius: 14,
          borderWidth: 2.5,
          borderColor: colors.ink,
          overflow: "hidden",
        },
        shadow(5),
      ]}
    >
      <View style={{ padding: 18, paddingBottom: 0 }}>
        <Sticker bg={colors.paper} rotate={-2}>
          {t("爪爪镇 · 生活地图")}
        </Sticker>
      </View>
      <Wobble degrees={10} style={{ position: "absolute", right: 26, top: 20 }}>
        <View
          style={{
            width: 54,
            height: 54,
            backgroundColor: colors.yellow,
            borderRadius: 14,
            borderWidth: 2.5,
            borderColor: colors.ink,
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
            borderWidth: 2.5,
            borderColor: colors.ink,
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
                  borderColor: colors.ink,
                }}
              >
                <Icon name={d.icon} size={22} color={colors.ink} />
                <View style={{ flexDirection: "row", gap: 9 }}>
                  {[0, 1].map((i) => (
                    <View
                      key={i}
                      style={{
                        width: 16,
                        height: 20,
                        backgroundColor: colors.yellow,
                        borderWidth: 2.5,
                        borderColor: colors.ink,
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
          borderColor: colors.ink,
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
