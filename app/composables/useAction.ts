interface FetchFailure {
  data?: { statusMessage?: string }
  statusMessage?: string
}

export function errorMessageOf(failure: unknown): string {
  const { data, statusMessage } = failure as FetchFailure
  return data?.statusMessage ?? statusMessage ?? 'Etwas ist schiefgegangen. Versuch es nochmal.'
}

export function useAction<Args extends unknown[], Result>(run: (...args: Args) => Promise<Result>) {
  const pending = ref(false)
  const error = ref<string | null>(null)
  async function execute(...args: Args): Promise<Result | undefined> {
    pending.value = true
    error.value = null
    try {
      return await run(...args)
    } catch (failure) {
      error.value = errorMessageOf(failure)
      return undefined
    } finally {
      pending.value = false
    }
  }
  return { pending, error, execute }
}
