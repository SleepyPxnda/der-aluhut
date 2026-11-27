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
  catalog: PhaseInfo[]
}

export interface GameState {
  me: PublicPlayer | null
  step: CurrentStep | null
}

export interface UploadInfo {
  name: string
  size: number
}

export interface MyPreparation {
  theory: string
  words: string[]
  upload: UploadInfo | null
  speech: string | null
}

export interface PreparationOverviewEntry {
  id: string
  name: string
  upload: UploadInfo | null
  hasSpeech: boolean
}
