import { blocked, problem } from "./store.mjs";

const postCols =
  "p.id,p.pet,p.caption,p.category,(p.photo IS NOT NULL) AS hasPhoto,p.created,t.name,t.species";
const postJoin = " FROM posts p JOIN pets t ON t.id=p.pet ";

function findVisiblePost({ one, owner }, id) {
  return one(
    "SELECT " +
      postCols +
      ",t.owner " +
      postJoin +
      "WHERE p.id=? AND NOT " +
      blocked("t.owner", "?") +
      " AND NOT EXISTS(SELECT 1 FROM reports WHERE reporter=? AND post=p.id)",
    id,
    owner,
    owner,
    owner,
  );
}
export function visiblePost(store, id) {
  const post = findVisiblePost(store, id);
  if (!post) problem(404, "This moment is unavailable.");
  return post;
}
function publicPost({ one, all, owner }, row, sourceId) {
  const mentions = one(
    "SELECT t.id,t.name FROM posts p JOIN pets t ON t.id=p.mention WHERE p.id=? AND NOT " +
      blocked("t.owner", "?"),
    row.id,
    owner,
    owner,
  );
  const activity = all(
    "SELECT e.source,e.target,t.id AS actor,t.name AS actorName,e.remark,e.answer FROM encounters e JOIN posts s ON s.id=e.source JOIN pets t ON t.id=s.pet WHERE e.target=? AND NOT " +
      blocked("t.owner", "?") +
      " AND NOT EXISTS(SELECT 1 FROM reports WHERE reporter=? AND post=s.id)" +
      (sourceId ? " AND e.source=?" : "") +
      " ORDER BY e.source DESC LIMIT 12",
    row.id,
    owner,
    owner,
    owner,
    ...(sourceId ? [sourceId] : []),
  );
  const { owner: internalOwner, ...rest } = row;
  return {
    ...rest,
    own: internalOwner === owner,
    mention: mentions ?? null,
    activity,
  };
}

export function readFeed(store, action, q) {
  const { mine, all, owner, one, identity, friendPets } = store;
  if (action === "world") {
    const pet = mine(q.get("local")),
      profile = q.get("profile"),
      before = Number(q.get("before")) || Number.MAX_SAFE_INTEGER;
    const where =
      " WHERE p.id<? AND NOT " +
      blocked("t.owner", "?") +
      " AND NOT EXISTS(SELECT 1 FROM reports WHERE reporter=? AND post=p.id)";
    const rows = all(
      "SELECT " +
        postCols +
        ",t.owner " +
        postJoin +
        where +
        (profile ? " AND t.id=?" : "") +
        " ORDER BY p.id DESC LIMIT 13",
      before,
      owner,
      owner,
      owner,
      ...(profile ? [profile] : []),
    );
    const relations = pet
      ? all(
          "SELECT e.source,e.target,a.pet AS actor,b.pet AS recipient,ta.name AS actorName,tb.name AS recipientName,e.remark FROM encounters e JOIN posts a ON a.id=e.source JOIN posts b ON b.id=e.target JOIN pets ta ON ta.id=a.pet JOIN pets tb ON tb.id=b.pet WHERE (a.pet=? OR b.pet=?) AND NOT " +
            blocked("ta.owner", "?") +
            " AND NOT " +
            blocked("tb.owner", "?") +
            " AND NOT EXISTS(SELECT 1 FROM reports WHERE reporter=? AND post IN (a.id,b.id)) ORDER BY e.source DESC LIMIT 40",
          pet.id,
          pet.id,
          owner,
          owner,
          owner,
          owner,
          owner,
        )
      : [];
    const mentions = pet
      ? all(
          "SELECT p.id,t.name FROM posts p JOIN pets t ON t.id=p.pet WHERE p.mention=? AND NOT " +
            blocked("t.owner", "?") +
            " AND NOT EXISTS(SELECT 1 FROM reports WHERE reporter=? AND post=p.id) ORDER BY p.id DESC LIMIT 20",
          pet.id,
          owner,
          owner,
          owner,
        )
      : [];
    const selected = profile
      ? one(
          "SELECT t.id,t.name,t.species,t.owner=? AS own,EXISTS(SELECT 1 FROM saved_pets s WHERE s.owner=? AND s.pet=t.id) AS saved, EXISTS(SELECT 1 FROM preferred_pets WHERE pet=? AND peer=t.id) AS preferred FROM pets t WHERE t.id=? AND NOT " +
            blocked("t.owner", "?"),
          owner,
          owner,
          pet?.id ?? "",
          profile,
          owner,
          owner,
        )
      : null;
    const saved = all(
      "SELECT t.id,t.name,t.species FROM pets t JOIN saved_pets s ON s.pet=t.id WHERE s.owner=? AND NOT " +
        blocked("t.owner", "?") +
        " ORDER BY t.name",
      owner,
      owner,
      owner,
    );
    if (profile && !selected) problem(404, "This pet is unavailable.");
    return {
      pet: pet ? { id: pet.id, active: !!pet.active, mix: pet.mix } : null,
      profile: selected ?? null,
      code: identity()?.code ?? null,
      friends: friendPets(),
      saved,
      posts: rows.slice(0, 12).map((row) => publicPost(store, row)),
      more: rows.length > 12,
      relations,
      mentions,
    };
  }
  if (action === "post" || action === "photo") {
    const post = visiblePost(store, q.get("id"));
    if (action === "photo")
      return one("SELECT photo FROM posts WHERE id=?", post.id);
    const encounter = one(
      "SELECT target FROM encounters WHERE source=?",
      post.id,
    );
    const target = encounter && findVisiblePost(store, encounter.target);
    return {
      ...publicPost(store, post),
      met: target ? publicPost(store, target, post.id) : null,
    };
  }
}
