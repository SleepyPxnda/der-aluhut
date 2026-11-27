import { describe, expect, it } from 'vitest'
import theories from './theories.json'
import words from './words.json'

function expectCleanList(list: string[], minimum: number) {
  expect(list.length).toBeGreaterThanOrEqual(minimum)
  expect(list.every((entry) => typeof entry === 'string' && entry.trim() !== '')).toBe(true)
  expect(new Set(list).size).toBe(list.length)
}

describe('content lists', () => {
  it('has at least 20 distinct theories', () => {
    expectCleanList(theories, 20)
  })

  it('has at least 60 distinct words', () => {
    expectCleanList(words, 60)
  })
})
