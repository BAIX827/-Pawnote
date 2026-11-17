import { relayLink, type MomentRelay } from "../domain/moment-relay";

export const shareableRelayUrl = (relay: MomentRelay) => relayLink(window.location.href, relay);

export async function sendRelayLink(url: string): Promise<boolean> {
  try {
    await window.navigator.clipboard.writeText(url);
    return true;
  } catch {
    return false;
  }
}
