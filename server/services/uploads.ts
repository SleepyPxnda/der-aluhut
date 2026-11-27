import { randomUUID } from 'node:crypto'
import { createReadStream, mkdtempSync } from 'node:fs'
import { mkdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { basename, extname, join } from 'node:path'
import type { UploadInfo } from '../../shared/types'
import { getDb } from '../utils/db'

export const MAX_UPLOAD_BYTES = 50 * 1024 * 1024

const ZIP_SIGNATURE = Buffer.from([0x50, 0x4b, 0x03, 0x04])
const PDF_SIGNATURE = Buffer.from('%PDF-')

const SIGNATURES: Record<string, Buffer> = {
  '.pdf': PDF_SIGNATURE,
  '.pptx': ZIP_SIGNATURE,
  '.odp': ZIP_SIGNATURE,
  '.key': ZIP_SIGNATURE,
}

let root: string | undefined

function uploadRoot(): string {
  root ??= process.env.VITEST ? mkdtempSync(join(tmpdir(), 'aluhut-uploads-')) : join('data', 'uploads')
  return root
}

export function assertUploadSize(contentLength: string | number | undefined): void {
  const size = contentLength === undefined || contentLength === '' ? Number.NaN : Number(contentLength)
  if (!Number.isFinite(size) || size > MAX_UPLOAD_BYTES) {
    throw createError({ statusCode: 413, statusMessage: 'Die Datei ist größer als 50 MB.' })
  }
}

export function validateFile(name: string, data: Buffer): string {
  const extension = extname(name).toLowerCase()
  const signature = SIGNATURES[extension]
  if (!signature || !data.subarray(0, signature.length).equals(signature)) {
    throw createError({ statusCode: 400, statusMessage: 'Erlaubt sind PDF, PPTX, ODP und KEY.' })
  }
  return extension
}

function toUploadInfo(row: Record<string, unknown>): UploadInfo {
  return { name: row.name as string, size: row.size as number }
}

export function getUpload(playerId: string): UploadInfo | null {
  const row = getDb().prepare('SELECT name, size FROM upload WHERE player_id = ?').get(playerId)
  return row ? toUploadInfo(row) : null
}

export async function storeUpload(playerId: string, name: string, data: Buffer): Promise<UploadInfo> {
  assertUploadSize(data.length)
  const displayName = basename(name.replaceAll('\\', '/'))
  const extension = validateFile(displayName, data)
  const directory = join(uploadRoot(), playerId)
  const path = join(directory, `${randomUUID()}${extension}`)
  await mkdir(directory, { recursive: true })
  await writeFile(path, data)
  const db = getDb()
  const previous = db.prepare('SELECT path FROM upload WHERE player_id = ?').get(playerId)
  db.prepare(
    `INSERT INTO upload (player_id, path, name, size, uploaded_at) VALUES (?, ?, ?, ?, ?)
     ON CONFLICT (player_id) DO UPDATE SET path = excluded.path, name = excluded.name, size = excluded.size, uploaded_at = excluded.uploaded_at`,
  ).run(playerId, path, displayName, data.length, new Date().toISOString())
  if (previous) {
    await rm(previous.path as string, { force: true })
  }
  return { name: displayName, size: data.length }
}

export function openUpload(playerId: string) {
  const row = getDb().prepare('SELECT path, name, size FROM upload WHERE player_id = ?').get(playerId)
  if (!row) {
    throw createError({ statusCode: 404, statusMessage: 'Diese Datei gibt es nicht.' })
  }
  return { ...toUploadInfo(row), stream: createReadStream(row.path as string) }
}
