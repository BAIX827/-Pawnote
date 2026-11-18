import type { CommunitySession } from "./useCommunitySession";
import { socialStyles as s } from "../../components/CommunityMoment";
import { useState } from "react";
import { Image, Text, View } from "react-native";
import { Button, Field } from "../../components/ui";
import { useStore } from "../../data/store";
import { isSensitive } from "../../domain/temper";
import type { LifeEvent } from "../../domain/types";
import { communityAvailable, writeCommunity } from "../../platform/community";
import { Action, Back, Heading, OfflineNotice } from "./CommunityControls";
function initialCaption(entry?: LifeEvent) {
  if (!entry) return "";
  const text = (entry.stories[entry.selectedStyle] ?? entry.stories.diary).text;
  // Keep a copied private note out of the initial public caption, especially in older backups.
  return text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter((line) => line && !line.includes(entry.description.trim()))
    .join("\n")
    .slice(0, 1500);
}

export default function ShareMoment({
  session,
  entryId,
}: {
  session: CommunitySession;
  entryId: string;
}) {
  const { state } = useStore();
  const { real, world, pet, loading, local, setup, afterMutation } = session;
  const event = state.events.find(
    (e) => e.id === entryId && e.petSnapshot.id === pet?.id,
  );
  const [caption, setCaption] = useState(() => initialCaption(event)),
    [includePhoto, setPhoto] = useState(false),
    [enable, setEnable] = useState(false),
    [mention, setMention] = useState("");
  return (
    <>
      <Back />
      <Heading>Share a moment</Heading>
      {!real || !pet || !event ? (
        <Text style={s.copy}>This diary entry isn’t available.</Text>
      ) : isSensitive(event.description) ? (
        <Text style={s.copy}>This entry stays in your journal.</Text>
      ) : (
        <>
          <Text style={s.meta}>Public post · {pet.name}</Text>
          <Field
            accessibilityLabel="Public caption"
            multiline
            maxLength={1500}
            value={caption}
            onChangeText={setCaption}
          />
          {event.photo && (
            <>
              <Button
                tone="soft"
                label={includePhoto ? "Remove photo" : "Include diary photo"}
                onPress={() => setPhoto(!includePhoto)}
              />
              {includePhoto && (
                <Image source={{ uri: event.photo }} style={s.picture} />
              )}
            </>
          )}
          {!!world.friends.length && (
            <>
              <Text style={s.meta}>Mention a friend’s pet</Text>
              <View style={s.row}>
                {world.friends.map((f) => (
                  <Button
                    key={f.id}
                    tone={mention === f.id ? "primary" : "plain"}
                    label={"@" + f.name + " · " + f.species}
                    onPress={() => setMention(mention === f.id ? "" : f.id)}
                  />
                ))}
              </View>
            </>
          )}
          {!world.pet?.active && (
            <Button
              tone="soft"
              label={
                (enable ? "✓ " : "") +
                "Let " +
                pet.name +
                " meet and interact with pets automatically"
              }
              onPress={() => setEnable(!enable)}
            />
          )}
          <Text style={s.meta}>
            Your pet’s name, species and this post will be public. Your original
            note stays in your journal.
          </Text>
          <Action
            label="Publish moment"
            session={session}
            work={async () => {
              await setup();
              const result = await writeCommunity("publish", {
                local,
                entry: event.id,
                caption,
                category: event.category,
                enable,
                photo: includePhoto ? (event.photo ?? null) : null,
                mention: mention || null,
              });
              afterMutation(result.id);
            }}
            disabled={!communityAvailable || loading || !caption.trim()}
          />
          <OfflineNotice />
        </>
      )}
    </>
  );
}
