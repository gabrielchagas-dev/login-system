const path = require('path');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

const databaseFile = process.env.DATABASE_URL || path.join(__dirname, 'database.sqlite');

async function connectDatabase() {
  const db = await open({
    filename: databaseFile,
    driver: sqlite3.Database
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS email_campaigns (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      company_name TEXT,
      subject_template TEXT NOT NULL,
      message_template TEXT NOT NULL,
      recipients_count INTEGER NOT NULL,
      preview_only INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);

  return db;
}

module.exports = {
  connectDatabase
};
