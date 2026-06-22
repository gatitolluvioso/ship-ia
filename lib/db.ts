import Database from "better-sqlite3";

const db = new Database("ship.db");

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
  );

  CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER,
    nombre TEXT NOT NULL,
    industria TEXT NOT NULL,
    pais TEXT NOT NULL,
    ciudad TEXT NOT NULL,
    inputJson TEXT NOT NULL,
    resultJson TEXT,
    pdfPath TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id)
  )
`);

const projectColumns = db
  .prepare("PRAGMA table_info(projects)")
  .all() as { name: string }[];

if (!projectColumns.some((column) => column.name === "userId")) {
  db.prepare("ALTER TABLE projects ADD COLUMN userId INTEGER").run();
}

const userColumns = db.prepare("PRAGMA table_info(users)").all() as {
  name: string;
}[];

const userMigrations: { name: string; sql: string }[] = [
  { name: "company", sql: "ALTER TABLE users ADD COLUMN company TEXT" },
  {
    name: "language",
    sql: "ALTER TABLE users ADD COLUMN language TEXT DEFAULT 'es'",
  },
  { name: "reportEmail", sql: "ALTER TABLE users ADD COLUMN reportEmail TEXT" },
  {
    name: "emailSenderName",
    sql: "ALTER TABLE users ADD COLUMN emailSenderName TEXT",
  },
  { name: "avatarUrl", sql: "ALTER TABLE users ADD COLUMN avatarUrl TEXT" },
  {
    name: "avatarInitial",
    sql: "ALTER TABLE users ADD COLUMN avatarInitial TEXT",
  },
  {
    name: "avatarColor",
    sql: "ALTER TABLE users ADD COLUMN avatarColor TEXT DEFAULT '#0b63e5'",
  },
];

for (const migration of userMigrations) {
  if (!userColumns.some((column) => column.name === migration.name)) {
    db.prepare(migration.sql).run();
  }
}

export default db;
