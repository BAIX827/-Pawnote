import { accountId, originAllowed } from "./core.mjs";
import { communityStore, problem } from "./community/store.mjs";
import { readFeed } from "./community/feed.mjs";
import { ownerAction, chat } from "./community/owners.mjs";
import { momentAction } from "./community/publishing.mjs";
export { communitySchema } from "./community/store.mjs";

// Both gateway adapters run one request in one synchronous SQLite transaction.
export function communityAction(db, owner, method, action, query, data) {
  const store = communityStore(db, owner);
  if (method === "GET") {
    if (action === "chat")
      return chat(store, store.targetPet(query.get("pet")).owner);
    if (["world", "post", "photo"].includes(action))
      return readFeed(store, action, query);
  }
  if (method === "POST") {
    if (action !== "enrol" && !store.identity())
      problem(403, "Set up your community profile first.");
    switch (action) {
      case "enrol":
      case "save-profile":
      case "delete-account":
      case "friend":
      case "consent":
      case "message":
      case "block":
        return ownerAction(store, action, data);
      case "report":
      case "withdraw":
      case "settings":
      case "preference":
      case "publish":
        return momentAction(store, action, data);
    }
  }
  problem(404, "Unknown community action.");
}

export async function handleCommunity(
  method,
  url,
  authorization,
  origin,
  env,
  read,
  transaction,
) {
  try {
    if (!originAllowed(env, origin)) problem(403, "Origin unavailable.");
    if (method === "OPTIONS") return { status: 204, body: null };
    const owner = await accountId(authorization);
    if (!owner) problem(401, "Community identity unavailable.");
    let data = {};
    if (method === "POST") {
      const raw = await read();
      if (raw.length > 955000) problem(413, "The photo is too large.");
      try {
        data = JSON.parse(raw);
      } catch {
        problem(400, "Invalid request.");
      }
      if (!data || typeof data !== "object" || Array.isArray(data))
        problem(400, "Invalid request.");
    }
    return {
      status: 200,
      body: transaction((db) =>
        communityAction(
          db,
          owner,
          method,
          url.pathname.split("/").pop(),
          url.searchParams,
          data,
        ),
      ),
    };
  } catch (err) {
    if (!err.status) console.error("Community storage error", err.message);
    return {
      status: err.status || 500,
      body: {
        error: err.status ? err.message : "Community temporarily unavailable.",
      },
    };
  }
}
