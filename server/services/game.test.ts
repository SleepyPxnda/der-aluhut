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
  throw new Error('Kein Fehler geworfen')
}

beforeEach(() => {
  getDb().exec('DELETE FROM game')
})

describe('getPhaseOrder', () => {
  it('liefert beim ersten Zugriff die Standardfolge', () => {
    expect(getPhaseOrder()).toEqual(DEFAULT_PHASE_ORDER)
    expect(getPhaseOrder()).toEqual([
      'lobby',
      'vorbereitung',
      'praesentation',
      'befragung',
      'auswertung',
      'abschluss',
    ])
  })
})

describe('setPhaseOrder', () => {
  it('gibt die gespeicherte Folge so zurück', () => {
    setPhaseOrder(['befragung', 'lobby'])
    expect(getPhaseOrder()).toEqual(['befragung', 'lobby'])
  })

  it('lehnt eine leere Liste mit 400 ab', () => {
    const error = catchError(() => setPhaseOrder([]))
    expect(error.statusCode).toBe(400)
    expect(error.statusMessage).toBe('Ungültige Phasenfolge.')
  })

  it('lehnt eine unbekannte ID mit 400 ab', () => {
    expect(catchError(() => setPhaseOrder(['lobby', 'unbekannt'])).statusCode).toBe(400)
  })

  it('lehnt eine doppelte ID mit 400 ab', () => {
    expect(catchError(() => setPhaseOrder(['lobby', 'lobby'])).statusCode).toBe(400)
  })
})

describe('getGameSetup', () => {
  it('liefert Spielende, Phasenfolge und Katalog', () => {
    getDb().exec('DELETE FROM player')
    const player = createPlayer('Jana')
    expect(getGameSetup()).toEqual({
      players: [player],
      phaseOrder: DEFAULT_PHASE_ORDER,
      catalog: [...PHASE_CATALOG],
    })
  })
})
