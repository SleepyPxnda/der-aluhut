import { beforeEach, describe, expect, it, vi } from 'vitest'
import theories from '../../content/theories.json'
import words from '../../content/words.json'
import { createPlayer } from '../../services/players'
import { advanceStep, startGame } from '../../services/steps'
import { getUpload } from '../../services/uploads'
import { getDb } from '../../utils/db'
import { broadcast } from '../../utils/events'
import { serverPhases } from '../registry'
import {
  assignAll,
  getMyPreparation,
  getPreparationOverview,
  savePresentation,
  saveSpeech,
} from './index'

vi.mock('../../utils/events', () => ({ broadcast: vi.fn() }))

const PDF = Buffer.from('%PDF-1.7 inhalt')

function seededRandom(seed: number): () => number {
  let state = seed
  return () => {
    state = (state * 16807) % 2147483647
    return state / 2147483647
  }
}

async function catchError(run: () => unknown): Promise<{ statusCode: number; statusMessage: string }> {
  try {
    await run()
  } catch (error) {
    return error as { statusCode: number; statusMessage: string }
  }
  throw new Error('No error thrown')
}

function createPlayers(count: number): string[] {
  return Array.from({ length: count }, (_, index) => createPlayer(`Person ${index + 1}`).id)
}

function startedGame(count: number): string[] {
  const ids = createPlayers(count)
  startGame(() => 0.5)
  return ids
}

beforeEach(() => {
  for (const table of ['upload', 'assignment', 'step', 'game', 'player']) {
    getDb().exec(`DELETE FROM ${table}`)
  }
  vi.mocked(broadcast).mockReset()
})

describe('assignAll', () => {
  it('gives every person a different theory and nine different words in total', () => {
    const ids = createPlayers(3)
    assignAll(seededRandom(1))
    const mine = ids.map((id) => getMyPreparation(id))
    expect(new Set(mine.map((entry) => entry.theory)).size).toBe(3)
    expect(mine.every((entry) => theories.includes(entry.theory))).toBe(true)
    const allWords = mine.flatMap((entry) => entry.words)
    expect(allWords).toHaveLength(9)
    expect(new Set(allWords).size).toBe(9)
    expect(allWords.every((word) => words.includes(word))).toBe(true)
  })

  it('never reassigns', () => {
    const ids = createPlayers(3)
    assignAll(seededRandom(1))
    const before = ids.map((id) => getMyPreparation(id))
    assignAll(seededRandom(2))
    expect(ids.map((id) => getMyPreparation(id))).toEqual(before)
  })

  it('gives 21 people three different words each and unique theories', () => {
    const ids = createPlayers(21)
    assignAll(seededRandom(3))
    const mine = ids.map((id) => getMyPreparation(id))
    expect(mine.every((entry) => new Set(entry.words).size === 3)).toBe(true)
    expect(new Set(mine.map((entry) => entry.theory)).size).toBe(21)
    expect(new Set(mine.flatMap((entry) => entry.words)).size).toBe(63)
  })

  it('runs when the game advances to the preparation step', () => {
    const ids = startedGame(2)
    expect(serverPhases.preparation?.enter).toBeTypeOf('function')
    expect(() => getMyPreparation(ids[0]!)).toThrow()
    advanceStep(0)
    expect(getMyPreparation(ids[0]!).words).toHaveLength(3)
    expect(getMyPreparation(ids[1]!).words).toHaveLength(3)
  })
})

describe('saveSpeech', () => {
  it('trims and stores the text', () => {
    const [id] = startedGame(1)
    advanceStep(0)
    saveSpeech(id!, '  Liebe Mitbürger  ')
    expect(getMyPreparation(id!).speech).toBe('Liebe Mitbürger')
  })

  it('deletes the speech with an empty text', () => {
    const [id] = startedGame(1)
    advanceStep(0)
    saveSpeech(id!, 'Text')
    saveSpeech(id!, '   ')
    expect(getMyPreparation(id!).speech).toBeNull()
  })

  it('accepts 5000 and rejects 5001 characters', async () => {
    const [id] = startedGame(1)
    advanceStep(0)
    expect(() => saveSpeech(id!, 'a'.repeat(5000))).not.toThrow()
    const error = await catchError(() => saveSpeech(id!, 'a'.repeat(5001)))
    expect(error).toMatchObject({ statusCode: 400, statusMessage: 'Der Redetext darf höchstens 5000 Zeichen haben.' })
    expect(getMyPreparation(id!).speech).toHaveLength(5000)
  })
})

describe('preparation is running', () => {
  const NOT_RUNNING = { statusCode: 409, statusMessage: 'Die Vorbereitung läuft gerade nicht.' }

  it('rejects speech and upload before the game starts', async () => {
    const [id] = createPlayers(1)
    expect(await catchError(() => saveSpeech(id!, 'Text'))).toMatchObject(NOT_RUNNING)
    expect(await catchError(() => savePresentation(id!, { filename: 'a.pdf', data: PDF }))).toMatchObject(NOT_RUNNING)
  })

  it('rejects speech and upload after the preparation step and changes nothing', async () => {
    const [id] = startedGame(1)
    advanceStep(0)
    saveSpeech(id!, 'Vorher')
    advanceStep(1)
    expect(await catchError(() => saveSpeech(id!, 'Nachher'))).toMatchObject(NOT_RUNNING)
    expect(await catchError(() => savePresentation(id!, { filename: 'a.pdf', data: PDF }))).toMatchObject(NOT_RUNNING)
    expect(getMyPreparation(id!).speech).toBe('Vorher')
    expect(getUpload(id!)).toBeNull()
  })
})

describe('getMyPreparation', () => {
  it('exposes exactly theory, words, upload and speech', async () => {
    const [id] = startedGame(1)
    advanceStep(0)
    await savePresentation(id!, { filename: 'a.pdf', data: PDF })
    const mine = getMyPreparation(id!)
    expect(Object.keys(mine).sort()).toEqual(['speech', 'theory', 'upload', 'words'])
    expect(Object.keys(mine.upload!).sort()).toEqual(['name', 'size'])
  })

  it('has no upload and no speech at first', () => {
    const [id] = startedGame(1)
    advanceStep(0)
    expect(getMyPreparation(id!)).toMatchObject({ upload: null, speech: null })
  })
})

describe('getPreparationOverview', () => {
  it('lists people in creation order with upload and speech flag but no secrets', async () => {
    const ids = startedGame(3)
    advanceStep(0)
    await savePresentation(ids[1]!, { filename: 'ben.pdf', data: PDF })
    saveSpeech(ids[2]!, 'Text')
    const overview = getPreparationOverview()
    expect(overview.map((entry) => entry.name)).toEqual(['Person 1', 'Person 2', 'Person 3'])
    expect(overview.map((entry) => entry.upload)).toEqual([null, { name: 'ben.pdf', size: PDF.length }, null])
    expect(overview.map((entry) => entry.hasSpeech)).toEqual([false, false, true])
    expect(Object.keys(overview[0]!).sort()).toEqual(['hasSpeech', 'id', 'name', 'upload'])
  })
})

describe('live signal', () => {
  it('broadcasts after an upload and after saving the speech', async () => {
    const [id] = startedGame(1)
    advanceStep(0)
    vi.mocked(broadcast).mockClear()
    await savePresentation(id!, { filename: 'a.pdf', data: PDF })
    expect(broadcast).toHaveBeenCalledTimes(1)
    saveSpeech(id!, 'Text')
    expect(broadcast).toHaveBeenCalledTimes(2)
  })
})
