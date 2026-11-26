import type { ZodType } from 'zod'

const FALLBACK_MESSAGE = 'Die Anfrage ist ungültig.'

export function parseWith<Output>(schema: ZodType<Output>) {
  return (data: unknown): Output => {
    const result = schema.safeParse(data, { error: () => FALLBACK_MESSAGE })
    if (!result.success) {
      throw createError({ statusCode: 400, statusMessage: result.error.issues[0]?.message ?? FALLBACK_MESSAGE })
    }
    return result.data
  }
}
