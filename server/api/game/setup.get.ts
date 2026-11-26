import { PHASE_CATALOG } from '../../../shared/phases'
import type { GameSetup } from '../../../shared/types'
import { getPhaseOrder } from '../../services/game'
import { listPlayers } from '../../services/players'

export default defineEventHandler(async (event): Promise<GameSetup> => {
  await requireAdmin(event)
  return { players: listPlayers(), phaseOrder: getPhaseOrder(), catalog: [...PHASE_CATALOG] }
})
