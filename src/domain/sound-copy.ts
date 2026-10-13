import { Pet } from "./types";
import { t } from "../i18n/core";

export function soundCopy(pet: Pick<Pet, "species">) {
  if (pet.species === "dog") return {
    description: t("小声的汪汪、兴奋的叫声、睡梦里的哼唧。按日期和成长阶段收藏，慢慢听它长大。"),
    example: t("例如：第一次对门铃汪汪"),
    empty: t("录下今天的叫声，以后回头听听，会有很多小惊喜。"),
  };
  if (pet.species === "cat") return {
    description: t("轻轻的喵喵、舒服的呼噜、睡梦里的小动静。按日期和成长阶段收藏，慢慢听它长大。"),
    example: t("例如：窝在毯子里打呼噜"),
    empty: t("录下今天的喵声或呼噜，以后回头听听。"),
  };
  return {
    description: t("轻轻的叫声、呼吸声、活动时的小动静。按日期和成长阶段收藏，留住它的日常。"),
    example: t("例如：探索小窝时的声音"),
    empty: t("留下一段叫声、呼吸声或活动声，以后回头听听。"),
  };
}
