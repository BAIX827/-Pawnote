import React from "react";
import { Image, Text, View } from "react-native";
import { router } from "expo-router";
import { useStore } from "../data/store";
import { formatDate } from "../domain/types";
import { Avatar, Button, Card, Empty, Tag, styles } from "../components/ui";
import Onboarding from "./Onboarding";
export default function Circle() {
  const { state } = useStore();
  if (!state.pet) return <Onboarding />;
  const events = state.events.filter((e) => e.published);
  return (
    <View
      style={{
        ...styles.stack,
        maxWidth: 800,
        width: "100%",
        alignSelf: "center",
      }}
    >
      <View>
        <Text style={styles.h1}>毛圈碎碎念</Text>
        <Text style={styles.muted}>以毛孩的口吻，把日常分享出来。</Text>
      </View>
      <Card style={{ gap: 7, backgroundColor: "#F0F3EA" }}>
        <Tag>本机动态预览</Tag>
        <Text style={styles.body}>这里展示你主动发布的本机动态。</Text>
        <Text style={styles.small}>
          好友邀请、点赞和评论将在联机版本接入真实账号后开放。
        </Text>
      </Card>
      {events.length ? (
        events.map((e) => (
          <Card key={e.id} style={{ gap: 18 }}>
            <View style={styles.row}>
              <Avatar pet={e.petSnapshot} demo={state.demo} />
              <View>
                <Text style={styles.h2}>{e.petSnapshot.name}</Text>
                <Text style={styles.small}>
                  {formatDate(e.createdAt)} · {e.petSnapshot.role} · 模板生成
                  {e.selectedStyle === "news" ? " · 虚构娱乐报道" : ""}
                </Text>
              </View>
            </View>
            <Text style={styles.body}>{e.stories[e.selectedStyle].text}</Text>
            {e.photo && (
              <Image
                source={{ uri: e.photo }}
                style={{ width: "100%", height: 270, borderRadius: 13 }}
                resizeMode="cover"
              />
            )}
            <View style={styles.between}>
              <Tag>仅当前设备可见</Tag>
              <Button
                label="查看这件小事"
                tone="plain"
                onPress={() =>
                  router.push({ pathname: "/event", params: { id: e.id } })
                }
              />
            </View>
          </Card>
        ))
      ) : (
        <Empty
          title="它的第一条动态，等你发布"
          subtitle="保存日常时选择“同步到本机毛圈预览”，就会出现在这里。"
          action={
            <Button
              label="写一条动态"
              icon="edit-3"
              onPress={() => router.push("/record")}
            />
          }
        />
      )}
    </View>
  );
}
