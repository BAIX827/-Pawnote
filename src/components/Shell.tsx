import { t, useLang } from "../i18n";
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
import { Avatar, Button, Icon, Wobble, colors, display, styles } from "./ui";
import BrandMark from "./BrandMark";
import RestoreBackup from "./RestoreBackup";
import { MAX_PETS, homePets, switchPet } from "../domain/household";
import { othersCalling } from "../domain/paw-dates";
const nav = [
  { route: "/", label: "爪窝", icon: "home" as const },
  { route: "/life", label: "爪迹", icon: "briefcase" as const },
  { route: "/circle", label: "爪友圈", icon: "message-circle" as const },
  { route: "/profile", label: "爪册", icon: "book-open" as const },
];
export default function Shell({ children }: { children: React.ReactNode }) {
  const { width } = useWindowDimensions();
  const wide = width >= 900;
  const path = usePathname();
  const { state, ready, toast, toastAction, error, blocked, raw, reset, notify, restoring, update } =
    useStore();
  const [confirmReset, setConfirmReset] = React.useState(false);
  // Tapping the pet in the top bar opens a quick switcher when there is more than one (docs/01 8.24).
  // Remembering where it was opened closes it on its own when the owner moves to another page.
  const [switcherAt, setSwitcherAt] = React.useState<string | null>(null);
  const switcher = switcherAt === path;
  const setSwitcher = (open: boolean) => setSwitcherAt(open ? path : null);
  const pets = homePets(state);
  // Other pets whose 爪约 has come round get a red dot, so a call isn't missed behind the switcher (docs/01 8.26).
  const calling = new Set(othersCalling(state).map((c) => c.pet.id));
  const dot = { position: "absolute" as const, top: -2, right: -2, width: 12, height: 12, borderRadius: 6,
    backgroundColor: colors.red, borderWidth: 2, borderColor: colors.paper };
  const lang = useLang();
  const item = (n: (typeof nav)[number]) => {
    const active = path === n.route;
    return (
      <Pressable
        key={n.route}
        accessibilityRole="button"
        accessibilityLabel={t(n.label)}
        accessibilityState={{ selected: active }}
        onPress={() => router.navigate(n.route as "/")}
        style={({ pressed }) => ({
          flex: wide ? undefined : 1,
          flexDirection: wide ? "row" : "column",
          gap: wide ? 12 : 3,
          alignItems: "center",
          justifyContent: wide ? "flex-start" : "center",
          paddingHorizontal: wide ? 16 : 2,
          paddingVertical: wide ? 14 : 7,
          borderRadius: 14,
          opacity: pressed ? 0.65 : active ? 1 : 0.6,
        })}
      >
        <Icon
          name={n.icon}
          size={20}
          color={active ? colors.green : colors.bg}
        />
        <Text
          style={{
            fontSize: wide ? 15 : 11,
            fontWeight: "700",
            color: active ? colors.green : colors.bg,
          }}
        >
          {t(n.label)}
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
              <BrandMark size={44} />
              <View>
                <Text
                  style={{
                    fontSize: 21,
                    fontFamily: display,
                    color: colors.paper,
                    fontWeight: "400",
                  }}
                >
                  {t("爪记")}
                </Text>
                <Text
                  style={[styles.small, { letterSpacing: 2, color: "#A2B09D" }]}
                >
                  PAWNOTE
                </Text>
              </View>
            </View>
            <View style={{ gap: 10 }}>{nav.map(item)}</View>
            {state.pet && (
              <Button
                label={t("记录今天")}
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
                {t("爪爪镇")}
              </Text>
            </View>
          </View>
        )}
        <View style={{ flex: 1 }}>
          <View
            style={{
              paddingHorizontal: wide ? 40 : 18,
              paddingVertical: 10,
              backgroundColor: colors.paper,
              borderBottomWidth: 2,
              borderColor: colors.ink,
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            {wide ? (
              <Text style={[styles.caps, { color: colors.muted }]}>
                {t("PAWNOTE / 爪爪镇日报")}
              </Text>
            ) : (
              <View style={[styles.row, { gap: 8 }]}>
                <Wobble degrees={8}>
                  <BrandMark size={32} />
                </Wobble>
                <Text
                  style={{
                    fontSize: 21,
                    fontWeight: "400",
                    fontFamily: display,
                    color: colors.ink,
                    letterSpacing: 1,
                  }}
                >
                  {t("爪记")}
                </Text>
              </View>
            )}
            <View style={[styles.row, { gap: 14 }]}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t("设置")}
              onPress={() => router.navigate("/settings")}
              hitSlop={10}
            >
              <Icon name="settings" color={colors.ink} size={22} />
            </Pressable>
            {state.pet ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={pets.length > 1 ? t("切换宠物") : t("打开爪册")}
                accessibilityState={pets.length > 1 ? { expanded: switcher } : undefined}
                onPress={() => (pets.length > 1 ? setSwitcher(!switcher) : router.navigate("/profile"))}
                style={[styles.row, { gap: 9 }]}
              >
                <Text
                  numberOfLines={1}
                  style={[styles.small, { maxWidth: wide ? 160 : 85, fontWeight: "700", color: colors.ink }]}
                >
                  {state.pet.name}
                </Text>
                <View>
                  <Avatar pet={state.pet} demo={state.demo} size={34} />
                  {calling.size > 0 && <View style={dot} />}
                </View>
                {pets.length > 1 && <Icon name={switcher ? "chevron-up" : "chevron-down"} size={16} color={colors.ink} />}
              </Pressable>
            ) : (
              <Text style={styles.small}>{t("居民登记处")}</Text>
            )}
            </View>
          </View>
          {switcher && state.pet && (
            <View
              style={{
                paddingVertical: 12,
                paddingHorizontal: wide ? 40 : 18,
                backgroundColor: colors.paper,
                borderBottomWidth: 2,
                borderColor: colors.ink,
                gap: 10,
              }}
            >
              <Text style={styles.caps}>{t("我家的毛孩子")} · {pets.length}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}
                style={{ flexGrow: 0 }}
                contentContainerStyle={{ alignItems: "flex-start", gap: 14, paddingVertical: 4 }}>
                {pets.map((pet) => {
                  const active = pet.id === state.pet!.id;
                  return (
                    <Pressable
                      key={pet.id}
                      accessibilityRole="button"
                      accessibilityLabel={active ? t("{name}（当前）", { name: pet.name }) : t("切换到{name}", { name: pet.name })}
                      accessibilityState={{ selected: active }}
                      onPress={() => {
                        setSwitcher(false);
                        if (active) return;
                        update((s) => switchPet(s, pet.id));
                        notify(t("现在是{name}的视角。", { name: pet.name }));
                      }}
                      style={({ pressed }) => ({ alignItems: "center", gap: 4, minWidth: 62, flexShrink: 0, opacity: pressed ? 0.6 : 1 })}
                    >
                      <View style={{ padding: 2, borderRadius: 30, borderWidth: 3, borderColor: active ? colors.orange : "transparent" }}>
                        <Avatar pet={pet} demo={state.demo} size={44} />
                        {calling.has(pet.id) && <View style={dot} />}
                      </View>
                      <Text numberOfLines={1} style={[styles.small, { color: colors.ink, fontWeight: active ? "800" : "500" }]}>
                        {pet.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
              <View style={[styles.row, { flexWrap: "wrap" }]}>
                {pets.length < MAX_PETS && (
                  <Button label={t("添加宠物")} icon="plus" tone="plain" onPress={() => router.push({ pathname: "/onboarding", params: { add: "1" } })} />
                )}
                <Button label={t("去爪册")} tone="plain" onPress={() => router.navigate("/profile")} />
              </View>
            </View>
          )}
          {state.demo && (
            <View
              style={{
                paddingVertical: 7,
                paddingHorizontal: wide ? 40 : 18,
                backgroundColor: colors.pink,
                borderBottomWidth: 2,
                borderColor: colors.ink,
                flexDirection: "row",
                flexWrap: "wrap",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Text style={[styles.small, { color: colors.ink, fontWeight: "700" }]}>
                {t("示例居民")} · {state.pet?.name}
              </Text>
              <Button
                label={t("创建我的宠物")}
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
                  label={t("导出备份")}
                  tone="plain"
                  onPress={() => {
                    exportBackup(
                      blocked ? (raw ?? "{}") : JSON.stringify(state, null, 2),
                    ).catch(() => notify(t("备份导出失败，请重试。")));
                  }}
                />
                {blocked && (
                  <Button
                    label={t("清空重建")}
                    tone="danger"
                    onPress={() => setConfirmReset(true)}
                  />
                )}
              </View>
              {confirmReset && (
                <View style={{ gap: 8 }}>
                  <Text style={styles.body}>
                    {t("清空当前设备的数据？请先保存原始备份。")}
                  </Text>
                  <View style={styles.row}>
                    <Button
                      label={t("确认清空")}
                      tone="danger"
                      onPress={() => {
                        reset();
                        setConfirmReset(false);
                        router.replace("/");
                      }}
                    />
                    <Button
                      label={t("取消")}
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
              padding: wide ? 36 : 18,
              paddingTop: wide ? 36 : 22,
              paddingBottom: 60,
              alignItems: "center",
            }}
          >
            <View style={{ width: "100%", maxWidth: 1160 }}>
              {blocked ? (
                <View style={{ padding: 30 }}>
                  <Text style={styles.h2}>{t("请先恢复本机数据")}</Text>
                  <Text style={styles.muted}>
                    {t("使用上方导出与重建操作处理读取异常。")}
                  </Text>
                </View>
              ) : (
                // Screens read their text while rendering, so a new language remounts them.
                <React.Fragment key={lang}>{children}</React.Fragment>
              )}
            </View>
          </ScrollView>
          {!wide && state.pet && (
            <View
              style={[
                {
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: colors.ink,
                  borderRadius: 18,
                  marginHorizontal: 12,
                  marginBottom: 8,
                  marginTop: 6,
                  paddingVertical: 6,
                  paddingHorizontal: 8,
                },
              ]}
            >
              {nav.slice(0, 2).map(item)}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t("记录今天")}
                onPress={() => router.push("/record")}
                style={({ pressed }) => ({
                  width: 50,
                  height: 50,
                  borderRadius: 12,
                  marginHorizontal: 8,
                  backgroundColor: colors.orange,
                  borderWidth: 2.5,
                  borderColor: colors.bg,
                  alignItems: "center",
                  justifyContent: "center",
                  transform: [{ rotate: "-6deg" }, { scale: pressed ? 0.92 : 1 }],
                })}
              >
                <Icon name="plus" size={22} color={colors.ink} />
                <Text style={{ fontSize: 10, fontWeight: "700", color: colors.ink }}>{t("记录")}</Text>
              </Pressable>
              {nav.slice(2).map(item)}
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
      {!!toast && (
        <View
          accessibilityRole="alert"
          style={{
            position: "absolute",
            bottom: wide ? 30 : 104,
            alignSelf: "center",
            paddingHorizontal: 20,
            paddingVertical: 12,
            borderRadius: 999,
            backgroundColor: colors.yellow,
            borderWidth: 2.5,
            borderColor: colors.ink,
            boxShadow: `4px 4px 0px ${colors.ink}`,
            maxWidth: "90%",
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
            <Text style={{ color: colors.ink, fontSize: 14, fontWeight: "700", flexShrink: 1 }}>{toast}</Text>
            {toastAction && (
              <Pressable
                accessibilityRole="button"
                onPress={() => { toastAction.run(); notify(""); }}
                hitSlop={10}
              >
                <Text style={{ color: colors.ink, fontSize: 14, fontWeight: "900", textDecorationLine: "underline" }}>{toastAction.label}</Text>
              </Pressable>
            )}
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}
