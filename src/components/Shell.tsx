import React from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { router, usePathname } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useStore } from "../data/store";
import { exportBackup } from "../platform/export";
import { Avatar, Button, Icon, colors, styles } from "./ui";
const nav = [
  { route: "/", label: "今日营业", icon: "sun" as const },
  { route: "/life", label: "毛孩人生", icon: "briefcase" as const },
  { route: "/circle", label: "毛圈", icon: "message-circle" as const },
  { route: "/profile", label: "我的档案", icon: "user" as const },
];
export default function Shell({ children }: { children: React.ReactNode }) {
  const { width } = useWindowDimensions();
  const wide = width >= 900;
  const path = usePathname();
  const { state, ready, toast, error, blocked, raw, reset, notify } =
    useStore();
  const [confirmReset, setConfirmReset] = React.useState(false);
  const item = (n: (typeof nav)[number]) => (
    <Button
      key={n.route}
      icon={n.icon}
      label={n.label}
      tone={path === n.route ? "soft" : "plain"}
      onPress={() => router.navigate(n.route as "/")}
      style={
        wide
          ? { justifyContent: "flex-start" }
          : { flex: 1, paddingHorizontal: 4 }
      }
    />
  );
  if (!ready)
    return (
      <SafeAreaView
        style={{
          flex: 1,
          justifyContent: "center",
          backgroundColor: colors.bg,
        }}
      >
        <ActivityIndicator color={colors.orange} />
      </SafeAreaView>
    );
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ flex: 1, flexDirection: "row" }}>
        {wide && (
          <View
            style={{
              width: 226,
              backgroundColor: "#FFF",
              borderRightWidth: 1,
              borderColor: colors.line,
              padding: 25,
              gap: 30,
            }}
          >
            <View style={[styles.row, { marginTop: 12 }]}>
              <Text style={{ fontSize: 31 }}>🐾</Text>
              <View>
                <Text
                  style={{ fontSize: 19, color: colors.ink, fontWeight: "800" }}
                >
                  毛孩营业中
                </Text>
                <Text style={[styles.small, { letterSpacing: 2 }]}>
                  PAW LIFE CLUB
                </Text>
              </View>
            </View>
            <View style={{ gap: 10 }}>{nav.map(item)}</View>
            {state.pet && (
              <Button
                label="记录今天"
                icon="plus"
                onPress={() => router.push("/record")}
              />
            )}
            <View style={{ flex: 1 }} />
            <View
              style={{
                backgroundColor: "#F7F7F1",
                padding: 17,
                borderRadius: 16,
                gap: 7,
              }}
            >
              <Icon name="coffee" color="#6E8563" />
              <Text style={{ color: colors.ink, fontSize: 13, lineHeight: 22 }}>
                认真记录生活，{"\n"}偶尔认真摸鱼。
              </Text>
            </View>
            <Text style={styles.small}>v0.1 · 本机体验版</Text>
          </View>
        )}
        <View style={{ flex: 1 }}>
          <View
            style={{
              paddingHorizontal: wide ? 40 : 20,
              paddingVertical: 18,
              backgroundColor: "#FFF",
              borderBottomWidth: 1,
              borderColor: colors.line,
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Text
              style={{
                fontSize: wide ? 13 : 16,
                fontWeight: wide ? "400" : "700",
                color: wide ? colors.muted : colors.ink,
              }}
            >
              {wide ? "每一件小事，都值得写进它的人生。" : "🐾 毛孩营业中"}
            </Text>
            {state.pet ? (
              <View style={[styles.row, { gap: 9 }]}>
                <Text style={styles.small}>{state.pet.name}</Text>
                <Avatar pet={state.pet} demo={state.demo} size={32} />
              </View>
            ) : (
              <Text style={styles.small}>第二人生，准备开场</Text>
            )}
          </View>
          {state.demo && (
            <View
              style={{
                paddingVertical: 7,
                paddingHorizontal: wide ? 40 : 18,
                backgroundColor: colors.pale,
                flexDirection: "row",
                flexWrap: "wrap",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Text style={[styles.small, { color: "#976143" }]}>
                示例体验 · 橘总的故事用于演示
              </Text>
              <Button
                label="创建我的宠物"
                tone="plain"
                onPress={() => router.push("/onboarding")}
              />
            </View>
          )}
          {!!error && (
            <View style={{ backgroundColor: "#FFF0EB", padding: 16, gap: 8 }}>
              <Text
                accessibilityRole="alert"
                style={[styles.body, { color: "#A74933" }]}
              >
                {error}
              </Text>
              <View style={styles.row}>
                <Button
                  label="导出备份"
                  tone="plain"
                  onPress={() => {
                    exportBackup(
                      blocked ? (raw ?? "{}") : JSON.stringify(state, null, 2),
                    ).catch(() => notify("备份导出失败，请重试。"));
                  }}
                />
                {blocked && (
                  <Button
                    label="清空重建"
                    tone="danger"
                    onPress={() => setConfirmReset(true)}
                  />
                )}
              </View>
              {confirmReset && (
                <View style={{ gap: 8 }}>
                  <Text style={styles.body}>
                    清空当前设备的数据？请先保存原始备份。
                  </Text>
                  <View style={styles.row}>
                    <Button
                      label="确认清空"
                      tone="danger"
                      onPress={() => {
                        reset();
                        setConfirmReset(false);
                        router.replace("/");
                      }}
                    />
                    <Button
                      label="取消"
                      tone="plain"
                      onPress={() => setConfirmReset(false)}
                    />
                  </View>
                </View>
              )}
            </View>
          )}
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{
              padding: wide ? 40 : 20,
              paddingBottom: 45,
              alignItems: "center",
            }}
          >
            <View style={{ width: "100%", maxWidth: 1160 }}>
              {blocked ? (
                <View style={{ padding: 30 }}>
                  <Text style={styles.h2}>请先恢复本机数据</Text>
                  <Text style={styles.muted}>
                    使用上方导出与重建操作处理读取异常。
                  </Text>
                </View>
              ) : (
                children
              )}
            </View>
          </ScrollView>
          {!wide && state.pet && (
            <View
              style={{
                flexDirection: "row",
                backgroundColor: "#FFF",
                borderTopWidth: 1,
                borderColor: colors.line,
                paddingVertical: 7,
                paddingHorizontal: 4,
              }}
            >
              {nav.map(item)}
            </View>
          )}
        </View>
      </View>
      {!!toast && (
        <View
          accessibilityRole="alert"
          style={{
            position: "absolute",
            bottom: wide ? 30 : 88,
            alignSelf: "center",
            paddingHorizontal: 22,
            paddingVertical: 14,
            borderRadius: 14,
            backgroundColor: colors.ink,
            maxWidth: "90%",
          }}
        >
          <Text style={{ color: "#FFF", fontSize: 14 }}>{toast}</Text>
        </View>
      )}
    </SafeAreaView>
  );
}
