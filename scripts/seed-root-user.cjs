/* eslint-disable @typescript-eslint/no-require-imports */

const crypto = require("crypto");
const Database = require("better-sqlite3");

const db = new Database("ship.db");
const email = process.env.ROOT_USER_EMAIL;
const password = process.env.ROOT_USER_PASSWORD;
const name = process.env.ROOT_USER_NAME || "Root";

if (!email || !password) {
  console.error(
    "Missing ROOT_USER_EMAIL or ROOT_USER_PASSWORD. Set them before running this script.",
  );
  process.exit(1);
}

const salt = crypto.randomBytes(16).toString("base64url");
const iterations = 210000;
const hash = crypto
  .pbkdf2Sync(password, salt, iterations, 32, "sha256")
  .toString("base64url");
const passwordHash = `${iterations}:${salt}:${hash}`;

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    email TEXT UNIQUE NOT NULL,
    passwordHash TEXT NOT NULL,
  role TEXT DEFAULT 'user',
  company TEXT,
  language TEXT DEFAULT 'es',
  reportEmail TEXT,
  emailSenderName TEXT,
  avatarUrl TEXT,
  avatarInitial TEXT,
  avatarColor TEXT DEFAULT '#0b63e5',
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

const columns = db.prepare("PRAGMA table_info(users)").all();
const migrations = [
  ["company", "ALTER TABLE users ADD COLUMN company TEXT"],
  ["language", "ALTER TABLE users ADD COLUMN language TEXT DEFAULT 'es'"],
  ["reportEmail", "ALTER TABLE users ADD COLUMN reportEmail TEXT"],
  ["emailSenderName", "ALTER TABLE users ADD COLUMN emailSenderName TEXT"],
  ["avatarUrl", "ALTER TABLE users ADD COLUMN avatarUrl TEXT"],
  ["avatarInitial", "ALTER TABLE users ADD COLUMN avatarInitial TEXT"],
  [
    "avatarColor",
    "ALTER TABLE users ADD COLUMN avatarColor TEXT DEFAULT '#0b63e5'",
  ],
];

for (const [name, sql] of migrations) {
  if (!columns.some((column) => column.name === name)) {
    db.prepare(sql).run();
  }
}

const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email);

if (existing) {
  db.prepare(
    `UPDATE users
     SET name = ?,
         passwordHash = ?,
         role = ?,
         language = ?,
         avatarInitial = ?,
         avatarColor = ?
     WHERE email = ?`,
  ).run(
    name,
    passwordHash,
    "root",
    "es",
    name.charAt(0).toUpperCase(),
    "#0b63e5",
    email,
  );
  console.log(`Updated root user: ${email}`);
} else {
  const result = db
    .prepare(
      `INSERT INTO users
        (name, email, passwordHash, role, language, avatarInitial, avatarColor)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      name,
      email,
      passwordHash,
      "root",
      "es",
      name.charAt(0).toUpperCase(),
      "#0b63e5",
    );
  console.log(`Created root user #${result.lastInsertRowid}: ${email}`);
}

console.log("Root user password was set from ROOT_USER_PASSWORD.");
