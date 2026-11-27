import type { PhaseId } from '../../shared/phases'
import type { CurrentStep } from '../../shared/types'
import { assignAll } from './preparation'

export interface ServerPhase {
  enter?(step: CurrentStep): void
}

export const serverPhases: Partial<Record<PhaseId, ServerPhase>> = {
  preparation: { enter: () => assignAll() },
}
