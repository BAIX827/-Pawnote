import AsyncStorage from "@react-native-async-storage/async-storage";
import { ownerName, selfName } from "../domain/story-engine";
import { Pet, STYLES, Stories, id } from "../domain/types";
import { getLang, t } from "../i18n/core";
import { flavorsOf, isWeird, temperOf } from "../domain/temper";

// Both come from the build: one bundle for mainland China, one for everywhere else.
const API = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, "");
const REGION = process.env.EXPO_PUBLIC_REGION === "intl" ? "intl" : "cn";
const DEVICE_KEY = "pawlife.deviceId";

export const aiAvailable = !!API;
// The gateway picks British or American spelling from this.
function deviceLocale() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().locale;
  } catch {
    return "en-US";
  }
}
export interface Quota {
  member: boolean;
  used: number;
  limit: number | null;
  remaining: number | null;
  resetsAt: string;
}
export class AIError extends Error {
  constructor(
    message: string,
    readonly quota?: Quota,
  ) {
    super(message);
  }
}

async function deviceId() {
  const saved = await AsyncStorage.getItem(DEVICE_KEY);
  if (saved) return saved;
  const fresh = id();
  await AsyncStorage.setItem(DEVICE_KEY, fresh);
  return fresh;
}
const isQuota = (v: unknown): v is Quota =>
  !!v && typeof v === "object" && typeof (v as Quota).used === "number" &&
  typeof (v as Quota).member === "boolean";
// The gateway is another machine; its stories get the same limits the local store enforces.
function isStories(v: unknown): v is Stories {
  return (
    !!v && typeof v === "object" &&
    STYLES.every((style) => {
      const s = (v as Record<string, { title?: unknown; text?: unknown }>)[style];
      return (
        !!s && typeof s.title === "string" && typeof s.text === "string" &&
        s.title.length <= 160 && s.text.trim().length > 0 && s.text.length <= 2000
      );
    })
  );
}

export async function fetchQuota(): Promise<Quota | undefined> {
  if (!API) return undefined;
  try {
    const response = await fetch(
      `${API}/v1/quota?deviceId=${encodeURIComponent(await deviceId())}`,
    );
    const body: unknown = await response.json();
    const quota = (body as { quota?: unknown }).quota;
    return response.ok && isQuota(quota) ? quota : undefined;
  } catch {
    return undefined;
  }
}

/** Asks the gateway for all four voices at once; one call spends one AI use. */
export async function generateWithAI(
  pet: Pet,
  description: string,
): Promise<{ stories: Stories; quota?: Quota }> {
  if (!API) throw new AIError(t("AI 服务还没有接通，先用本机版本。"));
  let response: Response, body: { stories?: unknown; quota?: unknown; error?: string };
  try {
    response = await fetch(`${API}/v1/pet-voice`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        deviceId: await deviceId(),
        region: REGION,
        lang: getLang(),
        temper: temperOf(pet),
        flavors: flavorsOf(pet),
        weird: isWeird(pet),
        locale: deviceLocale(),
        description: description.trim(),
        pet: {
          name: pet.name,
          species: pet.species,
          speciesName: pet.speciesName,
          personality: pet.personality,
          route: pet.route,
          role: pet.role,
          owner: ownerName(pet),
          self: selfName(pet),
        },
      }),
    });
    body = await response.json();
  } catch {
    throw new AIError(t("连不上 AI 服务，已保留本机版本。"));
  }
  const quota = isQuota(body.quota) ? body.quota : undefined;
  if (response.status === 429 && body.error === "ip_limited")
    throw new AIError(t("今天 AI 用得有点多，明天再试。本机版本不限次数。"), quota);
  if (response.status === 429)
    throw new AIError(t("本周的免费 AI 次数用完了，本机版本不限次数。"), quota);
  if (response.status === 409) throw new AIError(t("上一次 AI 生成还没结束，稍等一下。"));
  if (!response.ok || !isStories(body.stories))
    throw new AIError(t("AI 这次没写好，没有扣次数，已保留本机版本。"), quota);
  const stories = {} as Stories;
  for (const style of STYLES)
    stories[style] = {
      title: body.stories[style].title,
      text: body.stories[style].text,
      generator: "ai",
      edited: false,
    };
  return { stories, quota };
}
