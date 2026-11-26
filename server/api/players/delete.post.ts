import { z } from 'zod'
import { deletePlayer } from '../../services/players'

const bodySchema = z.object({ id: z.string().min(1) })

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const { id } = await readValidatedBody(event, parseWith(bodySchema))
  deletePlayer(id)
  return { ok: true }
})
