import type { CommunitySession } from "./useCommunitySession";
import { useState } from "react";
import { Text } from "react-native";
import { Button, Field } from "../../components/ui";
import {
  socialStyles as s,
  goCommunity,
  LinkButton,
} from "../../components/CommunityMoment";
import { communityAvailable, writeCommunity } from "../../platform/community";
import { Action, Heading, Join, OfflineNotice } from "./CommunityControls";
export default function Friends({ session }: { session: CommunitySession }) {
  const { world, pet, real, reload, write, setNotice } = session;
  const [confirm, setConfirm] = useState(""),
    [code, setCode] = useState("");
  return (
    <>
      <Heading>{(pet?.name || "Pet") + "’s friends"}</Heading>
      {world.relations.map((a) => (
        <LinkButton
          key={a.source}
          label={
            a.actorName +
            (a.remark ? " spoke to " : " liked a post by ") +
            a.recipientName
          }
          onPress={() => goCommunity({ post: String(a.target) })}
        />
      ))}
      {!world.relations.length && (
        <Text style={s.meta}>Pet encounters will appear here.</Text>
      )}
      {world.mentions.map((m) => (
        <LinkButton
          key={m.id}
          label={m.name + " mentioned " + pet?.name}
          onPress={() => goCommunity({ post: String(m.id) })}
        />
      ))}
      {!!world.saved.length && (
        <>
          <Heading>Your saved pets</Heading>
          {world.saved.map((f) => (
            <LinkButton
              key={f.id}
              label={f.name}
              onPress={() => goCommunity({ profile: f.id })}
            />
          ))}
        </>
      )}
      <Heading>People you know</Heading>
      <OfflineNotice />
      {!real ? (
        <Button label="Add your pet" onPress={write} />
      ) : communityAvailable && !world.code ? (
        <Join session={session} />
      ) : (
        world.code && (
          <>
            <Text style={s.meta}>Your friend code</Text>
            <Text selectable style={s.copy}>
              {world.code}
            </Text>
            <Field
              accessibilityLabel="Friend’s code"
              placeholder="Friend’s code"
              value={code}
              onChangeText={setCode}
              autoCapitalize="characters"
              maxLength={32}
            />
            <Action
              label="Add friend"
              session={session}
              work={async () => {
                await writeCommunity("friend", { code });
                setCode("");
                await reload();
                setNotice("Friend added.");
              }}
              disabled={!code.trim()}
            />
            {world.friends.map((f) => (
              <LinkButton
                key={f.id}
                label={f.name + " · " + f.species}
                onPress={() => goCommunity({ profile: f.id })}
              />
            ))}
          </>
        )
      )}
      <LinkButton
        label="Pet social settings"
        onPress={() => goCommunity({ panel: "settings" })}
      />
      {!!world.code &&
        (confirm === "delete" ? (
          <>
            <Text style={s.meta}>
              This removes this household’s public profiles, moments,
              friendships and owner messages. Your on-device journal stays here.
            </Text>
            <Action
              label="Delete community account"
              session={session}
              work={async () => {
                await writeCommunity("delete-account", {});
                setConfirm("");
                await reload();
              }}
            />
            <LinkButton label="Cancel" onPress={() => setConfirm("")} />
          </>
        ) : (
          <LinkButton
            label="Remove community account"
            onPress={() => setConfirm("delete")}
          />
        ))}
    </>
  );
}
