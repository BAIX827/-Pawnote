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
export type Personality = "傲娇" | "憨厚" | "戏精";
export interface Pet {
  id: string;
  name: string;
  species: "cat" | "dog";
  personality: Personality;
  route: Route;
  role: string;
  avatar?: string;
}
export interface Story {
  text: string;
  title: string;
  generator: "template";
  edited: boolean;
}
export type Stories = Record<StoryStyle, Story>;
export interface LifeEvent {
  id: string;
  description: string;
  category: Category;
  photo?: string;
  createdAt: string;
  petSnapshot: Pet;
  stories: Stories;
  selectedStyle: StoryStyle;
  published: boolean;
}
export interface Draft {
  id: string;
  description: string;
  category: Category;
  photo?: string;
  stories?: Stories;
  selectedStyle: StoryStyle;
  published: boolean;
  signature?: string;
}
export interface AppState {
  schemaVersion: 1;
  pet: Pet | null;
  events: LifeEvent[];
  draft: Draft | null;
  demo: boolean;
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
  published: false,
});
export const roleFor = (route: Route) =>
  route === "work" ? "零食鉴定员" : "睡眠研究班";
export const formatDate = (date: string) =>
  new Date(date).toLocaleDateString("zh-CN", { month: "long", day: "numeric" });
