# Architektur

## Overview

```
Handy/Admin-Browser → Nuxt-Seite → Composable → $fetch POST /api/... → Route (Auth + Validierung) → Service → SQLite
                                       ↑                                                              │
                                       └──────────── SSE /api/events ← broadcast() ←──────────────────┘
```

Ein Spiel ist eine Folge von Schritten `{ phaseId, speakerId? }` mit einem Zeiger auf den aktuellen Schritt, den nur der Admin bewegt. Die Phasen 2a (Präsentation) und 2b (Befragung) stehen pro sprechender Person einmal in der Folge. Nach jeder Änderung sendet der Server einen SSE-Ping; Clients laden daraufhin `GET /api/state` neu.

## Structure

- `app/pages/`: `index` (Join per `?t`-Token), `play` (Spieler-Hülle, vorerst Warteseite), `admin/index` (Login oder Einrichtung). Keine phasenspezifischen Inhalte.
- `app/phases/<id>/`: `PlayerView.vue` und `AdminView.vue` einer Phase. Kein Import aus anderen Phasen.
- `app/phases/registry.ts`: Phasen-ID → Komponenten.
- `app/composables/`: `useGame` (Zustand `me`, Join; SSE folgt mit der Phasen-Engine), `useAdmin` (Login, Einrichtung, Spielende, Phasenfolge), `useAction` (`pending` und `error` einer Aktion).
- `app/components/<Bereich>/`: wiederverwendbare, phasenneutrale Komponenten (`Admin/`, `Brand/`).
- `app/assets/main.css`: globales CSS, mobile first.
- `server/api/`: dünne Routen, nie direkter DB-Zugriff.
- `server/services/`: Spiellogik als Funktionen (`game`, `players`; `uploads` folgt).
- `server/phases/<id>/`: Aktionen und `score()` einer Phase.
- `server/phases/registry.ts`: Server-Registry der Phasen.
- `server/utils/`: `db.ts` (`node:sqlite`), `auth.ts`, `events.ts` (SSE-Broadcast).
- `server/content/`: `theories.json`, `words.json`, `bingo.json`.
- `shared/`: `phases.ts` (Phasen-Katalog, `PhaseId`) und `types.ts` für Client und Server.
- `data/` (gitignored): `aluhut.db`, `uploads/<playerId>/`.

## Data

- SQLite unter `data/aluhut.db`, Eigentümer sind die Services. Vorhanden: `game` (eine Zeile `id = 1`, `phase_order` als JSON-Array von Phasen-IDs) und `player` (`id`, `name`, `token`, `created_at`). Mit den Phasen kommen `step`, `assignment`, `upload`, `bingo_mark`, `word_guess`, `rating`. Unter vitest läuft die DB in `:memory:`.
- Der Katalog `shared/phases.ts` legt wählbare Phasen und Standardfolge fest. Die Schritte in `step` entstehen erst beim Spielstart aus `phase_order` und den Spielenden.
- Spielende haben kein Passwort: Ein zufälliges Token (32 Bytes, base64url) im Join-Link `/?t=<token>` meldet das Gerät über die Session an.
- Uploads im Dateisystem, in der DB nur Pfad, Name, Größe. Erlaubt: PDF, PPTX, ODP, KEY bis 50 MB.
- Client hält nur UI-Zustand; Spielzustand kommt aus `GET /api/state`.
- Auswertung: Sprechende nach Ø-Bewertung (Skala 1–10); Publikum nach richtig erratenen Pflichtwörtern + 1 Punkt je vollständiger Bingo-Reihe. Zwei Ranglisten.

## Boundaries

- Seiten und Komponenten sprechen den Server nur über Composables an.
- Routen prüfen die Session, validieren den Body mit zod und rufen genau einen Service auf.
- Nur Services und Phasen-Server schreiben in die DB und lösen `broadcast()` aus.
- Der Kern (`game`-Service, `play.vue`) kennt keine einzelne Phasen-ID, nur die Registries.
- Admin-Routen prüfen mit `requireAdmin`; `GET /api/state` liefert Spieler-Geräten nur `me: { id, name }`, nie Tokens oder die Phasenfolge.
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
