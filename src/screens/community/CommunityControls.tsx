import { Text } from "react-native";
import { router } from "expo-router";
import { Button } from "../../components/ui";
import {
  LinkButton,
  socialStyles as s,
} from "../../components/CommunityMoment";
import { communityAvailable } from "../../platform/community";
import type { CommunitySession } from "./useCommunitySession";
export function Action({
  session,
  label,
  work,
  disabled = false,
}: {
  session: CommunitySession;
  label: string;
  work: () => Promise<void>;
  disabled?: boolean;
}) {
  return (
    <Button
      label={label}
      disabled={session.busy || disabled}
      onPress={() => void session.run(work)}
    />
  );
}
export function Heading({ children }: { children: string }) {
  return (
    <Text accessibilityRole="header" style={s.name}>
      {children}
    </Text>
  );
}
export function Back() {
  return (
    <LinkButton
      label="Back"
      onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))}
    />
  );
}
export function OfflineNotice() {
  return communityAvailable ? null : (
    <Text style={s.meta}>
      The live community is offline. You can still keep a journal.
    </Text>
  );
}
export function Join({ session }: { session: CommunitySession }) {
  return (
    <Action
      label="Create community profile"
      session={session}
      work={async () => {
        await session.setup();
        await session.reload();
      }}
    />
  );
}
export function More({ session }: { session: CommunitySession }) {
  return session.world.more ? (
    <Button
      label="Earlier moments"
      tone="plain"
      disabled={session.paging}
      onPress={() => void session.more()}
    />
  ) : null;
}
