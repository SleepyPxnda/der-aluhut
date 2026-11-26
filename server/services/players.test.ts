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
  throw new Error('No error thrown')
}

beforeEach(() => {
  getDb().exec('DELETE FROM player')
})

describe('createPlayer', () => {
  it('creates a player that appears in the list', () => {
    const created = createPlayer('Jana')
    expect(listPlayers().map((player) => player.id)).toEqual([created.id])
  })

  it('trims the name', () => {
    expect(createPlayer('  Jana  ').name).toBe('Jana')
  })

  it('rejects an empty name with 400', () => {
    const error = catchError(() => createPlayer('   '))
    expect(error.statusCode).toBe(400)
    expect(error.statusMessage).toBe('Der Name muss 1 bis 30 Zeichen haben.')
  })

  it('accepts 30 characters and rejects 31 with 400', () => {
    expect(() => createPlayer('a'.repeat(30))).not.toThrow()
    expect(catchError(() => createPlayer('b'.repeat(31))).statusCode).toBe(400)
  })

  it('rejects a name differing only in case with 409', () => {
    createPlayer('Jana')
    const error = catchError(() => createPlayer(' JANA '))
    expect(error.statusCode).toBe(409)
    expect(error.statusMessage).toBe('Diesen Namen gibt es schon.')
  })

  it('creates distinct tokens of 32 bytes', () => {
    const first = createPlayer('Jana')
    const second = createPlayer('Mehmet')
    expect(Buffer.from(first.token, 'base64url')).toHaveLength(32)
    expect(first.token).toMatch(/^[A-Za-z0-9_-]+$/)
    expect(first.token).not.toBe(second.token)
  })
})

describe('deletePlayer', () => {
  it('invalidates the token', () => {
    const player = createPlayer('Jana')
    expect(findPlayerByToken(player.token)).toEqual({ id: player.id, name: 'Jana' })
    deletePlayer(player.id)
    expect(findPlayerByToken(player.token)).toBeNull()
  })
})

describe('getPublicPlayer', () => {
  it('returns exactly id and name', () => {
    const player = createPlayer('Jana')
    expect(Object.keys(getPublicPlayer(player.id) ?? {}).sort()).toEqual(['id', 'name'])
  })

  it('returns null for a removed player', () => {
    const player = createPlayer('Jana')
    deletePlayer(player.id)
    expect(getPublicPlayer(player.id)).toBeNull()
  })
})
