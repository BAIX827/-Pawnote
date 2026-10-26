import { t, useLang } from "../i18n";
import { useEffect, useMemo, useState } from "react";
import { Image, Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import { useStore } from "../data/store";
import { formatDate } from "../domain/types";
import {
  BROWSE_HOURS,
  CircleComment,
  CirclePost,
  RESIDENTS,
  Resident,
  buildCircle,
  petIsGone,
  residentName,
} from "../domain/paw-circle";
import {
  Avatar,
  Button,
  Card,
  Chip,
  Empty,
  Heading,
  Icon,
  PawMark,
  Sticker,
  Tape,
  colors,
  shadow,
  styles,
} from "../components/ui";
import Onboarding from "./Onboarding";

// 爪友圈 2.0 (docs/01 8.20): only animals speak. The owner picks where a post goes and can tidy up,
// but never writes a post or a comment here.
const notes = [colors.paper, colors.lavender, colors.mint, colors.yellow];
const tapes = [colors.orange, colors.yellow, colors.lavender, colors.mint];
const PAGE = 20;

function ResidentFace({ r, size = 48, faded }: { r: Resident; size?: number; faded?: boolean }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: 2.5,
        borderColor: colors.ink,
        backgroundColor: r.color,
        alignItems: "center",
        justifyContent: "center",
        opacity: faded ? 0.4 : 1,
      }}
    >
      <Text style={{ fontSize: size * 0.48 }}>{r.emoji}</Text>
    </View>
  );
}

const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
function when(at: Date, now: Date) {
  const time = `${String(at.getHours()).padStart(2, "0")}:${String(at.getMinutes()).padStart(2, "0")}`;
  if (sameDay(at, now)) return t("今天 {time}", { time });
  const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
  if (sameDay(at, yesterday)) return t("昨天 {time}", { time });
  return formatDate(at.toISOString());
}

export default function Circle() {
  const { state, update, notify } = useStore();
  const lang = useLang();
  const [who, setWho] = useState<string>("all");
  const [limit, setLimit] = useState(PAGE);
  const [confirm, setConfirm] = useState<string>();
  const [now, setNow] = useState(() => new Date());
  // Residents drop by over time, so the page refreshes itself once a minute.
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);
  const circle = useMemo(() => buildCircle(state, now, lang), [state, now, lang]);
  const pet = state.pet;
  if (!pet) return <Onboarding />;
  const hidden = state.circle?.hiddenNpcs ?? [];
  const nameOf = (r: Resident) => residentName(r, lang);
  const resident = RESIDENTS.find((r) => r.id === who);
  const posts = circle.posts.filter((p) =>
    who === "all" ? true : who === "mine" ? p.kind === "pet" : p.author.id === who,
  );
  const join = (names: string[]) => [...new Set(names)].join(lang === "zh" ? "、" : ", ");
  const gone = petIsGone(state);

  const setCircle = (fn: (c: NonNullable<typeof state.circle>) => NonNullable<typeof state.circle>) =>
    update((s) => ({ ...s, circle: fn(s.circle ?? {}) }));
  const toggleResident = (r: Resident) => {
    const back = hidden.includes(r.id);
    setCircle((c) => ({
      ...c,
      hiddenNpcs: back ? (c.hiddenNpcs ?? []).filter((id) => id !== r.id) : [...(c.hiddenNpcs ?? []), r.id],
    }));
    notify(back ? t("{name}回来了。", { name: nameOf(r) }) : t("不看{name}的动态了，想看时可以恢复。", { name: nameOf(r) }));
  };
  const removeComment = (c: CircleComment) => {
    setCircle((s) => ({ ...s, removed: [...(s.removed ?? []), c.id].slice(-500) }));
    notify(t("这条评论删掉了。"));
  };
  const unpost = (p: CirclePost) => {
    if (confirm !== p.id) {
      setConfirm(p.id);
      return;
    }
    setConfirm(undefined);
    update((s) => ({
      ...s,
      events: s.events.map((e) => (e.id === p.event!.id ? { ...e, published: false } : e)),
    }));
    notify(t("已从爪友圈撤回，日记还在爪册里。"));
  };

  return (
    <View style={[styles.stack, { maxWidth: 760, width: "100%", alignSelf: "center" }]}>
      <Heading
        title={t("爪友圈")}
        hint={t("小镇朋友圈")}
        accent={colors.sky}
        action={<Button label={t("写今天的事")} icon="edit-3" onPress={() => router.push("/record")} />}
      />
      <View style={[styles.row, { flexWrap: "wrap" }]}>
        <Button label={t("关系网")} icon="share-2" tone="soft" onPress={() => router.push("/bonds")} />
      </View>
      <>
          <View style={{ gap: 10 }}>
            <Text style={styles.caps}>{t(pet.species === "cat" ? "{name}的好朋喵 · 爪爪镇居民" : pet.species === "dog" ? "{name}的好朋狗 · 爪爪镇居民" : "{name}的好朋友 · 爪爪镇居民", { name: pet.name })}</Text>
            <View style={[styles.row, { flexWrap: "wrap", gap: 12 }]}>
              {RESIDENTS.map((r) => (
                <Pressable
                  key={r.id}
                  accessibilityRole="button"
                  accessibilityLabel={nameOf(r)}
                  accessibilityState={{ selected: who === r.id }}
                  onPress={() => {
                    setWho(who === r.id ? "all" : r.id);
                    setLimit(PAGE);
                  }}
                  style={{ alignItems: "center", gap: 4, width: 64 }}
                >
                  <ResidentFace r={r} faded={hidden.includes(r.id)} />
                  <Text style={[styles.small, { color: colors.ink, fontWeight: who === r.id ? "800" : "500" }]} numberOfLines={1}>
                    {nameOf(r)}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {resident && (
            <Card style={[{ gap: 10, backgroundColor: resident.color }, shadow(4)]}>
              <View style={styles.row}>
                <ResidentFace r={resident} size={56} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.h2}>{nameOf(resident)}</Text>
                  <Text style={[styles.small, { color: colors.ink }]}>{resident.role[lang]}</Text>
                  <Sticker bg={colors.paper} rotate={-2} style={{ marginTop: 6 }}>
                    {t("爪爪镇居民")}
                  </Sticker>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t("收起")}
                  onPress={() => setWho("all")}
                  hitSlop={10}
                  style={{ alignSelf: "flex-start" }}
                >
                  <Icon name="x" size={22} color={colors.ink} />
                </Pressable>
              </View>
              <Text style={styles.body}>{resident.bio[lang]}</Text>

              <Button
                label={hidden.includes(resident.id) ? t("恢复显示") : t("不看它的动态")}
                tone="soft"
                onPress={() => toggleResident(resident)}
              />
            </Card>
          )}

          {!gone && who === "all" && (
            <Card style={{ gap: 6, backgroundColor: colors.lilac }}>
              <Text style={[styles.body, { fontWeight: "700" }]}>{t("{name}今天的出门记录", { name: pet.name })}</Text>
              <Text style={styles.body}>
                {circle.today.liked.length
                  ? [
                      t("给{list}点了爪。", { list: join(circle.today.liked) }),
                      circle.today.commented.length
                        ? t("在{list}那里留了话。", { list: join(circle.today.commented) })
                        : "",
                    ].join(lang === "zh" ? "" : " ")
                  : now.getHours() < BROWSE_HOURS[0]
                    ? t("{name}10 点会出门逛一圈，19 点再逛一次。", { name: pet.name })
                    : t("今天逛了一圈，没遇到特别合拍的。")}
              </Text>
            </Card>
          )}

          <View style={[styles.row, { flexWrap: "wrap" }]}>
            <Chip label={t("全部")} active={who === "all"} onPress={() => setWho("all")} />
            <Chip label={t("只看{name}", { name: pet.name })} active={who === "mine"} onPress={() => setWho("mine")} />
          </View>

          {posts.length ? (
            <View
              style={{
                backgroundColor: colors.orange,
                borderWidth: 2.5,
                borderColor: colors.ink,
                borderRadius: 14,
                paddingHorizontal: 16,
                paddingVertical: 30,
                gap: 34,
              }}
            >
              {posts.slice(0, limit).map((p, i) => (
                <Post
                  key={p.id}
                  post={p}
                  index={i}
                  now={now}
                  demo={state.demo}
                  confirming={confirm === p.id}
                  onUnpost={() => unpost(p)}
                  onRemove={removeComment}
                />
              ))}
              {posts.length > limit && (
                <Button label={t("看更早的")} tone="soft" onPress={() => setLimit(limit + PAGE)} />
              )}
            </View>
          ) : (
            <Empty
              title={who === "mine" ? t("{name}还没发动态", { name: pet.name }) : t("这里还很安静")}
              action={<Button label={t("写今天的事")} onPress={() => router.push("/record")} />}
            />
          )}
      </>
    </View>
  );
}

function Post({
  post: p,
  index: i,
  now,
  demo,
  confirming,
  onUnpost,
  onRemove,
}: {
  post: CirclePost;
  index: number;
  now: Date;
  demo: boolean;
  confirming: boolean;
  onUnpost: () => void;
  onRemove: (c: CircleComment) => void;
}) {
  const e = p.event;
  const lang = useLang();
  const comments = p.comments.filter((c) => !c.replyTo);
  return (
    <View
      style={[
        {
          backgroundColor: notes[i % notes.length],
          borderWidth: 2.5,
          borderColor: colors.ink,
          borderRadius: 14,
          padding: 18,
          gap: 14,
          transform: [{ rotate: `${[-1.4, 1.1, -0.6, 1.6][i % 4]}deg` }],
        },
        shadow(4),
      ]}
    >
      <Tape color={tapes[i % tapes.length]} rotate={i % 2 ? 6 : -6} />
      <View style={styles.row}>
        {e ? <Avatar pet={e.petSnapshot} demo={demo} /> : <ResidentFace r={p.resident!} />}
        <View style={{ flex: 1 }}>
          <Text style={styles.h2}>{p.author.name}</Text>
          <Text style={[styles.small, { color: colors.ink }]}>
            {when(p.at, now)} · {e ? t(e.petSnapshot.role) : p.resident!.role[lang]}
          </Text>
          {p.resident && (
            <Sticker bg={colors.paper} rotate={-2} style={{ marginTop: 6 }}>
              {t("爪爪镇居民")}
            </Sticker>
          )}
        </View>
      </View>
      <Text style={[styles.body, { fontSize: 17, lineHeight: 30, fontWeight: "500" }]}>{p.text}</Text>
      {p.photo && (
        <View
          style={{
            backgroundColor: "#FFF",
            padding: 8,
            paddingBottom: 26,
            borderWidth: 2.5,
            borderColor: colors.ink,
            transform: [{ rotate: i % 2 ? "-1.5deg" : "1.5deg" }],
          }}
        >
          <Image source={{ uri: p.photo }} style={{ width: "100%", height: 250 }} resizeMode="cover" />
        </View>
      )}
      {p.likes.length > 0 && (
        <View style={[styles.row, { gap: 8 }]}>
          <PawMark size={20} />
          <Text style={[styles.small, { color: colors.ink, flex: 1 }]}>
            {t("{list} 点了爪", { list: p.likes.map((l) => l.who.name).join(lang === "zh" ? "、" : ", ") })}
          </Text>
        </View>
      )}
      {comments.length > 0 && (
        <View style={{ gap: 8, borderTopWidth: 2, borderColor: colors.ink, paddingTop: 10 }}>
          {comments.map((c) => (
            <View key={c.id} style={{ gap: 6 }}>
              <Line c={c} onRemove={onRemove} />
              {p.comments
                .filter((r) => r.replyTo === c.id)
                .map((r) => (
                  <View key={r.id} style={{ paddingLeft: 18 }}>
                    <Line c={r} replyTo={c.author.name} onRemove={onRemove} />
                  </View>
                ))}
            </View>
          ))}
        </View>
      )}
      {e && (
        <View style={{ gap: 6 }}>
          <Text style={styles.small}>
            {e.stories.social.generator === "ai" ? t("AI 生成") : t("本机生成")}
          </Text>
          <View style={[styles.row, { flexWrap: "wrap", gap: 4 }]}>
            <Button label={confirming ? t("确定撤回？") : t("撤回")} tone="plain" onPress={onUnpost} />
            <Button
              label={t("看原日记")}
              tone="plain"
              onPress={() => router.push({ pathname: "/event", params: { id: e.id } })}
            />
          </View>
        </View>
      )}
    </View>
  );
}

function Line({ c, replyTo, onRemove }: { c: CircleComment; replyTo?: string; onRemove: (c: CircleComment) => void }) {
  return (
    <View style={[styles.row, { alignItems: "flex-start", gap: 6 }]}>
      <Text style={[styles.body, { flex: 1, fontSize: 15, lineHeight: 24 }]}>
        <Text style={{ fontWeight: "800" }}>{c.author.name}</Text>
        {replyTo ? <Text style={styles.small}>{t(" 回复 {name}", { name: replyTo })}</Text> : null}
        {t("：")}
        {c.text}
      </Text>
      {c.removable && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("删掉这条评论")}
          onPress={() => onRemove(c)}
          hitSlop={10}
          style={{ paddingTop: 4 }}
        >
          <Icon name="x" size={16} color={colors.muted} />
        </Pressable>
      )}
    </View>
  );
}
