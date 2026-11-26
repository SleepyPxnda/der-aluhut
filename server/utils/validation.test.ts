import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { parseWith } from './validation'

function catchError(run: () => void): { statusCode: number; statusMessage: string } {
  try {
    run()
  } catch (error) {
    return error as { statusCode: number; statusMessage: string }
  }
  throw new Error('No error thrown')
}

describe('parseWith', () => {
  const parse = parseWith(z.object({ name: z.string().max(3, 'Der Name ist zu lang.') }))

  it('returns the parsed data', () => {
    expect(parse({ name: 'Jan' })).toEqual({ name: 'Jan' })
  })

  it('throws 400 with the German message of the schema', () => {
    const error = catchError(() => parse({ name: 'Janine' }))
    expect(error.statusCode).toBe(400)
    expect(error.statusMessage).toBe('Der Name ist zu lang.')
  })

  it('throws 400 with a German fallback for a wrong type', () => {
    const error = catchError(() => parse({ name: 5 }))
    expect(error.statusCode).toBe(400)
    expect(error.statusMessage).toBe('Die Anfrage ist ungültig.')
  })
})
