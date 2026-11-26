import type { PhaseId, PhaseInfo } from './phases'

export interface PublicPlayer {
  id: string
  name: string
}

export interface AdminPlayer extends PublicPlayer {
  token: string
}

export interface CurrentStep {
  phaseId: PhaseId
  speaker: PublicPlayer | null
}

export interface GameProgress {
  steps: CurrentStep[]
  currentIndex: number | null
}

export interface GameSetup extends GameProgress {
  players: AdminPlayer[]
  phaseOrder: PhaseId[]
  catalog: PhaseInfo[]
}

export interface GameState {
  me: PublicPlayer | null
  step: CurrentStep | null
}
