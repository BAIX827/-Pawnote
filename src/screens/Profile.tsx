import React, { useState } from "react";
import { Platform, Text, View } from "react-native";
import { router } from "expo-router";
import { useStore } from "../data/store";
import { formatDate } from "../domain/types";
import { exportBackup } from "../platform/export";
import { Avatar, Button, Card, Empty, Tag, styles } from "../components/ui";
import Onboarding from "./Onboarding";
import { ageLabel, speciesLabel } from "../domain/pet-profile";
import RestoreBackup from "../components/RestoreBackup";
export default function Profile() {
  const { state, reset, notify } = useStore();
  const [confirm, setConfirm] = useState(false);
  if (!state.pet) return <Onboarding />;
  const pet = state.pet;
  return (
    <View style={styles.stack}>
      <View style={[styles.between, { flexWrap: "wrap" }]}>
        <View>
          <Text style={styles.h1}>我的毛孩档案</Text>
          <Text style={styles.muted}>保存它的人设，也保存你们的小日子。</Text>
        </View>
        <Button
          label="编辑人设"
          icon="edit-2"
          tone="soft"
          onPress={() =>
            router.push({ pathname: "/onboarding", params: { edit: "1" } })
          }
        />
      </View>
      <Card style={{ gap: 20 }}>
        <View style={styles.row}>
          <Avatar pet={pet} demo={state.demo} size={70} />
          <View style={{ flex: 1 }}>
            <Text style={styles.h2}>{pet.name}</Text>
            <Text style={styles.muted}>
              {speciesLabel(pet)} · {pet.personality} ·{" "}
              {pet.route === "work" ? "职场路线" : "校园路线"}
            </Text>
            <Text style={styles.small}>{ageLabel(pet.ageMonths)} · {pet.role}</Text>
          </View>
          <Tag>{state.demo ? "示例居民" : "毛孩市居民"}</Tag>
        </View>
      </Card>
      <View style={styles.between}>
        <Text style={styles.h2}>人生日记</Text>
        <Text style={styles.small}>{state.events.length} 条真实记录</Text>
      </View>
      {state.events.length ? (
        state.events.map((e) => (
          <Card key={e.id} style={{ padding: 20, gap: 8 }}>
            <View style={styles.between}>
              <Text style={styles.small}>
                {formatDate(e.createdAt)} ·{" "}
                {e.petSnapshot.route === "work" ? "职场" : "校园"} ·{" "}
                {e.petSnapshot.role}
              </Text>
              <Tag>{e.published ? "本机毛圈" : "私密"}</Tag>
            </View>
            <Text style={styles.body}>{e.description}</Text>
            <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
              <Button
                label="打开日记"
                icon="book-open"
                tone="plain"
                onPress={() =>
                  router.push({ pathname: "/event", params: { id: e.id } })
                }
              />
              <Button
                label="制作喵闻"
                icon="file-text"
                tone="plain"
                onPress={() =>
                  router.push({ pathname: "/news", params: { id: e.id } })
                }
              />
            </View>
          </Card>
        ))
      ) : (
        <Empty
          title="日记本还是空的"
          subtitle="从今天的一件小事开始。"
          action={
            <Button label="记录今天" onPress={() => router.push("/record")} />
          }
        />
      )}
      <Card style={{ gap: 17 }}>
        <Text style={styles.h2}>数据与隐私</Text>
        <Text style={styles.body}>
          照片、档案和日记保存在当前浏览器或设备。浏览器清理和换设备会影响数据，请定期导出备份。
        </Text>
        <Text style={styles.small}>
          导出文件包含照片与全部记录，请保存到自己的空间。恢复支持 20 MB 以内的 JSON 备份；确认后替换本机数据。
        </Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
          <Button
            label="导出全部数据"
            icon="download"
            tone="soft"
            onPress={() => {
              exportBackup(JSON.stringify(state, null, 2))
                .then(() => notify(Platform.OS === "web"
                  ? "备份已导出，请保管好这个文件。"
                  : "分享面板已关闭，请在保存位置检查备份。"))
                .catch(() => notify("导出失败，请重试。"));
            }}
          />
          <Button
            label="清空本机数据"
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
              backgroundColor: "#FFF2EC",
              borderRadius: 12,
            }}
          >
            <Text style={styles.body}>
              将清空这台设备上的宠物、照片、日记和草稿。请先导出备份。
            </Text>
            <View style={styles.row}>
              <Button
                label="确认清空全部数据"
                tone="danger"
                onPress={() => {
                  reset();
                  router.replace("/");
                  notify("本机数据已清空。");
                }}
              />
              <Button
                label="取消"
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
