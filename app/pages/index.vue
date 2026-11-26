<script setup lang="ts">
const route = useRoute()
const { me, pending, errorMessage, join } = await useGame()
const token = typeof route.query.t === 'string' ? route.query.t : ''

if (!token && me.value) {
  await navigateTo('/play', { replace: true })
}

async function joinWithToken() {
  await join.execute(token)
  if (!join.error.value) {
    await navigateTo('/play', { replace: true })
  }
}

onMounted(() => {
  if (token) {
    joinWithToken()
  }
})
</script>

<template>
  <section class="hero">
    <span class="stamp" aria-hidden="true">STRENG GEHEIM</span>
    <BrandAluhutHat class="bighat" />
    <p class="wordmark">Der Aluhut<span>Vertrauliche Akte</span></p>
    <p v-if="token && !join.error.value" class="say loading">Du wirst angemeldet …<span class="caret" /></p>
    <p v-else-if="join.error.value" class="err say" role="alert">{{ join.error.value }}</p>
    <p v-else-if="pending" class="say loading">Lädt …<span class="caret" /></p>
    <p v-else-if="errorMessage" class="err say" role="alert">{{ errorMessage }}</p>
    <p v-else class="say">Öffne den persönlichen Link, den du vom Admin bekommen hast.</p>
  </section>
</template>
