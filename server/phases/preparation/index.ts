import type { MyPreparation, PreparationOverviewEntry } from '../../../shared/types'
import theories from '../../content/theories.json'
import words from '../../content/words.json'
import { getCurrentPhaseId } from '../../services/game'
import { listPlayers } from '../../services/players'
import { shuffle } from '../../services/steps'
import { getUpload, storeUpload } from '../../services/uploads'
import { getDb } from '../../utils/db'
import { broadcast } from '../../utils/events'

const WORDS_PER_PLAYER = 3
const MAX_SPEECH_LENGTH = 5000

function drawer(items: readonly string[], random: () => number): () => string {
  let pool: string[] = []
  return () => {
    if (pool.length === 0) {
      pool = shuffle(items, random)
    }
    return pool.pop()!
  }
}

export function assignAll(random: () => number = Math.random): void {
  const nextTheory = drawer(theories, random)
  const nextWord = drawer(words, random)
  const insert = getDb().prepare('INSERT OR IGNORE INTO assignment (player_id, theory, words) VALUES (?, ?, ?)')
  for (const player of listPlayers()) {
    const picked = new Set<string>()
    while (picked.size < WORDS_PER_PLAYER) {
      picked.add(nextWord())
    }
    insert.run(player.id, nextTheory(), JSON.stringify([...picked]))
  }
}

function assertRunning(): void {
  if (getCurrentPhaseId() !== 'preparation') {
    throw createError({ statusCode: 409, statusMessage: 'Die Vorbereitung läuft gerade nicht.' })
  }
}

export function getMyPreparation(playerId: string): MyPreparation {
  const row = getDb().prepare('SELECT theory, words, speech FROM assignment WHERE player_id = ?').get(playerId)
  if (!row) {
    throw createError({ statusCode: 404, statusMessage: 'Dir ist noch nichts zugewiesen.' })
  }
  return {
    theory: row.theory as string,
    words: JSON.parse(row.words as string) as string[],
    upload: getUpload(playerId),
    speech: (row.speech as string | null) ?? null,
  }
}

export async function savePresentation(playerId: string, file: { filename: string; data: Buffer }) {
  assertRunning()
  const upload = await storeUpload(playerId, file.filename, file.data)
  broadcast()
  return upload
}

export function saveSpeech(playerId: string, rawText: string): void {
  assertRunning()
  const text = rawText.trim()
  if (text.length > MAX_SPEECH_LENGTH) {
    throw createError({ statusCode: 400, statusMessage: 'Der Redetext darf höchstens 5000 Zeichen haben.' })
  }
  getDb()
    .prepare('UPDATE assignment SET speech = ? WHERE player_id = ?')
    .run(text === '' ? null : text, playerId)
  broadcast()
}

export function getPreparationOverview(): PreparationOverviewEntry[] {
  const speeches = new Set(
    getDb()
      .prepare('SELECT player_id FROM assignment WHERE speech IS NOT NULL')
      .all()
      .map((row) => row.player_id as string),
  )
  return listPlayers().map((player) => ({
    id: player.id,
    name: player.name,
    upload: getUpload(player.id),
    hasSpeech: speeches.has(player.id),
  }))
}
