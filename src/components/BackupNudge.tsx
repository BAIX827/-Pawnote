import { t } from "../i18n";
import { Platform, Text, View } from "react-native";
import { useStore } from "../data/store";
import { backupDue, markBackedUp, snoozeBackup } from "../domain/backup";
import { exportBackup } from "../platform/export";
import { Button, Icon, colors, display, shadow } from "./ui";

/** Exports everything and remembers when, for the reminder below and the settings page (docs/01 8.27). */
export function useBackupExport() {
  const { state, update, notify } = useStore();
  return () =>
    exportBackup(JSON.stringify(state, null, 2))
      .then(() => {
        update((s) => markBackedUp(s));
        notify(
          Platform.OS === "web"
            ? t("备份已导出，请保管好这个文件。")
            : t("分享面板已关闭，请在保存位置检查备份。"),
        );
      })
      .catch(() => notify(t("导出失败，请重试。")));
}

/** 爪窝's reminder to keep a copy of the diary, while it only lives on this device. */
export default function BackupNudge() {
  const { state, update } = useStore();
  const backup = useBackupExport();
  if (!state.pet || !backupDue(state)) return null;
  return (
    <View style={[{ backgroundColor: colors.sky, borderWidth: 2.5, borderColor: colors.ink, borderRadius: 14, padding: 14, gap: 12 }, shadow(3)]}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <Icon name="hard-drive" size={24} color={colors.ink} />
        <Text style={{ flex: 1, fontFamily: display, fontSize: 19, lineHeight: 26, color: colors.ink }}>
          {t("把{name}的日记存一份", { name: state.pet.name })}
        </Text>
      </View>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
        <Button label={t("现在备份")} icon="download" tone="soft" onPress={backup} />
        <Button label={t("以后再说")} tone="plain" onPress={() => update((s) => snoozeBackup(s))} />
      </View>
    </View>
  );
}
