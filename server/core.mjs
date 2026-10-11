// Pawnote AI gateway, the part that is the same wherever it runs: it keeps provider keys off
// the device, picks a model by region, and counts each device's free AI generations per week.
// A host (Node in index.mjs, Cloudflare Workers in worker.mjs) supplies `env` and a usage store.
import { BANNED, SPECIES_CARD, TEMPERS, TEMPER_CARD, example } from "./voice.mjs";

const STYLES = ["diary", "life", "social", "news"];
const SPECIES = { cat: "猫", dog: "狗", rabbit: "兔子", lizard: "蜥蜴", hamster: "仓鼠", guineaPig: "豚鼠", bird: "鸟", turtle: "龟", snake: "蛇", fish: "鱼" };

// Usage is keyed by device and ISO week, so the free allowance resets every Monday (UTC).
export function week(now = new Date()) {
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const day = d.getUTCDay() || 7;
  const monday = new Date(d.getTime() - (day - 1) * 86400000);
  return { key: monday.toISOString().slice(0, 10), resetsAt: new Date(monday.getTime() + 7 * 86400000).toISOString() };
}

/**
 * @param env plain object of settings (see .env.example)
 * @param store { get(weekKey, deviceId): Promise<number>, add(weekKey, deviceId): Promise<void> }
 */
export function createGateway(env, store) {
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
  async function quota(deviceId) {
    const w = week(), member = MEMBERS.has(deviceId);
    const used = await store.get(w.key, deviceId);
    return { member, used, limit: member ? null : FREE_PER_WEEK, remaining: member ? null : Math.max(0, FREE_PER_WEEK - used), resetsAt: w.resetsAt };
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
          `You are writing for a pet with a little social life of its own: private thoughts, a school/work diary, a post to friends and a neighbourhood news item. The owner's note provides the actual event.\n` +
          `The pet: ${pet.name}, a ${kind}. Personality: ${pet.personality}. It calls its owner "${pet.owner}". In its pretend life it ${work ? `has a job as ${pet.role}` : "goes to school"}.\n\n` +
          `Voice: ${withOwner(TEMPER_CARD.en[temper], pet.owner)}\n` +
          `${weird ? "This one is a bit unhinged: include one deadpan absurd thought per piece." : "One absurd beat is welcome but optional."}\n` +
          `Species: ${SPECIES_CARD.en[pet.species] ?? SPECIES_CARD.en.other}\n\n` +
          `How to write:\n` +
          `1. Use only what the owner wrote. No new events, places or anything about health. The pet's opinions, excuses and misreadings are welcome.\n` +
          `2. Let one detail in the note carry a feeling: what the pet notices, hopes for, misunderstands or is reluctant to admit. Sensory detail must come from the note; inner interpretations and wishes can be imagined. Vary sentence length.\n` +
          `3. End on an action or a petty remark. No moral, no summary, no explaining the joke.\n` +
          `4. No em dashes. No lists of three. At most one pet-internet word (zoomies, loaf, blep...). Never: fren, hooman twice, heckin pupperino, i can haz, fur-ever, pawsitively, testament, tapestry, boundless, journey.\n` +
          `5. If the note mentions illness, injury or a lost pet, nothing is a joke: quiet, sincere, short.\n` +
          `6. Write in ${british(locale) ? "British" : "American"} English.\n` +
          `7. Let the social world appear through a question to friends, a private opinion or a playful use of the pet's school/job role. Named friends, encounters, replies, likes and shared history require evidence in the owner's note. Use at most one social gesture per piece.\n` +
          `8. Use the pet's name or species. Town name: Pawtown. Remove archive announcements and explanations of the fictional setting.\n` +
          `9. Check each sentence before returning it. An unrecorded action, sensory observation or response by the owner must be removed or phrased wholly as a future wish or hypothetical. "I guess" does not justify saying something already happened. If the note only says they went out, do not claim they sniffed anything, were called back, returned on command, lingered or met anyone. All four pieces use the same factual boundary.\n\n` +
          `Return one JSON object with keys diary, life, social, news, each {"title": string, "text": string}.\n` +
          `- diary: inner voice, usually 40-100 words. Give the event a private meaning or a little hope for next time. Let the mood change naturally.\n` +
          `- life: a ${work ? "work diary" : "school diary"}, usually 30-80 words. Connect one actual detail to its role with one light metaphor. Conversational prose; avoid compulsory numbered reports and a formal Note line.\n` +
          `- social: a personal post to friends, usually 15-45 words. An actual detail plus a feeling or a gentle question to readers. No hashtags; at most one emoji. Let it stand alone, rather than tacking a slogan onto the note.\n` +
          `- news: a short, lightly playful pet news item. Use a concrete Title Case headline, tell the event once, then optionally add one brief opinion in the pet's voice. Prefer 15-45 words; a simple note can be shorter. No invented sources, formal reporting preamble, repeated retelling, stock investigation ending, archive/notebook announcements or explanation of the fictional setting. Stop at the pet's reaction.\n` +
          `Titles under 10 words.\n\n` +
          `An example of this voice on a different event. Feel the voice; do not reuse its sentences or structure.\n` +
          `Owner's note: ${shown.note}\nDiary:\n${withOwner(shown.diary, pet.owner)}\n\nA separate feed example, based only on "Went out together today":\n${withOwner(shown.social, pet.owner)}`,
      },
      { role: "user", content: `The owner's note: ${description.trim()}` },
    ];
  }
  function prompt(input) {
    if (input.lang === "en") return promptEn(input);
    const { pet, description, temper, weird } = input;
    const kind = SPECIES[pet.species] ?? pet.speciesName;
    const work = pet.route === "work";
    const shown = example("zh", temper, description);
    return [
      {
        role: "system",
        content:
          `你在替一只小动物写它自己的生活：私下的心事、上学或上班的日常、发给朋友的动态和邻里小报。真实经过来自主人记录，表达来自它自己的视角。\n` +
          `宠物：${pet.name}，${kind}。性格：${pet.personality}。它叫主人“${pet.owner}”。它的虚拟身份：${work ? "上班的小动物" : "上学的小动物"}，${pet.role}。\n\n` +
          `【它的语气】${withOwner(TEMPER_CARD.zh[temper], pet.owner)}\n` +
          `${weird ? "它是个抽象的家伙：每篇放一处一本正经的离谱想法。" : "可以有一处无厘头的抽象，没有也行。"}\n` +
          `【物种】${SPECIES_CARD.zh[pet.species] ?? SPECIES_CARD.zh.other}\n\n` +
          `写法：\n` +
          `1. 只写主人写到的事。不编新事件、地点和健康状况；宠物的想法、借口、误会可以加。\n` +
          `2. 从原话的一个细节写进它心里：它注意到什么，惦记什么，误会了什么，想让谁理解。原话里的气味、声音、触感或动作可以承载情绪；未提供的动作和感官细节保持为愿望、假设，或省去。让心情有小小的转折，长短句自然交错。\n` +
          `3. 结尾停在动作或一句嘴硬上。不总结，不升华，不讲道理。\n` +
          `4. 默认自称“我”${pet.self !== "我" ? `，“${pet.self}”全篇最多用一次` : ""}。一篇最多一个网络梗。\n` +
          `5. 不用：排比、“不是……而是……”“不仅……更是……”、仿佛、宛如、治愈、岁月静好、满满的、喵星人、汪星人、哈基米、萌萌哒。\n` +
          `6. 如果主人写到生病、受伤或走失：四段都不开玩笑，安静、真诚、短。\n` +
          `7. 用简体中文。称呼只用宠物名字、具体物种或“小动物”；城镇叫“爪爪镇”，公司叫“爪爪公司”。删掉“在小动物世界里”“写进档案”“已收录为校园生活笔记”“新增独家记录”等背景解释和归档说明。\n` +
          `8. 小社会的感觉来自它自己的偏好、对熟人的语气、给读者留的一句轻问题，或身份带来的一个小比喻。一篇选一种就够。朋友姓名、相遇、评论、点赞、共同经历都需要主人原话依据；学校或职场用作想象里的比喻，别编成实际发生的课程和会议。\n` +
          `9. 输出前逐句核对：新增的已发生动作、感官观察或主人回应，删除或完整改成未来愿望、假设。“我猜”也不能用来断言已经发生的事。原话只有“出去玩”时，省去“没闻够”“妈妈一叫我就回来”“路过谁”“跑了多久”等补写经过；可以写“下次想慢慢闻”“希望妈妈多陪我一会儿”。四种体裁共享这条事实边界。\n\n` +
          `输出一个 JSON 对象，只输出 JSON。四个键 diary、life、social、news，每个值是 {"title": "...", "text": "..."}。\n` +
          `- diary 内心独白：通常 70–160 字。写真实日常在它心里的分量，一点自己的偏好、犹豫或下一次的小期待。情绪有变化，结尾留在它想说的那句话。\n` +
          `- life ${work ? "打工日记" : "校园日记"}：通常 50–120 字，自然的日记段落，用一个${work ? "工作" : "上学"}小比喻连接真实经过和身份。省去编号纪要、固定“备注”和完成任务式结尾。\n` +
          `- social 爪友圈动态：通常 25–80 字，像它发给熟人的朋友圈。一件具体小事加一点心思，可以偶尔问读者一句。全文自己讲清楚，省去“主人说”开场和重复改写；避免句句喊口号、固定结尾问“谁懂”。不加话题标签，最多一个表情。\n` +
          `- news 小报：简短、自然，可以带一点轻松的幽默。标题直接写宠物和具体小事。正文把事情讲一遍，可加一句宠物自己的想法，回应要增加态度，避免把原话换个人称又说一遍。通常 20–60 字，简单的事可以更短。省去“本报讯”“据主人爆料”“当事宠物随后回应”等报道套话；结尾停在反应上，省去“情绪稳定”“事件仍在调查中”和收录说明。例：主人写“今天带她出去玩了”，标题“小黄出门啦”，正文“今天主人带小黄出去玩了。小黄：‘明天还想去！’”。\n` +
          `标题都不超过 20 个字。\n\n` +
          `下面是同一种语气写另一件事的示范，只用来感受语气，不要照抄句子和结构。\n` +
          `主人原话：${shown.note}\n内心独白：\n${withOwner(shown.diary, pet.owner)}\n\n另一条独立的爪友圈示范，原话只有“今天带她出去玩了”：\n${withOwner(shown.social, pet.owner)}`,
      },
      { role: "user", content: `主人写的原话：${description.trim()}` },
    ];
  }
  function parseStories(raw) {
    const start = raw.indexOf("{"), end = raw.lastIndexOf("}");
    if (start < 0 || end <= start) throw Object.assign(new Error("model returned no JSON"), { status: 502 });
    const data = JSON.parse(raw.slice(start, end + 1));
    const stories = {};
    const names = value => value.replace(/\u6bdb\u5b69市/g, "爪爪镇").replace(/\u6bdb\u5b69公司/g, "爪爪公司").replace(/\u6bdb\u5b69(?:儿|子)?/g, "小动物");
    for (const style of STYLES) {
      const s = data[style];
      if (!s || !text(s.title, 160) || !text(s.text, 1900)) throw new Error(`model returned a bad ${style} story`);
      stories[style] = { title: names(s.title.trim()).slice(0, 160), text: names(s.text.trim()).slice(0, 1900), generator: "ai", edited: false };
    }
    return stories;
  }
  // Providers disagree on small things: the name of the output limit, whether JSON mode exists.
  // A 400 that names one of those gets one retry with the alternative, so a config works as is.
  async function ask(p, messages, region, jsonMode, limitName = "max_tokens") {
    const response = await fetch(`${p.url.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${p.key}` },
      body: JSON.stringify({
        model: p.model,
        messages,
        // DeepSeek recommends a higher temperature for creative writing than other providers need.
        temperature: Number(env[region === "cn" ? "CN_TEMPERATURE" : "INTL_TEMPERATURE"] ?? (region === "cn" ? 1.3 : 1)),
        // Some models think before they answer and the thinking counts against this limit,
        // so it has to leave room for both or the answer comes back empty.
        [limitName]: Number(env[region === "cn" ? "CN_MAX_TOKENS" : "INTL_MAX_TOKENS"] ?? 4096),
        ...(jsonMode ? { response_format: { type: "json_object" } } : {}),
      }),
      signal: AbortSignal.timeout(60000),
    });
    if (response.status === 400) {
      const reason = await response.text();
      if (limitName === "max_tokens" && reason.includes("max_completion_tokens"))
        return ask(p, messages, region, jsonMode, "max_completion_tokens");
      if (jsonMode) return ask(p, messages, region, false, limitName);
    }
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
      return parseStories(JSON.stringify(Object.fromEntries(STYLES.map((s) => [s, { title: `【模拟 AI】${pet.name}的${s}`, text: said }]))));
    }
    const region = providers[input.region].key && providers[input.region].url && providers[input.region].model ? input.region : "cn";
    const p = providers[region];
    if (!p.key) throw Object.assign(new Error("AI provider is not configured"), { status: 503 });
    const jsonMode = env[region === "cn" ? "CN_JSON_MODE" : "INTL_JSON_MODE"] !== "0";
    const messages = prompt({ ...input, lang });
    const raw = await ask(p, messages, region, jsonMode);
    const first = parseStories(raw);
    const hit = flat(first).match(BANNED[lang]);
    if (!hit) return first;
    // One rewrite when the text uses a stock phrase; the caller is charged once either way.
    try {
      const again = await ask(p, [
        ...messages,
        { role: "assistant", content: raw },
        { role: "user", content: lang === "en" ? `The last version used: "${hit[0]}". Say it another way. Everything else stays the same.` : `上一版用了：“${hit[0]}”。换个说法，其他要求不变。` },
      ], region, jsonMode);
      return parseStories(again);
    } catch {
      return first;
    }
  }

  const busy = new Set();
  /** Answers one request. `readText` returns the raw body; nothing here knows about the host. */
  async function handle(method, url, readText) {
    try {
      if (method === "OPTIONS") return { status: 204, body: {} };
      if (method === "GET" && url.pathname === "/v1/quota") {
        const deviceId = url.searchParams.get("deviceId") ?? "";
        if (!/^[\w-]{1,100}$/.test(deviceId)) return { status: 400, body: { error: "bad_request", field: "deviceId" } };
        return { status: 200, body: { quota: await quota(deviceId) } };
      }
      if (method === "POST" && url.pathname === "/v1/pet-voice") {
        let body;
        try {
          const raw = await readText();
          if (raw.length > 16384) return { status: 413, body: { error: "bad_request" } };
          body = JSON.parse(raw);
        } catch {
          return { status: 400, body: { error: "bad_request" } };
        }
        const field = parseRequest(body);
        if (field) return { status: 400, body: { error: "bad_request", field } };
        const before = await quota(body.deviceId);
        if (!before.member && before.remaining <= 0) return { status: 429, body: { error: "quota_exhausted", quota: before } };
        // One request at a time per device, so a double tap cannot spend the allowance twice.
        if (busy.has(body.deviceId)) return { status: 409, body: { error: "busy" } };
        busy.add(body.deviceId);
        try {
          const stories = await generate(body);
          await store.add(week().key, body.deviceId);
          return { status: 200, body: { stories, quota: await quota(body.deviceId) } };
        } finally {
          busy.delete(body.deviceId);
        }
      }
      return { status: 404, body: { error: "not_found" } };
    } catch (e) {
      console.error(e);
      return { status: e.status ?? 500, body: { error: e.status === 503 ? "not_configured" : "generation_failed" } };
    }
  }
  return { handle, mock: MOCK };
}

export const headers = (env) => ({
  "content-type": "application/json; charset=utf-8",
  "access-control-allow-origin": env.ALLOW_ORIGIN ?? "*",
  "access-control-allow-headers": "content-type",
  "access-control-allow-methods": "GET,POST,OPTIONS",
});
