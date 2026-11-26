import type { GameState, PublicPlayer } from '../../shared/types'

export async function useGame() {
  const { data, pending, error, refresh } = await useFetch<GameState>('/api/state', {
    key: 'game-state',
  })
  const me = computed(() => data.value?.me ?? null)
  const errorMessage = computed(() => {
    if (!error.value) {
      return null
    }
    return (error.value.data as { statusMessage?: string } | undefined)?.statusMessage ?? 'Der Zustand konnte nicht geladen werden.'
  })
  const join = useAction(async (token: string) => {
    await $fetch<PublicPlayer>('/api/players/join', { method: 'POST', body: { token } })
    await refresh()
  })
  return { me, pending, errorMessage, refresh, join }
}
