import { createHash, timingSafeEqual } from 'node:crypto'
import type { H3Event } from 'h3'

interface SessionData {
  admin?: true
  playerId?: string
}

function hash(value: string): Buffer {
  return createHash('sha256').update(value).digest()
}

export function checkAdminPassword(input: string, configured: string | undefined): void {
  if (!configured) {
    throw createError({ statusCode: 500, statusMessage: 'Das Admin-Passwort ist nicht gesetzt.' })
  }
  if (!timingSafeEqual(hash(input), hash(configured))) {
    throw createError({ statusCode: 401, statusMessage: 'Falsches Passwort.' })
  }
}

function openSession(event: H3Event) {
  return useSession<SessionData>(event, { password: useRuntimeConfig(event).sessionPassword })
}

export async function loginAdmin(event: H3Event, password: string): Promise<void> {
  checkAdminPassword(password, useRuntimeConfig(event).adminPassword)
  const session = await openSession(event)
  await session.update({ admin: true })
}

export async function requireAdmin(event: H3Event): Promise<void> {
  const session = await openSession(event)
  if (!session.data.admin) {
    throw createError({ statusCode: 401, statusMessage: 'Bitte melde dich als Admin an.' })
  }
}

export async function setSessionPlayer(event: H3Event, playerId: string): Promise<void> {
  const session = await openSession(event)
  await session.update({ playerId })
}

export async function getSessionPlayerId(event: H3Event): Promise<string | null> {
  const session = await openSession(event)
  return session.data.playerId ?? null
}
