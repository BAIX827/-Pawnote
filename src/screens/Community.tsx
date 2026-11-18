import { Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useStore } from "../data/store";
import { LinkButton, socialStyles as s } from "../components/CommunityMoment";
import {
  useCommunitySession,
  type Params,
} from "./community/useCommunitySession";
import ShareMoment from "./community/ShareMoment";
import OwnerChat from "./community/OwnerChat";
import MomentDetail from "./community/MomentDetail";
import PetProfile from "./community/PetProfile";
import SocialSettings from "./community/SocialSettings";
import Friends from "./community/Friends";
import PetWorld from "./community/PetWorld";
export default function Community({ friends = false }: { friends?: boolean }) {
  const { state } = useStore();
  const p = useLocalSearchParams<Params>();
  const key = [
    state.pet?.id,
    state.demo,
    friends,
    p.panel,
    p.entry,
    p.profile,
    p.post,
    p.chat,
  ].join("/");
  return <CommunityView key={key} p={p} friends={friends} />;
}
function CommunityView({ p, friends }: { p: Params; friends: boolean }) {
  const session = useCommunitySession(p);
  let body;
  if (p.entry) body = <ShareMoment session={session} entryId={p.entry} />;
  else if (p.chat) body = <OwnerChat session={session} peer={p.chat} />;
  else if (p.post) body = <MomentDetail session={session} />;
  else if (p.profile)
    body = <PetProfile session={session} profileId={p.profile} />;
  else if (p.panel === "settings") body = <SocialSettings session={session} />;
  else if (friends) body = <Friends session={session} />;
  else body = <PetWorld session={session} />;
  return (
    <View style={s.page}>
      {body}
      {!!session.notice && <Text style={s.copy}>{session.notice}</Text>}
      {!!session.error && (
        <View>
          <Text accessibilityRole="alert" style={s.copy}>
            {session.error}
          </Text>
          <LinkButton label="Refresh" onPress={() => void session.reload()} />
        </View>
      )}
    </View>
  );
}
