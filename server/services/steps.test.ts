import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PHASE_CATALOG, type PhaseId } from '../../shared/phases'
import { serverPhases } from '../phases/registry'
import { getDb } from '../utils/db'
import { broadcast } from '../utils/events'
import { createPlayer } from './players'
import { advanceStep, buildSteps, getCurrentStep, getGameSetup, shuffle, startGame } from './steps'

vi.mock('../utils/events', () => ({ broadcast: vi.fn() }))
vi.mock('../phases/registry', () => ({ serverPhases: {} }))

function catchError(run: () => void): { statusCode: number; statusMessage: string } {
  try {
    run()
  } catch (error) {
    return error as { statusCode: number; statusMessage: string }
  }
  throw new Error('No error thrown')
}

function labels(steps: { phaseId: PhaseId; speakerId: string | null }[]): string[] {
  return steps.map((step) => (step.speakerId ? `${step.phaseId}:${step.speakerId}` : step.phaseId))
}

beforeEach(() => {
  getDb().exec('DELETE FROM game')
  getDb().exec('DELETE FROM step')
  getDb().exec('DELETE FROM player')
  vi.mocked(broadcast).mockReset()
  for (const id of Object.keys(serverPhases)) {
    delete serverPhases[id as PhaseId]
  }
})

describe('buildSteps', () => {
  it('runs the block of presentation and survey once per speaker', () => {
    expect(
      labels(buildSteps(['lobby', 'presentation', 'survey', 'evaluation'], ['ben', 'anna'])),
    ).toEqual([
      'lobby',
      'presentation:ben',
      'survey:ben',
      'presentation:anna',
      'survey:anna',
      'evaluation',
    ])
  })

  it('creates one step per phase without per-speaker phases', () => {
    expect(labels(buildSteps(['lobby', 'closing'], ['ben', 'anna']))).toEqual(['lobby', 'closing'])
  })

  it('runs a lone presentation once per speaker', () => {
    expect(labels(buildSteps(['presentation', 'closing'], ['ben', 'anna']))).toEqual([
      'presentation:ben',
      'presentation:anna',
      'closing',
    ])
  })

  it('does not merge per-speaker phases separated by another phase', () => {
    expect(labels(buildSteps(['presentation', 'lobby', 'survey'], ['ben', 'anna']))).toEqual([
      'presentation:ben',
      'presentation:anna',
      'lobby',
      'survey:ben',
      'survey:anna',
    ])
  })

  it('keeps the given speaker order', () => {
    const steps = buildSteps(['presentation'], ['c', 'a', 'b'])
    expect(steps.map((step) => step.speakerId)).toEqual(['c', 'a', 'b'])
  })
})

describe('shuffle', () => {
  it('reorders with a fixed random source, keeps every item once and leaves the input alone', () => {
    const input = ['a', 'b', 'c', 'd']
    const result = shuffle(input, () => 0)
    expect(result).toEqual(['b', 'c', 'd', 'a'])
    expect([...result].sort()).toEqual(input)
    expect(input).toEqual(['a', 'b', 'c', 'd'])
  })
})

describe('startGame', () => {
  it('draws the speaker order instead of the creation order and keeps it', () => {
    const anna = createPlayer('Anna')
    const ben = createPlayer('Ben')
    startGame(() => 0)
    const first = getGameSetup().steps
    const speakers = first.filter((step) => step.phaseId === 'presentation').map((step) => step.speaker?.id)
    expect(speakers).toEqual([ben.id, anna.id])
    expect(getGameSetup().steps).toEqual(first)
  })

  it('builds the steps from the fixed phase order', () => {
    createPlayer('Anna')
    createPlayer('Ben')
    startGame(() => 0)
    expect(getGameSetup().steps.map((step) => [step.phaseId, step.speaker?.name ?? null])).toEqual([
      ['lobby', null],
      ['preparation', null],
      ['presentation', 'Ben'],
      ['survey', 'Ben'],
      ['presentation', 'Anna'],
      ['survey', 'Anna'],
      ['evaluation', null],
      ['closing', null],
    ])
  })

  it('makes the first step current', () => {
    createPlayer('Anna')
    startGame()
    expect(getCurrentStep()).toEqual({ phaseId: 'lobby', speaker: null })
    expect(getGameSetup().currentIndex).toBe(0)
  })

  it('has no current step before the start', () => {
    expect(getCurrentStep()).toBeNull()
    expect(getGameSetup().currentIndex).toBeNull()
  })

  it('rejects without players with 400', () => {
    const error = catchError(() => startGame())
    expect(error.statusCode).toBe(400)
    expect(error.statusMessage).toBe('Leg zuerst mindestens eine Person an.')
  })

  it('rejects a second start with 409', () => {
    createPlayer('Anna')
    startGame()
    const error = catchError(() => startGame())
    expect(error.statusCode).toBe(409)
    expect(error.statusMessage).toBe('Das Spiel läuft schon.')
  })

  it('calls enter once with the new step, then broadcasts', () => {
    createPlayer('Anna')
    const calls: string[] = []
    const enter = vi.fn(() => {
      calls.push('enter')
    })
    vi.mocked(broadcast).mockImplementation(() => {
      calls.push('broadcast')
    })
    serverPhases.lobby = { enter }
    startGame()
    expect(enter).toHaveBeenCalledTimes(1)
    expect(enter).toHaveBeenCalledWith({ phaseId: 'lobby', speaker: null })
    expect(calls).toEqual(['enter', 'broadcast'])
  })
})

describe('advanceStep', () => {
  beforeEach(() => {
    createPlayer('Anna')
    startGame()
  })

  it('moves to the next step', () => {
    advanceStep(0)
    expect(getGameSetup().currentIndex).toBe(1)
    expect(getCurrentStep()?.phaseId).toBe('preparation')
  })

  it('rejects a stale position with 409 and changes nothing', () => {
    advanceStep(0)
    const error = catchError(() => advanceStep(0))
    expect(error.statusCode).toBe(409)
    expect(error.statusMessage).toBe('Jemand hat schon weitergeschaltet.')
    expect(getGameSetup().currentIndex).toBe(1)
  })

  it('rejects at the last step with 409', () => {
    const last = getGameSetup().steps.length - 1
    for (let position = 0; position < last; position++) {
      advanceStep(position)
    }
    const error = catchError(() => advanceStep(last))
    expect(error.statusCode).toBe(409)
    expect(error.statusMessage).toBe('Das ist schon der letzte Schritt.')
    expect(getGameSetup().currentIndex).toBe(last)
  })

  it('calls enter once with the new step, then broadcasts', () => {
    const calls: string[] = []
    const enter = vi.fn(() => {
      calls.push('enter')
    })
    vi.mocked(broadcast).mockImplementation(() => {
      calls.push('broadcast')
    })
    serverPhases.preparation = { enter }
    advanceStep(0)
    expect(enter).toHaveBeenCalledTimes(1)
    expect(enter).toHaveBeenCalledWith({ phaseId: 'preparation', speaker: null })
    expect(calls).toEqual(['enter', 'broadcast'])
  })
})

describe('getCurrentStep', () => {
  it('exposes exactly phaseId and speaker with id and name', () => {
    createPlayer('Anna')
    startGame()
    advanceStep(0)
    advanceStep(1)
    const step = getCurrentStep()
    expect(step?.phaseId).toBe('presentation')
    expect(Object.keys(step ?? {}).sort()).toEqual(['phaseId', 'speaker'])
    expect(Object.keys(step?.speaker ?? {}).sort()).toEqual(['id', 'name'])
  })
})

describe('getGameSetup', () => {
  it('returns players, catalog and empty progress before the start', () => {
    const player = createPlayer('Jana')
    const setup = getGameSetup()
    expect(setup.players).toEqual([player])
    expect(setup.catalog).toEqual([...PHASE_CATALOG])
    expect(setup).not.toHaveProperty('phaseOrder')
    expect(setup.steps).toEqual([])
    expect(setup.currentIndex).toBeNull()
  })
})
