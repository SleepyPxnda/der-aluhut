<script setup lang="ts">
import { stepLabel } from '../../../shared/phases'
import type { CurrentStep } from '../../../shared/types'

const props = defineProps<{
  steps: CurrentStep[]
  currentIndex: number | null
  starting: boolean
  startError: string | null
  advancing: boolean
  advanceError: string | null
}>()
const emit = defineEmits<{ start: []; advance: [from: number] }>()

const confirming = ref(false)

const current = computed(() => (props.currentIndex === null ? null : (props.steps[props.currentIndex] ?? null)))
const next = computed(() => (props.currentIndex === null ? null : (props.steps[props.currentIndex + 1] ?? null)))

function confirmStart() {
  confirming.value = false
  emit('start')
}
</script>

<template>
  <section class="panel">
    <h2>Spielablauf</h2>
    <template v-if="current && currentIndex !== null">
      <div class="step">
        <p class="step-count">Schritt {{ currentIndex + 1 }} von {{ steps.length }}</p>
        <p class="step-now">{{ stepLabel(current) }}</p>
      </div>
      <p class="step-next">{{ next ? `Als Nächstes: ${stepLabel(next)}` : 'Das ist der letzte Schritt.' }}</p>
      <p v-if="advanceError" class="err" role="alert">{{ advanceError }}</p>
      <button class="btn wide" type="button" :disabled="advancing || !next" @click="emit('advance', currentIndex)">
        {{ advancing ? 'Schaltet weiter …' : 'Weiter' }}
      </button>
    </template>
    <template v-else>
      <p class="hint">
        Gestartet wird mit der festen Phasenfolge. Die Reihenfolge der Sprechenden wird beim Start ausgelost.
      </p>
      <p v-if="startError" class="err" role="alert">{{ startError }}</p>
      <button class="btn wide" type="button" :disabled="starting" @click="confirming = true">
        {{ starting ? 'Startet …' : 'Spiel starten' }}
      </button>
    </template>
    <div v-if="confirming" class="scrim">
      <div class="dialog" role="dialog" aria-modal="true" aria-labelledby="start-question">
        <p id="start-question"><strong>Spiel starten?</strong> Danach kannst du Spielende nicht mehr ändern.</p>
        <div class="inline">
          <button class="btn secondary" type="button" @click="confirming = false">Abbrechen</button>
          <button class="btn" type="button" @click="confirmStart">Starten</button>
        </div>
      </div>
    </div>
  </section>
</template>
