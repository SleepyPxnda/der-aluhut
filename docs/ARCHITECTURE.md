# Architektur

## Overview

```
Handy/Admin-Browser → Nuxt-Seite → Composable → $fetch POST /api/... → Route (Auth + Validierung) → Service → SQLite
                                       ↑                                                              │
                                       └──────────── SSE /api/events ← broadcast() ←──────────────────┘
```

Ein Spiel ist eine Folge von Schritten `{ phaseId, speakerId? }` mit einem Zeiger `game.current_step` auf den aktuellen Schritt, den nur der Admin bewegt. Phasen mit `perSpeaker` im Katalog (Präsentation, Befragung) laufen einmal je Person in der beim Start ausgelosten Sprechreihenfolge. Nach jeder Änderung ruft der Server den `enter`-Hook der Phase auf und sendet dann ein inhaltsloses SSE-Signal; Clients laden daraufhin `GET /api/state` (`{ me, step }`) im Hintergrund neu.

## Structure

- `app/pages/`: `index` (Join per `?t`-Token), `play` (Spieler-Hülle: Warteseite, Phasen-Ansicht des aktuellen Schritts, Verbindungshinweis), `admin/index` (Login, Einrichtung, Panel „Spielablauf“). Keine phasenspezifischen Inhalte.
- `app/phases/<id>/`: `PlayerView.vue` und `AdminView.vue` einer Phase. Kein Import aus anderen Phasen.
- `app/phases/registry.ts`: `Partial<Record<PhaseId, { PlayerView, AdminView? }>>`, Einträge optional; Phasen ohne Eintrag zeigt `Game/PhaseFallback`. Vorhanden: `lobby`, `closing`.
- `app/composables/`: `useGame` (`me`, `step`, Join, eine geteilte `EventSource` je Tab, `connectionLost`), `useAdmin` (Login, Einrichtung, Spielende, Phasenfolge, `startGame`, `advance`), `useAction` (`pending` und `error` einer Aktion).
- `app/components/<Bereich>/`: wiederverwendbare, phasenneutrale Komponenten (`Admin/`, `Brand/`, `Game/`).
- `app/assets/main.css`: globales CSS, mobile first.
- `server/api/`: dünne Routen, nie direkter DB-Zugriff.
- `server/services/`: Spiellogik als Funktionen (`game`: Phasenfolge und Startsperre; `players`; `steps`: Schritte, Start, Weiterschalten, Einrichtungsdaten; `uploads` folgt).
- `server/phases/<id>/`: Aktionen und `score()` einer Phase.
- `server/phases/registry.ts`: `Partial<Record<PhaseId, { enter?(step) }>>`; ein Eintrag nur für Phasen mit Serverlogik.
- `server/utils/`: `db.ts` (`node:sqlite`), `auth.ts`, `events.ts` (SSE-Clients, `broadcast()`).
- `server/content/`: `theories.json`, `words.json`, `bingo.json`.
- `shared/`: `phases.ts` (Phasen-Katalog mit `perSpeaker`, `PhaseId`, `stepLabel`) und `types.ts` für Client und Server.
- `data/` (gitignored): `aluhut.db`, `uploads/<playerId>/`.

## Data

- SQLite unter `data/aluhut.db`, Eigentümer sind die Services. Vorhanden: `game` (eine Zeile `id = 1`, `phase_order` als JSON-Array von Phasen-IDs, `current_step`, NULL = nicht gestartet), `player` (`id`, `name`, `token`, `created_at`) und `step` (`position`, `phase_id`, `speaker_id`). Mit den Phasen kommen `assignment`, `upload`, `bingo_mark`, `word_guess`, `rating`. Unter vitest läuft die DB in `:memory:`.
- Der Katalog `shared/phases.ts` legt wählbare Phasen und Standardfolge fest. Die Schritte in `step` entstehen beim Spielstart in einer Transaktion aus `phase_order` und den Spielenden; die ausgeloste Sprechreihenfolge steckt in `speaker_id` und wird nie neu berechnet. `getDb()` ergänzt `game.current_step` in bestehenden DBs per `ALTER TABLE`.
- Spielende haben kein Passwort: Ein zufälliges Token (32 Bytes, base64url) im Join-Link `/?t=<token>` meldet das Gerät über die Session an.
- Uploads im Dateisystem, in der DB nur Pfad, Name, Größe. Erlaubt: PDF, PPTX, ODP, KEY bis 50 MB.
- Client hält nur UI-Zustand; Spielzustand kommt aus `GET /api/state`.
- Auswertung: Sprechende nach Ø-Bewertung (Skala 1–10); Publikum nach richtig erratenen Pflichtwörtern + 1 Punkt je vollständiger Bingo-Reihe. Zwei Ranglisten.

## Boundaries

- Seiten und Komponenten sprechen den Server nur über Composables an.
- Routen prüfen die Session, validieren den Body mit zod und rufen genau einen Service auf.
- Nur Services und Phasen-Server schreiben in die DB und lösen `broadcast()` aus.
- Der Kern (`steps`-Service, `play.vue`, `admin/index.vue`) kennt keine einzelne Phasen-ID, nur Katalog und Registries.
- `game.ts` importiert keinen anderen Service; `getGameSetup` liegt in `steps.ts`, um Import-Zyklen zu vermeiden.
- Nach dem Start sind Spielende und Phasenfolge gesperrt (409); der Server lehnt Änderungen ab, die Oberfläche deaktiviert sie.
- Admin-Routen prüfen mit `requireAdmin`; `GET /api/state` liefert nur `{ me, step }` mit `step: { phaseId, speaker }`, nie Tokens, Phasenfolge, andere Schritte oder Position; `GET /api/events` sendet nur ein inhaltsloses Signal.
- Session-Cookies setzen `secure` nach dem Protokoll der Anfrage, damit http im LAN funktioniert.
- Spieler-Routen geben nie fremde Pflichtwörter oder Uploads heraus; Upload-Downloads nur für den Admin.

## Decisions

- 2026-11-26 · Nuxt 4 + Nitro, TS strict, vitest, pnpm: bekannter Stack, Server und Client in einem Projekt.
- 2026-11-26 · SQLite über `node:sqlite`: kein zusätzliches Paket, ein Host.
- 2026-11-26 · SSE statt WebSocket: Push nur vom Server, Aktionen per POST.
- 2026-11-26 · Sessions über h3 `useSession`: Admin-Passwort aus `NUXT_ADMIN_PASSWORD`, Spieler-Token im Join-Link.
- 2026-11-26 · zod als einzige Zusatzabhängigkeit für Validierung.
- 2026-11-26 · Eigenes CSS mobile first, kein UI-Framework.
- 2026-11-26 · Phasen-Katalog `shared/phases.ts` (`{ id, label }`, `PhaseId`) ist die einzige Quelle der wählbaren Phasen, beide Registries schlüsseln danach; eine neue Phase braucht zusätzlich eine Katalogzeile: die Folge ist konfigurierbar, bevor Phasen-Module existieren.
- 2026-11-26 · Konfigurierte Folge als JSON-Array von Phasen-IDs in `game.phase_order`, `step` erzeugt erst die Phasen-Engine beim Spielstart: Schritte hängen von den Sprechenden ab, die beim Einrichten noch wechseln.
- 2026-11-26 · Session-Secret aus `NUXT_SESSION_PASSWORD` (mindestens 32 Zeichen), getrennt vom Admin-Passwort, beide in `.env.example` ohne Werte: `useSession` verlangt ein eigenes langes Secret, das Repo ist öffentlich.
- 2026-11-27 · `perSpeaker: true` im Katalog `shared/phases.ts` markiert Phasen, die je Person laufen; direkt aufeinanderfolgende bilden einen Block: Schritte lassen sich erzeugen, bevor Phasen-Module existieren, und der Kern kennt keine IDs.
- 2026-11-27 · Sprechreihenfolge lost der Server beim Start einmal aus und speichert sie nur als `speaker_id` in `step` (Zufallsquelle ist Parameter von `startGame`): niemand kennt seine Position vorher, alle Geräte sehen dieselbe stabile Reihenfolge.
- 2026-11-27 · Beide Registries sind `Partial<Record<PhaseId, …>>`, einziger Kern-Hook ist `enter(step)` auf dem Server: die Engine läuft, solange Phasen fehlen, und spätere Phasen ändern den Kern nicht.
- 2026-11-27 · Tabelle `step` plus `game.current_step` (NULL = nicht gestartet), `GET /api/state` liefert `me` und den aktuellen Schritt, `getGameSetup` zieht nach `steps.ts`: Zustand und Zeiger liegen auf dem Server, `game.ts` bleibt ohne Service-Importe.
