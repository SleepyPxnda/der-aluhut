import { z } from 'zod'
import { savePresentation } from '../../phases/preparation'
import { assertUploadSize } from '../../services/uploads'

const fileSchema = z.object(
  { filename: z.string().min(1, 'Wähle zuerst eine Datei aus.'), data: z.instanceof(Buffer) },
  'Wähle zuerst eine Datei aus.',
)

export default defineEventHandler(async (event) => {
  const playerId = await requirePlayer(event)
  assertUploadSize(getHeader(event, 'content-length'))
  const parts = await readMultipartFormData(event)
  const file = parseWith(fileSchema)(parts?.find((part) => part.name === 'file'))
  return savePresentation(playerId, file)
})
