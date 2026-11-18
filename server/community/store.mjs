export const communitySchema = [
  "CREATE TABLE IF NOT EXISTS households(id TEXT PRIMARY KEY, code TEXT NOT NULL UNIQUE)",
  "CREATE TABLE IF NOT EXISTS pets(id TEXT PRIMARY KEY, owner TEXT NOT NULL, local TEXT NOT NULL, name TEXT NOT NULL, species TEXT NOT NULL, temper TEXT NOT NULL, active INTEGER NOT NULL DEFAULT 0, mix TEXT NOT NULL DEFAULT 'interests', UNIQUE(owner,local))",
  "CREATE TABLE IF NOT EXISTS posts(id INTEGER PRIMARY KEY AUTOINCREMENT, pet TEXT NOT NULL REFERENCES pets(id) ON DELETE CASCADE, entry TEXT NOT NULL, caption TEXT NOT NULL, category TEXT NOT NULL, photo TEXT, mention TEXT, created INTEGER NOT NULL, UNIQUE(pet,entry))",
  "CREATE INDEX IF NOT EXISTS pet_posts ON posts(pet,id DESC)",
  "CREATE INDEX IF NOT EXISTS mentions_by_pet ON posts(mention,id DESC) WHERE mention IS NOT NULL",
  "CREATE TABLE IF NOT EXISTS encounters(source INTEGER PRIMARY KEY REFERENCES posts(id) ON DELETE CASCADE, target INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE, remark TEXT, answer TEXT)",
  "CREATE INDEX IF NOT EXISTS at_post ON encounters(target)",
  "CREATE TABLE IF NOT EXISTS links(owner TEXT NOT NULL, peer TEXT NOT NULL, kind TEXT NOT NULL, PRIMARY KEY(owner,peer,kind))",
  "CREATE TABLE IF NOT EXISTS messages(id INTEGER PRIMARY KEY AUTOINCREMENT, sender TEXT NOT NULL, recipient TEXT NOT NULL, nonce TEXT NOT NULL, body TEXT NOT NULL, UNIQUE(sender,nonce))",
  "CREATE INDEX IF NOT EXISTS conversation_messages ON messages(sender,recipient,id DESC)",
  "CREATE TABLE IF NOT EXISTS reports(reporter TEXT NOT NULL, post INTEGER NOT NULL, reason TEXT NOT NULL, created INTEGER NOT NULL, PRIMARY KEY(reporter,post))",
  "CREATE TABLE IF NOT EXISTS saved_pets(owner TEXT NOT NULL, pet TEXT NOT NULL REFERENCES pets(id) ON DELETE CASCADE, PRIMARY KEY(owner,pet))",
  "CREATE TABLE IF NOT EXISTS preferred_pets(pet TEXT NOT NULL REFERENCES pets(id) ON DELETE CASCADE, peer TEXT NOT NULL REFERENCES pets(id) ON DELETE CASCADE, PRIMARY KEY(pet,peer))",
  "CREATE TABLE IF NOT EXISTS daily_use(bucket TEXT PRIMARY KEY, day INTEGER NOT NULL, count INTEGER NOT NULL)",
];

export const problem = (status, message) => {
  throw Object.assign(new Error(message), { status });
};
export function field(value, max, label) {
  if (typeof value !== "string" || !value.trim() || value.trim().length > max)
    problem(400, "Check the " + label + ".");
  return value.trim();
}
export const blocked = (a, b) =>
  `EXISTS (SELECT 1 FROM links l WHERE l.kind='block' AND ((l.owner=${a} AND l.peer=${b}) OR (l.owner=${b} AND l.peer=${a})))`;

export function communityStore(db, owner) {
  const all = (sql, ...v) => db(sql, ...v),
    one = (sql, ...v) => all(sql, ...v)[0];
  const linked = (a, b, k) =>
    !!one("SELECT 1 FROM links WHERE owner=? AND peer=? AND kind=?", a, b, k);
  const isBlocked = (a, b) => linked(a, b, "block") || linked(b, a, "block");
  const link = (a, b, k) =>
    all("INSERT OR IGNORE INTO links VALUES(?,?,?)", a, b, k);
  const identity = () => one("SELECT code FROM households WHERE id=?", owner);
  const mine = (local) =>
    one("SELECT * FROM pets WHERE owner=? AND local=?", owner, local || "");
  const friendPets = () =>
    all(
      "SELECT t.id,t.name,t.species FROM pets t JOIN links l ON l.peer=t.owner WHERE l.owner=? AND l.kind='friend' ORDER BY t.name",
      owner,
    );
  function quota(bucket, limit) {
    const day = Math.floor(Date.now() / 86400000);
    all(
      "INSERT INTO daily_use VALUES(?,?,1) ON CONFLICT(bucket) DO UPDATE SET day=excluded.day,count=CASE WHEN daily_use.day=excluded.day THEN daily_use.count+1 ELSE 1 END",
      bucket,
      day,
    );
    if (one("SELECT count FROM daily_use WHERE bucket=?", bucket).count > limit)
      problem(429, "Please try again tomorrow.");
  }
  const targetPet = (id) => {
    const p = one(
      "SELECT id,owner FROM pets WHERE id=?",
      field(id, 100, "pet"),
    );
    if (!p || p.owner === owner || isBlocked(owner, p.owner))
      problem(404, "This pet is unavailable.");
    return p;
  };
  return {
    owner,
    all,
    one,
    linked,
    isBlocked,
    link,
    identity,
    mine,
    friendPets,
    quota,
    targetPet,
  };
}
