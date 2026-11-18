import type { CommunitySession } from "./useCommunitySession";
import { socialStyles as s } from "../../components/CommunityMoment";
import { Text, View } from "react-native";
import { Button } from "../../components/ui";
import {
  communityAvailable,
  writeCommunity,
  type Mix,
} from "../../platform/community";
import {
  Action,
  Back,
  Heading,
  Join,
  OfflineNotice,
} from "./CommunityControls";
const mixes: [Mix, string][] = [
  ["interests", "Shared interests"],
  ["variety", "Different species"],
  ["familiar", "Familiar faces"],
];

export default function SocialSettings({
  session,
}: {
  session: CommunitySession;
}) {
  const { world, pet, real, local, reload, write, busy, run } = session;
  const preference = async (active: boolean, mix: Mix) => {
    await writeCommunity("settings", { local, active, mix });
    await reload();
  };
  return (
    <>
      <Back />
      <Heading>{(pet?.name || "Pet") + "’s social settings"}</Heading>
      {!real || !pet ? (
        <Button label="Add your pet" onPress={write} />
      ) : !communityAvailable ? (
        <OfflineNotice />
      ) : !world.pet ? (
        <>
          <Text style={s.meta}>
            Share {pet.name}’s name and species to join the community.
          </Text>
          <Join session={session} />
        </>
      ) : (
        <>
          <Text style={s.copy}>
            Automatic pet interactions are {world.pet.active ? "on" : "off"}.
          </Text>
          <Action
            label={
              world.pet.active
                ? "Pause pet interactions"
                : "Let " + pet.name + " meet other pets"
            }
            session={session}
            work={() => preference(!world.pet!.active, world.pet!.mix)}
          />
          <Text style={s.meta}>Who {pet.name} meets</Text>
          <View style={s.row}>
            {mixes.map(([value, label]) => (
              <Button
                key={value}
                label={label}
                tone={world.pet?.mix === value ? "primary" : "soft"}
                disabled={busy}
                onPress={() =>
                  void run(() => preference(world.pet!.active, value))
                }
              />
            ))}
          </View>
        </>
      )}
    </>
  );
}
