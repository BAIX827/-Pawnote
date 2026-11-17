import { Share } from "react-native";
import { relayLink, type MomentRelay } from "../domain/moment-relay";

const publicWebUrl = process.env.EXPO_PUBLIC_PAWNOTE_WEB_URL || "https://baix827.github.io/-Pawnote/";

export const shareableRelayUrl = (relay: MomentRelay) => relayLink(publicWebUrl, relay);

export async function sendRelayLink(url: string): Promise<boolean | undefined> {
  await Share.share({ message: url, title: "Paw Note relay" });
  return undefined;
}
