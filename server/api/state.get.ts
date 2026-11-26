import type { GameState } from '../../shared/types'
import { getPublicPlayer } from '../services/players'

export default defineEventHandler(async (event): Promise<GameState> => {
  const playerId = await getSessionPlayerId(event)
  return { me: playerId ? getPublicPlayer(playerId) : null }
})
