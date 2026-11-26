import { z } from 'zod'

const bodySchema = z.object({ password: z.string().max(200, 'Das Passwort ist zu lang.') })

export default defineEventHandler(async (event) => {
  const { password } = await readValidatedBody(event, parseWith(bodySchema))
  await loginAdmin(event, password)
  return { ok: true }
})
