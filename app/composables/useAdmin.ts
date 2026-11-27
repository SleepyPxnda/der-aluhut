import type { AdminPlayer, GameProgress, GameSetup } from '../../shared/types'

interface FetchFailure {
  statusCode?: number
  data?: { statusMessage?: string }
  statusMessage?: string
}

export function useAdmin() {
  const setup = ref<GameSetup | null>(null)
  const needsLogin = ref(false)
  const loading = ref(true)
  const loadError = ref<string | null>(null)

  async function load() {
    loading.value = true
    loadError.value = null
    try {
      setup.value = await $fetch<GameSetup>('/api/game/setup')
      needsLogin.value = false
    } catch (failure) {
      if ((failure as FetchFailure).statusCode === 401) {
        needsLogin.value = true
      } else {
        loadError.value = errorMessageOf(failure)
      }
    } finally {
      loading.value = false
    }
  }

  const login = useAction(async (password: string) => {
    await $fetch('/api/admin/login', { method: 'POST', body: { password } })
    await load()
  })

  const addPlayer = useAction(async (name: string) => {
    const player = await $fetch<AdminPlayer>('/api/players/create', { method: 'POST', body: { name } })
    setup.value?.players.push(player)
    return player
  })

  const removePlayer = useAction(async (id: string) => {
    await $fetch('/api/players/delete', { method: 'POST', body: { id } })
    if (setup.value) {
      setup.value.players = setup.value.players.filter((player) => player.id !== id)
    }
  })

  async function reloadAfterConflict(failure: unknown) {
    if ((failure as FetchFailure).statusCode === 409) {
      await $fetch<GameSetup>('/api/game/setup').then(
        (fresh) => {
          setup.value = fresh
        },
        () => undefined,
      )
    }
  }

  function takeProgress(progress: GameProgress) {
    if (setup.value) {
      setup.value.steps = progress.steps
      setup.value.currentIndex = progress.currentIndex
    }
  }

  const startGame = useAction(async () => {
    try {
      takeProgress(await $fetch<GameProgress>('/api/game/start', { method: 'POST' }))
    } catch (failure) {
      await reloadAfterConflict(failure)
      throw failure
    }
  })

  const advance = useAction(async (from: number) => {
    try {
      takeProgress(await $fetch<GameProgress>('/api/game/advance', { method: 'POST', body: { from } }))
    } catch (failure) {
      await reloadAfterConflict(failure)
      throw failure
    }
  })

  return {
    setup,
    needsLogin,
    loading,
    loadError,
    load,
    login,
    addPlayer,
    removePlayer,
    startGame,
    advance,
  }
}
