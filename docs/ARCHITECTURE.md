# Architektur

## Overview

```
Handy/Admin-Browser → Nuxt-Seite → Composable → $fetch POST /api/... → Route (Auth + Validierung) → Service → SQLite
                                       ↑                                                              │
                                       └──────────── SSE /api/events ← broadcast() ←──────────────────┘
```

Ein Spiel ist eine Folge von Schritten `{ phaseId, speakerId? }` mit einem Zeiger `game.current_step` auf den aktuellen Schritt, den nur der Admin bewegt. Phasen mit `perSpeaker` im Katalog (Präsentation, Befragung) laufen einmal je Person in der beim Start ausgelosten Sprechreihenfolge. Nach jeder Änderung ruft der Server den `enter`-Hook der Phase auf und sendet dann ein inhaltsloses SSE-Signal; Clients laden daraufhin `GET /api/state` (`{ me, step }`) im Hintergrund neu.

## Structure

- `app/pages/`: `index` (Join per `?t`-Token), `play` (Spieler-Hülle: Warteseite, Phasen-Ansicht des aktuellen Schritts, Verbindungshinweis), `admin/index` (Login, Einrichtung, Panel „Spielablauf“, Übersicht `Admin/PhaseOverview` der festen Phasenfolge). Keine phasenspezifischen Inhalte.
- `app/phases/<id>/`: `PlayerView.vue` und `AdminView.vue` einer Phase. Kein Import aus anderen Phasen.
- `app/phases/registry.ts`: `Partial<Record<PhaseId, { PlayerView, AdminView? }>>`, Einträge optional; Phasen ohne Eintrag zeigt `Game/PhaseFallback`. Vorhanden: `lobby`, `preparation`, `closing`. Phaseneigene Composables (`usePreparation`) liegen im Phasenordner und laden per `useFetch` mit eigenem Schlüssel.
- `app/composables/`: `useGame` (`me`, `step`, Join, eine geteilte `EventSource` je Tab, `connectionLost`; das Live-Signal lädt alle Nuxt-Daten neu), `useAdmin` (Login, Einrichtung, Spielende, `startGame`, `advance`), `useAction` (`pending` und `error` einer Aktion).
- `app/components/<Bereich>/`: wiederverwendbare, phasenneutrale Komponenten (`Admin/`, `Brand/`, `Game/`).
- `app/assets/main.css`: globales CSS, mobile first.
- `server/api/`: dünne Routen, nie direkter DB-Zugriff. Phaseneigene Routen liegen unter `server/api/<phaseId>/` (Vorbereitung: `mine`, `upload`, `speech`, `overview`, `download`).
- `server/services/`: Spiellogik als Funktionen (`game`: Position, Startsperre und `getCurrentPhaseId()`; `players`; `steps`: Schritte, Start, Weiterschalten, Einrichtungsdaten; `uploads`: Prüfen, Ablegen, Ersetzen und Öffnen von Dateien ohne Phasenwissen).
- `server/phases/<id>/`: Aktionen und `score()` einer Phase. Vorhanden: `preparation` (Zuweisung per `assignAll`, eigene Daten, Upload, Redetext, Übersicht).
- `server/phases/registry.ts`: `Partial<Record<PhaseId, { enter?(step) }>>`; ein Eintrag nur für Phasen mit Serverlogik. Vorhanden: `preparation` (`enter` ruft `assignAll`).
- `server/utils/`: `db.ts` (`node:sqlite`), `auth.ts` (`requireAdmin`, `requirePlayer`), `events.ts` (SSE-Clients, `broadcast()`).
- `server/content/`: `theories.json`, `words.json` (JSON-Arrays von Strings), `bingo.json` folgt.
- `shared/`: `phases.ts` (Phasen-Katalog mit `perSpeaker`, feste Folge `PHASE_ORDER`, `PhaseId`, `stepLabel`) und `types.ts` für Client und Server.
- `data/` (gitignored): `aluhut.db`, `uploads/<playerId>/`.

## Data

- SQLite unter `data/aluhut.db`, Eigentümer sind die Services. Vorhanden: `game` (eine Zeile `id = 1`, `current_step`, NULL = nicht gestartet), `player` (`id`, `name`, `token`, `created_at`) und `step` (`position`, `phase_id`, `speaker_id`). `assignment` (`player_id`, `theory`, `words` als JSON-Array, `speech`) und `upload` (`player_id`, `path`, `name`, `size`, `uploaded_at`). Mit den Phasen kommen `bingo_mark`, `word_guess`, `rating`. Tabellen einer Phase stehen im Schema von `db.ts`. Die Zuweisung entsteht einmalig im `enter`-Hook der Vorbereitung (`INSERT OR IGNORE`). Unter vitest läuft die DB in `:memory:`.
- Der Katalog `shared/phases.ts` legt die Phasen und ihre feste Folge (`PHASE_ORDER`, Katalogreihenfolge) fest. Die Schritte in `step` entstehen beim Spielstart in einer Transaktion aus `PHASE_ORDER` und den Spielenden; `startGame` legt die Zeile `game` bei Bedarf selbst an. Die ausgeloste Sprechreihenfolge steckt in `speaker_id` und wird nie neu berechnet. `getDb()` ergänzt `game.current_step` in bestehenden DBs per `ALTER TABLE` und entfernt die alte Spalte `phase_order`.
- Spielende haben kein Passwort: Ein zufälliges Token (32 Bytes, base64url) im Join-Link `/?t=<token>` meldet das Gerät über die Session an.
- Uploads im Dateisystem unter `data/uploads/<playerId>/<uuid>.<endung>`, in der DB nur Pfad, Name, Größe; eine Datei je Person, die alte wird beim Ersetzen gelöscht. Erlaubt: PDF, PPTX, ODP, KEY bis 50 MB, geprüft über Endung und Signatur (`%PDF-` bzw. ZIP). Unter vitest liegt die Ablage in einem Temp-Ordner.
- Client hält nur UI-Zustand; Spielzustand kommt aus `GET /api/state`.
- Auswertung: Sprechende nach Ø-Bewertung (Skala 1–10); Publikum nach richtig erratenen Pflichtwörtern + 1 Punkt je vollständiger Bingo-Reihe. Zwei Ranglisten.

## Boundaries

- Seiten und Komponenten sprechen den Server nur über Composables an.
- Routen prüfen die Session, validieren Body, Multipart-Teil oder Query mit zod und rufen genau einen Service auf. Der Upload liest `multipart/form-data` mit `readMultipartFormData`; `assertUploadSize` prüft vorher nur den Header `content-length`.
- Phasen-Server fragen die aktuelle Phase über `getCurrentPhaseId()` in `game.ts`, nie über `steps.ts`. `assignAll` nutzt aber `shuffle` aus `steps.ts`; der entstehende Import-Zyklus steps → Registry → preparation → steps ist unkritisch, solange `shuffle` nur zur Laufzeit aufgerufen wird. Braucht `shuffle` später ein weiterer Nutzer, gehört es in ein neutrales Modul.
- Nur Services und Phasen-Server schreiben in die DB und lösen `broadcast()` aus.
- Der Kern (`steps`-Service, `play.vue`, `admin/index.vue`) kennt keine einzelne Phasen-ID, nur Katalog und Registries.
- `game.ts` importiert keinen anderen Service; `getGameSetup` liegt in `steps.ts`, um Import-Zyklen zu vermeiden.
- Nach dem Start sind Spielende gesperrt (409); der Server lehnt Änderungen ab, die Oberfläche deaktiviert sie. Die Phasenfolge ist nie änderbar.
- Admin-Routen prüfen mit `requireAdmin`; `GET /api/state` liefert nur `{ me, step }` mit `step: { phaseId, speaker }`, nie Tokens, Phasenfolge, andere Schritte oder Position; `GET /api/events` sendet nur ein inhaltsloses Signal.
- Session-Cookies setzen `secure` nach dem Protokoll der Anfrage, damit http im LAN funktioniert.
- Spieler-Routen (`requirePlayer`) geben nie fremde Pflichtwörter, Redetexte oder Uploads oder Dateipfade heraus; Übersicht und Download nur für den Admin, die Übersicht ohne Theorie und Pflichtwörter.

## Decisions

- 2026-11-26 · Nuxt 4 + Nitro, TS strict, vitest, pnpm: bekannter Stack, Server und Client in einem Projekt.
- 2026-11-26 · SQLite über `node:sqlite`: kein zusätzliches Paket, ein Host.
- 2026-11-26 · SSE statt WebSocket: Push nur vom Server, Aktionen per POST.
- 2026-11-26 · Sessions über h3 `useSession`: Admin-Passwort aus `NUXT_ADMIN_PASSWORD`, Spieler-Token im Join-Link.
- 2026-11-26 · zod als einzige Zusatzabhängigkeit für Validierung.
- 2026-11-26 · Eigenes CSS mobile first, kein UI-Framework.
- 2026-11-26 · Phasen-Katalog `shared/phases.ts` (`{ id, label }`, `PhaseId`) ist die einzige Quelle der Phasen, beide Registries schlüsseln danach; eine neue Phase braucht zusätzlich eine Katalogzeile: die Folge steht fest, bevor Phasen-Module existieren.
- 2026-11-26 · `step` erzeugt die Phasen-Engine erst beim Spielstart: Schritte hängen von den Sprechenden ab, die beim Einrichten noch wechseln.
- 2026-11-26 · Session-Secret aus `NUXT_SESSION_PASSWORD` (mindestens 32 Zeichen), getrennt vom Admin-Passwort, beide in `.env.example` ohne Werte: `useSession` verlangt ein eigenes langes Secret, das Repo ist öffentlich.
- 2026-11-27 · `perSpeaker: true` im Katalog `shared/phases.ts` markiert Phasen, die je Person laufen; direkt aufeinanderfolgende bilden einen Block: Schritte lassen sich erzeugen, bevor Phasen-Module existieren, und der Kern kennt keine IDs.
- 2026-11-27 · Sprechreihenfolge lost der Server beim Start einmal aus und speichert sie nur als `speaker_id` in `step` (Zufallsquelle ist Parameter von `startGame`): niemand kennt seine Position vorher, alle Geräte sehen dieselbe stabile Reihenfolge.
- 2026-11-27 · Beide Registries sind `Partial<Record<PhaseId, …>>`, einziger Kern-Hook ist `enter(step)` auf dem Server: die Engine läuft, solange Phasen fehlen, und spätere Phasen ändern den Kern nicht.
- 2026-11-27 · Tabelle `step` plus `game.current_step` (NULL = nicht gestartet), `GET /api/state` liefert `me` und den aktuellen Schritt, `getGameSetup` zieht nach `steps.ts`: Zustand und Zeiger liegen auf dem Server, `game.ts` bleibt ohne Service-Importe.
- 2026-11-27 · Die Phasenfolge ist die Reihenfolge im Katalog `shared/phases.ts` (`PHASE_ORDER`) und im UI nicht änderbar; `game.phase_order`, `setPhaseOrder` und `POST /api/game/update-phases` entfallen, `getDb()` entfernt die Spalte in bestehenden DBs per `ALTER TABLE … DROP COLUMN`: Das Spiel ergibt nur in einer Folge Sinn, eine gespeicherte zweite Wahrheit neben dem Katalog wäre nur eine Fehlerquelle.
- 2026-11-27 · Phasen mit eigenen Aktionen legen Routen unter `server/api/<phaseId>/` und ihr Composable in `app/phases/<phaseId>/` ab, das per `useFetch` mit eigenem Schlüssel lädt; das Live-Signal in `useGame()` lädt alle Nuxt-Daten neu (`refreshNuxtData()` ohne Schlüssel), Tabellen einer Phase stehen in `db.ts`: Nitro routet nur aus `server/api/`, `GET /api/state` bleibt klein und ohne Phasendaten, ein Signal für alles hält den Kern frei von Phasen-IDs.
- 2026-11-27 · `getCurrentPhaseId()` liegt in `game.ts`, Phasen-Server fragen die aktuelle Phase nie über `steps.ts`: `steps.ts` importiert die Server-Registry, ein Rückimport erzeugt einen Zyklus.
