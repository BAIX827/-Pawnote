import React, { useState } from "react";
import { Image, Platform, Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import { useStore } from "../data/store";
import { formatDate } from "../domain/types";
import { exportBackup } from "../platform/export";
import {
  Button,
  Card,
  Empty,
  Heading,
  Icon,
  Portrait,
  Tag,
  colors,
  styles,
} from "../components/ui";
import Onboarding from "./Onboarding";
import { ageLabel, speciesLabel } from "../domain/pet-profile";
import RestoreBackup from "../components/RestoreBackup";
export default function Profile() {
  const { state, reset, notify } = useStore();
  const [confirm, setConfirm] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  if (!state.pet) return <Onboarding />;
  const pet = state.pet;
  return (
    <View style={styles.stack}>
      <Heading
        title="我的手账"
        eyebrow="THE PET JOURNAL / 居民档案"
        action={
          <Button
            label="编辑档案"
            icon="edit-2"
            tone="soft"
            onPress={() =>
              router.push({ pathname: "/onboarding", params: { edit: "1" } })
            }
          />
        }
      />
      <View
        style={{
          backgroundColor: "#EAE4F8",
          padding: 24,
          borderRadius: 20,
          gap: 20,
        }}
      >
        <View style={[styles.row, { gap: 22, alignItems: "center" }]}>
          <Portrait pet={pet} demo={state.demo} size={90} />
          <View style={{ flex: 1, gap: 6 }}>
            <Tag
              style={{ backgroundColor: "#FFFFFF99", color: colors.lavender }}
            >
              {state.demo ? "示例居民" : "毛孩市居民"}
            </Tag>
            <Text style={[styles.h1, { fontSize: 30 }]}>{pet.name}</Text>
            <Text style={styles.body}>
              {speciesLabel(pet)} · {ageLabel(pet.ageMonths)}
            </Text>
            <Text style={styles.small}>{pet.personality}</Text>
          </View>
        </View>
        <View
          style={{
            borderTopWidth: 1,
            borderColor: "#C9BEDF",
            paddingTop: 16,
            flexDirection: "row",
            gap: 12,
          }}
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.h2}>{state.events.length}</Text>
            <Text style={styles.small}>篇日记</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.h2}>
              {state.events.filter((e) => e.published).length}
            </Text>
            <Text style={styles.small}>条本机动态</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.h2, { fontSize: 17 }]}>
              {pet.route === "work" ? "职场" : "校园"}
            </Text>
            <Text style={styles.small}>{pet.role}</Text>
          </View>
        </View>
      </View>
      <View style={styles.between}>
        <Text style={styles.h2}>人生日记</Text>
        <Text style={styles.small}>{state.events.length} 条真实记录</Text>
      </View>
      {state.events.length ? (
        state.events.map((e) => (
          <View key={e.id} style={{ flexDirection: "row", gap: 14 }}>
            <View style={{ alignItems: "center", width: 12 }}>
              <View
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 5,
                  backgroundColor: colors.lavender,
                  marginTop: 24,
                }}
              />
              <View
                style={{ flex: 1, width: 1, backgroundColor: colors.line }}
              />
            </View>
            <View
              style={{
                flex: 1,
                backgroundColor: colors.paper,
                padding: 18,
                gap: 12,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: colors.line,
              }}
            >
              <View style={[styles.between, { flexWrap: "wrap" }]}>
                <Text style={styles.small}>{formatDate(e.createdAt)}</Text>
                <Tag>{e.published ? "本机毛圈" : "私密"}</Tag>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`打开日记：${e.description}`}
                onPress={() =>
                  router.push({ pathname: "/event", params: { id: e.id } })
                }
              >
                <View style={[styles.row, { alignItems: "flex-start" }]}>
                  <View style={{ flex: 1, gap: 6 }}>
                    <Text style={styles.h2} numberOfLines={2}>
                      {e.stories[e.selectedStyle].title}
                    </Text>
                    <Text style={styles.body} numberOfLines={3}>
                      {e.description}
                    </Text>
                  </View>
                  {e.photo && (
                    <Image
                      source={{ uri: e.photo }}
                      style={{
                        width: 70,
                        height: 80,
                        transform: [{ rotate: "-3deg" }],
                      }}
                    />
                  )}
                </View>
              </Pressable>
              <View
                style={[
                  styles.row,
                  { flexWrap: "wrap", justifyContent: "space-between" },
                ]}
              >
                <Text style={styles.small}>
                  {e.petSnapshot.name} ·{" "}
                  {e.petSnapshot.route === "work" ? "职场" : "校园"}
                </Text>
                <Button
                  label="制作喵闻 ↗"
                  tone="plain"
                  onPress={() =>
                    router.push({ pathname: "/news", params: { id: e.id } })
                  }
                />
              </View>
            </View>
          </View>
        ))
      ) : (
        <Empty
          title="日记本还是空的"

          action={
            <Button label="记录今天" onPress={() => router.push("/record")} />
          }
        />
      )}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="数据与备份"
        accessibilityState={{ expanded: toolsOpen }}
        onPress={() => setToolsOpen(!toolsOpen)}
        style={[
          styles.between,
          { paddingVertical: 16, borderTopWidth: 1, borderColor: colors.line },
        ]}
      >
        <View style={styles.row}>
          <Icon name="hard-drive" color={colors.muted} />
          <Text style={styles.body}>数据与备份</Text>
        </View>
        <Icon
          name={toolsOpen ? "chevron-up" : "chevron-down"}
          color={colors.muted}
        />
      </Pressable>
      {toolsOpen && (
        <Card style={{ gap: 17 }}>
          <Text style={styles.body}>
            数据保存在当前设备。清理浏览器或换设备前，请导出备份。
          </Text>
          <Text style={styles.small}>
            备份含照片与全部记录。恢复上限 20 MB，确认后替换本机数据。
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
            <Button
              label="导出全部数据"
              icon="download"
              tone="soft"
              onPress={() => {
                exportBackup(JSON.stringify(state, null, 2))
                  .then(() =>
                    notify(
                      Platform.OS === "web"
                        ? "备份已导出，请保管好这个文件。"
                        : "分享面板已关闭，请在保存位置检查备份。",
                    ),
                  )
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
      )}
    </View>
  );
}
