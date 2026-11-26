import { describe, expect, it } from 'vitest'
import { assertSessionPassword, checkAdminPassword, sessionCookieOptions } from './auth'

function catchError(run: () => void): { statusCode: number; statusMessage: string } {
  try {
    run()
  } catch (error) {
    return error as { statusCode: number; statusMessage: string }
  }
  throw new Error('No error thrown')
}

describe('checkAdminPassword', () => {
  it('accepts the correct password', () => {
    expect(() => checkAdminPassword('geheim', 'geheim')).not.toThrow()
  })

  it('rejects a wrong password with 401', () => {
    const error = catchError(() => checkAdminPassword('falsch', 'geheim'))
    expect(error.statusCode).toBe(401)
    expect(error.statusMessage).toBe('Falsches Passwort.')
  })

  it('throws 500 when the password is not set', () => {
    const error = catchError(() => checkAdminPassword('irgendwas', undefined))
    expect(error.statusCode).toBe(500)
    expect(error.statusMessage).toBe('Das Admin-Passwort ist nicht gesetzt.')
  })

  it('throws 500 for an empty password, even with empty input', () => {
    expect(catchError(() => checkAdminPassword('', '')).statusCode).toBe(500)
  })
})

describe('sessionCookieOptions', () => {
  it('sets the secure flag only for https', () => {
    expect(sessionCookieOptions('https').secure).toBe(true)
    expect(sessionCookieOptions('http').secure).toBe(false)
  })
})

describe('assertSessionPassword', () => {
  it('returns a password with 32 characters', () => {
    expect(assertSessionPassword('a'.repeat(32))).toBe('a'.repeat(32))
  })

  it('throws a German 500 for a missing password', () => {
    const error = catchError(() => assertSessionPassword(undefined))
    expect(error.statusCode).toBe(500)
    expect(error.statusMessage).toBe('Das Session-Passwort fehlt oder ist kürzer als 32 Zeichen.')
  })

  it('throws a German 500 for a password with 31 characters', () => {
    expect(catchError(() => assertSessionPassword('a'.repeat(31))).statusCode).toBe(500)
  })
})
