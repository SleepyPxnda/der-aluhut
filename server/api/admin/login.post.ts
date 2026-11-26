import { z } from 'zod'

const bodySchema = z.object({ password: z.string().max(200) })

export default defineEventHandler(async (event) => {
  const { password } = await readValidatedBody(event, bodySchema.parse)
  await loginAdmin(event, password)
  return { ok: true }
})
