import { z } from 'zod'
import { createPlayer } from '../../services/players'

const bodySchema = z.object({ name: z.string().max(500, 'Der Name muss 1 bis 30 Zeichen haben.') })

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const { name } = await readValidatedBody(event, parseWith(bodySchema))
  return createPlayer(name)
})
