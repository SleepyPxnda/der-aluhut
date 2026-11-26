export const PHASE_CATALOG = [
  { id: 'lobby', label: 'Lobby' },
  { id: 'preparation', label: 'Vorbereitung' },
  { id: 'presentation', label: 'Präsentation' },
  { id: 'survey', label: 'Befragung' },
  { id: 'evaluation', label: 'Auswertung' },
  { id: 'closing', label: 'Abschluss' },
] as const

export type PhaseId = (typeof PHASE_CATALOG)[number]['id']

export interface PhaseInfo {
  id: PhaseId
  label: string
}

export const DEFAULT_PHASE_ORDER: PhaseId[] = PHASE_CATALOG.map((phase) => phase.id)
