import { beforeEach, describe, expect, it } from 'vitest'
import { getDb } from '../utils/db'
import {
  createPlayer,
  deletePlayer,
  findPlayerByToken,
  getPublicPlayer,
  listPlayers,
} from './players'

function catchError(run: () => void): { statusCode: number; statusMessage: string } {
  try {
    run()
  } catch (error) {
    return error as { statusCode: number; statusMessage: string }
  }
  throw new Error('Kein Fehler geworfen')
}

beforeEach(() => {
  getDb().exec('DELETE FROM player')
})

describe('createPlayer', () => {
  it('legt eine Person an, die in der Liste erscheint', () => {
    const created = createPlayer('Jana')
    expect(listPlayers().map((player) => player.id)).toEqual([created.id])
  })

  it('trimmt den Namen', () => {
    expect(createPlayer('  Jana  ').name).toBe('Jana')
  })

  it('lehnt einen leeren Namen mit 400 ab', () => {
    const error = catchError(() => createPlayer('   '))
    expect(error.statusCode).toBe(400)
    expect(error.statusMessage).toBe('Der Name muss 1 bis 30 Zeichen haben.')
  })

  it('akzeptiert 30 Zeichen und lehnt 31 Zeichen mit 400 ab', () => {
    expect(() => createPlayer('a'.repeat(30))).not.toThrow()
    expect(catchError(() => createPlayer('b'.repeat(31))).statusCode).toBe(400)
  })

  it('lehnt einen Namen in anderer Schreibweise mit 409 ab', () => {
    createPlayer('Jana')
    const error = catchError(() => createPlayer(' JANA '))
    expect(error.statusCode).toBe(409)
    expect(error.statusMessage).toBe('Diesen Namen gibt es schon.')
  })

  it('erzeugt Tokens mit 32 Bytes, die sich unterscheiden', () => {
    const first = createPlayer('Jana')
    const second = createPlayer('Mehmet')
    expect(Buffer.from(first.token, 'base64url')).toHaveLength(32)
    expect(first.token).toMatch(/^[A-Za-z0-9_-]+$/)
    expect(first.token).not.toBe(second.token)
  })
})

describe('deletePlayer', () => {
  it('macht das Token ungültig', () => {
    const player = createPlayer('Jana')
    expect(findPlayerByToken(player.token)).toEqual({ id: player.id, name: 'Jana' })
    deletePlayer(player.id)
    expect(findPlayerByToken(player.token)).toBeNull()
  })
})

describe('getPublicPlayer', () => {
  it('liefert genau id und name', () => {
    const player = createPlayer('Jana')
    expect(Object.keys(getPublicPlayer(player.id) ?? {}).sort()).toEqual(['id', 'name'])
  })

  it('liefert null für eine entfernte Person', () => {
    const player = createPlayer('Jana')
    deletePlayer(player.id)
    expect(getPublicPlayer(player.id)).toBeNull()
  })
})
