<script setup lang="ts">
import { stepLabel } from '../../../shared/phases'
import { clientPhases } from '~/phases/registry'

const { setup, needsLogin, loading, loadError, load, login, addPlayer, removePlayer, savePhases, startGame, advance } =
  useAdmin()

const currentStep = computed(() => {
  const index = setup.value?.currentIndex
  return index === null || index === undefined ? null : (setup.value?.steps[index] ?? null)
})
const started = computed(() => currentStep.value !== null)
const title = computed(() => (currentStep.value ? stepLabel(currentStep.value) : 'Spiel einrichten'))
const AdminView = computed(() => (currentStep.value ? (clientPhases[currentStep.value.phaseId]?.AdminView ?? null) : null))

onMounted(load)
</script>

<template>
  <div class="page">
    <BrandAppBar :title="needsLogin ? 'Der Aluhut' : title" :tag="needsLogin ? 'Admin' : 'Geheim'" />
    <div class="body">
      <section v-if="loading" class="panel">
        <p class="loading">Lädt …<span class="caret" /></p>
      </section>
      <template v-else-if="needsLogin">
        <p class="deco" aria-hidden="true">
          <span>Akte Nr. ALU-<span class="redact">0000</span></span>
          <span>Nur für Befugte</span>
        </p>
        <section class="panel">
          <AdminLoginForm :pending="login.pending.value" :error="login.error.value" @submit="login.execute" />
        </section>
      </template>
      <section v-else-if="loadError" class="panel">
        <p class="err" role="alert">{{ loadError }}</p>
        <button class="btn secondary wide" type="button" @click="load">Nochmal versuchen</button>
      </section>
      <template v-else-if="setup">
        <AdminGameControl
          :steps="setup.steps"
          :current-index="setup.currentIndex"
          :starting="startGame.pending.value"
          :start-error="startGame.error.value"
          :advancing="advance.pending.value"
          :advance-error="advance.error.value"
          @start="startGame.execute"
          @advance="advance.execute"
        />
        <component :is="AdminView" v-if="AdminView" />
        <p v-if="started" class="lock">Das Spiel läuft. Spielende und Phasenfolge sind gesperrt.</p>
        <AdminPlayerList
          :locked="started"
          :players="setup.players"
          :adding="addPlayer.pending.value"
          :add-error="addPlayer.error.value"
          :removing="removePlayer.pending.value"
          :remove-error="removePlayer.error.value"
          @add="addPlayer.execute"
          @remove="removePlayer.execute"
        />
        <AdminPhaseOrderEditor
          :locked="started"
          :phase-order="setup.phaseOrder"
          :catalog="setup.catalog"
          :pending="savePhases.pending.value"
          :error="savePhases.error.value"
          @save="savePhases.execute"
        />
      </template>
    </div>
  </div>
</template>
