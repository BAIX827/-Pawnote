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
    };
    const result = await createGateway(env, store).handle(request.method, new URL(request.url), () => request.text());
    return new Response(result.status === 204 ? null : JSON.stringify(result.body), {
      status: result.status,
      headers: headers(env),
    });
  },
};
