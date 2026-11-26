export const PHASE_CATALOG = [
  { id: 'lobby', label: 'Lobby' },
  { id: 'vorbereitung', label: 'Vorbereitung' },
  { id: 'praesentation', label: 'Präsentation' },
  { id: 'befragung', label: 'Befragung' },
  { id: 'auswertung', label: 'Auswertung' },
  { id: 'abschluss', label: 'Abschluss' },
] as const

export type PhaseId = (typeof PHASE_CATALOG)[number]['id']

export interface PhaseInfo {
  id: PhaseId
  label: string
}

export const DEFAULT_PHASE_ORDER: PhaseId[] = PHASE_CATALOG.map((phase) => phase.id)
