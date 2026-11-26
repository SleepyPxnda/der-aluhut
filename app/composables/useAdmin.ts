import type { PhaseId } from '../../shared/phases'
import type { AdminPlayer, GameSetup } from '../../shared/types'

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

  const savePhases = useAction(async (phaseOrder: PhaseId[]) => {
    const saved = await $fetch<{ phaseOrder: PhaseId[] }>('/api/game/update-phases', {
      method: 'POST',
      body: { phaseOrder },
    })
    if (setup.value) {
      setup.value.phaseOrder = saved.phaseOrder
    }
  })

  return { setup, needsLogin, loading, loadError, load, login, addPlayer, removePlayer, savePhases }
}
