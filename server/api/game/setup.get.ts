import { getGameSetup } from '../../services/steps'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  return getGameSetup()
})
