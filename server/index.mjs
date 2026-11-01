// Pawnote AI gateway on Node 22+ with zero dependencies: for local development and any plain
// server. Usage counts live in a JSON file next to this script.
import { createServer } from "node:http";
import { Buffer } from "node:buffer";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { MAX_BACKUP, createGateway, headers } from "./core.mjs";

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
// Per-address counts only need today's numbers, so they stay in memory.
let ipDay = "", ipCounts = new Map();
store.ipGet = async (day, ip) => (day === ipDay ? ipCounts.get(ip) ?? 0 : 0);
store.ipAdd = async (day, ip) => {
  if (day !== ipDay) { ipDay = day; ipCounts = new Map(); }
  ipCounts.set(ip, (ipCounts.get(ip) ?? 0) + 1);
};
// Cloud backups (docs/03 ADR-007): one file per account under data/backups/.
const backups = join(here, "data", "backups");
const file = (account, ext) => join(backups, `${account}.${ext}`);
store.backupPut = async (account, body, info) => {
  mkdirSync(backups, { recursive: true });
  writeFileSync(file(account, "json"), body);
  writeFileSync(file(account, "meta"), JSON.stringify(info));
};
const readOr = (path, fallback) => { try { return readFileSync(path, "utf8"); } catch { return fallback; } };
store.backupGet = async (account) => readOr(file(account, "json"), null);
store.backupMeta = async (account) => { const m = readOr(file(account, "meta"), null); return m && JSON.parse(m); };
store.backupDelete = async (account) => { rmSync(file(account, "json"), { force: true }); rmSync(file(account, "meta"), { force: true }); };
const gateway = createGateway(env, store);

async function read(req, limit) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > limit) break;
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString("utf8");
}

createServer(async (req, res) => {
  const result = await gateway.handle(req.method, new URL(req.url ?? "/", "http://localhost"), () => read(req, 65536), {
    origin: req.headers.origin,
    ip: req.socket.remoteAddress,
    authorization: req.headers.authorization,
    contentLength: req.headers["content-length"],
    backupPet: req.headers["x-backup-pet"],
    backupEvents: req.headers["x-backup-events"],
    readBody: () => read(req, MAX_BACKUP),
  });
  res.writeHead(result.status, headers(env, req.headers.origin));
  res.end(result.raw ?? JSON.stringify(result.body));
}).listen(PORT, () => console.log(`Pawnote AI gateway on :${PORT}${gateway.mock ? " (mock replies)" : ""}`));
