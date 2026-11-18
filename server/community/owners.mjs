import { field, problem } from "./store.mjs";

export function chat({ owner, linked, all }, peer) {
  const willing = linked(owner, peer, "chat"),
    open = willing && linked(peer, owner, "chat");
  return {
    willing,
    open,
    messages: open
      ? all(
          "SELECT id, sender=? AS mine,body FROM messages WHERE (sender=? AND recipient=?) OR (sender=? AND recipient=?) ORDER BY id DESC LIMIT 60",
          owner,
          owner,
          peer,
          peer,
          owner,
        ).reverse()
      : [],
  };
}

export function ownerAction(store, action, data) {
  const { owner, all, one, identity, mine, targetPet, isBlocked, link, quota } =
    store;
  if (action === "enrol") {
    const local = field(data.local, 100, "pet ID"),
      name = field(data.name, 60, "pet name"),
      species = field(data.species, 60, "species");
    const temper = field(data.temper, 24, "temper");
    if (!identity())
      all(
        "INSERT INTO households VALUES(?,?)",
        owner,
        crypto.randomUUID().replaceAll("-", "").slice(0, 16).toUpperCase(),
      );
    if (
      !mine(local) &&
      one("SELECT count(*) AS n FROM pets WHERE owner=?", owner).n >= 20
    )
      problem(400, "Your community pet list is full.");
    all(
      "INSERT INTO pets(id,owner,local,name,species,temper) VALUES(?,?,?,?,?,?) ON CONFLICT(owner,local) DO UPDATE SET name=excluded.name,species=excluded.species,temper=excluded.temper",
      crypto.randomUUID(),
      owner,
      local,
      name,
      species,
      temper,
    );
    return { id: mine(local).id };
  }
  if (action === "save-profile") {
    const other = targetPet(data.pet);
    if (typeof data.saved !== "boolean") problem(400, "Choose a saved status.");
    if (data.saved === true)
      all("INSERT OR IGNORE INTO saved_pets VALUES(?,?)", owner, other.id);
    else all("DELETE FROM saved_pets WHERE owner=? AND pet=?", owner, other.id);
    return { ok: true };
  }
  if (action === "delete-account") {
    all(
      "UPDATE posts SET mention=NULL WHERE mention IN (SELECT id FROM pets WHERE owner=?)",
      owner,
    );
    all(
      "DELETE FROM reports WHERE reporter=? OR post IN (SELECT p.id FROM posts p JOIN pets t ON p.pet=t.id WHERE t.owner=?)",
      owner,
      owner,
    );
    all("DELETE FROM saved_pets WHERE owner=?", owner);
    all("DELETE FROM pets WHERE owner=?", owner);
    all("DELETE FROM links WHERE owner=? OR peer=?", owner, owner);
    all("DELETE FROM messages WHERE sender=? OR recipient=?", owner, owner);
    all(
      "DELETE FROM daily_use WHERE bucket IN (?,?)",
      owner + ":posts",
      owner + ":messages",
    );
    all("DELETE FROM households WHERE id=?", owner);
    return { ok: true };
  }
  if (action === "friend") {
    const other = one(
      "SELECT id FROM households WHERE code=?",
      field(data.code, 32, "friend code").toUpperCase(),
    );
    if (!other || other.id === owner || isBlocked(owner, other.id))
      problem(404, "This friend code is unavailable.");
    link(owner, other.id, "friend");
    link(other.id, owner, "friend");
    return { ok: true };
  }
  if (action === "consent" || action === "message" || action === "block") {
    const peer = targetPet(data.pet).owner;
    if (action === "block") {
      all(
        "DELETE FROM links WHERE (owner=? AND peer=?) OR (owner=? AND peer=?)",
        owner,
        peer,
        peer,
        owner,
      );
      link(owner, peer, "block");
      return { ok: true };
    }
    if (action === "consent") {
      if (typeof data.open !== "boolean")
        problem(400, "Choose a chat preference.");
      if (data.open === true) link(owner, peer, "chat");
      else
        all(
          "DELETE FROM links WHERE owner=? AND peer=? AND kind='chat'",
          owner,
          peer,
        );
      return chat(store, peer);
    }
    if (!chat(store, peer).open)
      problem(403, "Both owners must be open to chatting.");
    const nonce = field(data.nonce, 100, "message ID"),
      body = field(data.text, 1200, "message");
    if (
      !one("SELECT 1 FROM messages WHERE sender=? AND nonce=?", owner, nonce)
    ) {
      quota(owner + ":messages", 150);
      all(
        "INSERT INTO messages(sender,recipient,nonce,body) VALUES(?,?,?,?)",
        owner,
        peer,
        nonce,
        body,
      );
    }
    return chat(store, peer);
  }
}
