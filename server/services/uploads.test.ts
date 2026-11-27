import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { dirname, basename } from 'node:path'
import { beforeEach, describe, expect, it } from 'vitest'
import { getDb } from '../utils/db'
import { assertUploadSize, getUpload, openUpload, storeUpload, validateFile } from './uploads'

const PDF = Buffer.from('%PDF-1.7 inhalt')
const ZIP = Buffer.from([0x50, 0x4b, 0x03, 0x04, 1, 2, 3])

function storedPath(playerId: string): string {
  return getDb().prepare('SELECT path FROM upload WHERE player_id = ?').get(playerId)!.path as string
}

async function catchError(run: () => unknown): Promise<{ statusCode: number; statusMessage: string }> {
  try {
    await run()
  } catch (error) {
    return error as { statusCode: number; statusMessage: string }
  }
  throw new Error('No error thrown')
}

beforeEach(() => {
  getDb().exec('DELETE FROM upload')
})

describe('storeUpload', () => {
  it('stores the file and records name and size', async () => {
    const info = await storeUpload('anna', 'mondlandung.pdf', PDF)
    expect(info).toEqual({ name: 'mondlandung.pdf', size: PDF.length })
    expect(getUpload('anna')).toEqual(info)
    expect(await readFile(storedPath('anna'))).toEqual(PDF)
  })

  it('replaces an earlier upload and deletes the old file', async () => {
    await storeUpload('anna', 'alt.pdf', PDF)
    const oldPath = storedPath('anna')
    await storeUpload('anna', 'neu.pptx', ZIP)
    expect(existsSync(oldPath)).toBe(false)
    expect(getUpload('anna')).toEqual({ name: 'neu.pptx', size: ZIP.length })
    expect(existsSync(storedPath('anna'))).toBe(true)
  })

  it('accepts upper case extensions', async () => {
    expect((await storeUpload('anna', 'FOLIEN.KEY', ZIP)).name).toBe('FOLIEN.KEY')
  })

  it('keeps only the base name and stays inside the folder of the person', async () => {
    const info = await storeUpload('anna', '../../etc/passwd.pdf', PDF)
    expect(info.name).toBe('passwd.pdf')
    expect(basename(dirname(storedPath('anna')))).toBe('anna')
  })

  it('rejects a wrong extension and keeps the earlier upload', async () => {
    await storeUpload('anna', 'alt.pdf', PDF)
    const error = await catchError(() => storeUpload('anna', 'notizen.docx', ZIP))
    expect(error).toMatchObject({ statusCode: 400, statusMessage: 'Erlaubt sind PDF, PPTX, ODP und KEY.' })
    expect(getUpload('anna')).toEqual({ name: 'alt.pdf', size: PDF.length })
  })

  it('rejects a pdf extension with zip content and keeps the earlier upload', async () => {
    await storeUpload('anna', 'alt.pdf', PDF)
    const error = await catchError(() => storeUpload('anna', 'falsch.pdf', ZIP))
    expect(error.statusCode).toBe(400)
    expect(getUpload('anna')?.name).toBe('alt.pdf')
  })

  it('rejects a pptx extension with pdf content', async () => {
    expect((await catchError(() => storeUpload('anna', 'falsch.pptx', PDF))).statusCode).toBe(400)
    expect(getUpload('anna')).toBeNull()
  })
})

describe('validateFile', () => {
  it('returns the lower case extension', () => {
    expect(validateFile('A.ODP', ZIP)).toBe('.odp')
  })

  it('rejects empty data', async () => {
    expect((await catchError(() => validateFile('leer.pdf', Buffer.alloc(0)))).statusCode).toBe(400)
  })
})

describe('assertUploadSize', () => {
  it('accepts up to 50 MB', () => {
    expect(() => assertUploadSize('52428800')).not.toThrow()
  })

  it('rejects more than 50 MB with 413', async () => {
    const error = await catchError(() => assertUploadSize('52428801'))
    expect(error).toMatchObject({ statusCode: 413, statusMessage: 'Die Datei ist größer als 50 MB.' })
  })

  it('treats a missing size as too large', async () => {
    expect((await catchError(() => assertUploadSize(undefined))).statusCode).toBe(413)
  })
})

describe('openUpload', () => {
  it('opens the stored file with its original name', async () => {
    await storeUpload('anna', 'mondlandung.pdf', PDF)
    const opened = openUpload('anna')
    const chunks: Buffer[] = []
    for await (const chunk of opened.stream) {
      chunks.push(chunk as Buffer)
    }
    expect(opened.name).toBe('mondlandung.pdf')
    expect(Buffer.concat(chunks)).toEqual(PDF)
  })

  it('throws 404 without an upload', async () => {
    const error = await catchError(() => openUpload('ben'))
    expect(error).toMatchObject({ statusCode: 404, statusMessage: 'Diese Datei gibt es nicht.' })
  })
})
