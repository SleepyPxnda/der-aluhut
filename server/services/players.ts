import { randomBytes, randomUUID } from 'node:crypto'
import type { AdminPlayer, PublicPlayer } from '../../shared/types'
import { getDb } from '../utils/db'

const MAX_NAME_LENGTH = 30

export function listPlayers(): AdminPlayer[] {
  return getDb()
    .prepare('SELECT id, name, token FROM player ORDER BY created_at, rowid')
    .all() as unknown as AdminPlayer[]
}

export function createPlayer(rawName: string): AdminPlayer {
  const name = rawName.trim()
  if (name.length < 1 || name.length > MAX_NAME_LENGTH) {
    throw createError({ statusCode: 400, statusMessage: 'Der Name muss 1 bis 30 Zeichen haben.' })
  }
  const db = getDb()
  const duplicate = db.prepare('SELECT 1 FROM player WHERE lower(name) = lower(?)').get(name)
  if (duplicate) {
    throw createError({ statusCode: 409, statusMessage: 'Diesen Namen gibt es schon.' })
  }
  const player: AdminPlayer = {
    id: randomUUID(),
    name,
    token: randomBytes(32).toString('base64url'),
  }
  db.prepare('INSERT INTO player (id, name, token, created_at) VALUES (?, ?, ?, ?)').run(
    player.id,
    player.name,
    player.token,
    new Date().toISOString(),
  )
  return player
}

export function deletePlayer(id: string): void {
  getDb().prepare('DELETE FROM player WHERE id = ?').run(id)
}

export function findPlayerByToken(token: string): PublicPlayer | null {
  const row = getDb().prepare('SELECT id FROM player WHERE token = ?').get(token)
  return row ? getPublicPlayer(row.id as string) : null
}

export function getPublicPlayer(id: string): PublicPlayer | null {
  const row = getDb().prepare('SELECT id, name FROM player WHERE id = ?').get(id)
  return row ? { id: row.id as string, name: row.name as string } : null
}
