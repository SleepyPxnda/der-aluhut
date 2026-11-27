import type { MyPreparation, PreparationOverviewEntry, UploadInfo } from '../../../shared/types'

const MAX_UPLOAD_BYTES = 50 * 1024 * 1024
const ALLOWED_EXTENSIONS = ['.pdf', '.pptx', '.odp', '.key']

export function formatMegabytes(size: number): string {
  return (size / (1024 * 1024)).toFixed(1).replace('.', ',')
}

function loadState(data: Readonly<Ref<unknown>>, status: Readonly<Ref<string>>, error: Readonly<Ref<unknown>>) {
  const pending = computed(() => status.value === 'pending' && !data.value)
  const errorMessage = computed(() => (error.value && !data.value ? errorMessageOf(error.value) : null))
  return { pending, errorMessage }
}

export function usePlayerPreparation() {
  const { data, status, error, refresh } = useFetch<MyPreparation>('/api/preparation/mine', {
    key: 'preparation-mine',
  })
  const upload = useAction(async (file: File) => {
    const name = file.name.toLowerCase()
    if (!ALLOWED_EXTENSIONS.some((extension) => name.endsWith(extension))) {
      throw createError({ statusCode: 400, statusMessage: 'Erlaubt sind PDF, PPTX, ODP und KEY.' })
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      throw createError({ statusCode: 413, statusMessage: 'Die Datei ist größer als 50 MB.' })
    }
    const body = new FormData()
    body.append('file', file)
    await $fetch<UploadInfo>('/api/preparation/upload', { method: 'POST', body })
    await refresh()
    return true
  })
  const saveSpeech = useAction(async (text: string) => {
    await $fetch('/api/preparation/speech', { method: 'POST', body: { text } })
    await refresh()
    return true
  })
  return {
    data,
    refresh,
    ...loadState(data, status, error),
    upload,
    saveSpeech,
  }
}

export function useAdminPreparation() {
  const { data, status, error, refresh } = useFetch<PreparationOverviewEntry[]>('/api/preparation/overview', {
    key: 'preparation-overview',
  })
  return {
    data,
    refresh,
    ...loadState(data, status, error),
  }
}
