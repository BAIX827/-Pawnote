import type { CommunitySession } from "./useCommunitySession";
import { useState } from "react";
import { Text, View } from "react-native";
import {
  socialStyles as s,
  goCommunity,
  LinkButton,
  MomentCard,
} from "../../components/CommunityMoment";
import { writeCommunity } from "../../platform/community";
import {
  Action,
  Back,
  More,
  Heading,
  OfflineNotice,
} from "./CommunityControls";
export default function PetProfile({
  session,
  profileId,
}: {
  session: CommunitySession;
  profileId: string;
}) {
  const { world, real, pet, local, setup, reload, afterMutation } = session;
  const [confirm, setConfirm] = useState("");
  return (
    <>
      <Back />
      {world.profile && (
        <>
          <Heading>{world.profile.name}</Heading>
          <Text style={s.meta}>{world.profile.species}</Text>
          {!world.profile.own && real && (
            <View style={s.row}>
              {pet && (
                <Action
                  label={
                    world.profile.preferred
                      ? "Clear encounter preference"
                      : "More chances for " +
                        pet.name +
                        " to meet " +
                        world.profile.name
                  }
                  session={session}
                  work={async () => {
                    await setup();
                    await writeCommunity("preference", {
                      local,
                      pet: profileId,
                      prefer: !world.profile?.preferred,
                    });
                    await reload();
                  }}
                />
              )}
              <Action
                label={
                  world.profile.saved
                    ? "Remove from saved pets"
                    : "Save this pet"
                }
                session={session}
                work={async () => {
                  await setup();
                  await writeCommunity("save-profile", {
                    pet: profileId,
                    saved: !world.profile?.saved,
                  });
                  await reload();
                }}
              />
              <LinkButton
                label="Owner chat"
                onPress={() => goCommunity({ chat: profileId })}
              />
              {confirm === "block" ? (
                <Action
                  label="Confirm block"
                  session={session}
                  work={async () => {
                    await setup();
                    await writeCommunity("block", { pet: profileId });
                    afterMutation();
                  }}
                />
              ) : (
                <LinkButton
                  label="Block household"
                  onPress={() => setConfirm("block")}
                />
              )}
            </View>
          )}
          {!world.posts.length && (
            <Text style={s.meta}>No public moments yet.</Text>
          )}
          {world.posts.map((post) => (
            <MomentCard key={post.id} post={post} />
          ))}
          <More session={session} />
        </>
      )}
      <OfflineNotice />
    </>
  );
}
