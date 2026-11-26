import { describe, expect, it } from 'vitest'
import { checkAdminPassword, sessionCookieOptions } from './auth'

function catchError(run: () => void): { statusCode: number; statusMessage: string } {
  try {
    run()
  } catch (error) {
    return error as { statusCode: number; statusMessage: string }
  }
  throw new Error('Kein Fehler geworfen')
}

describe('checkAdminPassword', () => {
  it('akzeptiert das richtige Passwort', () => {
    expect(() => checkAdminPassword('geheim', 'geheim')).not.toThrow()
  })

  it('lehnt ein falsches Passwort mit 401 ab', () => {
    const error = catchError(() => checkAdminPassword('falsch', 'geheim'))
    expect(error.statusCode).toBe(401)
    expect(error.statusMessage).toBe('Falsches Passwort.')
  })

  it('wirft 500, wenn das Passwort nicht gesetzt ist', () => {
    const error = catchError(() => checkAdminPassword('irgendwas', undefined))
    expect(error.statusCode).toBe(500)
    expect(error.statusMessage).toBe('Das Admin-Passwort ist nicht gesetzt.')
  })

  it('wirft 500 bei leerem Passwort, auch bei leerer Eingabe', () => {
    expect(catchError(() => checkAdminPassword('', '')).statusCode).toBe(500)
  })
})

describe('sessionCookieOptions', () => {
  it('setzt das Secure-Flag nur bei https', () => {
    expect(sessionCookieOptions('https').secure).toBe(true)
    expect(sessionCookieOptions('http').secure).toBe(false)
  })
})
