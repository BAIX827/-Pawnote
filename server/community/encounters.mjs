import { blocked } from "./store.mjs";

function exchange(from, to) {
  const a = from.caption.toLowerCase(),
    b = to.caption.toLowerCase();
  if (
    /\bsit(?:ting)?\b/.test(a) &&
    /fridge/.test(b) &&
    /sandwich/.test(b) &&
    /bed|rug/.test(b)
  ) {
    const spot = /\brug\b/.test(b) ? "rug" : "bed";
    return [
      `You went back to your ${spot}? I’d give it one more sit.`,
      `For a sandwich? My ${spot} wins.`,
    ];
  }
  if (/bag|box/.test(a) && /bag|box/.test(b))
    return [
      "Would there be room for me in yours?",
      "Depends. How small can you fold yourself?",
    ];
  if (from.category !== to.category || from.category === "other")
    return [null, null];
  const subjects = {
    snack: [
      "Was there anything left for you?",
      "That’s the part I care about too.",
    ],
    walk: ["What did it smell like?", "You’d have stopped to sniff too."],
    sleep: ["Would you make room for one more?", "Quiet paws, please."],
    chaos: ["Do you think they noticed?", "Let’s keep that between us."],
    bath: ["How soon is too soon to get messy again?", "I vote now."],
  };
  const words = subjects[from.category];
  if (!words || Math.random() < 0.3) return [null, null];
  return [
    from.temper === "shy"
      ? "I was wondering… " + words[0][0].toLowerCase() + words[0].slice(1)
      : words[0],
    words[1],
  ];
}

export function meet(store, source) {
  const { owner, one, all } = store;
  if (
    !source.active ||
    one("SELECT 1 FROM encounters WHERE source=?", source.id)
  )
    return;
  const candidates = all(
    `SELECT p.id,p.pet,p.caption,p.category,t.mix,t.species,
      EXISTS(SELECT 1 FROM links WHERE owner=? AND peer=t.owner AND kind='friend') AS known,
      EXISTS(SELECT 1 FROM preferred_pets WHERE pet=? AND peer=p.pet) AS preferred,
      EXISTS(SELECT 1 FROM preferred_pets WHERE pet=p.pet AND peer=?) AS preferredByPeer
      FROM posts p JOIN pets t ON t.id=p.pet WHERE t.active=1 AND t.owner<>? AND NOT ` +
      blocked("t.owner", "?") +
      " AND NOT EXISTS(SELECT 1 FROM reports WHERE reporter=? AND post=p.id) AND NOT EXISTS(SELECT 1 FROM reports WHERE reporter=t.owner AND post=?) ORDER BY p.id DESC LIMIT 120",
    owner,
    source.petId,
    source.petId,
    owner,
    owner,
    owner,
    owner,
    source.id,
  );
  const seen = new Set(),
    explore = Math.random() < 0.18;
  const words = new Set(source.caption.toLowerCase().match(/[a-z]{4,}/g) ?? []);
  const ranked = candidates
    .filter((candidate) => {
      if (seen.has(candidate.pet)) return false;
      seen.add(candidate.pet);
      return true;
    })
    .map((c) => {
      const overlap = (
        c.caption.toLowerCase().match(/[a-z]{4,}/g) ?? []
      ).filter((w) => words.has(w)).length;
      const preference = (mix) =>
        mix === "variety" && c.species !== source.species
          ? 2
          : mix === "familiar" && c.known
            ? 3
            : 0;
      return {
        c,
        score:
          Math.random() * 2 +
          preference(source.mix) +
          preference(c.mix) +
          3 * (c.preferred + c.preferredByPeer) +
          (explore
            ? 0
            : Math.min(2, overlap) + (c.category === source.category ? 2 : 0)),
      };
    })
    .sort((a, b) => b.score - a.score);
  if (!ranked.length) return;
  const target = ranked[0].c;
  const [remark, answer] = exchange(source, target);
  all(
    "INSERT INTO encounters VALUES(?,?,?,?)",
    source.id,
    target.id,
    remark,
    answer,
  );
}
