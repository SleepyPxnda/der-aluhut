<script setup lang="ts">
import type { AdminPlayer } from '../../../shared/types'

const props = defineProps<{
  players: AdminPlayer[]
  adding: boolean
  addError: string | null
  removing: boolean
  removeError: string | null
}>()
const emit = defineEmits<{ add: [name: string]; remove: [id: string] }>()

const name = ref('')
const origin = ref('')
const copiedId = ref<string | null>(null)
const copyError = ref<string | null>(null)
const pendingRemoval = ref<AdminPlayer | null>(null)

onMounted(() => {
  origin.value = window.location.origin
})

function joinLink(player: AdminPlayer): string {
  return `${origin.value}/?t=${player.token}`
}

function copyWithFallback(text: string) {
  const field = document.createElement('textarea')
  field.value = text
  field.style.position = 'fixed'
  field.style.opacity = '0'
  document.body.appendChild(field)
  field.select()
  const copied = document.execCommand('copy')
  document.body.removeChild(field)
  if (!copied) {
    throw new Error('Kopieren nicht möglich')
  }
}

async function copyLink(player: AdminPlayer) {
  copyError.value = null
  try {
    const link = joinLink(player)
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(link)
    } else {
      copyWithFallback(link)
    }
    copiedId.value = player.id
  } catch {
    copyError.value = 'Der Link konnte nicht kopiert werden.'
  }
}

function submitName() {
  emit('add', name.value)
}

watch(
  () => props.adding,
  (isAdding) => {
    if (!isAdding && !props.addError) {
      name.value = ''
    }
  },
)

function confirmRemoval() {
  if (pendingRemoval.value) {
    emit('remove', pendingRemoval.value.id)
    pendingRemoval.value = null
  }
}
</script>

<template>
  <section class="panel">
    <h2>Spielende</h2>
    <form @submit.prevent="submitName">
      <label for="player-name">Name</label>
      <div class="inline">
        <input
          id="player-name"
          v-model="name"
          type="text"
          autocomplete="off"
          :class="{ invalid: addError }"
          :aria-invalid="addError ? 'true' : undefined"
        >
        <button class="btn" type="submit" :disabled="adding">Hinzufügen</button>
      </div>
      <p v-if="addError" class="err" role="alert">{{ addError }}</p>
    </form>
    <p v-if="removeError" class="err" role="alert">{{ removeError }}</p>
    <p v-if="copyError" class="err" role="alert">{{ copyError }}</p>
    <p v-if="players.length === 0" class="empty">Noch niemand dabei. Füg die erste Person hinzu.</p>
    <ul v-else class="players">
      <li v-for="(player, index) in players" :key="player.id">
        <span class="pname">
          {{ player.name }}
          <span class="no" aria-hidden="true">Subjekt {{ String(index + 1).padStart(2, '0') }}</span>
        </span>
        <span class="link">
          {{ origin }}/?t=<span class="redact" aria-label="Token verborgen">{{ player.token }}</span>
        </span>
        <div class="pactions">
          <button class="btn secondary" type="button" @click="copyLink(player)">
            {{ copiedId === player.id ? 'Kopiert.' : 'Link kopieren' }}
          </button>
          <button class="btn danger-text" type="button" :disabled="removing" @click="pendingRemoval = player">
            Entfernen
          </button>
        </div>
      </li>
    </ul>
    <div v-if="pendingRemoval" class="scrim">
      <div class="dialog" role="dialog" aria-modal="true" aria-labelledby="remove-question">
        <p id="remove-question">{{ pendingRemoval.name }} entfernen?</p>
        <div class="inline">
          <button class="btn secondary" type="button" @click="pendingRemoval = null">Abbrechen</button>
          <button class="btn danger" type="button" @click="confirmRemoval">Entfernen</button>
        </div>
      </div>
    </div>
  </section>
</template>
