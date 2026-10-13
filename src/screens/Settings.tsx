import { setLang, t, useLang } from "../i18n";
import React, { useState } from "react";
import { Platform, Text, View } from "react-native";
import { router } from "expo-router";
import { useStore } from "../data/store";
import { exportBackup } from "../platform/export";
import {
  Button,
  Card,
  Chip,
  Heading,
  Icon,
  colors,
  styles,
} from "../components/ui";
import RestoreBackup from "../components/RestoreBackup";
import { Preferences } from "../domain/types";
export default function Settings() {
  const { state, update, reset, notify } = useStore();
  const preference = (key: keyof Preferences, value: boolean) =>
    update((s) => ({ ...s, preferences: { ...s.preferences, [key]: value } }));
  const [confirm, setConfirm] = useState(false);
  const lang = useLang();
  return (
    <View style={[styles.stack, { maxWidth: 760, width: "100%", alignSelf: "center" }]}>
      <Heading
        title={t("设置")}
        accent={colors.green}
        action={<Button label={t("返回")} tone="plain" onPress={() => router.canGoBack() ? router.back() : router.replace("/")} />}
      />
      <Card style={{ gap: 14 }}>
        <View style={[styles.between, { flexWrap: "wrap" }]}>
        <View style={styles.row}>
          <Icon name="globe" color={colors.muted} />
          <Text style={styles.h2}>{t("界面语言")}</Text>
        </View>
        <View style={[styles.row, { gap: 8 }]}>
          <Chip label="中文" active={lang === "zh"} onPress={() => setLang("zh")} />
          <Chip label="English" active={lang === "en"} onPress={() => setLang("en")} />
        </View>
        </View>
      </Card>
      <Card style={{ gap: 18 }}>
        <Text style={styles.h2}>{t("按你的习惯")}</Text>
        {([
          { key: "homeAsBirthday", title: "生日未知时，用到家日庆生", enabled: state.preferences?.homeAsBirthday !== false },
          { key: "randomStyle", title: "新日记随机选择口吻", enabled: state.preferences?.randomStyle !== false },
          { key: "homeExtras", title: "首页展示小镇与成长", enabled: state.preferences?.homeExtras === true },
        ] as const).map((item) => (
          <View key={item.key} style={{ gap: 8 }}>
            <Text style={[styles.body, { fontWeight: "700" }]}>{t(item.title)}</Text>
            <View style={styles.row}>
              <Chip label={t("开启")} active={item.enabled} onPress={() => preference(item.key, true)} />
              <Chip label={t("关闭")} active={!item.enabled} onPress={() => preference(item.key, false)} />
            </View>
          </View>
        ))}
        {state.pet && <Button label={t("修改年龄、身份与日期")} icon="edit-2" tone="plain"
          onPress={() => router.push({ pathname: "/onboarding", params: { edit: "1" } })} />}
      </Card>
      <Card style={{ gap: 17 }}>
          <View style={styles.row}>
            <Icon name="hard-drive" color={colors.muted} />
            <Text style={styles.h2}>{t("数据与备份")}</Text>
          </View>
          <Text style={styles.body}>
            {t("数据保存在当前设备。清理浏览器或换设备前，请导出备份。")}
          </Text>
          <Text style={styles.small}>
            {t("备份含照片与全部记录。恢复上限 20 MB，确认后替换本机数据。")}
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
            <Button
              label={t("导出全部数据")}
              icon="download"
              tone="soft"
              onPress={() => {
                exportBackup(JSON.stringify(state, null, 2))
                  .then(() =>
                    notify(
                      Platform.OS === "web"
                        ? t("备份已导出，请保管好这个文件。")
                        : t("分享面板已关闭，请在保存位置检查备份。"),
                    ),
                  )
                  .catch(() => notify(t("导出失败，请重试。")));
              }}
            />
            <Button
              label={t("清空本机数据")}
              icon="trash-2"
              tone="danger"
              onPress={() => setConfirm(true)}
            />
          </View>
          <RestoreBackup />
          {confirm && (
            <View
              style={{
                gap: 12,
                padding: 16,
                backgroundColor: colors.pale,
                borderWidth: 2.5,
                borderColor: colors.ink,
                borderRadius: 12,
              }}
            >
              <Text style={styles.body}>
                {t("将清空这台设备上的宠物、照片、日记、声音和草稿。请先导出备份。")}
              </Text>
              <View style={styles.row}>
                <Button
                  label={t("确认清空全部数据")}
                  tone="danger"
                  onPress={() => {
                    reset();
                    router.replace("/");
                    notify(t("本机数据已清空。"));
                  }}
                />
                <Button
                  label={t("取消")}
                  tone="plain"
                  onPress={() => setConfirm(false)}
                />
              </View>
            </View>
          )}
      </Card>
    </View>
  );
}
