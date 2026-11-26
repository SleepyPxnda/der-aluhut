import { mkdirSync } from 'node:fs'
import { DatabaseSync } from 'node:sqlite'

let database: DatabaseSync | undefined

export function getDb(): DatabaseSync {
  if (database) {
    return database
  }
  let location = ':memory:'
  if (!process.env.VITEST) {
    mkdirSync('data', { recursive: true })
    location = 'data/aluhut.db'
  }
  database = new DatabaseSync(location)
  database.exec(`
    CREATE TABLE IF NOT EXISTS game (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      phase_order TEXT NOT NULL,
      current_step INTEGER
    );
    CREATE TABLE IF NOT EXISTS player (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      token TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS step (
      position INTEGER PRIMARY KEY,
      phase_id TEXT NOT NULL,
      speaker_id TEXT
    );
  `)
  const columns = database.prepare('PRAGMA table_info(game)').all()
  if (!columns.some((column) => column.name === 'current_step')) {
    database.exec('ALTER TABLE game ADD COLUMN current_step INTEGER')
  }
  return database
}
