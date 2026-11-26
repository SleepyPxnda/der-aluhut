import { z } from 'zod'
import { setPhaseOrder } from '../../services/game'

const bodySchema = z.object({ phaseOrder: z.array(z.string()) })

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const { phaseOrder } = await readValidatedBody(event, bodySchema.parse)
  return { phaseOrder: setPhaseOrder(phaseOrder) }
})
