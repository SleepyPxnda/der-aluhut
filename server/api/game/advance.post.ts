import { z } from 'zod'
import { advanceStep } from '../../services/steps'

const bodySchema = z.object({ from: z.number().int().min(0) })

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const { from } = await readValidatedBody(event, parseWith(bodySchema))
  return advanceStep(from)
})
