<script setup lang="ts">
const { setup, needsLogin, loading, loadError, load, login, addPlayer, removePlayer, savePhases } = useAdmin()

onMounted(load)
</script>

<template>
  <section v-if="loading" class="panel">
    <p class="loading">Lädt …<span class="caret" /></p>
  </section>
  <section v-else-if="needsLogin" class="panel">
    <AdminLoginForm :pending="login.pending.value" :error="login.error.value" @submit="login.execute" />
  </section>
  <section v-else-if="loadError" class="panel">
    <p class="err" role="alert">{{ loadError }}</p>
    <button class="btn secondary wide" type="button" @click="load">Nochmal versuchen</button>
  </section>
  <template v-else-if="setup">
    <AdminPlayerList
      :players="setup.players"
      :adding="addPlayer.pending.value"
      :add-error="addPlayer.error.value"
      :removing="removePlayer.pending.value"
      :remove-error="removePlayer.error.value"
      @add="addPlayer.execute"
      @remove="removePlayer.execute"
    />
    <AdminPhaseOrderEditor
      :phase-order="setup.phaseOrder"
      :catalog="setup.catalog"
      :pending="savePhases.pending.value"
      :error="savePhases.error.value"
      @save="savePhases.execute"
    />
  </template>
</template>
