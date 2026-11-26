import { z } from 'zod'
import { createPlayer } from '../../services/players'

const bodySchema = z.object({ name: z.string().max(500) })

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const { name } = await readValidatedBody(event, bodySchema.parse)
  return createPlayer(name)
})
