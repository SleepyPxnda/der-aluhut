export const PHASE_CATALOG = [
  { id: 'lobby', label: 'Lobby' },
  { id: 'preparation', label: 'Vorbereitung' },
  { id: 'presentation', label: 'Präsentation', perSpeaker: true },
  { id: 'survey', label: 'Befragung', perSpeaker: true },
  { id: 'evaluation', label: 'Auswertung' },
  { id: 'closing', label: 'Abschluss' },
] as const

export type PhaseId = (typeof PHASE_CATALOG)[number]['id']

export interface PhaseInfo {
  id: PhaseId
  label: string
  perSpeaker?: true
}

export const PHASE_ORDER: PhaseId[] = PHASE_CATALOG.map((phase) => phase.id)

const PHASES: readonly PhaseInfo[] = PHASE_CATALOG

export function phaseLabel(id: PhaseId): string {
  return PHASES.find((phase) => phase.id === id)?.label ?? id
}

export function isPerSpeaker(id: PhaseId): boolean {
  return PHASES.find((phase) => phase.id === id)?.perSpeaker === true
}

export function stepLabel(step: { phaseId: PhaseId; speaker: { name: string } | null }): string {
  const label = phaseLabel(step.phaseId)
  return step.speaker ? `${label} · ${step.speaker.name}` : label
}
