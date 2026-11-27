import { z } from 'zod'
import { openUpload } from '../../services/uploads'

const querySchema = z.object({ playerId: z.string().min(1) })

function encodeFilename(name: string): string {
  return encodeURIComponent(name).replace(/['()*]/g, (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`)
}

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const { playerId } = await getValidatedQuery(event, parseWith(querySchema))
  const { name, size, stream } = openUpload(playerId)
  setHeaders(event, {
    'Content-Type': 'application/octet-stream',
    'Content-Length': String(size),
    'Content-Disposition': `attachment; filename*=UTF-8''${encodeFilename(name)}`,
  })
  return sendStream(event, stream)
})
