import { DEFAULT_PHASE_ORDER, PHASE_CATALOG, type PhaseId } from '../../shared/phases'
import { getDb } from '../utils/db'

export function getPhaseOrder(): PhaseId[] {
  const db = getDb()
  const row = db.prepare('SELECT phase_order FROM game WHERE id = 1').get()
  if (row) {
    return JSON.parse(row.phase_order as string) as PhaseId[]
  }
  db.prepare('INSERT INTO game (id, phase_order) VALUES (1, ?)').run(JSON.stringify(DEFAULT_PHASE_ORDER))
  return [...DEFAULT_PHASE_ORDER]
}

export function setPhaseOrder(order: string[]): PhaseId[] {
  const known = new Set<string>(PHASE_CATALOG.map((phase) => phase.id))
  const valid =
    order.length > 0 && new Set(order).size === order.length && order.every((id) => known.has(id))
  if (!valid) {
    throw createError({ statusCode: 400, statusMessage: 'Ungültige Phasenfolge.' })
  }
  getDb()
    .prepare(
      'INSERT INTO game (id, phase_order) VALUES (1, ?) ON CONFLICT(id) DO UPDATE SET phase_order = excluded.phase_order',
    )
    .run(JSON.stringify(order))
  return order as PhaseId[]
}
