import type { PhaseId, PhaseInfo } from './phases'

export interface PublicPlayer {
  id: string
  name: string
}

export interface AdminPlayer extends PublicPlayer {
  token: string
}

export interface GameSetup {
  players: AdminPlayer[]
  phaseOrder: PhaseId[]
  catalog: PhaseInfo[]
}

export interface GameState {
  me: PublicPlayer | null
}
