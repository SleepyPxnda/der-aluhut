<script setup lang="ts">
defineProps<{ pending: boolean; error: string | null }>()
const emit = defineEmits<{ submit: [password: string] }>()
const password = ref('')
</script>

<template>
  <form @submit.prevent="emit('submit', password)">
    <h1>Admin</h1>
    <label for="admin-password">Passwort</label>
    <input
      id="admin-password"
      v-model="password"
      type="password"
      autocomplete="current-password"
      :class="{ invalid: error }"
      :aria-invalid="error ? 'true' : undefined"
    >
    <p v-if="error" class="err" role="alert">{{ error }}</p>
    <button class="btn wide" type="submit" :disabled="pending">
      {{ pending ? 'Prüfe …' : 'Anmelden' }}
    </button>
  </form>
</template>
