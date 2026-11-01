import { t } from "../i18n";
import { useState } from "react";
import { Text, View } from "react-native";
import { router } from "expo-router";
import { AppState } from "../domain/types";
import { normalizeCode } from "../domain/backup";
import { allEvents } from "../domain/household";
import { chooseBackup } from "../platform/backup";
import { cloudAvailable, downloadBackup, saveAccount } from "../platform/cloud";
import { useStore } from "../data/store";
import { Button, Field, styles } from "./ui";

/** Restores from a JSON file, or from the cloud copy with a recovery code (docs/01 8.38); both preview first. */
export default function RestoreBackup() {
  const { restore, notify } = useStore();
  const [pending, setPending] = useState<{ state: AppState; code?: string }>();
  const [busy, setBusy] = useState(false);
  const [asking, setAsking] = useState(false);
  const [typed, setTyped] = useState("");
  async function pick() {
    setBusy(true);
    try {
      const state = await chooseBackup();
      setPending(state && { state });
    }
    catch (e) { notify(e instanceof Error ? e.message : t("备份读取失败。")); }
    finally { setBusy(false); }
  }
  async function fetchCloud() {
    const code = normalizeCode(typed);
    if (!code) return notify(t("恢复码是 20 位字母和数字，请检查后重试。"));
    setBusy(true);
    try { setPending({ state: await downloadBackup(code), code }); }
    catch (e) { notify(e instanceof Error ? e.message : t("云端暂时出错了，请稍后再试。")); }
    finally { setBusy(false); }
  }
  async function confirm() {
    if (!pending) return;
    setBusy(true);
    try {
      await restore(pending.state);
      // The device joins the account it restored from; nothing new to upload until the next change.
      if (pending.code)
        await saveAccount({ code: pending.code, lastAt: new Date().toISOString(), events: allEvents(pending.state).length });
      setPending(undefined);
      setAsking(false);
      setTyped("");
      router.replace("/");
      notify(t("备份已恢复，照片、日记与声音已保留。"));
    } catch (e) { notify(e instanceof Error ? e.message : t("恢复失败，请重试。")); }
    finally { setBusy(false); }
  }
  const p = pending?.state;
  return <View style={{ gap: 12 }}>
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
      <Button label={busy && !asking ? t("正在处理备份…") : t("从 JSON 备份恢复")} icon="upload"
        tone="soft" disabled={busy} onPress={() => { void pick(); }} />
      {cloudAvailable && <Button label={t("用恢复码找回")} icon="key" tone="plain" disabled={busy}
        onPress={() => setAsking(!asking)} />}
    </View>
    {asking && !pending && <View style={{ gap: 10 }}>
      <Field value={typed} onChangeText={setTyped} placeholder="XXXX-XXXX-XXXX-XXXX-XXXX"
        autoCapitalize="characters" autoCorrect={false} maxLength={29} accessibilityLabel={t("恢复码")} />
      <View style={styles.row}>
        <Button label={busy ? t("正在找回…") : t("找回云端备份")} icon="cloud" tone="soft" disabled={busy}
          onPress={() => { void fetchCloud(); }} />
      </View>
    </View>}
    {p && <View style={{ padding: 16, gap: 12, borderRadius: 12, backgroundColor: "#FFF2EC" }}>
      <Text style={styles.body}>
        {t("将恢复 {name} · {n} 条记录", { name: p.pet?.name ?? t("空白档案"), n: p.events.length })}
        {p.draft ? t(" · 含草稿") : ""}{p.demo ? t(" · 示例数据") : ""}
        {p.sounds?.length ? t(" · {n} 段声音", { n: p.sounds.length }) : ""}
        {"\n"}{t("确认后将替换本机全部数据。请先导出当前备份。")}
      </Text>
      <View style={[styles.row, { flexWrap: "wrap" }]}>
        <Button label={t("确认替换本机数据")} tone="danger" disabled={busy} onPress={() => { void confirm(); }} />
        <Button label={t("取消恢复")} tone="plain" disabled={busy} onPress={() => setPending(undefined)} />
      </View>
    </View>}
  </View>;
}
