import Database from "better-sqlite3";

const db = new Database("ship.db");

db.exec(`
  CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    industria TEXT NOT NULL,
    pais TEXT NOT NULL,
    ciudad TEXT NOT NULL,
    inputJson TEXT NOT NULL,
    resultJson TEXT,
    pdfPath TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

export default db;
