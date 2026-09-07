import Database from "better-sqlite3";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const here = dirname(fileURLToPath(import.meta.url));
const db = new Database(join(here, "../bot.db"));
db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS stock (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    credentials TEXT NOT NULL,
    username TEXT,
    level INTEGER,
    linked_platforms TEXT,
    renown INTEGER,
    r6credits INTEGER,
    black_ices TEXT,
    elites TEXT,
    universals TEXT,
    ranked_history TEXT,
    skin_link TEXT,
    tier TEXT NOT NULL DEFAULT 'free',
    is_used INTEGER NOT NULL DEFAULT 0,
    added_at INTEGER NOT NULL DEFAULT (unixepoch())
  );
  CREATE TABLE IF NOT EXISTS subscriptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    guild_id TEXT NOT NULL,
    expires_at INTEGER NOT NULL,
    granted_by TEXT NOT NULL,
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    UNIQUE(user_id, guild_id)
  );
  CREATE TABLE IF NOT EXISTS settings (
    guild_id TEXT PRIMARY KEY,
    gen_channel_id TEXT,
    premium_channel_id TEXT,
    log_channel_id TEXT,
    cooldown_seconds INTEGER NOT NULL DEFAULT 30,
    premium_cooldown_seconds INTEGER NOT NULL DEFAULT 15,
    drop_cooldown_seconds INTEGER NOT NULL DEFAULT 0,
    last_drop_at INTEGER NOT NULL DEFAULT 0,
    admin_role_name TEXT,
    hype_enabled INTEGER NOT NULL DEFAULT 0,
    embed_color TEXT NOT NULL DEFAULT '#65c7c4',
    embed_title TEXT NOT NULL DEFAULT 'Dokkabi Generator R6',
    footer_text TEXT NOT NULL DEFAULT 'Dokkabi Generator R6',
    embed_image_url TEXT
  );
  CREATE TABLE IF NOT EXISTS claims (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    guild_id TEXT NOT NULL,
    account_id INTEGER NOT NULL,
    tier TEXT NOT NULL,
    claimed_at INTEGER NOT NULL DEFAULT (unixepoch())
  );
  CREATE TABLE IF NOT EXISTS invites (
    invite_code TEXT PRIMARY KEY,
    owner_id TEXT NOT NULL,
    guild_id TEXT NOT NULL,
    uses INTEGER NOT NULL DEFAULT 0
  );
  CREATE TABLE IF NOT EXISTS vouches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    guild_id TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at INTEGER NOT NULL DEFAULT (unixepoch())
  );
  CREATE TABLE IF NOT EXISTS cooldowns (
    user_id TEXT NOT NULL,
    guild_id TEXT NOT NULL,
    tier TEXT NOT NULL,
    expires_at INTEGER NOT NULL,
    PRIMARY KEY (user_id, guild_id, tier)
  );
`);

// Keep installations made with the earlier bot version upgradeable.
const settingColumns = new Set(
  db.prepare("PRAGMA table_info(settings)").all().map((column) => column.name)
);
const missingSettingColumns = {
  premium_channel_id: "TEXT",
  log_channel_id: "TEXT",
  cooldown_seconds: "INTEGER NOT NULL DEFAULT 30",
  premium_cooldown_seconds: "INTEGER NOT NULL DEFAULT 15",
  drop_cooldown_seconds: "INTEGER NOT NULL DEFAULT 0",
  last_drop_at: "INTEGER NOT NULL DEFAULT 0",
  admin_role_name: "TEXT",
  hype_enabled: "INTEGER NOT NULL DEFAULT 0",
  embed_color: "TEXT NOT NULL DEFAULT '#65c7c4'",
  embed_title: "TEXT NOT NULL DEFAULT 'Dokkabi Generator R6'",
  footer_text: "TEXT NOT NULL DEFAULT 'Dokkabi Generator R6'",
  embed_image_url: "TEXT",
};
for (const [name, definition] of Object.entries(missingSettingColumns)) {
  if (!settingColumns.has(name)) {
    db.exec(`ALTER TABLE settings ADD COLUMN ${name} ${definition}`);
  }
}

db.prepare("UPDATE settings SET embed_title = 'Dokkabi Generator R6' WHERE embed_title = 'DOKKAEBI'").run();
db.prepare("UPDATE settings SET footer_text = 'Dokkabi Generator R6' WHERE footer_text = 'DOKKAEBI⭐'").run();

const stockColumns = new Set(
  db.prepare("PRAGMA table_info(stock)").all().map((column) => column.name)
);
const missingStockColumns = {
  username: "TEXT",
  level: "INTEGER",
  linked_platforms: "TEXT",
  renown: "INTEGER",
  r6credits: "INTEGER",
  black_ices: "TEXT",
  elites: "TEXT",
  universals: "TEXT",
  ranked_history: "TEXT",
  skin_link: "TEXT",
};
for (const [name, definition] of Object.entries(missingStockColumns)) {
  if (!stockColumns.has(name)) {
    db.exec(`ALTER TABLE stock ADD COLUMN ${name} ${definition}`);
  }
}

export function getSettings(guildId) {
  return (
    db.prepare("SELECT * FROM settings WHERE guild_id = ?").get(guildId) ?? {
      guild_id: guildId,
      gen_channel_id: null,
      premium_channel_id: null,
      log_channel_id: null,
      cooldown_seconds: 30,
      premium_cooldown_seconds: 15,
      drop_cooldown_seconds: 0,
      last_drop_at: 0,
      admin_role_name: null,
      hype_enabled: 0,
      embed_color: "#65c7c4",
      embed_title: "Dokkabi Generator R6",
      footer_text: "Dokkabi Generator R6",
      embed_image_url: null,
    }
  );
}

export function setSetting(guildId, key, value) {
  const allowed = new Set([
    "gen_channel_id",
    "premium_channel_id",
    "log_channel_id",
    "cooldown_seconds",
    "premium_cooldown_seconds",
    "drop_cooldown_seconds",
    "last_drop_at",
    "admin_role_name",
    "hype_enabled",
    "embed_color",
    "embed_title",
    "footer_text",
    "embed_image_url",
  ]);
  if (!allowed.has(key)) throw new Error(`Unknown setting ${key}`);
  db.prepare(`
    INSERT INTO settings (guild_id, ${key}) VALUES (?, ?)
    ON CONFLICT(guild_id) DO UPDATE SET ${key} = excluded.${key}
  `).run(guildId, value);
}

export function getStockCount(tier) {
  return db
    .prepare("SELECT COUNT(*) AS count FROM stock WHERE tier = ? AND is_used = 0")
    .get(tier).count;
}

function json(value, fallback = []) {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function normalizeAccount(account) {
  const credentials = account.credentials ?? `${account.email}:${account.password}`;
  const separator = credentials.indexOf(":");
  const email = account.email ?? credentials.slice(0, separator);
  const password = account.password ?? credentials.slice(separator + 1);
  const skins = Array.isArray(account.skins) ? account.skins : [];
  const platforms = account.linkedPlatforms ?? account.linked_platforms ?? [];
  const inventory = account.inventory ?? {};
  const number = (camel, snake, fallback = 0) =>
    account[camel] ?? account[snake] ?? inventory[camel] ?? inventory[snake] ?? fallback;
  return {
    credentials,
    email,
    password,
    username: account.username ?? account.displayName ?? account.display_name ?? null,
    level: account.level ?? null,
    linkedPlatforms: platforms,
    renown: account.renown ?? null,
    r6credits: account.r6credits ?? account.r6Credits ?? null,
    blackIces: account.blackIces ?? account.black_ices ?? [],
    elites: account.elites ?? [],
    universals: account.universals ?? [],
    rankedHistory: account.rankedHistory ?? account.ranked_history ?? [],
    skinLink: account.skinLink ?? account.skin_link ?? null,
    tier: account.tier ?? "free",
    inventory: {
      blackIces: number("blackIces", "black_ices", 0),
      elites: number("elites", "elite_count", 0),
      universals: number("universals", "universal_count", 0),
    },
  };
}

export function addAccount(input) {
  const account = normalizeAccount(input);
  return db
    .prepare(`
      INSERT INTO stock
        (credentials, username, level, linked_platforms, renown, r6credits,
         black_ices, elites, universals, ranked_history, skin_link, tier)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .run(
      account.credentials,
      account.username,
      account.level,
      JSON.stringify(account.linkedPlatforms),
      account.renown,
      account.r6credits,
      JSON.stringify(account.blackIces),
      JSON.stringify(account.elites),
      JSON.stringify(account.universals),
      JSON.stringify(account.rankedHistory),
      account.skinLink,
      account.tier
    );
}

function hydrate(row) {
  return {
    ...row,
    linkedPlatforms: json(row.linked_platforms),
    blackIces: json(row.black_ices),
    elites: json(row.elites),
    universals: json(row.universals),
    rankedHistory: json(row.ranked_history),
  };
}

export function popAccount(tier) {
  const row = db
    .prepare("SELECT * FROM stock WHERE tier = ? AND is_used = 0 ORDER BY id LIMIT 1")
    .get(tier);
  if (!row) return null;
  db.prepare("UPDATE stock SET is_used = 1 WHERE id = ?").run(row.id);
  return hydrate(row);
}

export function listAccounts(tier, limit = 20) {
  return db
    .prepare("SELECT * FROM stock WHERE tier = ? AND is_used = 0 ORDER BY id LIMIT ?")
    .all(tier, limit)
    .map(hydrate);
}

export function deleteAccountById(id) {
  return db.prepare("DELETE FROM stock WHERE id = ? AND is_used = 0").run(id);
}

export function deleteAccountByEmail(email) {
  return db
    .prepare(
      "DELETE FROM stock WHERE id = (SELECT id FROM stock WHERE (credentials = ? OR credentials LIKE ?) AND is_used = 0 ORDER BY id LIMIT 1)"
    )
    .run(email, `${email}:%`);
}

export function clearStock(tier) {
  return db.prepare("DELETE FROM stock WHERE tier = ? AND is_used = 0").run(tier);
}

export function getSubscription(userId, guildId) {
  return db
    .prepare("SELECT * FROM subscriptions WHERE user_id = ? AND guild_id = ?")
    .get(userId, guildId);
}

export function hasActiveSubscription(userId, guildId) {
  const subscription = getSubscription(userId, guildId);
  return Boolean(subscription && subscription.expires_at > Math.floor(Date.now() / 1000));
}

export function grantSubscription(userId, guildId, days, grantedBy) {
  const now = Math.floor(Date.now() / 1000);
  const existing = getSubscription(userId, guildId);
  const start = existing?.expires_at > now ? existing.expires_at : now;
  const expiresAt = start + days * 86400;
  db.prepare(`
    INSERT INTO subscriptions (user_id, guild_id, expires_at, granted_by)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(user_id, guild_id) DO UPDATE SET
      expires_at = excluded.expires_at,
      granted_by = excluded.granted_by
  `).run(userId, guildId, expiresAt, grantedBy);
  return expiresAt;
}

export function addClaim(userId, guildId, accountId, tier) {
  db.prepare(
    "INSERT INTO claims (user_id, guild_id, account_id, tier) VALUES (?, ?, ?, ?)"
  ).run(userId, guildId, accountId, tier);
}

export function getClaimHistory(userId, guildId) {
  return db
    .prepare(
      "SELECT claims.*, stock.username FROM claims LEFT JOIN stock ON stock.id = claims.account_id WHERE claims.user_id = ? AND claims.guild_id = ? ORDER BY claims.id DESC LIMIT 20"
    )
    .all(userId, guildId);
}

export function getCooldown(userId, guildId, tier) {
  const row = db
    .prepare(
      "SELECT expires_at FROM cooldowns WHERE user_id = ? AND guild_id = ? AND tier = ?"
    )
    .get(userId, guildId, tier);
  return Math.max(0, (row?.expires_at ?? 0) - Math.floor(Date.now() / 1000));
}

export function setCooldown(userId, guildId, tier, seconds) {
  db.prepare(`
    INSERT INTO cooldowns (user_id, guild_id, tier, expires_at)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(user_id, guild_id, tier) DO UPDATE SET expires_at = excluded.expires_at
  `).run(userId, guildId, tier, Math.floor(Date.now() / 1000) + seconds);
}

export function saveInvite(code, ownerId, guildId, uses = 0) {
  db.prepare(
    "INSERT INTO invites (invite_code, owner_id, guild_id, uses) VALUES (?, ?, ?, ?) ON CONFLICT(invite_code) DO UPDATE SET uses = excluded.uses"
  ).run(code, ownerId, guildId, uses);
}

export function syncInvite(code, uses) {
  db.prepare("UPDATE invites SET uses = ? WHERE invite_code = ?").run(uses, code);
}

export function getTrackedInvites(guildId) {
  return db.prepare("SELECT * FROM invites WHERE guild_id = ?").all(guildId);
}

export function getInvitesForUser(userId, guildId) {
  return (
    db
      .prepare("SELECT COALESCE(SUM(uses), 0) AS total FROM invites WHERE owner_id = ? AND guild_id = ?")
      .get(userId, guildId)?.total ?? 0
  );
}

export function getInviteLeaderboard(guildId) {
  return db
    .prepare(
      "SELECT owner_id, SUM(uses) AS total FROM invites WHERE guild_id = ? GROUP BY owner_id ORDER BY total DESC LIMIT 10"
    )
    .all(guildId);
}

export function addVouch(userId, guildId, message) {
  return db
    .prepare("INSERT INTO vouches (user_id, guild_id, message) VALUES (?, ?, ?)")
    .run(userId, guildId, message);
}

export function getVouches(guildId, limit = 20) {
  return db
    .prepare("SELECT * FROM vouches WHERE guild_id = ? ORDER BY id DESC LIMIT ?")
    .all(guildId, limit);
}

export function deleteVouch(id, guildId) {
  return db.prepare("DELETE FROM vouches WHERE id = ? AND guild_id = ?").run(id, guildId);
}

export function getDb() {
  return db;
}

export default db;