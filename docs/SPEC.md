# Spec

## Admin-Zugang

- `/admin` zeigt ohne Admin-Session ein Login-Formular mit Passwortfeld. Mit dem richtigen Passwort erscheint die Einrichtungsseite, mit einem falschen bleibt das Formular stehen und zeigt „Falsches Passwort.“
- Das Passwort kommt aus `NUXT_ADMIN_PASSWORD`. Ist es nicht gesetzt oder leer, antwortet der Login mit 500 „Das Admin-Passwort ist nicht gesetzt.“ und meldet niemanden an.
- Ohne Admin-Session antworten alle Admin-Routen mit 401 „Bitte melde dich als Admin an.“ und ändern nichts.

## Spielende

- Es gibt genau ein Spiel. Der Admin legt Spielende über Namen und „Hinzufügen“ an; jede Person erscheint in der Liste mit Join-Link und dem Button „Link kopieren“. Die Liste bleibt über Neuladen und Serverneustart erhalten.
- Der Name wird getrimmt und muss 1 bis 30 Zeichen haben (sonst 400 „Der Name muss 1 bis 30 Zeichen haben.“). Er muss ohne Rücksicht auf Groß- und Kleinschreibung eindeutig sein (sonst 409 „Diesen Namen gibt es schon.“). Die Meldung steht am Formular.
- Jede Person hat ein eigenes zufälliges Token mit 256 Bit, base64url-kodiert. Der Join-Link lautet `<aktuelle Origin>/?t=<token>`.
- „Entfernen“ löscht die Person nach der Rückfrage „<Name> entfernen?“. Ihr Link ist danach ungültig; ein Gerät, das damit angemeldet war, landet beim nächsten Laden auf der Startseite.

## Join

- Ein gültiger Join-Link meldet das Gerät als diese Person an und leitet nach `/play`; das Token verschwindet aus der Adresszeile. Das Gerät bleibt über Neuladen angemeldet. Während der Anmeldung steht „Du wirst angemeldet …“.
- Solange das Spiel nicht gestartet ist, zeigt `/play` „Hallo, <Name>! Warte, bis das Spiel startet.“
- Ein ungültiges Token zeigt auf `/` „Dieser Link ist ungültig. Frag den Admin nach deinem Link.“ Ohne Token und ohne Session steht dort „Öffne den persönlichen Link, den du vom Admin bekommen hast.“
- Ein angemeldetes Gerät auf `/` wird nach `/play` geleitet, `/play` ohne gültige Session nach `/`.
- `GET /api/state` liefert `{ me, step }`: `me` ist `{ id, name }` bzw. ohne Session `null`, `step` der aktuelle Schritt (siehe Live-Ansicht). Nie Tokens, die Phasenfolge, andere Schritte, die Sprechreihenfolge oder die Position.
- Session-Cookies sind nur bei https `secure`, damit der Join im LAN über http funktioniert.

## Phasenfolge

- Die Phasenfolge ist fest: Lobby, Vorbereitung, Präsentation, Befragung, Auswertung, Abschluss, in der Reihenfolge des Phasen-Katalogs im Code. Der Admin kann sie nicht ändern; neue Phasen kommen nur im Code dazu.
- Das Panel „Phasenfolge“ auf der Einrichtungsseite ist eine reine Übersicht ohne Bedienelemente. Lobby trägt die Marke „Start“, Abschluss die Marke „Ende“, Präsentation und Befragung die Marke „je Person“. Darunter steht „Präsentation und Befragung laufen für jede Person einmal, in der beim Start ausgelosten Reihenfolge.“ Das Panel sieht vor und nach dem Start gleich aus.
- `GET /api/game/setup` liefert `players`, `catalog`, `steps` und `currentIndex`, keine Phasenfolge. Eine Route zum Ändern der Folge gibt es nicht.

## Spielablauf

- Die Einrichtungsseite heißt „Spiel einrichten“ und zeigt über den anderen Panels das Panel „Spielablauf“ mit dem Hinweis „Gestartet wird mit der festen Phasenfolge. Die Reihenfolge der Sprechenden wird beim Start ausgelost.“ und dem Button „Spiel starten“. Der Button fragt nach: „Spiel starten? Danach kannst du Spielende nicht mehr ändern.“ mit „Abbrechen“ und „Starten“; währenddessen heißt er „Startet …“.
- Beim Start erzeugt der Server die Schritte aus der festen Phasenfolge, der erste Schritt wird der aktuelle. Jede Phase wird ein Schritt. Phasen, die pro Person laufen (Präsentation, Befragung), bilden bei direkter Folge einen Block, der einmal je Person in der Sprechreihenfolge läuft. Beispiel: Lobby, Präsentation, Befragung, Auswertung mit der Reihenfolge Ben, Anna ergibt Lobby, Präsentation · Ben, Befragung · Ben, Präsentation · Anna, Befragung · Anna, Auswertung.
- Die Sprechreihenfolge lost der Server beim Start zufällig aus allen Spielenden aus. Sie wird mit den Schritten gespeichert und bleibt nach Neuladen und Serverneustart gleich.
- Ohne Spielende lehnt der Server den Start mit 400 „Leg zuerst mindestens eine Person an.“ ab, bei laufendem Spiel mit 409 „Das Spiel läuft schon.“ Die Meldung steht am Button.
- Läuft das Spiel, heißt die Einrichtungsseite wie der aktuelle Schritt („<Phase>“ bzw. „<Phase> · <Name>“). Das Panel zeigt „Schritt <n> von <m>“, den aktuellen Schritt, „Als Nächstes: <Schritt>“ und den Button „Weiter“ („Schaltet weiter …“ während der Anfrage). Am letzten Schritt steht „Das ist der letzte Schritt.“ und „Weiter“ ist deaktiviert. Hat die aktuelle Phase eine Admin-Ansicht, steht sie unter dem Panel. Der Stand bleibt nach Neuladen und Serverneustart erhalten.
- „Weiter“ sendet die Position, von der aus weitergeschaltet wird. Stimmt sie nicht mehr, antwortet der Server mit 409 „Jemand hat schon weitergeschaltet.“ und ändert nichts, am letzten Schritt mit 409 „Das ist schon der letzte Schritt.“ Das Panel lädt nach einem Konflikt den aktuellen Stand; die Meldung bleibt am Button, bis zum nächsten Tipp auf „Weiter“. Zurückschalten gibt es nicht.
- Start und Weiter ohne Admin-Session antworten mit 401 „Bitte melde dich als Admin an.“
- Sobald das Spiel läuft, steht über der Liste der Spielenden „Das Spiel läuft. Spielende sind gesperrt.“ Namensfeld, „Hinzufügen“ und „Entfernen“ sind deaktiviert; der Server lehnt Spielende anlegen und Spielende entfernen mit 409 „Das Spiel läuft schon.“ ab. Join-Links und „Link kopieren“ funktionieren weiter.
- Wird ein Schritt aktuell, ruft der Server genau einmal den `enter`-Hook der Phase aus der Server-Registry auf, falls es einen gibt, und sendet danach das Live-Signal.

## Live-Ansicht

- `/play` folgt dem aktuellen Schritt live ohne Neuladen; ein Handy zeigt Start und „Weiter“ innerhalb von 2 Sekunden. Bis der neue Zustand da ist, bleibt die bisherige Ansicht stehen, ohne „Lädt …“. `GET /api/events` sendet bei jeder Änderung nur ein inhaltsloses Signal, danach lädt der Client `GET /api/state` neu.
- Im Schritt Lobby steht „Hallo, <Name>! Gleich geht's los.“, im Schritt Abschluss „Danke fürs Mitspielen, <Name>!“. Jede Phase ohne eigenes Modul zeigt ihren Namen und „Warte, bis der Admin weiterschaltet.“ Bei einem Schritt mit Person steht dazwischen „Es spricht: <Name>“, auf dem Handy der sprechenden Person „Du bist dran.“
- Bricht die Live-Verbindung ab, zeigt `/play` unter der App-Leiste fixiert den Hinweis „Verbindung unterbrochen. Verbinde neu …“. Steht die Verbindung wieder, verschwindet er, und das Handy zeigt den aktuellen Schritt.

## Vorbereitung

- Wird der Schritt Vorbereitung aktuell, lost der Server jeder Person genau eine Theorie aus `server/content/theories.json` (mindestens 20) und drei verschiedene Wörter aus `server/content/words.json` (mindestens 60) zu. Bei bis zu 20 Personen bekommen keine zwei dieselbe Theorie, und kein Wort kommt doppelt vor. Reicht eine Liste nicht, beginnt sie nach erneutem Mischen von vorn; innerhalb einer Person bleiben die Wörter verschieden. Die Zuweisung bleibt nach Neuladen und Serverneustart gleich und wird nie neu ausgelost.
- `/play` zeigt im Schritt Vorbereitung die Überschrift „Vorbereitung“, „Deine Theorie“ mit der Theorie, „Deine Pflichtwörter“ mit den drei Wörtern und den Hinweis „Bau alle drei Wörter in deine Präsentation ein. Verrat sie niemandem.“ Beim Laden steht „Lädt …“, bei einem Fehler die Meldung des Servers mit „Nochmal versuchen“.
- Unter „Deine Präsentation“ wählt die Person eine Datei (PDF, PPTX, ODP oder KEY, höchstens 50 MB) und tippt auf „Hochladen“. Während der Anfrage ist der Button deaktiviert und heißt „Lädt hoch …“. Danach steht „Hochgeladen: <Dateiname> (<Größe> MB)“ mit einer Nachkommastelle, und der Button heißt „Andere Datei hochladen“. Eine neue Datei ersetzt die alte; der Server löscht die alte vom Datenträger. Ohne Upload steht „Noch keine Datei hochgeladen.“ Der Stand bleibt nach Neuladen erhalten.
- Hat die Datei eine andere Endung oder passt ihr Inhalt nicht zur Endung (PDF beginnt mit `%PDF-`, PPTX, ODP und KEY sind ZIP-Archive), antwortet der Server mit 400 „Erlaubt sind PDF, PPTX, ODP und KEY.“ Ist die Anfrage größer als 50 MB, antwortet er mit 413 „Die Datei ist größer als 50 MB.“, bevor er den Inhalt liest. Er speichert dann nichts, ein früherer Upload bleibt bestehen. Das Handy prüft Endung und Größe schon vor dem Senden und zeigt dieselben Meldungen am Upload.
- Unter „Redetext (optional)“ steht ein mehrzeiliges Textfeld mit dem Hinweis „Nur du siehst ihn.“ und dem Button „Speichern“ („Speichert …“ während der Anfrage, danach „Gespeichert.“). Der Text wird getrimmt, ein leerer Text löscht den Redetext. Mehr als 5000 Zeichen lehnt der Server mit 400 „Der Redetext darf höchstens 5000 Zeichen haben.“ ab. Nach Neuladen steht der gespeicherte Text im Feld.
- Ist der aktuelle Schritt nicht die Vorbereitung, lehnt der Server Upload und Redetext mit 409 „Die Vorbereitung läuft gerade nicht.“ ab und ändert nichts. Ohne angemeldete Person antworten alle Spieler-Routen der Phase mit 401 „Öffne zuerst deinen persönlichen Link.“
- `GET /api/preparation/mine` liefert nur die eigenen Daten `{ theory, words, upload: { name, size } | null, speech }`. Keine Spieler-Route liefert Theorie, Wörter, Upload oder Redetext einer anderen Person oder einen Dateipfad.
- Beim Admin steht unter dem Panel „Spielablauf“ das Panel „Vorbereitung“ mit „<n> von <m> haben eine Datei hochgeladen.“ (bei n = 1 „hat“). Darunter steht je Person in der Reihenfolge des Anlegens der Name, daneben der Dateiname mit Größe und dem Button „Herunterladen“ oder „Noch keine Datei“, außerdem „Redetext: ja“ oder „Redetext: nein“. Theorie und Pflichtwörter zeigt das Panel nicht. Beim Laden steht „Lädt …“, bei einem Fehler die Meldung mit „Nochmal versuchen“. Nach Upload oder Redetext einer Person zeigt das Panel den neuen Stand innerhalb von 2 Sekunden ohne Neuladen.
- „Herunterladen“ liefert die Datei unverändert und mit ihrem ursprünglichen Namen. Ohne Admin-Session antworten Übersicht und Download mit 401 „Bitte melde dich als Admin an.“, gibt es keine Datei, antwortet der Download mit 404 „Diese Datei gibt es nicht.“
- Die Vorbereitung hat keinen Upload-Zwang: „Weiter“ geht auch, wenn jemand nichts hochgeladen hat. Die App spielt die Datei nie ab und zeigt keine Vorschau.

## Zustände und Bedienung

- Die Einrichtungsseite zeigt beim Laden „Lädt …“, bei einem Fehler die Meldung des Servers mit „Nochmal versuchen“. Während Login, Hinzufügen, Entfernen, Start und Weiter ist der jeweilige Button deaktiviert; Fehler stehen an der Aktion.
- Login, Einrichtung, Startseite, `/play` und alle Ansichten des Spielablaufs sind ab 360 px ohne horizontales Scrollen bedienbar, auch mit langen Dateinamen und Theorien; alle Buttons, Links und die Dateiauswahl sind mindestens 44 px hoch.
