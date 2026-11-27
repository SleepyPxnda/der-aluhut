<script setup lang="ts">
import { phaseLabel } from '../../../shared/phases'

const { me, step } = await useGame()
const isMe = computed(() => !!step.value?.speaker && step.value.speaker.id === me.value?.id)
</script>

<template>
  <p v-if="step" class="say note raised">
    <strong>{{ phaseLabel(step.phaseId) }}</strong>
    <span v-if="step.speaker" class="speaker">{{ isMe ? 'Du bist dran.' : `Es spricht: ${step.speaker.name}` }}</span>
    <span class="wait">Warte, bis der Admin weiterschaltet.</span>
  </p>
</template>
