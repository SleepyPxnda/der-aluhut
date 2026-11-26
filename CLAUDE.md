# Der Aluhut

Partyspiel über Verschwörungstheorien als mobile-first Website. Jede Person bekommt eine Theorie und drei absurde Pflichtwörter und hält dazu eine Präsentation; das Publikum spielt Bingo, rät die Wörter und bewertet in einer Befragung. Ein Admin legt Spielende an und steuert die Phasen.

## Hard rules

- Keine Kommentare im Code. Code erklärt sich über Namen und Struktur.
- Mobile first: Jede Spieler-Ansicht ist ab 360 px Breite vollständig bedienbar.
- Nur der Admin wechselt Phasen; alle Clients folgen live.
- Phasen sind Module: neue Phase = neuer Ordner + Registry-Eintrag, kein Umbau am Kern.
- Start, Ende und Phasenfolge sind pro Spiel konfigurierbar.
- Der Server ist die Wahrheit: Zuweisungen, Timer und Auswertung entstehen serverseitig, nie im Client.

## Architecture

Nuxt 4 mit Nitro-Routen, Services auf SQLite (`node:sqlite`), Live-Updates per SSE, Phasen als Module mit Registry auf Client und Server.
Read `docs/ARCHITECTURE.md` before adding a file; it is binding.

## Commands

- Install: `pnpm install`
- Dev: `pnpm dev` → http://localhost:3000
- Test: `pnpm test`
- Typecheck: `pnpm typecheck`
- Build: `pnpm build`

## Conventions

1. Keine Kommentare im Code; einzige Ausnahme sind von lean-ctx verlangte Marker.
2. UI-Texte Deutsch in Du-Form, Code-Bezeichner Englisch.
3. Komponenten in PascalCase unter `app/components/<Bereich>/`; Phasen-UI ausschließlich unter `app/phases/<id>/`.
4. API-Routen heißen `server/api/<ressource>/<aktion>.<method>.ts`; Reihenfolge immer: Auth → `readValidatedBody` mit zod → genau ein Service-Aufruf.
5. Services werfen `createError({ statusCode, statusMessage })` mit deutscher Meldung; der Client zeigt sie an, kein leeres `catch`.
6. Jede Abfrage im Client hat einen sichtbaren Lade- und Fehlerzustand.
7. Spielzustand kommt nur aus `useGame()`; Komponenten laden Phase oder Schritt nicht selbst.
8. Neue Phase = Ordner in `app/phases/` und `server/phases/` plus zwei Registry-Einträge; braucht es mehr, ist das ein Architektur-Fehler.
9. Mobile first: Media Queries nur mit `min-width`, Touch-Ziele mindestens 44 px, keine reine Hover-Interaktion.
10. Tests liegen als `*.test.ts` neben Services und `score()`-Funktionen; jede Auswertungsregel hat einen eigenen Test.
