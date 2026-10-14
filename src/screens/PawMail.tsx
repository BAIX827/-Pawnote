import { t, useLang } from "../i18n";
import { useEffect, useRef, useState } from "react";
import { Image, Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import { useStore } from "../data/store";
import { MAIL_KINDS, MIN_YEAR_ENTRIES, MailKind, allReminders, weekMailKey, writeMail, type Mail } from "../domain/paw-mail";
import { mailSVG, periodLabel } from "../domain/share-cards";
import { CATEGORY_LABELS, LifeEvent } from "../domain/types";
import { exportCard } from "../platform/export";
import {
  ReminderPermission,
  reminderPermission,
  remindersSupported,
  requestReminderPermission,
  syncReminders,
} from "../platform/reminders";
import { Avatar, Bubble, Button, Chip, Empty, Heading, colors, display, numeric, shadow, styles } from "../components/ui";
import Onboarding from "./Onboarding";

const KIND_LABELS: Record<MailKind, string> = { week: "周信", month: "月信", year: "年鉴" };
type Page = "cover" | "numbers" | "best" | "words" | "end";
const pagesOf = (mail: Mail): Page[] =>
  mail.empty ? ["cover", "words", "end"] : ["cover", "numbers", "best", "words", "end"];
const PAGE_COLORS: Record<Page, string> = {
  cover: colors.orange,
  numbers: colors.green,
  best: colors.lavender,
  words: colors.pink,
  end: colors.paper,
};

/** 爪信 / Paw Mail (docs/01 8.18): a letter from the pet, one tap per page. */
export default function PawMail() {
  const { state, update, notify } = useStore();
  const lang = useLang();
  const [kind, setKind] = useState<MailKind>("week");
  const [page, setPage] = useState(0);
  const [permission, setPermission] = useState<ReminderPermission>("unsupported");
  const card = useRef<View>(null);
  const [now] = useState(() => new Date());
  const mail = writeMail(state, kind, now, lang);
  const weekKey = weekMailKey(now);
  const hasMail = !!mail;
  // Opening this week's letter marks it read, which clears the card on 爪窝.
  useEffect(() => {
    if (hasMail && kind === "week" && state.mailRead !== weekKey) update((s) => ({ ...s, mailRead: weekKey }));
  }, [hasMail, kind, state.mailRead, weekKey, update]);
  useEffect(() => {
    if (remindersSupported) void reminderPermission().then(setPermission).catch(() => {});
  }, []);
  if (!state.pet) return <Onboarding />;
  const pet = state.pet;
  const back = <Button label={t("返回")} tone="plain" onPress={() => router.replace("/")} />;
  if (!mail)
    return (
      <View style={styles.stack}>
        <Heading title={t("爪信")}
        hint={t("它写给你的信")} accent={colors.pink} action={back} />
        <Empty title={t("最新的记录写到它离开了。爪信先停下，这里不替它说话。")} />
      </View>
    );
  const big = { fontFamily: display, fontSize: 30, lineHeight: 40, color: colors.ink };
  const open = (e?: LifeEvent) => e && router.push({ pathname: "/event", params: { id: e.id } });
  if (mail.inProgress) {
    const newest = mail.highlight;
    return (
      <View style={[styles.stack, { maxWidth: 760, width: "100%", alignSelf: "center" }]}>
        <Heading title={t("爪信")}
          hint={t("它写给你的信")} accent={colors.pink} action={back} />
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {MAIL_KINDS.map((k) => (
            <Chip key={k} label={t(KIND_LABELS[k])} active={k === kind} color={colors.orange} onPress={() => { setKind(k); setPage(0); }} />
          ))}
        </View>
        <View style={[{ minHeight: 280, backgroundColor: colors.paper, borderWidth: 2.5, borderColor: colors.ink, borderRadius: 14, padding: 22, gap: 14, justifyContent: "center" }, shadow(5)]}>
          <Avatar pet={pet} size={72} demo={state.demo} />
          <Text style={big}>{kind === "week" ? t("这周的信还在写") : kind === "month" ? t("这个月的信还在写") : t("年鉴还在攒")}</Text>
          <Text style={styles.body}>
            {kind === "year"
              ? t("今年已经记了 {n} 件事，记满 {min} 件就能翻开年鉴。", { n: mail.entries, min: MIN_YEAR_ENTRIES })
              : mail.entries
              ? t(kind === "week" ? "这周已经记了 {n} 件事，下周一写完给你。" : "这个月已经记了 {n} 件事，下个月初写完给你。", { n: mail.entries })
              : t(kind === "week" ? "这周还没有记录，记下一件，信里就有内容了。" : "这个月还没有记录，记下一件，信里就有内容了。")}
          </Text>
          {newest ? (
            <Pressable accessibilityRole="button" onPress={() => open(newest)}>
              <Text style={[styles.body, { fontWeight: "700", textDecorationLine: "underline" }]}>
                {t("最新一件：{title}", { title: newest.stories[newest.selectedStyle].title })}
              </Text>
            </Pressable>
          ) : (
            <Button label={t("记录今天")} icon="plus" onPress={() => router.push("/record")} style={{ alignSelf: "flex-start" }} />
          )}
        </View>
      </View>
    );
  }
  const pages = pagesOf(mail);
  const at = Math.min(page, pages.length - 1);
  const current = pages[at];
  async function share() {
    try {
      await exportCard(mailSVG(pet, mail!), `paw-mail-${mail!.kind}`, card.current, mail!.title);
    } catch (e) {
      notify(e instanceof Error ? e.message : t("分享失败，请重试。"));
    }
  }
  async function enableNotifications() {
    const next = await requestReminderPermission();
    setPermission(next);
    if (next === "granted") await syncReminders(allReminders(state, lang)).catch(() => {});
    else notify(t("没有通知权限。可以在系统设置里打开。"));
  }

  const body = (() => {
    switch (current) {
      case "cover":
        return (
          <View style={{ gap: 14, alignItems: "flex-start" }}>
            <Avatar pet={pet} size={88} demo={state.demo} />
            <Text style={big}>{mail.title}</Text>
            <Text style={[styles.body, { fontWeight: "700" }]}>{periodLabel(mail)}</Text>
            <Text style={styles.body}>{mail.greeting}</Text>
          </View>
        );
      case "numbers":
        return (
          <View style={{ gap: 14 }}>
            <Text style={styles.caps}>{t("这段时间的数字")}</Text>
            {[
              { n: mail.entries, label: t("条记录") },
              { n: mail.days, label: t("天有记录") },
              { n: mail.photos, label: t("张照片") },
              { n: `+${mail.xp}`, label: t("经验") },
            ].map((s) => (
              <View key={s.label} style={{ flexDirection: "row", alignItems: "baseline", gap: 10 }}>
                <Text style={{ fontFamily: numeric, fontSize: 44, lineHeight: 52, color: colors.ink }}>{s.n}</Text>
                <Text style={[styles.body, { fontWeight: "700" }]}>{s.label}</Text>
              </View>
            ))}
          </View>
        );
      case "best":
        return (
          <View style={{ gap: 14 }}>
            {mail.top && (
              <>
                <Text style={styles.caps}>{t("最常做的事")}</Text>
                <Text style={big}>{t(CATEGORY_LABELS[mail.top])}</Text>
                {mail.topLine && (
                  <Bubble tail="left">
                    <Text style={[styles.body, { fontWeight: "600" }]}>{mail.topLine}</Text>
                  </Bubble>
                )}
              </>
            )}
            {mail.highlight && (
              <Pressable accessibilityRole="button" onPress={() => open(mail.highlight)} style={{ gap: 8 }}>
                <Text style={styles.caps}>{t("代表作")}</Text>
                {mail.highlight.photo && (
                  <Image source={{ uri: mail.highlight.photo }} style={{ width: "100%", height: 160, borderRadius: 12, borderWidth: 2.5, borderColor: colors.ink }} />
                )}
                <Text style={[styles.body, { fontWeight: "700", textDecorationLine: "underline" }]}>
                  {mail.highlight.stories[mail.highlight.selectedStyle].title}
                </Text>
              </Pressable>
            )}
            {kind === "year" && mail.first && mail.longest && (
              <View style={{ gap: 6 }}>
                <Text style={styles.small}>
                  {t("第一条：")}
                  <Text style={{ fontWeight: "700" }} onPress={() => open(mail.first)}>{mail.first.stories[mail.first.selectedStyle].title}</Text>
                </Text>
                <Text style={styles.small}>
                  {t("写得最长的一条：")}
                  <Text style={{ fontWeight: "700" }} onPress={() => open(mail.longest)}>{mail.longest.stories[mail.longest.selectedStyle].title}</Text>
                </Text>
              </View>
            )}
          </View>
        );
      case "words":
        return (
          <View style={{ gap: 14 }}>
            {mail.quietLine ? (
              <Text style={[styles.body, { fontSize: 18, lineHeight: 28, fontWeight: "600" }]}>{mail.quietLine}</Text>
            ) : (
              <>
                <Text style={styles.caps}>{t("告状")}</Text>
                {mail.complaints.map((c) => (
                  <Bubble key={c} tail="left" bg={colors.paper}>
                    <Text style={[styles.body, { fontWeight: "600" }]}>{c}</Text>
                  </Bubble>
                ))}
                {mail.praise && (
                  <>
                    <Text style={styles.caps}>{t("表扬")}</Text>
                    <Bubble tail="left" bg={colors.yellow}>
                      <Text style={[styles.body, { fontWeight: "600" }]}>{mail.praise}</Text>
                    </Bubble>
                  </>
                )}
              </>
            )}
          </View>
        );
      case "end":
        return (
          <View style={{ gap: 12 }}>
            <Text style={styles.caps}>{mail.title} · {periodLabel(mail)}</Text>
            {!mail.empty && (
              <Text style={[styles.body, { fontWeight: "700" }]}>
                {t("{n} 条记录 · {d} 天 · {p} 张照片", { n: mail.entries, d: mail.days, p: mail.photos })}
              </Text>
            )}
            {mail.complaints[0] && <Text style={styles.body}>{mail.complaints[0]}</Text>}
            <Text style={[styles.body, { fontSize: 18, lineHeight: 28, fontWeight: "700" }]}>{mail.closing}</Text>
            {mail.stars && (
              <View style={{ gap: 2 }}>
                <Text style={styles.caps}>{t("给{owner}打分", { owner: mail.owner })}</Text>
                <Text accessibilityLabel={t("{n} 星", { n: mail.stars })} style={{ fontSize: 34, color: colors.orange }}>
                  {"★".repeat(mail.stars)}
                  <Text style={{ color: colors.muted }}>{"☆".repeat(5 - mail.stars)}</Text>
                </Text>
              </View>
            )}
            <Text style={{ fontFamily: display, fontSize: 22, color: colors.ink, alignSelf: "flex-end" }}>— {pet.name} 🐾</Text>
          </View>
        );
    }
  })();

  return (
    <View style={[styles.stack, { maxWidth: 760, width: "100%", alignSelf: "center" }]}>
      <Heading title={t("爪信")}
        hint={t("它写给你的信")} accent={colors.pink} action={back} />
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {MAIL_KINDS.map((k) => (
          <Chip key={k} label={t(KIND_LABELS[k])} active={k === kind} color={colors.orange} onPress={() => { setKind(k); setPage(0); }} />
        ))}
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={at < pages.length - 1 ? t("下一页") : mail.title}
        onPress={() => at < pages.length - 1 && setPage(at + 1)}
      >
        <View
          ref={card}
          collapsable={false}
          style={[{ minHeight: 360, backgroundColor: PAGE_COLORS[current], borderWidth: 2.5, borderColor: colors.ink, borderRadius: 14, padding: 22, justifyContent: "center" }, shadow(5)]}
        >
          {body}
        </View>
      </Pressable>
      <View style={styles.between}>
        <Button label={t("上一页")} tone="plain" disabled={at === 0} onPress={() => setPage(at - 1)} />
        <View style={{ flexDirection: "row", gap: 6 }} accessibilityLabel={t("第 {n} / {total} 页", { n: at + 1, total: pages.length })}>
          {pages.map((p, i) => (
            <View key={p} style={{ width: 10, height: 10, borderRadius: 5, borderWidth: 2, borderColor: colors.ink, backgroundColor: i === at ? colors.ink : colors.paper }} />
          ))}
        </View>
        {at < pages.length - 1 ? (
          <Button label={t("下一页")} tone="soft" onPress={() => setPage(at + 1)} />
        ) : (
          <Button label={t("分享这封信")} icon="upload" onPress={() => void share()} />
        )}
      </View>
      {remindersSupported && (
        <View style={{ gap: 8 }}>
          <Chip
            label={state.mailReminder === false ? t("周一收信提醒：关") : t("周一收信提醒：开")}
            active={state.mailReminder !== false}
            color={colors.green}
            onPress={() => update((s) => ({ ...s, mailReminder: s.mailReminder === false }))}
          />
          {state.mailReminder !== false && permission !== "granted" && (
            <Button label={t("开启通知")} icon="bell" tone="soft" onPress={() => void enableNotifications()} style={{ alignSelf: "flex-start" }} />
          )}
        </View>
      )}
    </View>
  );
}
