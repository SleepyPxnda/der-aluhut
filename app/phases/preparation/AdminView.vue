<script setup lang="ts">
import { formatMegabytes, useAdminPreparation } from './usePreparation'

await useGame()
const { data, pending, errorMessage, refresh } = useAdminPreparation()

const uploadedCount = computed(() => data.value?.filter((entry) => entry.upload).length ?? 0)
</script>

<template>
  <section class="panel">
    <h2>Vorbereitung</h2>
    <p v-if="pending" class="loading">Lädt …<span class="caret" /></p>
    <template v-else-if="errorMessage">
      <p class="err" role="alert">{{ errorMessage }}</p>
      <button class="btn secondary wide" type="button" @click="refresh()">Nochmal versuchen</button>
    </template>
    <template v-else-if="data">
      <p class="counter">
        {{ uploadedCount }} von {{ data.length }} {{ uploadedCount === 1 ? 'hat' : 'haben' }} eine Datei hochgeladen.
      </p>
      <ul class="players">
        <li v-for="(entry, index) in data" :key="entry.id">
          <span class="player-name">
            {{ entry.name }}
            <span class="no" aria-hidden="true">Subjekt {{ String(index + 1).padStart(2, '0') }}</span>
          </span>
          <span v-if="entry.upload" class="file-line">
            {{ entry.upload.name }} ({{ formatMegabytes(entry.upload.size) }} MB)
          </span>
          <span v-else class="file-line none">Noch keine Datei</span>
          <div class="prep-row">
            <span class="speech-flag" :class="{ no: !entry.hasSpeech }">
              Redetext: {{ entry.hasSpeech ? 'ja' : 'nein' }}
            </span>
            <a
              v-if="entry.upload"
              class="btn secondary"
              :href="`/api/preparation/download?playerId=${encodeURIComponent(entry.id)}`"
              download
            >
              Herunterladen
            </a>
          </div>
        </li>
      </ul>
    </template>
  </section>
</template>
