import { t } from "../i18n";
import { useEffect, useRef, useState } from "react";
import { AppState as RNAppState, Text, View } from "react-native";
import { useStore } from "../data/store";
import { cloudDue, markBackedUp } from "../domain/backup";
import { formatDate } from "../domain/types";
import {
  CloudAccount,
  cloudAvailable,
  deleteCloud,
  loadAccount,
  newCode,
  onAccountChange,
  uploadBackup,
} from "../platform/cloud";
import { Button, Icon, colors, styles } from "./ui";

/** The cloud link on this device, kept current when settings or the background upload change it. */
export function useCloudAccount() {
  const [account, setAccount] = useState<CloudAccount | null>(null);
  useEffect(() => {
    let alive = true;
    void loadAccount().then((a) => alive && setAccount(a));
    const off = onAccountChange(setAccount);
    return () => { alive = false; off(); };
  }, []);
  return account;
}

/** Uploads on launch and on return to the app when a day has passed and something changed (docs/01 8.38). */
export function CloudSync() {
  const { state, ready, blocked, update } = useStore();
  const latest = useRef(state);
  useEffect(() => { latest.current = state; }, [state]);
  const running = useRef(false);
  useEffect(() => {
    if (!cloudAvailable || !ready || blocked) return;
    async function check() {
      if (running.current) return;
      const account = await loadAccount();
      if (!account || !cloudDue(latest.current, account.lastAt)) return;
      running.current = true;
      try {
        await uploadBackup(latest.current, account.code);
        update((s) => markBackedUp(s));
      } catch {
        // Quietly try again next time; the settings page shows when the last upload worked.
      } finally {
        running.current = false;
      }
    }
    const timer = setTimeout(() => void check(), 3000);
    const sub = RNAppState.addEventListener("change", (s) => { if (s === "active") void check(); });
    return () => { clearTimeout(timer); sub.remove(); };
  }, [ready, blocked, update]);
  return null;
}

/** The 云端备份 part of 数据与备份 in settings. */
export default function CloudBackup() {
  const { state, update, notify } = useStore();
  const account = useCloudAccount();
  const [busy, setBusy] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  if (!cloudAvailable) return null;
  const canUpload = !!state.pet && !state.demo;

  async function upload(code: string, fresh: boolean) {
    setBusy(true);
    try {
      await uploadBackup(state, code);
      update((s) => markBackedUp(s));
      if (fresh) setShowCode(true);
      notify(fresh ? t("云端备份已开启，请存好恢复码。") : t("已备份到云端。"));
    } catch (e) {
      notify(e instanceof Error ? e.message : t("云端暂时出错了，请稍后再试。"));
    } finally {
      setBusy(false);
    }
  }
  async function remove() {
    if (!account) return;
    setBusy(true);
    try {
      await deleteCloud(account.code);
      setConfirmDelete(false);
      setShowCode(false);
      notify(t("云端备份已删除。"));
    } catch (e) {
      notify(e instanceof Error ? e.message : t("云端暂时出错了，请稍后再试。"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={{ gap: 12, paddingTop: 4 }}>
      <View style={styles.row}>
        <Icon name="cloud" color={colors.muted} />
        <Text style={[styles.body, { fontWeight: "700" }]}>{t("云端备份")}</Text>
      </View>
      {!account ? (
        <>
          <Text style={styles.small}>
            {t("开启后每天自动传一份到云端，换手机用恢复码找回。恢复码丢了就找不回，请存好。")}
          </Text>
          <View style={styles.row}>
            <Button label={busy ? t("正在上传…") : t("开启云端备份")} icon="cloud" tone="soft"
              disabled={busy || !canUpload} onPress={() => void upload(newCode(), true)} />
          </View>
          {!canUpload && <Text style={styles.small}>{t("先建好宠物档案再开启。")}</Text>}
        </>
      ) : (
        <>
          <Text style={styles.small}>
            {account.lastAt
              ? t("上次云端备份：{date} · {n} 条记录", { date: formatDate(account.lastAt), n: account.events ?? 0 })
              : t("还没传到云端")}
          </Text>
          {showCode && (
            <View style={{ padding: 14, gap: 6, borderRadius: 12, borderWidth: 2.5, borderColor: colors.ink, backgroundColor: colors.pale }}>
              <Text style={styles.small}>{t("恢复码")}</Text>
              <Text selectable style={{ fontSize: 17, fontWeight: "800", fontVariant: ["tabular-nums"], color: colors.ink }}>
                {account.code}
              </Text>
              <Text style={styles.small}>{t("截图或抄下来。换手机时在建档页点“用恢复码找回”。")}</Text>
            </View>
          )}
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
            <Button label={busy ? t("正在上传…") : t("立即备份到云端")} icon="upload" tone="soft"
              disabled={busy || !canUpload} onPress={() => void upload(account.code, false)} />
            <Button label={showCode ? t("收起恢复码") : t("查看恢复码")} icon="key" tone="plain"
              onPress={() => setShowCode(!showCode)} />
            <Button label={t("删除云端备份")} icon="trash-2" tone="plain" disabled={busy}
              onPress={() => setConfirmDelete(true)} />
          </View>
          {confirmDelete && (
            <View style={{ gap: 12, padding: 16, backgroundColor: colors.pale, borderWidth: 2.5, borderColor: colors.ink, borderRadius: 12 }}>
              <Text style={styles.body}>{t("删除云端那一份，这台设备也会退出云端备份。本机数据不受影响。")}</Text>
              <View style={styles.row}>
                <Button label={t("确认删除云端备份")} tone="danger" disabled={busy} onPress={() => void remove()} />
                <Button label={t("取消")} tone="plain" onPress={() => setConfirmDelete(false)} />
              </View>
            </View>
          )}
        </>
      )}
    </View>
  );
}
