<script setup lang="ts">
import type { PhaseId, PhaseInfo } from '../../../shared/phases'

interface PhaseItem extends PhaseInfo {
  active: boolean
}

const props = defineProps<{
  phaseOrder: PhaseId[]
  catalog: PhaseInfo[]
  pending: boolean
  error: string | null
}>()
const emit = defineEmits<{ save: [phaseOrder: PhaseId[]] }>()

function buildItems(): PhaseItem[] {
  const active = props.phaseOrder
    .map((id) => props.catalog.find((phase) => phase.id === id))
    .filter((phase): phase is PhaseInfo => phase !== undefined)
    .map((phase) => ({ ...phase, active: true }))
  const inactive = props.catalog
    .filter((phase) => !props.phaseOrder.includes(phase.id))
    .map((phase) => ({ ...phase, active: false }))
  return [...active, ...inactive]
}

const items = ref<PhaseItem[]>(buildItems())
const saved = ref(false)

const activeIds = computed(() => items.value.filter((item) => item.active).map((item) => item.id))
const firstActive = computed(() => activeIds.value[0])
const lastActive = computed(() => activeIds.value[activeIds.value.length - 1])
const nothingActive = computed(() => activeIds.value.length === 0)

function move(index: number, offset: number) {
  const next = [...items.value]
  const [moved] = next.splice(index, 1)
  next.splice(index + offset, 0, moved!)
  items.value = next
  saved.value = false
}

function toggle(item: PhaseItem) {
  item.active = !item.active
  saved.value = false
}

function save() {
  saved.value = false
  emit('save', activeIds.value)
}

watch(
  () => props.pending,
  (isPending) => {
    if (!isPending && !props.error) {
      saved.value = true
    }
  },
)
</script>

<template>
  <section class="panel">
    <h2>Phasenfolge</h2>
    <ol class="phases">
      <li v-for="(item, index) in items" :key="item.id" class="phase" :class="{ off: !item.active }">
        <label class="switch">
          <input type="checkbox" :checked="item.active" :aria-label="`${item.label} aktiv`" @change="toggle(item)">
          <span class="track" aria-hidden="true"><span class="knob" /></span>
        </label>
        <span class="phase-label">
          <span class="phase-text">{{ item.label }}</span>
          <span v-if="item.active && item.id === firstActive" class="mark">Start</span>
          <span v-if="item.active && item.id === lastActive" class="mark end">Ende</span>
        </span>
        <span class="moves">
          <button class="icon" type="button" aria-label="Nach oben" :disabled="index === 0" @click="move(index, -1)">↑</button>
          <button
            class="icon"
            type="button"
            aria-label="Nach unten"
            :disabled="index === items.length - 1"
            @click="move(index, 1)"
          >↓</button>
        </span>
      </li>
    </ol>
    <p v-if="nothingActive" class="hint">Wähl mindestens eine Phase aus.</p>
    <p v-if="error" class="err" role="alert">{{ error }}</p>
    <p v-if="saved && !error" class="ok-message" role="status">Gespeichert.</p>
    <button class="btn wide" type="button" :disabled="nothingActive || pending" @click="save">
      {{ pending ? 'Speichert …' : 'Speichern' }}
    </button>
  </section>
</template>
