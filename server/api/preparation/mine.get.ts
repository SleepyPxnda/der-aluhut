import { getMyPreparation } from '../../phases/preparation'

export default defineEventHandler(async (event) => {
  const playerId = await requirePlayer(event)
  return getMyPreparation(playerId)
})
