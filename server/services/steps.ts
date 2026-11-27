import { PHASE_CATALOG, PHASE_ORDER, isPerSpeaker, type PhaseId } from '../../shared/phases'
import type { CurrentStep, GameProgress, GameSetup } from '../../shared/types'
import { serverPhases } from '../phases/registry'
import { getDb } from '../utils/db'
import { broadcast } from '../utils/events'
import { assertNotStarted, getCurrentPosition } from './game'
import { getPublicPlayer, listPlayers } from './players'

export interface PlannedStep {
  phaseId: PhaseId
  speakerId: string | null
}

export function shuffle<Item>(items: readonly Item[], random: () => number): Item[] {
  const copy = [...items]
  for (let index = copy.length - 1; index > 0; index--) {
    const other = Math.floor(random() * (index + 1))
    ;[copy[index], copy[other]] = [copy[other]!, copy[index]!]
  }
  return copy
}

export function buildSteps(order: readonly PhaseId[], speakerIds: readonly string[]): PlannedStep[] {
  const steps: PlannedStep[] = []
  let index = 0
  while (index < order.length) {
    const phaseId = order[index]!
    if (!isPerSpeaker(phaseId)) {
      steps.push({ phaseId, speakerId: null })
      index++
      continue
    }
    const block: PhaseId[] = []
    while (index < order.length && isPerSpeaker(order[index]!)) {
      block.push(order[index]!)
      index++
    }
    for (const speakerId of speakerIds) {
      for (const blockPhaseId of block) {
        steps.push({ phaseId: blockPhaseId, speakerId })
      }
    }
  }
  return steps
}

function toStep(row: Record<string, unknown>): CurrentStep {
  const speakerId = row.speaker_id as string | null
  return {
    phaseId: row.phase_id as PhaseId,
    speaker: speakerId ? getPublicPlayer(speakerId) : null,
  }
}

function listSteps(): CurrentStep[] {
  return getDb().prepare('SELECT phase_id, speaker_id FROM step ORDER BY position').all().map(toStep)
}

function getProgress(): GameProgress {
  return { steps: listSteps(), currentIndex: getCurrentPosition() }
}

function enterStep(position: number): void {
  const row = getDb().prepare('SELECT phase_id, speaker_id FROM step WHERE position = ?').get(position)
  if (row) {
    serverPhases[row.phase_id as PhaseId]?.enter?.(toStep(row))
  }
  broadcast()
}

export function startGame(random: () => number = Math.random): GameProgress {
  assertNotStarted()
  const players = listPlayers()
  if (players.length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'Leg zuerst mindestens eine Person an.' })
  }
  const planned = buildSteps(
    PHASE_ORDER,
    shuffle(
      players.map((player) => player.id),
      random,
    ),
  )
  const db = getDb()
  const insert = db.prepare('INSERT INTO step (position, phase_id, speaker_id) VALUES (?, ?, ?)')
  db.exec('BEGIN')
  try {
    db.exec('DELETE FROM step')
    db.prepare('INSERT OR IGNORE INTO game (id) VALUES (1)').run()
    planned.forEach((step, position) => insert.run(position, step.phaseId, step.speakerId))
    db.prepare('UPDATE game SET current_step = 0 WHERE id = 1').run()
    db.exec('COMMIT')
  } catch (failure) {
    db.exec('ROLLBACK')
    throw failure
  }
  enterStep(0)
  return getProgress()
}

export function advanceStep(from: number): GameProgress {
  const db = getDb()
  const count = (db.prepare('SELECT COUNT(*) AS count FROM step').get()?.count as number) ?? 0
  const result = db
    .prepare('UPDATE game SET current_step = current_step + 1 WHERE id = 1 AND current_step = ? AND current_step < ?')
    .run(from, count - 1)
  if (Number(result.changes) === 0) {
    const position = getCurrentPosition()
    if (position === null) {
      throw createError({ statusCode: 409, statusMessage: 'Das Spiel läuft noch nicht.' })
    }
    if (position !== from) {
      throw createError({ statusCode: 409, statusMessage: 'Jemand hat schon weitergeschaltet.' })
    }
    throw createError({ statusCode: 409, statusMessage: 'Das ist schon der letzte Schritt.' })
  }
  enterStep(from + 1)
  return getProgress()
}

export function getCurrentStep(): CurrentStep | null {
  const position = getCurrentPosition()
  if (position === null) {
    return null
  }
  const row = getDb().prepare('SELECT phase_id, speaker_id FROM step WHERE position = ?').get(position)
  return row ? toStep(row) : null
}

export function getGameSetup(): GameSetup {
  return {
    players: listPlayers(),
    catalog: [...PHASE_CATALOG],
    ...getProgress(),
  }
}
