import type { GameState } from '../../shared/types'
import { getPublicPlayer } from '../services/players'
import { getCurrentStep } from '../services/steps'

export default defineEventHandler(async (event): Promise<GameState> => {
  const playerId = await getSessionPlayerId(event)
  return { me: playerId ? getPublicPlayer(playerId) : null, step: getCurrentStep() }
})
