// Pawnote AI gateway on Cloudflare Workers. Settings come from wrangler.jsonc `vars` and
// `wrangler secret`; usage counts live in the Workers KV namespace bound as USAGE.
import { createGateway, headers } from "./core.mjs";

const TWO_WEEKS = 14 * 24 * 60 * 60;

export default {
  async fetch(request, env) {
    const key = (weekKey, deviceId) => `u:${weekKey}:${deviceId}`;
    const store = {
      get: async (weekKey, deviceId) => Number((await env.USAGE.get(key(weekKey, deviceId))) ?? 0),
      // KV is eventually consistent, so two requests within a moment may count as one.
      // The weekly allowance is a soft limit at this stage; see docs/03 ADR-006.
      add: async (weekKey, deviceId) => {
        const k = key(weekKey, deviceId);
        const used = Number((await env.USAGE.get(k)) ?? 0);
        await env.USAGE.put(k, String(used + 1), { expirationTtl: TWO_WEEKS });
      },
      // The daily per-address cap (docs/01 8.27); same soft-limit caveat as above.
      ipGet: async (day, ip) => Number((await env.USAGE.get(`ip:${day}:${ip}`)) ?? 0),
      ipAdd: async (day, ip) => {
        const k = `ip:${day}:${ip}`;
        await env.USAGE.put(k, String(Number((await env.USAGE.get(k)) ?? 0) + 1), { expirationTtl: 2 * 24 * 60 * 60 });
      },
      // Cloud backups (docs/03 ADR-007) share the USAGE namespace: the body under "b:", its summary under "bm:".
      backupPut: async (account, body, info) => {
        await env.USAGE.put(`b:${account}`, body);
        await env.USAGE.put(`bm:${account}`, JSON.stringify(info));
      },
      backupGet: (account) => env.USAGE.get(`b:${account}`, { type: "stream" }),
      backupMeta: (account) => env.USAGE.get(`bm:${account}`, { type: "json" }),
      backupDelete: async (account) => {
        await env.USAGE.delete(`b:${account}`);
        await env.USAGE.delete(`bm:${account}`);
      },
    };
    const origin = request.headers.get("origin") ?? undefined;
    const result = await createGateway(env, store).handle(request.method, new URL(request.url), () => request.text(), {
      origin,
      ip: request.headers.get("cf-connecting-ip") ?? undefined,
      authorization: request.headers.get("authorization") ?? undefined,
      contentLength: request.headers.get("content-length") ?? undefined,
      backupPet: request.headers.get("x-backup-pet") ?? undefined,
      backupEvents: request.headers.get("x-backup-events") ?? undefined,
      readBody: () => request.arrayBuffer(),
    });
    const out = headers(env, origin);
    if (result.raw) return new Response(result.raw, { status: result.status, headers: out });
    return new Response(result.status === 204 ? null : JSON.stringify(result.body), { status: result.status, headers: out });
  },
};
