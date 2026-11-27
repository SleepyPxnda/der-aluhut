<script setup lang="ts">
import { formatMegabytes, usePlayerPreparation } from './usePreparation'

await useGame()
const { data, pending, errorMessage, refresh, upload, saveSpeech } = usePlayerPreparation()

const selectedFile = ref<File | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)
const speechText = ref('')
const speechLoaded = ref(false)
const speechSaved = ref(false)

watch(
  data,
  (loaded) => {
    if (loaded && !speechLoaded.value) {
      speechText.value = loaded.speech ?? ''
      speechLoaded.value = true
    }
  },
  { immediate: true },
)

function pickFile(event: Event) {
  selectedFile.value = (event.target as HTMLInputElement).files?.[0] ?? null
  upload.error.value = null
}

async function sendFile() {
  if (!selectedFile.value) {
    return
  }
  if (await upload.execute(selectedFile.value)) {
    selectedFile.value = null
    if (fileInput.value) {
      fileInput.value.value = ''
    }
  }
}

async function sendSpeech() {
  if (await saveSpeech.execute(speechText.value)) {
    speechText.value = speechText.value.trim()
    speechSaved.value = true
  }
}
</script>

<template>
  <p v-if="pending" class="say loading raised">Lädt …<span class="caret" /></p>
  <template v-else-if="errorMessage">
    <p class="err say raised" role="alert">{{ errorMessage }}</p>
    <button class="btn secondary raised" type="button" @click="refresh()">Nochmal versuchen</button>
  </template>
  <div v-else-if="data" class="prep raised">
    <h1 class="prep-title">Vorbereitung</h1>
    <section class="panel">
      <h2>Deine Theorie</h2>
      <p class="theory">{{ data.theory }}</p>
    </section>
    <section class="panel">
      <h2>Deine Pflichtwörter</h2>
      <ol class="words">
        <li v-for="word in data.words" :key="word">{{ word }}</li>
      </ol>
      <p class="secret">Bau alle drei Wörter in deine Präsentation ein. Verrat sie niemandem.</p>
    </section>
    <section class="panel">
      <h2>Deine Präsentation</h2>
      <p v-if="data.upload" class="file-status has">
        Hochgeladen: {{ data.upload.name }} ({{ formatMegabytes(data.upload.size) }} MB)
      </p>
      <p v-else class="file-status">Noch keine Datei hochgeladen.</p>
      <div class="pick" :class="{ disabled: upload.pending.value }">
        <label class="pick-label">
          Datei wählen
          <input
            ref="fileInput"
            class="sr-only"
            type="file"
            accept=".pdf,.pptx,.odp,.key"
            :disabled="upload.pending.value"
            @change="pickFile"
          />
        </label>
        <span class="pick-name">{{ selectedFile?.name ?? 'Keine Datei ausgewählt' }}</span>
        <p class="hint">PDF, PPTX, ODP oder KEY, höchstens 50 MB.</p>
      </div>
      <p v-if="upload.error.value" class="err" role="alert">{{ upload.error.value }}</p>
      <button
        class="btn wide"
        :class="{ secondary: data.upload }"
        type="button"
        :disabled="upload.pending.value || !selectedFile"
        @click="sendFile"
      >
        {{ upload.pending.value ? 'Lädt hoch …' : data.upload ? 'Andere Datei hochladen' : 'Hochladen' }}
      </button>
    </section>
    <section class="panel">
      <h2>Redetext (optional)</h2>
      <div class="field">
        <textarea
          v-model="speechText"
          rows="6"
          aria-label="Redetext"
          :class="{ invalid: saveSpeech.error.value }"
          :aria-invalid="saveSpeech.error.value ? 'true' : undefined"
          @input="speechSaved = false"
        />
        <p class="hint">Nur du siehst ihn.</p>
      </div>
      <p v-if="saveSpeech.error.value" class="err" role="alert">{{ saveSpeech.error.value }}</p>
      <p v-else-if="speechSaved" class="ok-message">Gespeichert.</p>
      <button class="btn wide" type="button" :disabled="saveSpeech.pending.value" @click="sendSpeech">
        {{ saveSpeech.pending.value ? 'Speichert …' : 'Speichern' }}
      </button>
    </section>
  </div>
</template>
