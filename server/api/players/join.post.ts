import { z } from 'zod'
import { findPlayerByToken } from '../../services/players'

const bodySchema = z.object({ token: z.string().min(1).max(200, 'Dieser Link ist ungültig. Frag den Admin nach deinem Link.') })

export default defineEventHandler(async (event) => {
  const { token } = await readValidatedBody(event, parseWith(bodySchema))
  const player = findPlayerByToken(token)
  if (!player) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Dieser Link ist ungültig. Frag den Admin nach deinem Link.',
    })
  }
  await setSessionPlayer(event, player.id)
  return player
})
