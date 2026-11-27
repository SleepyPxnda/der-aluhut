import { getPreparationOverview } from '../../phases/preparation'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  return getPreparationOverview()
})
