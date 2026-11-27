<script setup lang="ts">
import { clientPhases } from '~/phases/registry'

const { me, step, pending, errorMessage, connectionLost, refresh } = await useGame()

const PlayerView = computed(() => (step.value ? (clientPhases[step.value.phaseId]?.PlayerView ?? null) : null))

if (!pending.value && !errorMessage.value && !me.value) {
  await navigateTo('/', { replace: true })
}
</script>

<template>
  <div class="page">
  <div class="top">
    <BrandAppBar title="Der Aluhut" :tag="me?.name ?? '…'" />
    <GameConnectionHint v-if="connectionLost" />
  </div>
  <section class="hero">
    <svg class="thread" viewBox="0 0 360 500" preserveAspectRatio="none" aria-hidden="true">
      <path d="M30 40 L180 150 L330 70 M180 150 L60 420 M180 150 L310 400" stroke="#c4302a" stroke-width="2" fill="none" opacity=".55" />
      <circle cx="30" cy="40" r="6" fill="#a3201a" />
      <circle cx="330" cy="70" r="6" fill="#a3201a" />
      <circle cx="60" cy="420" r="6" fill="#a3201a" />
      <circle cx="310" cy="400" r="6" fill="#a3201a" />
    </svg>
    <BrandAluhutHat class="bighat raised" />
    <p v-if="pending" class="say loading raised">Lädt …<span class="caret" /></p>
    <template v-else-if="errorMessage">
      <p class="err say raised" role="alert">{{ errorMessage }}</p>
      <button class="btn secondary raised" type="button" @click="refresh()">Nochmal versuchen</button>
    </template>
    <template v-else-if="me && step">
      <component :is="PlayerView" v-if="PlayerView" />
      <GamePhaseFallback v-else />
    </template>
    <template v-else-if="me">
      <p class="say note raised"><strong>Hallo, {{ me.name }}!</strong>Warte, bis das Spiel startet.</p>
      <p class="deco raised" aria-hidden="true">Du wirst beobachtet. <span class="redact">Von wem</span></p>
    </template>
  </section>
  </div>
</template>
