import { useEffect, useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { type Moment, readCommunity } from "../platform/community";

export const goCommunity = (params: Record<string, string> = {}) =>
  router.push({ pathname: "/community", params });

export const socialStyles = StyleSheet.create({
  page: {
    width: "100%",
    maxWidth: 640,
    alignSelf: "center",
    gap: 16,
    paddingBottom: 16,
  },
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 10,
  },
  spread: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  card: { backgroundColor: "#FFFDFA", borderRadius: 16, overflow: "hidden" },
  inner: { padding: 17, gap: 11 },
  name: { color: "#272722", fontSize: 25, fontWeight: "700" },
  quote: { color: "#282622", fontSize: 20, lineHeight: 28 },
  copy: { color: "#34352F", fontSize: 16, lineHeight: 23 },
  meta: { color: "#555A51", fontSize: 14, lineHeight: 20 },
  reply: {
    paddingLeft: 12,
    gap: 4,
    borderLeftColor: "#BD603E",
    borderLeftWidth: 3,
  },
  picture: { width: "100%", aspectRatio: 1.65, backgroundColor: "#E7E4D9" },
  link: { color: "#813821", fontWeight: "700", fontSize: 15 },
});
const s = socialStyles;
export function LinkButton({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={{ minHeight: 44, justifyContent: "center" }}
    >
      <Text style={s.link}>{label}</Text>
    </Pressable>
  );
}
export function CommunityPhoto({ id, name }: { id: number; name: string }) {
  const [uri, setUri] = useState("");
  useEffect(() => {
    let alive = true;
    readCommunity("photo", { id: String(id) })
      .then((r) => {
        if (alive) setUri(r.photo || "");
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [id]);
  return uri ? (
    <Image
      accessibilityLabel={name + "’s diary photo"}
      source={{ uri }}
      style={s.picture}
    />
  ) : null;
}
export function MomentCard({
  post,
  expanded = false,
}: {
  post: Moment;
  expanded?: boolean;
}) {
  const activity = expanded ? post.activity : post.activity.slice(0, 1);
  return (
    <View style={s.card}>
      {!!post.hasPhoto && (
        <CommunityPhoto key={post.id} id={post.id} name={post.name} />
      )}
      <View style={s.inner}>
        <View style={s.spread}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={"View " + post.name}
            onPress={() => goCommunity({ profile: post.pet })}
          >
            <Text style={s.name}>{post.name}</Text>
          </Pressable>
          <Text style={s.meta}>{post.species}</Text>
        </View>
        <Text style={s.quote}>{post.caption}</Text>
        {!!post.mention && (
          <LinkButton
            label={"@" + post.mention.name}
            onPress={() => goCommunity({ profile: post.mention!.id })}
          />
        )}
        {activity.length > 0 && (
          <Text style={s.meta}>Pet activity · automatic</Text>
        )}
        {activity.map((a) => (
          <View key={a.source} style={s.reply}>
            <Text style={s.copy}>
              <Text style={{ fontWeight: "700" }}>{a.actorName}</Text>
              {a.remark ? "  " + a.remark : " liked this."}
            </Text>
            {expanded && a.answer && (
              <Text style={s.copy}>
                <Text style={{ fontWeight: "700" }}>{post.name}</Text>
                {"  " + a.answer}
              </Text>
            )}
            {expanded && (
              <LinkButton
                label={"What brought " + a.actorName + " here"}
                onPress={() => goCommunity({ post: String(a.source) })}
              />
            )}
          </View>
        ))}
        {!expanded && (
          <LinkButton
            label="Open moment"
            onPress={() => goCommunity({ post: String(post.id) })}
          />
        )}
      </View>
    </View>
  );
}
const samples = [
  {
    name: "Fig",
    species: "Rabbit",
    image: require("../../assets/community/fig.jpg"),
    caption:
      "I ran all the way to the fridge. She got her sandwich. I went back to bed.",
    other: "I fell asleep on Dad’s slipper. He wore the other one.",
  },
  {
    name: "Bean",
    species: "Dog",
    image: require("../../assets/community/bean.jpg"),
    caption: "I did my good sit. Twice. Mom saw both. Still no dinner.",
    other: "I took my ball to bed. There was room for me too. Just.",
  },
  {
    name: "Cleo",
    species: "Cat",
    image: require("../../assets/demo-cat.jpg"),
    caption: "He put the shopping away. I kept the paper bag.",
    other: "My bed went through the wash. His sweater did just fine.",
  },
];
export function SampleWorld() {
  const [index, select] = useState(0),
    [more, expand] = useState(false);
  const pet = samples[index];
  return (
    <View style={s.card}>
      <View style={s.inner}>
        <Text style={s.meta}>Sample pet diaries</Text>
        <View style={s.row}>
          {samples.map((p, i) => (
            <LinkButton
              key={p.name}
              label={p.name}
              onPress={() => {
                select(i);
                expand(false);
              }}
            />
          ))}
        </View>
      </View>
      <Image
        accessibilityLabel={pet.name + "’s example photo"}
        source={pet.image}
        style={s.picture}
      />
      <View style={s.inner}>
        <View style={s.spread}>
          <Text style={s.name}>{pet.name}</Text>
          <Text style={s.meta}>{pet.species}</Text>
        </View>
        <Text style={s.quote}>{pet.caption}</Text>
        {index === 0 && (
          <View style={s.reply}>
            <Text style={s.meta}>Pet activity · example</Text>
            <Text style={s.copy}>
              <Text style={{ fontWeight: "700" }}>Bean </Text>You went back to
              bed? I’d give it one more sit.
            </Text>
            <Text style={s.copy}>
              <Text style={{ fontWeight: "700" }}>Fig </Text>For a sandwich? My
              bed wins.
            </Text>
          </View>
        )}
        <LinkButton
          label={more ? "Close earlier moment" : "More from " + pet.name}
          onPress={() => expand(!more)}
        />
        {more && <Text style={s.quote}>{pet.other}</Text>}
      </View>
    </View>
  );
}
