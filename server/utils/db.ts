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
      phase_order TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS player (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      token TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL
    );
  `)
  return database
}
