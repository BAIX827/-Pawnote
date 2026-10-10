import React from "react";
import { Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import { colors, Icon, styles } from "./ui";

export default function Neighborhood({ work }: { work: boolean }) {
  const districts = [
    {
      label: "日记小屋",
      route: "/profile" as const,
      icon: "book-open" as const,
      color: colors.orange,
      roof: "#CB503A",
      height: 92,
    },
    {
      label: work ? "毛孩公司" : "联合学院",
      route: "/life" as const,
      icon: work ? ("briefcase" as const) : ("book" as const),
      color: colors.jade,
      roof: "#194F44",
      height: 124,
    },
    {
      label: "毛圈广场",
      route: "/circle" as const,
      icon: "message-circle" as const,
      color: colors.lavender,
      roof: "#554497",
      height: 104,
    },
  ];
  return (
    <View
      style={{
        backgroundColor: "#E4ECD8",
        borderRadius: 22,
        padding: 20,
        overflow: "hidden",
      }}
    >
      <View style={styles.between}>
        <Text
          style={[
            styles.small,
            { color: colors.jade, fontWeight: "700", letterSpacing: 2 },
          ]}
        >
          毛孩市 · 生活地图
        </Text>
        <Icon name="compass" color={colors.jade} size={20} />
      </View>
      <View
        style={{
          position: "absolute",
          right: 32,
          top: 52,
          width: 34,
          height: 34,
          backgroundColor: colors.yellow,
          borderRadius: 17,
        }}
      />
      <View
        style={{
          flexDirection: "row",
          alignItems: "flex-end",
          gap: 12,
          paddingTop: 48,
          paddingBottom: 13,
          borderBottomWidth: 3,
          borderColor: "#BDCAA6",
        }}
      >
        {districts.map((d) => (
          <Pressable
            key={d.route}
            accessibilityRole="button"
            accessibilityLabel={`前往${d.label}`}
            onPress={() => router.push(d.route)}
            style={({ pressed }) => ({
              flex: 1,
              alignItems: "center",
              opacity: pressed ? 0.7 : 1,
              gap: 10,
            })}
          >
            <View style={{ width: "100%", maxWidth: 180 }}>
              <View
                style={{
                  height: 15,
                  backgroundColor: d.roof,
                  borderTopLeftRadius: 18,
                  borderTopRightRadius: 18,
                  marginHorizontal: -4,
                }}
              />
              <View
                style={{
                  height: d.height,
                  backgroundColor: d.color,
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingTop: 16,
                  borderWidth: 2,
                  borderColor: d.roof,
                }}
              >
                <Icon name={d.icon} size={22} color="#FFFDF7" />
                <View style={{ flexDirection: "row", gap: 9 }}>
                  {[0, 1].map((i) => (
                    <View
                      key={i}
                      style={{
                        width: 14,
                        height: 18,
                        backgroundColor: colors.yellow,
                        borderWidth: 2,
                        borderColor: d.roof,
                      }}
                    />
                  ))}
                </View>
                <View
                  style={{
                    width: 24,
                    height: 29,
                    backgroundColor: d.roof,
                    borderTopLeftRadius: 12,
                    borderTopRightRadius: 12,
                  }}
                />
              </View>
            </View>
            <Text
              style={{ fontSize: 12, color: colors.ink, fontWeight: "700" }}
            >
              {d.label} ↗
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
