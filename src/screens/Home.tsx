import React from "react";
import {
  Image,
  Pressable,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { router } from "expo-router";
import { useStore } from "../data/store";
import { progress, titleFor } from "../domain/life";
import { formatDate } from "../domain/types";
import { speciesEmoji } from "../domain/pet-profile";
import {
  Avatar,
  Button,
  Card,
  Empty,
  Icon,
  Tag,
  colors,
  demoPhoto,
  styles,
} from "../components/ui";
import Onboarding from "./Onboarding";
export default function Home() {
  const { state } = useStore();
  const { width } = useWindowDimensions();
  const wide = width >= 1100;
  if (!state.pet) return <Onboarding />;
  const pet = state.pet,
    p = progress(state.events),
    latest = state.events[0];
  return (
    <View style={styles.stack}>
      <View
        style={[styles.between, { alignItems: "flex-end", flexWrap: "wrap" }]}
      >
        <View>
          <Text style={styles.small}>
            {new Date().toLocaleDateString("zh-CN", {
              month: "long",
              day: "numeric",
              weekday: "long",
            })}{" "}
            · 又是值得记住的一天
          </Text>
          <Text style={[styles.h1, { marginTop: 6 }]}>
            今天，{pet.name}营业了吗？
          </Text>
          <Text style={styles.muted}>把它的小日常，写成大故事。</Text>
        </View>
        <Button
          label="记录今天"
          icon="plus"
          onPress={() => router.push("/record")}
        />
      </View>
      <View style={{ flexDirection: wide ? "row" : "column", gap: 22 }}>
        <View style={{ flex: wide ? 1.7 : undefined, gap: 22 }}>
          <View
            style={{
              borderRadius: 24,
              overflow: "hidden",
              backgroundColor: colors.pale,
              flexDirection: "row",
              minHeight: 245,
            }}
          >
            <View
              style={{
                flex: 1,
                padding: width < 500 ? 22 : 30,
                gap: 12,
                justifyContent: "center",
              }}
            >
              <Tag style={{ backgroundColor: "#FFF8EF", color: "#9B643F" }}>
                {pet.route === "work"
                  ? "毛孩集团 · 今日在岗"
                  : "宠物联合学院 · 在校生"}
              </Tag>
              <Text style={[styles.h1, { fontSize: width < 500 ? 28 : 35 }]}>
                {pet.name}
                <Text style={{ fontSize: 20 }}> 的第二人生</Text>
              </Text>
              <Text style={[styles.body, { color: "#876D53" }]}>
                {pet.role} · {pet.personality}
                {"\n"}
                {titleFor(p.level, pet.route)}，持续成长中。
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="查看人生档案"
                onPress={() => router.push("/life")}
              >
                <Text
                  style={{
                    color: colors.ink,
                    fontWeight: "600",
                    fontSize: 14,
                    marginTop: 8,
                  }}
                >
                  查看人生档案 →
                </Text>
              </Pressable>
            </View>
            <View
              style={{
                width: width < 500 ? 95 : "37%",
                backgroundColor: "#EBD9BE",
              }}
            >
              {pet.avatar || state.demo ? (
                <Image
                  source={pet.avatar ? { uri: pet.avatar } : demoPhoto}
                  style={{ width: "100%", height: "100%" }}
                  resizeMode="cover"
                />
              ) : (
                <View
                  style={{
                    flex: 1,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text style={{ fontSize: width < 500 ? 53 : 100 }}>
                    {speciesEmoji(pet)}
                  </Text>
                </View>
              )}
              <View
                style={{
                  position: "absolute",
                  bottom: 15,
                  right: 12,
                  backgroundColor: "#FFFFFFEE",
                  borderRadius: 9,
                  padding: 10,
                }}
              >
                <Text
                  style={{ fontSize: 12, color: colors.ink, fontWeight: "700" }}
                >
                  Lv.{p.level} ·{" "}
                  {pet.route === "work" ? "认真摸鱼" : "努力成长"}
                </Text>
              </View>
            </View>
          </View>
          <Card style={{ padding: 22, gap: 16 }}>
            <View style={styles.between}>
              <Text style={styles.h2}>小事，也有大戏</Text>
              <Text style={styles.small}>一个日常 · 多种口吻</Text>
            </View>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
              {[
                {
                  icon: "moon" as const,
                  title: "如果它会说话",
                  sub: "宠物的内心独白",
                },
                {
                  icon: "briefcase" as const,
                  title: pet.route === "work" ? "打工日记" : "校园日记",
                  sub: "第二人生的营业报告",
                },
                {
                  icon: "message-circle" as const,
                  title: "毛圈碎碎念",
                  sub: "用它的口吻发动态",
                },
              ].map((x) => (
                <Pressable
                  key={x.title}
                  accessibilityRole="button"
                  onPress={() => router.push("/record")}
                  style={{
                    flexGrow: 1,
                    flexBasis: 130,
                    padding: 15,
                    borderRadius: 14,
                    backgroundColor: "#F8F8F4",
                    gap: 8,
                  }}
                >
                  <Icon name={x.icon} color={colors.orange} />
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "600",
                      color: colors.ink,
                    }}
                  >
                    {x.title}
                  </Text>
                  <Text style={styles.small}>{x.sub}</Text>
                </Pressable>
              ))}
            </View>
          </Card>
          <View style={styles.between}>
            <Text style={styles.h2}>最近的小日子</Text>
            <Button
              label="全部记录"
              tone="plain"
              onPress={() => router.push("/profile")}
            />
          </View>
          {state.events.length ? (
            state.events.slice(0, 3).map((e) => (
              <Pressable
                key={e.id}
                accessibilityRole="button"
                accessibilityLabel={`查看记录：${e.description}`}
                onPress={() =>
                  router.push({ pathname: "/event", params: { id: e.id } })
                }
              >
                <Card style={{ gap: 12, padding: 21 }}>
                  <View style={styles.between}>
                    <View style={styles.row}>
                      <Avatar pet={e.petSnapshot} demo={state.demo} size={37} />
                      <View>
                        <Text
                          style={{
                            fontSize: 14,
                            color: colors.ink,
                            fontWeight: "600",
                          }}
                        >
                          {e.petSnapshot.name}
                        </Text>
                        <Text style={styles.small}>
                          {formatDate(e.createdAt)} · {e.petSnapshot.role}
                        </Text>
                      </View>
                    </View>
                    <Icon
                      name="arrow-up-right"
                      size={17}
                      color={colors.muted}
                    />
                  </View>
                  <Text style={styles.body} numberOfLines={3}>
                    {e.stories[e.selectedStyle].text}
                  </Text>
                  <View style={styles.row}>
                    <Tag>{e.published ? "已同步本机毛圈" : "私密日记"}</Tag>
                    <Text style={styles.small}>
                      模板生成
                      {e.stories[e.selectedStyle].edited ? " · 主人编辑" : ""}
                    </Text>
                  </View>
                </Card>
              </Pressable>
            ))
          ) : (
            <Empty
              title="第一篇故事，等你开场"
              subtitle="记录一件它今天做的小事，领取第一份成长经验。"
              action={
                <Button
                  label="写第一篇故事"
                  icon="edit-3"
                  onPress={() => router.push("/record")}
                />
              }
            />
          )}
        </View>
        <View style={{ flex: wide ? 1 : undefined, gap: 22 }}>
          <Card style={{ gap: 18 }}>
            <View style={styles.between}>
              <Text style={styles.h2}>成长进行时</Text>
              <Icon name="trending-up" color="#719467" />
            </View>
            <View
              style={{ flexDirection: "row", alignItems: "baseline", gap: 8 }}
            >
              <Text
                style={{ fontSize: 42, fontWeight: "700", color: colors.ink }}
              >
                Lv.{p.level}
              </Text>
              <Text style={styles.muted}>{titleFor(p.level, pet.route)}</Text>
            </View>
            <View
              style={{
                height: 7,
                borderRadius: 9,
                backgroundColor: "#ECEEE7",
                overflow: "hidden",
              }}
            >
              <View
                style={{
                  width: `${p.current}%`,
                  height: "100%",
                  backgroundColor: "#8EA57C",
                  borderRadius: 9,
                }}
              />
            </View>
            <View style={styles.between}>
              <Text style={styles.small}>{p.current} / 100 XP</Text>
              <Text style={styles.small}>下一等级还差 {p.toNext} XP</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.between}>
              <Text style={styles.muted}>累计记录</Text>
              <Text style={[styles.h2, { fontSize: 18 }]}>
                {state.events.length} 件小事
              </Text>
            </View>
            <Text style={styles.small}>
              每次保存新日常 +20 XP。照自己的节奏，慢慢长大。
            </Text>
          </Card>
          <Card
            style={{
              backgroundColor: "#F4F0E6",
              gap: 15,
              borderColor: "#E6E0D2",
            }}
          >
            <View style={styles.between}>
              <Text
                style={{ fontSize: 26, fontWeight: "800", color: colors.ink }}
              >
                今日喵闻
              </Text>
              <Icon name="file-text" />
            </View>
            <View style={{ height: 2, backgroundColor: colors.ink }} />
            <Text style={styles.small}>THE DAILY PAW · 个人生活特刊</Text>
            <Text style={[styles.h2, { fontSize: 23, lineHeight: 33 }]}>
              {latest
                ? latest.stories.news.title
                : "毛孩世界的头条，\n等你来写。"}
            </Text>
            <Text style={styles.muted}>
              {latest
                ? "把一件真实小事，印成一份可收藏的趣味报道。"
                : "保存第一条日常后，就能拥有它的第一期个人喵闻。"}
            </Text>
            <Button
              label={latest ? "翻开这期喵闻" : "写下第一条日常"}
              icon="arrow-right"
              tone="soft"
              onPress={() =>
                latest
                  ? router.push({
                      pathname: "/news",
                      params: { id: latest.id },
                    })
                  : router.push("/record")
              }
            />
            <Text style={styles.small}>模板生成 · 虚构娱乐报道</Text>
          </Card>
          <View style={{ padding: 8, gap: 8 }}>
            <Text style={[styles.small, { letterSpacing: 2 }]}>
              LITTLE PAWS, BIG STORIES.
            </Text>
            <Text style={styles.small}>
              照片和故事保存在当前设备。{"\n"}
              在档案中导出一份备份，留住这些小日子。
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}
