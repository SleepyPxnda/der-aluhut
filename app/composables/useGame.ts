import type { GameState, PublicPlayer } from '../../shared/types'

const STATE_KEY = 'game-state'
const RECONNECT_DELAY_MS = 2000

let source: EventSource | undefined
let users = 0

function reloadState() {
  return refreshNuxtData()
}

function openConnection(connectionLost: Ref<boolean>) {
  source = new EventSource('/api/events')
  source.onmessage = () => {
    reloadState()
  }
  source.onopen = () => {
    if (connectionLost.value) {
      connectionLost.value = false
      reloadState()
    }
  }
  source.onerror = () => {
    connectionLost.value = true
    if (source?.readyState === EventSource.CLOSED) {
      source = undefined
      setTimeout(() => {
        if (users > 0 && !source) {
          openConnection(connectionLost)
        }
      }, RECONNECT_DELAY_MS)
    }
  }
}

export async function useGame() {
  const connectionLost = useState('game-connection-lost', () => false)
  onMounted(() => {
    users++
    if (!source) {
      openConnection(connectionLost)
    }
  })
  onBeforeUnmount(() => {
    users--
    if (users === 0) {
      source?.close()
      source = undefined
      connectionLost.value = false
    }
  })
  const { data, status, error, refresh } = await useFetch<GameState>('/api/state', {
    key: STATE_KEY,
    getCachedData: (key, nuxtApp, context) =>
      context.cause === 'initial' ? (nuxtApp.payload.data[key] as GameState | undefined) : undefined,
  })
  const me = computed(() => data.value?.me ?? null)
  const step = computed(() => data.value?.step ?? null)
  const pending = computed(() => status.value === 'pending' && !data.value)
  const errorMessage = computed(() => {
    if (!error.value || data.value) {
      return null
    }
    return (error.value.data as { statusMessage?: string } | undefined)?.statusMessage ?? 'Der Zustand konnte nicht geladen werden.'
  })
  const join = useAction(async (token: string) => {
    await $fetch<PublicPlayer>('/api/players/join', { method: 'POST', body: { token } })
    await refresh()
  })
  return { me, step, pending, errorMessage, connectionLost, refresh, join }
}
