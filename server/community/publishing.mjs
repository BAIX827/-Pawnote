import { field, problem } from "./store.mjs";
import { meet } from "./encounters.mjs";
import { visiblePost } from "./feed.mjs";

export function momentAction(store, action, data) {
  const { owner, all, one, mine, linked, targetPet, quota } = store;
  if (
    (action === "withdraw" || action === "report") &&
    (!Number.isSafeInteger(data.id) || data.id < 1)
  )
    problem(400, "Choose a public moment.");
  if (action === "report") {
    const post = visiblePost(store, data.id);
    if (post.owner === owner) problem(400, "Choose another pet’s moment.");
    all(
      "INSERT OR IGNORE INTO reports VALUES(?,?,?,?)",
      owner,
      post.id,
      field(data.reason, 300, "reason"),
      Date.now(),
    );
    return { ok: true };
  }
  if (action === "withdraw") {
    const post = one(
      "SELECT t.owner FROM posts p JOIN pets t ON t.id=p.pet WHERE p.id=?",
      data.id,
    );
    if (post && post.owner !== owner)
      problem(403, "This moment belongs to another household.");
    all("DELETE FROM reports WHERE post=?", data.id);
    all("DELETE FROM posts WHERE id=?", data.id);
    return { ok: true };
  }
  const pet = mine(field(data.local, 100, "pet ID"));
  if (!pet) problem(404, "Set up this pet first.");
  if (action === "preference") {
    const peer = targetPet(data.pet);
    if (typeof data.prefer !== "boolean") problem(400, "Choose a preference.");
    if (data.prefer)
      all("INSERT OR IGNORE INTO preferred_pets VALUES(?,?)", pet.id, peer.id);
    else
      all("DELETE FROM preferred_pets WHERE pet=? AND peer=?", pet.id, peer.id);
    return { ok: true };
  }
  if (action === "settings") {
    if (
      typeof data.active !== "boolean" ||
      !["interests", "variety", "familiar"].includes(data.mix)
    )
      problem(400, "Check the social settings.");
    all(
      "UPDATE pets SET active=?,mix=? WHERE id=?",
      +data.active,
      data.mix,
      pet.id,
    );
    if (data.active && !pet.active) {
      const latest = one(
        "SELECT id,caption,category FROM posts WHERE pet=? ORDER BY id DESC LIMIT 1",
        pet.id,
      );
      if (latest)
        meet(store, {
          ...pet,
          ...latest,
          petId: pet.id,
          active: 1,
          mix: data.mix,
        });
    }
    return { ok: true };
  }
  if (action === "publish") {
    const entry = field(data.entry, 100, "entry"),
      prior = one(
        "SELECT id FROM posts WHERE pet=? AND entry=?",
        pet.id,
        entry,
      );
    if (prior) return prior;
    const caption = field(data.caption, 1500, "caption");
    if (
      !["snack", "walk", "bath", "sleep", "chaos", "other"].includes(
        data.category,
      )
    )
      problem(400, "Choose a category.");
    const photo = data.photo ?? null,
      mention = data.mention ?? null;
    if (
      photo !== null &&
      (typeof photo !== "string" ||
        photo.length > 940000 ||
        !/^data:image\/jpeg;base64,\/9j\/[A-Za-z0-9+/]+=*$/.test(photo))
    )
      problem(400, "Choose a JPEG from the diary.");
    if (mention && !linked(owner, targetPet(mention).owner, "friend"))
      problem(403, "Choose a pet belonging to a known friend.");
    quota(owner + ":posts", 30);
    if (data.enable === true && !pet.active) {
      all("UPDATE pets SET active=1 WHERE id=?", pet.id);
      pet.active = 1;
    }
    all(
      "INSERT INTO posts(pet,entry,caption,category,photo,mention,created) VALUES(?,?,?,?,?,?,?)",
      pet.id,
      entry,
      caption,
      data.category,
      photo,
      mention,
      Date.now(),
    );
    const post = one(
      "SELECT id FROM posts WHERE pet=? AND entry=?",
      pet.id,
      entry,
    );
    meet(store, {
      ...pet,
      ...post,
      petId: pet.id,
      caption,
      category: data.category,
    });
    return post;
  }
}
