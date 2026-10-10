// Pawnote AI gateway: keeps provider keys off the device, picks a model by region,
// and counts each device's free AI generations per week. Zero dependencies, Node 22+.
import { createServer } from "node:http";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
try {
  process.loadEnvFile(join(here, ".env"));
} catch {
  // No .env file: configuration comes from the real environment.
}
const env = process.env;
const PORT = Number(env.PORT ?? 8787);
const FREE_PER_WEEK = Number(env.FREE_AI_PER_WEEK ?? 2);
const MOCK = env.AI_MOCK === "1";
const MEMBERS = new Set((env.MEMBER_DEVICE_IDS ?? "").split(",").map((s) => s.trim()).filter(Boolean));
const providers = {
  cn: {
    url: env.CN_BASE_URL ?? "https://api.deepseek.com",
    key: env.CN_API_KEY,
    model: env.CN_MODEL ?? "deepseek-flash",
  },
  // Any OpenAI-compatible endpoint works here; nothing is assumed about which vendor.
  intl: { url: env.INTL_BASE_URL, key: env.INTL_API_KEY, model: env.INTL_MODEL },
};
const STYLES = ["diary", "life", "social", "news"];
const SPECIES = { cat: "猫", dog: "狗", rabbit: "兔子", lizard: "蜥蜴", hamster: "仓鼠", guineaPig: "豚鼠", bird: "鸟", turtle: "龟", snake: "蛇", fish: "鱼" };

// Usage is keyed by device and ISO week, so the free allowance resets every Monday (UTC).
const usageFile = join(here, "data", "usage.json");
let usage = {};
try {
  usage = JSON.parse(readFileSync(usageFile, "utf8"));
} catch {
  usage = {};
}
function week(now = new Date()) {
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const day = d.getUTCDay() || 7;
  const monday = new Date(d.getTime() - (day - 1) * 86400000);
  return { key: monday.toISOString().slice(0, 10), resetsAt: new Date(monday.getTime() + 7 * 86400000).toISOString() };
}
function quota(deviceId) {
  const w = week(), member = MEMBERS.has(deviceId);
  const used = usage[w.key]?.[deviceId] ?? 0;
  return { member, used, limit: member ? null : FREE_PER_WEEK, remaining: member ? null : Math.max(0, FREE_PER_WEEK - used), resetsAt: w.resetsAt };
}
function spend(deviceId) {
  const w = week();
  usage = { [w.key]: { ...(usage[w.key] ?? {}), [deviceId]: (usage[w.key]?.[deviceId] ?? 0) + 1 } };
  mkdirSync(dirname(usageFile), { recursive: true });
  writeFileSync(usageFile, JSON.stringify(usage));
}

const text = (v, max) => typeof v === "string" && v.trim().length > 0 && v.length <= max;
function parseRequest(body) {
  const { deviceId, region, pet, description } = body ?? {};
  if (!text(deviceId, 100) || !/^[\w-]+$/.test(deviceId)) return "deviceId";
  if (region !== "cn" && region !== "intl") return "region";
  if (body.lang !== undefined && body.lang !== "zh" && body.lang !== "en") return "lang";
  if (!text(description, 500)) return "description";
  if (!pet || !text(pet.name, 20) || !text(pet.personality, 60) || !text(pet.owner, 10) || !text(pet.self, 10)) return "pet";
  if (pet.route !== "work" && pet.route !== "campus") return "pet.route";
  if (!(pet.species in SPECIES) && !text(pet.speciesName, 20)) return "pet.species";
  return null;
}
const SPECIES_EN = { cat: "cat", dog: "dog", rabbit: "rabbit", lizard: "lizard", hamster: "hamster", guineaPig: "guinea pig", bird: "bird", turtle: "turtle", snake: "snake", fish: "fish" };
// English is briefed in English and in its own registers; see docs/13 for the voice guide.
function promptEn({ pet, description }) {
  const kind = SPECIES_EN[pet.species] ?? pet.speciesName;
  const work = pet.route === "work";
  return [
    {
      role: "system",
      content:
        `Retell a pet owner's note in the pet's own first-person voice.\n` +
        `The pet: ${pet.name}, a ${kind}. Personality: ${pet.personality}. It calls its owner "${pet.owner}". In its pretend life it ${work ? "has a job" : "goes to school"}.\n` +
        `Voice: the personality leads. An aloof or sassy pet is deadpan and never admits it cares; an affectionate one is earnest, lowercase, short sentences; a lively one is breathless. Cats lean wry aristocrat, dogs lean sincere.\n` +
        `Rules:\n` +
        `1. Use only what the owner wrote. Do not invent events, places or anything about health. The pet's opinions, excuses and feelings are welcome.\n` +
        `2. Sound like a person wrote it: plain words, uneven sentences, one small specific detail, real feeling under the joke. No moral at the end, no lists of three, no explaining the joke.\n` +
        `3. Write in English.\n` +
        `4. Output one JSON object and nothing else, with keys diary, life, social, news, each {"title": string, "text": string}.\n` +
        `   diary: inner voice, 40-90 words.\n` +
        `   life: ${work ? "a work log entry" : "a page of class notes"}, 40-90 words.\n` +
        `   social: one short post, under 25 words, no hashtags.\n` +
        `   news: a mock-serious third-person local news item quoting the owner's note and the pet's reply, 60-110 words.\n` +
        `   Titles are under 10 words.`,
    },
    { role: "user", content: `The owner's note: ${description.trim()}` },
  ];
}
function prompt(input) {
  if (input.lang === "en") return promptEn(input);
  const { pet, description } = input;
  const kind = SPECIES[pet.species] ?? pet.speciesName;
  const life = pet.route === "work" ? "职场（它是一名上班的毛孩，身份：" + pet.role + "）" : "校园（它是一名上学的毛孩，身份：" + pet.role + "）";
  return [
    {
      role: "system",
      content:
        `你要把主人写的一段宠物日常，改写成这只宠物自己的第一人称讲述。\n` +
        `宠物：${pet.name}，${kind}，性格：${pet.personality}。它自称“${pet.self}”或“我”，称呼主人为“${pet.owner}”。它的虚拟人生路线：${life}。\n` +
        `要求：\n` +
        `1. 只根据主人写的事实来写，不要编造新的事件、健康状况或地点；可以加入宠物的想法、借口和小情绪。\n` +
        `2. 性格决定口吻：傲娇、高冷的嘴硬不承认在意；黏人的直接说喜欢；活泼的一惊一乍；稳重的冷面陈述。可以有一处无厘头的抽象幽默。\n` +
        `3. 像真人随手写的：口语、短句、长短不齐，写一个具体的小细节和当下的感受。结尾不总结、不升华、不讲道理；不用排比和“不是……而是……”；不堆砌感叹号和语气词。用简体中文。\n` +
        `4. 输出一个 JSON 对象，只输出 JSON，不要代码块。四个键 diary、life、social、news，每个值是 {"title": 标题, "text": 正文}。\n` +
        `   diary：内心独白，80–160 字。\n` +
        `   life：${pet.route === "work" ? "打工日记，像一份工作纪要" : "校园日记，像一页课堂笔记"}，80–160 字。\n` +
        `   social：一条朋友圈动态，40 字以内，不要话题标签。\n` +
        `   news：一则第三人称的娱乐小报道，引用主人原话并写出宠物的回应，120–200 字。\n` +
        `   标题都不超过 24 个字。`,
    },
    { role: "user", content: `主人写的原话：${description.trim()}` },
  ];
}
function parseStories(raw, lang = "zh") {
  const start = raw.indexOf("{"), end = raw.lastIndexOf("}");
  if (start < 0 || end <= start) throw new Error("model returned no JSON");
  const data = JSON.parse(raw.slice(start, end + 1));
  const stories = {};
  for (const style of STYLES) {
    const s = data[style];
    if (!s || !text(s.title, 160) || !text(s.text, 1900)) throw new Error(`model returned a bad ${style} story`);
    stories[style] = { title: s.title.trim(), text: s.text.trim(), generator: "ai", edited: false };
  }
  // The news voice is fiction about a real pet; the label travels with the text.
  stories.news.text += lang === "en" ? "\n\nThis is fictional entertainment based on the owner's note." : "\n\n以上为基于主人记录的虚构娱乐报道。";
  return stories;
}
async function generate(input) {
  if (MOCK) {
    const { pet, description } = input;
    const said = `【模拟 AI】${pet.self}听见${pet.owner}说：“${description.trim()}”`;
    return parseStories(JSON.stringify(Object.fromEntries(STYLES.map((s) => [s, { title: `【模拟 AI】${pet.name}的${s}`, text: said }]))));
  }
  const p = providers[input.region].key && providers[input.region].url && providers[input.region].model
    ? providers[input.region]
    : providers.cn;
  if (!p.key) throw Object.assign(new Error("AI provider is not configured"), { status: 503 });
  const response = await fetch(`${p.url.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${p.key}` },
    body: JSON.stringify({ model: p.model, messages: prompt(input), temperature: 0.9, max_tokens: 1200 }),
    signal: AbortSignal.timeout(45000),
  });
  if (!response.ok) throw Object.assign(new Error(`provider answered ${response.status}`), { status: 502 });
  const data = await response.json();
  return parseStories(String(data.choices?.[0]?.message?.content ?? ""), input.lang);
}

function send(res, status, body) {
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "access-control-allow-origin": env.ALLOW_ORIGIN ?? "*",
    "access-control-allow-headers": "content-type",
    "access-control-allow-methods": "GET,POST,OPTIONS",
  });
  res.end(JSON.stringify(body));
}
async function readJSON(req) {
  let size = 0;
  const chunks = [];
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 16384) throw Object.assign(new Error("body too large"), { status: 413 });
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}
const busy = new Set();
createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", "http://localhost");
  try {
    if (req.method === "OPTIONS") return send(res, 204, {});
    if (req.method === "GET" && url.pathname === "/v1/quota") {
      const deviceId = url.searchParams.get("deviceId") ?? "";
      if (!/^[\w-]{1,100}$/.test(deviceId)) return send(res, 400, { error: "bad_request", field: "deviceId" });
      return send(res, 200, { quota: quota(deviceId) });
    }
    if (req.method === "POST" && url.pathname === "/v1/pet-voice") {
      let body;
      try {
        body = await readJSON(req);
      } catch (e) {
        return send(res, e.status ?? 400, { error: "bad_request" });
      }
      const field = parseRequest(body);
      if (field) return send(res, 400, { error: "bad_request", field });
      const before = quota(body.deviceId);
      if (!before.member && before.remaining <= 0) return send(res, 429, { error: "quota_exhausted", quota: before });
      // One request at a time per device, so a double tap cannot spend the allowance twice.
      if (busy.has(body.deviceId)) return send(res, 409, { error: "busy" });
      busy.add(body.deviceId);
      try {
        const stories = await generate(body);
        spend(body.deviceId);
        return send(res, 200, { stories, quota: quota(body.deviceId) });
      } finally {
        busy.delete(body.deviceId);
      }
    }
    return send(res, 404, { error: "not_found" });
  } catch (e) {
    console.error(e);
    return send(res, e.status ?? 500, { error: e.status === 503 ? "not_configured" : "generation_failed" });
  }
}).listen(PORT, () => console.log(`Pawnote AI gateway on :${PORT}${MOCK ? " (mock replies)" : ""}`));
