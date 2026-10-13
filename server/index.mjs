// Pawnote AI gateway on Node 22+ with zero dependencies: for local development and any plain
// server. Usage counts live in a JSON file next to this script.
import { createServer } from "node:http";
import { Buffer } from "node:buffer";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createGateway, headers } from "./core.mjs";

const here = dirname(fileURLToPath(import.meta.url));
try {
  process.loadEnvFile(join(here, ".env"));
} catch {
  // No .env file: configuration comes from the real environment.
}
const env = process.env;
const PORT = Number(env.PORT ?? 8787);

const usageFile = join(here, "data", "usage.json");
let usage = {};
try {
  usage = JSON.parse(readFileSync(usageFile, "utf8"));
} catch {
  usage = {};
}
const store = {
  get: async (weekKey, deviceId) => usage[weekKey]?.[deviceId] ?? 0,
  // Only the current week is kept, so the file never grows past one week of devices.
  add: async (weekKey, deviceId) => {
    usage = { [weekKey]: { ...(usage[weekKey] ?? {}), [deviceId]: (usage[weekKey]?.[deviceId] ?? 0) + 1 } };
    mkdirSync(dirname(usageFile), { recursive: true });
    writeFileSync(usageFile, JSON.stringify(usage));
  },
};
const gateway = createGateway(env, store);

createServer(async (req, res) => {
  const result = await gateway.handle(req.method, new URL(req.url ?? "/", "http://localhost"), async () => {
    const chunks = [];
    let size = 0;
    for await (const chunk of req) {
      size += chunk.length;
      if (size > 65536) break;
      chunks.push(chunk);
    }
    return Buffer.concat(chunks).toString("utf8");
  });
  res.writeHead(result.status, headers(env));
  res.end(JSON.stringify(result.body));
}).listen(PORT, () => console.log(`Pawnote AI gateway on :${PORT}${gateway.mock ? " (mock replies)" : ""}`));
