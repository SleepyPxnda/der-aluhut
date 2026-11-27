import type { PhaseId } from '../../shared/phases'
import { getDb } from '../utils/db'

export function getCurrentPosition(): number | null {
  const row = getDb().prepare('SELECT current_step FROM game WHERE id = 1').get()
  return (row?.current_step as number | null | undefined) ?? null
}

export function assertNotStarted(): void {
  if (getCurrentPosition() !== null) {
    throw createError({ statusCode: 409, statusMessage: 'Das Spiel läuft schon.' })
  }
}

export function getCurrentPhaseId(): PhaseId | null {
  const row = getDb()
    .prepare('SELECT phase_id FROM step WHERE position = (SELECT current_step FROM game WHERE id = 1)')
    .get()
  return (row?.phase_id as PhaseId | undefined) ?? null
}
