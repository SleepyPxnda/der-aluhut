<script setup lang="ts">
interface JoinFailure {
  data?: { statusMessage?: string }
  statusMessage?: string
}

const route = useRoute()
const { me, pending, errorMessage, refresh } = useGame()
const token = typeof route.query.t === 'string' ? route.query.t : ''
const joining = ref(token !== '')
const joinError = ref<string | null>(null)

if (!token && me.value) {
  await navigateTo('/play', { replace: true })
}

async function join() {
  try {
    await $fetch('/api/players/join', { method: 'POST', body: { token } })
    await refresh()
    await navigateTo('/play', { replace: true })
  } catch (failure) {
    const { data, statusMessage } = failure as JoinFailure
    joinError.value = data?.statusMessage ?? statusMessage ?? 'Die Anmeldung ist fehlgeschlagen.'
    joining.value = false
  }
}

onMounted(() => {
  if (token) {
    join()
  } else if (me.value) {
    navigateTo('/play', { replace: true })
  }
})
</script>

<template>
  <section class="panel">
    <h1>Willkommen</h1>
    <p v-if="joining" class="loading">Du wirst angemeldet …<span class="caret" /></p>
    <p v-else-if="joinError" class="err" role="alert">{{ joinError }}</p>
    <p v-else-if="pending" class="loading">Lädt …<span class="caret" /></p>
    <p v-else-if="errorMessage" class="err" role="alert">{{ errorMessage }}</p>
    <p v-else>Öffne den persönlichen Link, den du vom Admin bekommen hast.</p>
  </section>
</template>
