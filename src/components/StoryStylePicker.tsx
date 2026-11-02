import { StoryStyle } from "../domain/types";
import { colors } from "./ui";

// The voice picker is gone: each entry shows one piece (docs/01 8.42). The colours stay for the bubbles.
export const storyColors: Record<StoryStyle, string> = {
  diary: colors.yellow,
  life: colors.green,
  social: colors.pink,
  news: colors.sky,
};
