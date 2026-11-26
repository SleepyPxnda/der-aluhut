<script setup lang="ts">
const { me, pending, errorMessage, refresh } = useGame()

watch(
  [pending, me, errorMessage],
  () => {
    if (!pending.value && !errorMessage.value && !me.value) {
      navigateTo('/', { replace: true })
    }
  },
  { immediate: true },
)
</script>

<template>
  <section class="panel">
    <p v-if="pending" class="loading">Lädt …<span class="caret" /></p>
    <template v-else-if="errorMessage">
      <p class="err" role="alert">{{ errorMessage }}</p>
      <button class="btn secondary wide" type="button" @click="refresh()">Nochmal versuchen</button>
    </template>
    <template v-else-if="me">
      <h1>Hallo, {{ me.name }}!</h1>
      <p>Warte, bis das Spiel startet.</p>
    </template>
  </section>
</template>
