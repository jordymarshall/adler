import { DatabaseSync } from "node:sqlite";
import {
  mkdirSync,
  existsSync,
  readFileSync,
  writeFileSync,
  chmodSync,
} from "node:fs";
import { resolve, join } from "node:path";
import {
  randomBytes,
  randomUUID,
  createHash,
  createCipheriv,
  createDecipheriv,
  scryptSync,
  timingSafeEqual,
} from "node:crypto";
import { EventEmitter } from "node:events";
import { initialData, enrichData, type Data } from "../shared/workspace.ts";

export const digest = (value: string) =>
  createHash("sha256").update(value).digest("hex");
export const fingerprint = (data: Data) =>
  digest(
    JSON.stringify({
      ...data,
      messages: [],
      decisions: [],
      conversations: [],
      goalDraft: {},
      calendarSnapshot: undefined,
    }),
  );
export class Database {
  sql: DatabaseSync;
  key: Buffer;
  events = new EventEmitter();
  constructor(directory = process.env.ADLER_DATA_DIR || ".data") {
    const root = resolve(directory);
    mkdirSync(root, { recursive: true, mode: 0o700 });
    const keyFile = join(root, "encryption.key");
    if (!existsSync(keyFile))
      writeFileSync(keyFile, randomBytes(32), { mode: 0o600, flag: "wx" });
    this.key = readFileSync(keyFile);
    if (this.key.length !== 32)
      throw new Error(
        "The server encryption key is invalid. Restore the key that belongs to this database.",
      );
    const file = join(root, "adler.sqlite");
    this.sql = new DatabaseSync(file);
    chmodSync(file, 0o600);
    this.sql
      .exec(`PRAGMA journal_mode = DELETE; PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000;
      CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, username TEXT UNIQUE NOT NULL, password TEXT NOT NULL, created INTEGER NOT NULL);
      CREATE TABLE IF NOT EXISTS sessions (hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), expires INTEGER NOT NULL);
      CREATE TABLE IF NOT EXISTS state (user_id TEXT PRIMARY KEY REFERENCES users(id), revision INTEGER NOT NULL, json TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS secrets (user_id TEXT NOT NULL, name TEXT NOT NULL, value TEXT NOT NULL, PRIMARY KEY(user_id,name));
      CREATE TABLE IF NOT EXISTS events (id INTEGER PRIMARY KEY, user_id TEXT NOT NULL, channel TEXT NOT NULL, summary TEXT NOT NULL, at INTEGER NOT NULL);
      CREATE TABLE IF NOT EXISTS proposals (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, base_hash TEXT NOT NULL, json TEXT NOT NULL, status TEXT NOT NULL, expires INTEGER NOT NULL, result TEXT);
      CREATE TABLE IF NOT EXISTS requests (user_id TEXT NOT NULL, id TEXT NOT NULL, hash TEXT NOT NULL, result TEXT NOT NULL, PRIMARY KEY(user_id,id));
      CREATE TABLE IF NOT EXISTS tokens (hash TEXT PRIMARY KEY, id TEXT UNIQUE NOT NULL, user_id TEXT NOT NULL, name TEXT NOT NULL, scope TEXT NOT NULL, expires INTEGER NOT NULL);
      CREATE TABLE IF NOT EXISTS phone_links (address TEXT PRIMARY KEY, user_id TEXT UNIQUE NOT NULL, opted_out INTEGER NOT NULL DEFAULT 0, last_inbound INTEGER NOT NULL DEFAULT 0);
      CREATE TABLE IF NOT EXISTS phone_routes (user_id TEXT PRIMARY KEY, provider TEXT NOT NULL, chat_id TEXT NOT NULL, sender TEXT NOT NULL, service TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS pairings (hash TEXT PRIMARY KEY, user_id TEXT NOT NULL, address TEXT NOT NULL, expires INTEGER NOT NULL);
      CREATE TABLE IF NOT EXISTS inbound (sid TEXT PRIMARY KEY, user_id TEXT, json TEXT NOT NULL, at INTEGER NOT NULL);
      CREATE TABLE IF NOT EXISTS jobs (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, kind TEXT NOT NULL, json TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'pending', due INTEGER NOT NULL, lease INTEGER, attempts INTEGER NOT NULL DEFAULT 0, error TEXT);
      CREATE INDEX IF NOT EXISTS jobs_due ON jobs(status,due);
      CREATE TABLE IF NOT EXISTS deliveries (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, address TEXT NOT NULL, message_id TEXT, body TEXT NOT NULL, status TEXT NOT NULL, sid TEXT UNIQUE, at INTEGER NOT NULL, error TEXT);
      CREATE TABLE IF NOT EXISTS delivery_events (sid TEXT NOT NULL, status TEXT NOT NULL, at INTEGER NOT NULL, PRIMARY KEY(sid,status));
      CREATE TABLE IF NOT EXISTS bookings (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, json TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS rate_limits (key TEXT PRIMARY KEY, count INTEGER NOT NULL, reset INTEGER NOT NULL);
    `);
    if (
      !(
        this.sql.prepare("PRAGMA table_info(deliveries)").all() as {
          name: string;
        }[]
      ).some((c) => c.name === "next_attempt")
    )
      this.sql.exec(
        "ALTER TABLE deliveries ADD COLUMN next_attempt INTEGER NOT NULL DEFAULT 0",
      );
    this.events.setMaxListeners(200);
    this.sql
      .prepare(
        "UPDATE jobs SET status='unknown',lease=NULL,error='Server restarted during an unconfirmed reaction.' WHERE status='running' AND kind='reaction'",
      )
      .run();
    this.sql
      .prepare(
        "UPDATE jobs SET status='pending', lease=NULL WHERE status='running'",
      )
      .run();
    this.sql
      .prepare(
        "UPDATE deliveries SET status='unknown', error='Server restarted during an unconfirmed send.' WHERE status='sending'",
      )
      .run();
  }
  transaction<T>(fn: () => T): T {
    this.sql.exec("BEGIN IMMEDIATE");
    try {
      const value = fn();
      this.sql.exec("COMMIT");
      return value;
    } catch (e) {
      this.sql.exec("ROLLBACK");
      throw e;
    }
  }
  limit(key: string, maximum: number, window = 60000) {
    const now = Date.now();
    const row = this.sql
      .prepare("SELECT count, reset FROM rate_limits WHERE key=?")
      .get(key) as { count: number; reset: number } | undefined;
    if (row && row.reset > now && row.count >= maximum)
      throw Object.assign(
        new Error("Too many requests. Please try again later."),
        { status: 429 },
      );
    this.sql
      .prepare(
        "INSERT INTO rate_limits VALUES(?,?,?) ON CONFLICT(key) DO UPDATE SET count=excluded.count, reset=excluded.reset",
      )
      .run(
        key,
        row && row.reset > now ? row.count + 1 : 1,
        row && row.reset > now ? row.reset : now + window,
      );
  }
  createUser(username: string, password: string, timeZone: string) {
    const id = randomUUID();
    const salt = randomBytes(16).toString("hex");
    const hash = scryptSync(password, salt, 64).toString("hex");
    this.transaction(() => {
      this.sql
        .prepare("INSERT INTO users VALUES(?,?,?,?)")
        .run(id, username.toLowerCase(), `${salt}:${hash}`, Date.now());
      const data = initialData();
      data.timeZone = timeZone;
      this.sql
        .prepare("INSERT INTO state VALUES(?,0,?)")
        .run(id, JSON.stringify(data));
    });
    return { id, username: username.toLowerCase() };
  }
  login(username: string, password: string) {
    const row = this.sql
      .prepare("SELECT * FROM users WHERE username=?")
      .get(username.toLowerCase()) as
      { id: string; username: string; password: string } | undefined;
    const [salt, hash] = (row?.password ?? "dummy:" + "0".repeat(128)).split(
      ":",
    );
    const valid = timingSafeEqual(
      scryptSync(password, salt, 64),
      Buffer.from(hash, "hex"),
    );
    if (!row || !valid)
      throw Object.assign(new Error("The username or password is incorrect."), {
        status: 401,
      });
    return { id: row.id, username: row.username };
  }
  session(userId: string) {
    const value = randomBytes(32).toString("hex");
    this.sql
      .prepare("INSERT INTO sessions VALUES(?,?,?)")
      .run(digest(value), userId, Date.now() + 30 * 86400000);
    return value;
  }
  authenticate(value: string) {
    return this.sql
      .prepare(
        "SELECT users.id, users.username FROM sessions JOIN users ON users.id=sessions.user_id WHERE sessions.hash=? AND sessions.expires>?",
      )
      .get(digest(value), Date.now()) as
      { id: string; username: string } | undefined;
  }
  snapshot(userId: string) {
    const row = this.sql
      .prepare("SELECT revision,json FROM state WHERE user_id=?")
      .get(userId) as { revision: number; json: string } | undefined;
    if (!row) throw new Error("Workspace not found.");
    return { revision: row.revision, data: enrichData(JSON.parse(row.json)) };
  }
  save(
    userId: string,
    data: Data,
    expected: number,
    channel: string,
    summary: string,
  ) {
    const result = this.sql
      .prepare(
        "UPDATE state SET revision=revision+1,json=? WHERE user_id=? AND revision=?",
      )
      .run(JSON.stringify(data), userId, expected);
    if (!result.changes)
      throw Object.assign(
        new Error(
          "This workspace changed in another channel. Review the latest records and retry.",
        ),
        { status: 409 },
      );
    this.sql
      .prepare("INSERT INTO events(user_id,channel,summary,at) VALUES(?,?,?,?)")
      .run(userId, channel, summary, Date.now());
    return expected + 1;
  }
  changed(userId: string) {
    this.events.emit(userId);
  }
  encrypt(value: unknown) {
    const iv = randomBytes(12);
    const cipher = createCipheriv("aes-256-gcm", this.key, iv);
    const data = Buffer.concat([
      cipher.update(JSON.stringify(value), "utf8"),
      cipher.final(),
    ]);
    return Buffer.concat([iv, cipher.getAuthTag(), data]).toString("base64");
  }
  setSecret(userId: string, name: string, value: unknown) {
    this.sql
      .prepare(
        "INSERT INTO secrets VALUES(?,?,?) ON CONFLICT(user_id,name) DO UPDATE SET value=excluded.value",
      )
      .run(userId, name, this.encrypt(value));
  }
  secret<T>(userId: string, name: string): T | undefined {
    const row = this.sql
      .prepare("SELECT value FROM secrets WHERE user_id=? AND name=?")
      .get(userId, name) as { value: string } | undefined;
    if (!row) return;
    const raw = Buffer.from(row.value, "base64");
    const cipher = createDecipheriv(
      "aes-256-gcm",
      this.key,
      raw.subarray(0, 12),
    );
    cipher.setAuthTag(raw.subarray(12, 28));
    return JSON.parse(
      Buffer.concat([
        cipher.update(raw.subarray(28)),
        cipher.final(),
      ]).toString(),
    );
  }
  removeSecret(userId: string, name: string) {
    this.sql
      .prepare("DELETE FROM secrets WHERE user_id=? AND name=?")
      .run(userId, name);
  }
  enqueue(
    id: string,
    userId: string,
    kind: string,
    payload: unknown,
    due = Date.now(),
  ) {
    this.sql
      .prepare(
        "INSERT OR IGNORE INTO jobs(id,user_id,kind,json,due,status) VALUES(?,?,?,?,?,'pending')",
      )
      .run(id, userId, kind, JSON.stringify(payload), due);
  }
  claim() {
    return this.sql
      .prepare(
        "UPDATE jobs SET status='running', attempts=attempts+1, lease=? WHERE id=(SELECT id FROM jobs WHERE status='pending' AND due<=? ORDER BY due LIMIT 1) RETURNING *",
      )
      .get(Date.now() + 120000, Date.now()) as
      | {
          id: string;
          user_id: string;
          kind: string;
          json: string;
          attempts: number;
          due: number;
        }
      | undefined;
  }
  close() {
    this.sql.close();
  }
}
