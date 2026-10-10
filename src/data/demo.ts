import { AppState, Pet } from "../domain/types";
import { generateStories } from "../domain/story-engine";
export function demoState(): AppState {
  const pet: Pet = {
    id: "demo-pet",
    name: "橘总",
    species: "cat",
    personality: "傲娇",
    route: "work",
    role: "零食鉴定员",
  };
  const samples = [
    {
      category: "sleep" as const,
      description: "橘总今天在窗边睡了一整个下午，叫都叫不醒。",
      published: true,
    },
    {
      category: "snack" as const,
      description: "趁我转身的时候，它偷吃了一块小鱼干。",
      published: false,
    },
    {
      category: "walk" as const,
      description: "今天带它出门散步，它在树下停了很久。",
      published: true,
    },
  ];
  return {
    schemaVersion: 1,
    pet,
    demo: true,
    draft: null,
    events: samples.map((s, i) => ({
      ...s,
      id: `demo-${i}`,
      createdAt: new Date(Date.now() - i * 86400000).toISOString(),
      petSnapshot: { ...pet },
      stories: generateStories(pet, s.description, s.category),
      selectedStyle: "diary",
    })),
  };
}
