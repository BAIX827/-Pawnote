// Pawnote AI gateway: keeps provider keys off the device, picks a model by region,
// and counts each device's free AI generations per week. Zero dependencies, Node 22+.
import { createServer } from "node:http";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { BANNED, SPECIES_CARD, TEMPERS, TEMPER_CARD, example } from "./voice.mjs";

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
  if (!text(pet.role, 30)) return "pet.role";
  if (!TEMPERS.includes(body.temper)) return "temper";
  if (body.weird !== undefined && typeof body.weird !== "boolean") return "weird";
  if (body.locale !== undefined && !(typeof body.locale === "string" && /^[A-Za-z-]{2,20}$/.test(body.locale))) return "locale";
  if (!(pet.species in SPECIES) && !text(pet.speciesName, 20)) return "pet.species";
  return null;
}
const SPECIES_EN = { cat: "cat", dog: "dog", rabbit: "rabbit", lizard: "lizard", hamster: "hamster", guineaPig: "guinea pig", bird: "bird", turtle: "turtle", snake: "snake", fish: "fish" };
const british = (locale) => /^en-(AU|GB|NZ|IE|ZA)\b/i.test(locale ?? "");
const withOwner = (text, owner) => text.split("{owner}").join(owner);

// Each prompt carries only this pet's own temper card, species card and one example of the
// voice, so the model writes one register well instead of averaging several. See docs/13.
function promptEn({ pet, description, temper, weird, locale }) {
  const kind = SPECIES_EN[pet.species] ?? pet.speciesName;
  const work = pet.route === "work";
  const shown = example("en", temper, description);
  return [
    {
      role: "system",
      content:
        `You are writing a pet's diary. The owner wrote what happened today; retell it in the pet's own voice.\n` +
        `The pet: ${pet.name}, a ${kind}. Personality: ${pet.personality}. It calls its owner "${pet.owner}". In its pretend life it ${work ? `has a job as ${pet.role}` : "goes to school"}.\n\n` +
        `Voice: ${withOwner(TEMPER_CARD.en[temper], pet.owner)}\n` +
        `${weird ? "This one is a bit unhinged: include one deadpan absurd thought per piece." : "One absurd beat is welcome but optional."}\n` +
        `Species: ${SPECIES_CARD.en[pet.species] ?? SPECIES_CARD.en.other}\n\n` +
        `How to write:\n` +
        `1. Use only what the owner wrote. No new events, places or anything about health. The pet's opinions, excuses and misreadings are welcome.\n` +
        `2. Start from one concrete detail in the note. Vary sentence length; a two-word line is fine. Show feeling through actions, not declarations (unless the voice is clingy).\n` +
        `3. End on an action or a petty remark. No moral, no summary, no explaining the joke.\n` +
        `4. No em dashes. No lists of three. At most one pet-internet word (zoomies, loaf, blep...). Never: fren, hooman twice, heckin pupperino, i can haz, fur-ever, pawsitively, testament, tapestry, boundless, journey.\n` +
        `5. If the note mentions illness, injury or a lost pet, nothing is a joke: quiet, sincere, short.\n` +
        `6. Write in ${british(locale) ? "British" : "American"} English.\n\n` +
        `Return one JSON object with keys diary, life, social, news, each {"title": string, "text": string}.\n` +
        `- diary: inner voice, 30-90 words, two or three short paragraphs.\n` +
        `- life: a ${work ? "work log" : "page of class notes"}, numbered 2-4 items and a final "Note:" line. Concrete, short jargon.\n` +
        `- social: one post, under 25 words, no hashtags, at most one emoji.\n` +
        `- news: an Onion-style local news item, deadpan serious. Title Case headline. Quote the owner's note, cite "a source close to the food bowl" or similar, give the pet's reply in its own voice (or "declined to comment"), end with "The investigation is ongoing." or similar. 60-110 words.\n` +
        `Titles under 10 words.\n\n` +
        `An example of this voice on a different event. Feel the voice; do not reuse its sentences or structure.\n` +
        `Owner's note: ${shown.note}\nDiary:\n${withOwner(shown.diary, pet.owner)}`,
    },
    { role: "user", content: `The owner's note: ${description.trim()}` },
  ];
}
function prompt(input) {
  if (input.lang === "en") return promptEn(input);
  const { pet, description, temper, weird } = input;
  const kind = SPECIES[pet.species] ?? pet.speciesName;
  const work = pet.route === "work";
  const witness = pet.species === "cat" ? "猫士" : pet.species === "dog" ? "汪士" : "人士";
  const shown = example("zh", temper, description);
  return [
    {
      role: "system",
      content:
        `你在替一只宠物写日记。主人写了今天发生的事，你用这只宠物自己的口吻重新讲一遍。\n` +
        `宠物：${pet.name}，${kind}。性格：${pet.personality}。它叫主人“${pet.owner}”。它的虚拟身份：${work ? "上班的毛孩" : "上学的毛孩"}，${pet.role}。\n\n` +
        `【它的语气】${withOwner(TEMPER_CARD.zh[temper], pet.owner)}\n` +
        `${weird ? "它是个抽象的家伙：每篇放一处一本正经的离谱想法。" : "可以有一处无厘头的抽象，没有也行。"}\n` +
        `【物种】${SPECIES_CARD.zh[pet.species] ?? SPECIES_CARD.zh.other}\n\n` +
        `写法：\n` +
        `1. 只写主人写到的事。不编新事件、地点和健康状况；宠物的想法、借口、误会可以加。\n` +
        `2. 从主人原话里的一个具体细节写起。长短句交错，可以只有两个字。感情放在动作里，不直接抒情（黏人的除外）。\n` +
        `3. 结尾停在动作或一句嘴硬上。不总结，不升华，不讲道理。\n` +
        `4. 默认自称“我”${pet.self !== "我" ? `，“${pet.self}”全篇最多用一次` : ""}。一篇最多一个网络梗。\n` +
        `5. 不用：排比、“不是……而是……”“不仅……更是……”、仿佛、宛如、治愈、岁月静好、满满的、喵星人、汪星人、哈基米、萌萌哒。\n` +
        `6. 如果主人写到生病、受伤或走失：四段都不开玩笑，安静、真诚、短。\n` +
        `7. 用简体中文。\n\n` +
        `输出一个 JSON 对象，只输出 JSON。四个键 diary、life、social、news，每个值是 {"title": "...", "text": "..."}。\n` +
        `- diary 内心独白：50–120 字，两三段。\n` +
        `- life ${work ? "打工日记：写成工作纪要" : "校园日记：写成课堂笔记"}，1. 2. 3. 列两到四条，最后一行“备注：”，${work ? "职场" : "校园"}词两三个。\n` +
        `- social 动态：30 字以内，一两句，停在反应上，不加话题标签，最多一个表情。\n` +
        `- news 小报：第三人称，一本正经。用“本报讯”“据知情${witness}透露”，引用主人原话，再写“当事${kind}${pet.name}随后回应：……”（用它自己的语气），结尾“目前当事${kind}情绪稳定”或“事件仍在调查中”。100–180 字。\n` +
        `标题都不超过 20 个字。\n\n` +
        `下面是同一种语气写另一件事的示范，只用来感受语气，不要照抄句子和结构。\n` +
        `主人原话：${shown.note}\n内心独白：\n${withOwner(shown.diary, pet.owner)}`,
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
async function ask(p, messages, region, jsonMode) {
  const response = await fetch(`${p.url.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${p.key}` },
    body: JSON.stringify({
      model: p.model,
      messages,
      // DeepSeek recommends a higher temperature for creative writing than other providers need.
      temperature: Number(env[region === "cn" ? "CN_TEMPERATURE" : "INTL_TEMPERATURE"] ?? (region === "cn" ? 1.3 : 1)),
      max_tokens: 1400,
      ...(jsonMode ? { response_format: { type: "json_object" } } : {}),
    }),
    signal: AbortSignal.timeout(45000),
  });
  // A provider that rejects JSON mode gets the same request once more without it.
  if (response.status === 400 && jsonMode) return ask(p, messages, region, false);
  if (!response.ok) throw Object.assign(new Error(`provider answered ${response.status}`), { status: 502 });
  const data = await response.json();
  return String(data.choices?.[0]?.message?.content ?? "");
}
const flat = (stories) => STYLES.map((s) => `${stories[s].title}\n${stories[s].text}`).join("\n");
async function generate(input) {
  const lang = input.lang ?? "zh";
  if (MOCK) {
    const { pet, description } = input;
    const said = `【模拟 AI · ${input.temper}】${pet.self}听见${pet.owner}说：“${description.trim()}”`;
    return parseStories(JSON.stringify(Object.fromEntries(STYLES.map((s) => [s, { title: `【模拟 AI】${pet.name}的${s}`, text: said }]))), lang);
  }
  const region = providers[input.region].key && providers[input.region].url && providers[input.region].model ? input.region : "cn";
  const p = providers[region];
  if (!p.key) throw Object.assign(new Error("AI provider is not configured"), { status: 503 });
  const jsonMode = env[region === "cn" ? "CN_JSON_MODE" : "INTL_JSON_MODE"] !== "0";
  const messages = prompt({ ...input, lang });
  const raw = await ask(p, messages, region, jsonMode);
  const first = parseStories(raw, lang);
  const hit = flat(first).match(BANNED[lang]);
  if (!hit) return first;
  // One rewrite when the text uses a stock phrase; the caller is charged once either way.
  try {
    const again = await ask(p, [
      ...messages,
      { role: "assistant", content: raw },
      { role: "user", content: lang === "en" ? `The last version used: "${hit[0]}". Say it another way. Everything else stays the same.` : `上一版用了：“${hit[0]}”。换个说法，其他要求不变。` },
    ], region, jsonMode);
    return parseStories(again, lang);
  } catch {
    return first;
  }
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
