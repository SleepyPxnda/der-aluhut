import type { EventStream, H3Event } from 'h3'

const clients = new Set<EventStream>()

export function addClient(event: H3Event) {
  const stream = createEventStream(event)
  clients.add(stream)
  stream.onClosed(() => {
    clients.delete(stream)
  })
  return stream.send()
}

export function broadcast(): void {
  for (const stream of clients) {
    stream.push('changed').catch(() => clients.delete(stream))
  }
}
