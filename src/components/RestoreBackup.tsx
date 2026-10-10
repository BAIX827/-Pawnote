import React, { useState } from "react";
import { Text, View } from "react-native";
import { router } from "expo-router";
import { AppState } from "../domain/types";
import { chooseBackup } from "../platform/backup";
import { useStore } from "../data/store";
import { Button, styles } from "./ui";

export default function RestoreBackup() {
  const { restore, notify } = useStore();
  const [pending, setPending] = useState<AppState>();
  const [busy, setBusy] = useState(false);
  async function pick() {
    setBusy(true);
    try { setPending(await chooseBackup()); }
    catch (e) { notify(e instanceof Error ? e.message : "备份读取失败。"); }
    finally { setBusy(false); }
  }
  async function confirm() {
    if (!pending) return;
    setBusy(true);
    try {
      await restore(pending);
      setPending(undefined);
      router.replace("/");
      notify("备份已恢复，照片与日记保留原有状态。");
    } catch (e) { notify(e instanceof Error ? e.message : "恢复失败，请重试。"); }
    finally { setBusy(false); }
  }
  return <View style={{ gap: 12 }}>
    <Button label={busy ? "正在处理备份…" : "从 JSON 备份恢复"} icon="upload"
      tone="soft" disabled={busy} onPress={() => { void pick(); }} />
    {pending && <View style={{ padding: 16, gap: 12, borderRadius: 12, backgroundColor: "#FFF2EC" }}>
      <Text style={styles.body}>
        将恢复 {pending.pet?.name ?? "空白档案"} · {pending.events.length} 条记录
        {pending.draft ? " · 含草稿" : ""}{pending.demo ? " · 示例数据" : ""}。
        {"\n"}确认后将替换本机全部数据。请先导出当前备份。
      </Text>
      <View style={[styles.row, { flexWrap: "wrap" }]}>
        <Button label="确认替换本机数据" tone="danger" disabled={busy} onPress={() => { void confirm(); }} />
        <Button label="取消恢复" tone="plain" disabled={busy} onPress={() => setPending(undefined)} />
      </View>
    </View>}
  </View>;
}
