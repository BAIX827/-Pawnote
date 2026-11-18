import type { CommunitySession } from "./useCommunitySession";
import { useState } from "react";
import { Text, View, ScrollView } from "react-native";
import { router } from "expo-router";
import { Button } from "../../components/ui";
import {
  socialStyles as s,
  goCommunity,
  LinkButton,
  MomentCard,
  SampleWorld,
} from "../../components/CommunityMoment";
import { Heading, More, OfflineNotice } from "./CommunityControls";
export default function PetWorld({ session }: { session: CommunitySession }) {
  const { world, pet, real, write, loading } = session;
  const [selected, setSelected] = useState("");
  const pets = Array.from(
    new Map(world.posts.map((m) => [m.pet, m.name])).entries(),
  );
  const latest = world.relations[0];
  const related =
    latest &&
    (latest.actor === world.pet?.id ? latest.recipient : latest.actor);
  const featured =
    selected ||
    (related && pets.some(([key]) => key === related) ? related : "") ||
    world.posts.find((m) => !m.own)?.pet ||
    world.posts[0]?.pet;
  const post = world.posts.find((m) => m.pet === featured);
  return (
    <>
      <View style={s.spread}>
        <Heading>{real && pet ? pet.name + "’s world" : "Pet world"}</Heading>
        <Button
          label={real ? "New entry" : "Add your pet"}
          icon="edit-3"
          tone="soft"
          onPress={write}
        />
      </View>
      {post ? (
        <>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ alignItems: "center", gap: 10 }}
          >
            {pets.map(([key, name]) => (
              <Button
                key={key}
                tone={featured === key ? "primary" : "soft"}
                label={name}
                onPress={() => setSelected(key)}
              />
            ))}
          </ScrollView>
          <MomentCard post={post} />
          {latest && latest.target !== post.id && (
            <LinkButton
              label={
                latest.actorName +
                " and " +
                latest.recipientName +
                " · Pet activity"
              }
              onPress={() => goCommunity({ post: String(latest.target) })}
            />
          )}
          <LinkButton
            label={"More from " + post.name}
            onPress={() => goCommunity({ profile: post.pet })}
          />
          <More session={session} />
        </>
      ) : loading ? (
        <Text style={s.meta}>Loading pet moments…</Text>
      ) : (
        <SampleWorld />
      )}
      <OfflineNotice />
      {real && (
        <View style={s.row}>
          <LinkButton
            label="Pet social settings"
            onPress={() => goCommunity({ panel: "settings" })}
          />
          <LinkButton label="My pet" onPress={() => router.push("/today")} />
        </View>
      )}
    </>
  );
}
