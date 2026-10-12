import { locale } from "../i18n/core";
import type { Temper } from "./temper";
export const CATEGORIES = [
  "sleep",
  "snack",
  "bath",
  "chaos",
  "walk",
  "other",
] as const;
export type Category = (typeof CATEGORIES)[number];
export const STYLES = ["diary", "life", "social", "news"] as const;
export type StoryStyle = (typeof STYLES)[number];
export type Route = "work" | "campus";
export const SPECIES = ["cat", "dog", "rabbit", "lizard", "hamster", "guineaPig", "bird", "turtle", "snake", "fish", "other"] as const;
export type Species = (typeof SPECIES)[number];
export const PERSONALITIES = ["傲娇", "憨厚", "戏精", "亲人", "独立", "活泼", "慢热", "好奇", "稳重", "敏感", "随和", "有主见", "温柔"] as const;
export type Personality = string;
export type PersonalitySource = "tag" | "custom" | "questionnaire";
export type RouteSource = "age" | "manual";
export interface Pet {
  id: string;
  name: string;
  species: Species;
  speciesName?: string;
  ageMonths?: number;
  ageRecordedAt?: string;
  personalitySource?: PersonalitySource;
  questionnaire?: { version: 1; answers: number[] };
  routeSource?: RouteSource;
  personality: Personality;
  route: Route;
  role: string;
  /** What the pet calls its owner in stories, chosen by the owner. */
  ownerTitle?: string;
  /** The day the pet came home, as YYYY-MM-DD. */
  homeDate?: string;
  /** Actual birth date; optional for pets whose birthday is unknown. */
  birthDate?: string;
  avatar?: string;
}
export interface Story {
  text: string;
  title: string;
  generator: "template" | "ai";
  edited: boolean;
}
export type Stories = Record<StoryStyle, Story>;
export interface LifeEvent {
  id: string;
  description: string;
  category: Category;
  photo?: string;
  createdAt: string;
  /** Calendar date of the experience, independent of its save time. */
  occurredOn?: string;
  savedAt?: string;
  editedAt?: string;
  petSnapshot: Pet;
  stories: Stories;
  selectedStyle: StoryStyle;
  published: boolean;
}
export interface Draft {
  id: string;
  occurredOn?: string;
  description: string;
  category: Category;
  photo?: string;
  stories?: Stories;
  selectedStyle: StoryStyle;
  published: boolean;
  signature?: string;
}
/** A 爪约: something the pet wants to do with its owner at a set time (docs/01 8.16). */
export interface Routine {
  id: string;
  /** A preset activity key from domain/paw-dates, or "custom" with the owner's own label. */
  activity: string;
  label?: string;
  /** HH:MM, local time. */
  time: string;
  /** Weekdays, 0 = Sunday. */
  days: number[];
  enabled: boolean;
  createdAt: string;
  lastDone?: string;
  snoozedUntil?: string;
}
export interface CircleSettings {
  hiddenNpcs?: string[];
  removed?: string[];
}
export interface AppState {
  schemaVersion: 1;
  pet: Pet | null;
  events: LifeEvent[];
  draft: Draft | null;
  demo: boolean;
  /** Optional so backups made before 爪约 still load. */
  routines?: Routine[];
  /** The latest 爪格 result (docs/01 8.17). */
  pawsona?: { version: 1; temper: Temper; scores: Record<Temper, number>; takenAt: string };
  /** The Monday (YYYY-MM-DD) of the newest weekly 爪信 the owner has opened (docs/01 8.18). */
  mailRead?: string;
  /** The Monday 爪信 notification; absent means on. */
  mailReminder?: boolean;
  /** 爪友圈 choices (docs/01 8.20): residents sent back to town, and the pet's comments the owner deleted. */
  circle?: CircleSettings;
  /** Audio is embedded so JSON backups keep the actual sound across devices. */
  sounds?: SoundMemory[];
}
export const SOUND_STAGES = ["baby", "young", "adult", "senior", "unknown"] as const;
export type SoundStage = (typeof SOUND_STAGES)[number];
export interface SoundMemory {
  id: string;
  petId: string;
  title: string;
  note: string;
  recordedOn: string;
  createdAt: string;
  ageMonths?: number;
  stage: SoundStage;
  source: "recording" | "video";
  duration: number;
  audio: string;
}
export const CATEGORY_LABELS: Record<Category, string> = {
  sleep: "睡觉",
  snack: "偷吃",
  bath: "洗澡",
  chaos: "拆家",
  walk: "散步",
  other: "其他",
};
export const id = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
export const emptyState = (): AppState => ({
  schemaVersion: 1,
  pet: null,
  events: [],
  draft: null,
  demo: false,
});
export const newDraft = (): Draft => ({
  id: id(),
  description: "",
  category: "other",
  selectedStyle: "diary",
  published: true,
});
export const roleFor = (route: Route) =>
  route === "work" ? "零食鉴定员" : "睡眠研究班";
export const formatDate = (date: string) =>
  new Date(date).toLocaleDateString(locale(), { year: "numeric", month: "long", day: "numeric" });
