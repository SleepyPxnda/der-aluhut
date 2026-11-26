import { beforeEach, describe, expect, it } from 'vitest'
import { DEFAULT_PHASE_ORDER } from '../../shared/phases'
import { getDb } from '../utils/db'
import { PHASE_CATALOG } from '../../shared/phases'
import { createPlayer } from './players'
import { getGameSetup, getPhaseOrder, setPhaseOrder } from './game'

function catchError(run: () => void): { statusCode: number; statusMessage: string } {
  try {
    run()
  } catch (error) {
    return error as { statusCode: number; statusMessage: string }
  }
  throw new Error('No error thrown')
}

beforeEach(() => {
  getDb().exec('DELETE FROM game')
})

describe('getPhaseOrder', () => {
  it('returns the default order on first access', () => {
    expect(getPhaseOrder()).toEqual(DEFAULT_PHASE_ORDER)
    expect(getPhaseOrder()).toEqual([
      'lobby',
      'preparation',
      'presentation',
      'survey',
      'evaluation',
      'closing',
    ])
  })
})

describe('setPhaseOrder', () => {
  it('returns the saved order unchanged', () => {
    setPhaseOrder(['survey', 'lobby'])
    expect(getPhaseOrder()).toEqual(['survey', 'lobby'])
  })

  it('rejects an empty list with 400', () => {
    const error = catchError(() => setPhaseOrder([]))
    expect(error.statusCode).toBe(400)
    expect(error.statusMessage).toBe('Ungültige Phasenfolge.')
  })

  it('rejects an unknown id with 400', () => {
    expect(catchError(() => setPhaseOrder(['lobby', 'unknown'])).statusCode).toBe(400)
  })

  it('rejects a duplicate id with 400', () => {
    expect(catchError(() => setPhaseOrder(['lobby', 'lobby'])).statusCode).toBe(400)
  })
})

describe('getGameSetup', () => {
  it('returns players, phase order and catalog', () => {
    getDb().exec('DELETE FROM player')
    const player = createPlayer('Jana')
    expect(getGameSetup()).toEqual({
      players: [player],
      phaseOrder: DEFAULT_PHASE_ORDER,
      catalog: [...PHASE_CATALOG],
    })
  })
})
