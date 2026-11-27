import { z } from 'zod'
import { saveSpeech } from '../../phases/preparation'

const bodySchema = z.object({ text: z.string() })

export default defineEventHandler(async (event) => {
  const playerId = await requirePlayer(event)
  const { text } = await readValidatedBody(event, parseWith(bodySchema))
  return saveSpeech(playerId, text)
})
