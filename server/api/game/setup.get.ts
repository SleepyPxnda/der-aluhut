import { getGameSetup } from '../../services/game'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  return getGameSetup()
})
