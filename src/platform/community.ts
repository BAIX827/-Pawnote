import AsyncStorage from "@react-native-async-storage/async-storage";
import { newCode } from "./cloud";
import { temperOf } from "../domain/temper";
import { speciesLabel } from "../domain/pet-profile";
import type { Pet } from "../domain/types";

const endpoint = (
  process.env.EXPO_PUBLIC_COMMUNITY_URL ||
  process.env.EXPO_PUBLIC_API_URL ||
  ""
).replace(/\/$/, "");
export const communityAvailable = !!endpoint;
const identityKey = "pawnote.community.identity.v1";
let pending: Promise<string> | undefined;
async function loadIdentity() {
  const stored = await AsyncStorage.getItem(identityKey);
  if (stored) return stored;
  const fresh = newCode();
  await AsyncStorage.setItem(identityKey, fresh);
  return fresh;
}
function identity() {
  // Web tabs may start at the same time on a new device.
  const locks = typeof navigator !== "undefined" ? navigator.locks : undefined;
  pending ??= (
    locks ? locks.request(identityKey, loadIdentity) : loadIdentity()
  ).catch((error) => {
    pending = undefined;
    throw error;
  });
  return pending;
}
export type Mix = "interests" | "variety" | "familiar";
export interface PublicPet {
  id: string;
  name: string;
  species: string;
}
export interface Moment {
  id: number;
  pet: string;
  name: string;
  species: string;
  caption: string;
  category: string;
  hasPhoto: number;
  created: number;
  own: boolean;
  mention: Pick<PublicPet, "id" | "name"> | null;
  activity: {
    source: number;
    actor: string;
    actorName: string;
    remark: string | null;
    answer: string | null;
  }[];
}
export interface World {
  pet: { id: string; active: boolean; mix: Mix } | null;
  profile:
    (PublicPet & { own: number; saved: number; preferred: number }) | null;
  saved: PublicPet[];
  code: string | null;
  friends: PublicPet[];
  posts: Moment[];
  more: boolean;
  relations: {
    source: number;
    target: number;
    actor: string;
    recipient: string;
    actorName: string;
    recipientName: string;
    remark: string | null;
  }[];
  mentions: { id: number; name: string }[];
}
export interface Conversation {
  willing: boolean;
  open: boolean;
  messages: { id: number; mine: number; body: string }[];
}
export interface MomentDetailData extends Moment {
  met: Moment | null;
}
type Payload = Record<string, string | number | boolean | null>;
async function request<T>(
  action: string,
  query: Record<string, string>,
  data?: Payload,
): Promise<T> {
  if (!endpoint)
    throw new Error("The community is offline. Your journal is available.");
  const token = await identity();
  const url =
    endpoint +
    "/v1/community/" +
    action +
    "?" +
    new URLSearchParams(query).toString();
  const response = await fetch(url, {
    method: data ? "POST" : "GET",
    headers: {
      authorization: "Bearer " + token,
      ...(data && { "content-type": "application/json" }),
    },
    ...(data && { body: JSON.stringify(data) }),
  });
  const body = await response.json().catch(() => null);
  if (!response.ok || !body)
    throw new Error(
      typeof body?.error === "string" && !/^[a-z_]+$/.test(body.error)
        ? body.error
        : "The live community is unavailable. Please try again later.",
    );
  return body as T;
}
type Reads = {
  world: [{ local: string; profile?: string; before?: string }, World];
  photo: [{ id: string }, { photo: string | null }];
  post: [{ id: string }, MomentDetailData];
  chat: [{ pet: string }, Conversation];
};
type Done = { ok: true };
type Writes = {
  enrol: [
    { local: string; name: string; species: string; temper: string },
    { id: string },
  ];
  publish: [
    {
      local: string;
      entry: string;
      caption: string;
      category: string;
      enable: boolean;
      photo: string | null;
      mention: string | null;
    },
    { id: number },
  ];
  settings: [{ local: string; active: boolean; mix: Mix }, Done];
  preference: [{ local: string; pet: string; prefer: boolean }, Done];
  "save-profile": [{ pet: string; saved: boolean }, Done];
  friend: [{ code: string }, Done];
  consent: [{ pet: string; open: boolean }, Conversation];
  message: [{ pet: string; text: string; nonce: string }, Conversation];
  block: [{ pet: string }, Done];
  withdraw: [{ id: number }, Done];
  report: [{ id: number; reason: string }, Done];
  "delete-account": [Record<string, never>, Done];
};
export const readCommunity = <K extends keyof Reads>(
  action: K,
  query: Reads[K][0],
) => request<Reads[K][1]>(action, query);
export const writeCommunity = <K extends keyof Writes>(
  action: K,
  data: Writes[K][0],
) => request<Writes[K][1]>(action, {}, data);
export const enrolPet = (pet: Pet) =>
  writeCommunity("enrol", {
    local: pet.id,
    name: pet.name,
    species: speciesLabel(pet),
    temper: temperOf(pet),
  });
