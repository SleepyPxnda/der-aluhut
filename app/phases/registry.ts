import { defineAsyncComponent, type Component } from 'vue'
import type { PhaseId } from '../../shared/phases'

export interface ClientPhase {
  PlayerView: Component
  AdminView?: Component
}

export const clientPhases: Partial<Record<PhaseId, ClientPhase>> = {
  lobby: { PlayerView: defineAsyncComponent(() => import('./lobby/PlayerView.vue')) },
  closing: { PlayerView: defineAsyncComponent(() => import('./closing/PlayerView.vue')) },
}
