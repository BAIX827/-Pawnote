import React from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
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
import RestoreBackup from "./RestoreBackup";
const nav = [
  { route: "/", label: "街区", icon: "sun" as const },
  { route: "/life", label: "人生", icon: "briefcase" as const },
  { route: "/circle", label: "毛圈", icon: "message-circle" as const },
  { route: "/profile", label: "手账", icon: "user" as const },
];
export default function Shell({ children }: { children: React.ReactNode }) {
  const { width } = useWindowDimensions();
  const wide = width >= 900;
  const path = usePathname();
  const { state, ready, toast, error, blocked, raw, reset, notify, restoring } =
    useStore();
  const [confirmReset, setConfirmReset] = React.useState(false);
  const item = (n: (typeof nav)[number]) => {
    const active = path === n.route;
    return (
      <Pressable
        key={n.route}
        accessibilityRole="button"
        accessibilityLabel={n.label}
        accessibilityState={{ selected: active }}
        onPress={() => router.navigate(n.route as "/")}
        style={({ pressed }) => ({
          flex: wide ? undefined : 1,
          flexDirection: wide ? "row" : "column",
          gap: wide ? 12 : 5,
          alignItems: wide ? "center" : "center",
          justifyContent: wide ? "flex-start" : "center",
          paddingHorizontal: wide ? 16 : 4,
          paddingVertical: wide ? 16 : 9,
          borderRadius: wide ? 12 : 10,
          backgroundColor: active
            ? wide
              ? colors.yellow
              : colors.green
            : "transparent",
          opacity: pressed ? 0.65 : 1,
        })}
      >
        <Icon
          name={n.icon}
          size={wide ? 20 : 21}
          color={active ? colors.ink : wide ? "#C6CCBF" : colors.muted}
        />
        <Text
          style={{
            fontSize: wide ? 15 : 11,
            fontWeight: active ? "700" : "500",
            color: active ? colors.ink : wide ? "#C6CCBF" : colors.muted,
          }}
        >
          {n.label}
        </Text>
      </Pressable>
    );
  };
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
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        pointerEvents={restoring ? "none" : "auto"}
        style={{ flex: 1, flexDirection: "row" }}
      >
        {wide && (
          <View
            style={{
              width: 226,
              backgroundColor: colors.ink,
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
                  style={{
                    fontSize: 19,
                    color: colors.paper,
                    fontWeight: "800",
                  }}
                >
                  毛孩营业中
                </Text>
                <Text
                  style={[styles.small, { letterSpacing: 2, color: "#A2B09D" }]}
                >
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
                borderTopWidth: 1,
                borderColor: "#4B554E",
                paddingTop: 20,
                gap: 8,
              }}
            >
              <Icon name="map-pin" color={colors.yellow} />
              <Text
                style={{ color: colors.paper, fontSize: 15, fontWeight: "700" }}
              >
                毛孩市
              </Text>
              <Text style={{ color: "#A2B09D", fontSize: 12 }}>
                本机体验版 · v0.1
              </Text>
            </View>
          </View>
        )}
        <View style={{ flex: 1 }}>
          <View
            style={{
              paddingHorizontal: wide ? 40 : 20,
              paddingVertical: 12,
              backgroundColor: colors.paper,
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
              {wide ? "PAW LIFE / 毛孩市" : "🐾 毛孩营业中"}
            </Text>
            {state.pet ? (
              <View style={[styles.row, { gap: 9 }]}>
                <Text
                  numberOfLines={1}
                  style={[styles.small, { maxWidth: wide ? 160 : 85 }]}
                >
                  {state.pet.name}
                </Text>
                <Avatar pet={state.pet} demo={state.demo} size={32} />
              </View>
            ) : (
              <Text style={styles.small}>居民登记处</Text>
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
                示例居民 · 橘总
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
              {blocked && <RestoreBackup />}
            </View>
          )}
          <ScrollView
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode={
              Platform.OS === "ios" ? "interactive" : "on-drag"
            }
            contentContainerStyle={{
              padding: wide ? 36 : 20,
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
                backgroundColor: colors.paper,
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
      </KeyboardAvoidingView>
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
