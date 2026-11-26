import type { GameState } from '../../shared/types'

export function useGame() {
  const { data, pending, error, refresh } = useFetch<GameState>('/api/state', {
    key: 'game-state',
    getCachedData: () => undefined,
  })
  const me = computed(() => data.value?.me ?? null)
  const errorMessage = computed(() => {
    if (!error.value) {
      return null
    }
    return (error.value.data as { statusMessage?: string } | undefined)?.statusMessage ?? 'Der Zustand konnte nicht geladen werden.'
  })
  return { me, pending, errorMessage, refresh }
}
