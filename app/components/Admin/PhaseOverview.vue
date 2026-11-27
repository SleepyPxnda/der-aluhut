<script setup lang="ts">
import type { PhaseInfo } from '../../../shared/phases'

defineProps<{ catalog: PhaseInfo[] }>()
</script>

<template>
  <section class="panel">
    <h2>Phasenfolge</h2>
    <ol class="phases">
      <li v-for="(phase, index) in catalog" :key="phase.id" class="phase">
        <span class="phase-label">
          <span class="phase-text">{{ phase.label }}</span>
          <span v-if="index === 0" class="mark">Start</span>
          <span v-if="phase.perSpeaker" class="mark each">je Person</span>
          <span v-if="index === catalog.length - 1" class="mark end">Ende</span>
        </span>
      </li>
    </ol>
    <p class="hint">Präsentation und Befragung laufen für jede Person einmal, in der beim Start ausgelosten Reihenfolge.</p>
  </section>
</template>
