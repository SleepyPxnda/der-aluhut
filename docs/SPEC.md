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

- Der Phasen-Editor zeigt in einem frischen Spiel Lobby, Vorbereitung, Präsentation, Befragung, Auswertung und Abschluss, alle aktiv. Jede Phase lässt sich per Schalter aktivieren oder deaktivieren und mit „Nach oben“ und „Nach unten“ verschieben. Die erste aktive Phase trägt die Marke „Start“, die letzte die Marke „Ende“; inaktive Phasen sind geschwärzt.
- „Speichern“ speichert die aktiven Phasen in ihrer Reihenfolge und zeigt „Gespeichert.“ Nach Neuladen stehen die aktiven Phasen in dieser Reihenfolge vorn, die inaktiven dahinter in Katalogreihenfolge.
- Ist keine Phase aktiv, ist „Speichern“ deaktiviert und der Editor zeigt „Wähl mindestens eine Phase aus.“ Der Server lehnt leere Listen, unbekannte und doppelte IDs mit 400 „Ungültige Phasenfolge.“ ab. Fachliche Regeln zur Folge gibt es nicht.

## Spielablauf

- Die Einrichtungsseite heißt „Spiel einrichten“ und zeigt über den anderen Panels das Panel „Spielablauf“ mit dem Hinweis „Gestartet wird mit der gespeicherten Phasenfolge. Die Reihenfolge der Sprechenden wird beim Start ausgelost.“ und dem Button „Spiel starten“. Der Button fragt nach: „Spiel starten? Danach kannst du Spielende und Phasenfolge nicht mehr ändern.“ mit „Abbrechen“ und „Starten“; währenddessen heißt er „Startet …“.
- Beim Start erzeugt der Server die Schritte aus der gespeicherten Phasenfolge, der erste Schritt wird der aktuelle. Jede Phase wird ein Schritt. Phasen, die pro Person laufen (Präsentation, Befragung), bilden bei direkter Folge einen Block, der einmal je Person in der Sprechreihenfolge läuft. Beispiel: Lobby, Präsentation, Befragung, Auswertung mit der Reihenfolge Ben, Anna ergibt Lobby, Präsentation · Ben, Befragung · Ben, Präsentation · Anna, Befragung · Anna, Auswertung.
- Die Sprechreihenfolge lost der Server beim Start zufällig aus allen Spielenden aus. Sie wird mit den Schritten gespeichert und bleibt nach Neuladen und Serverneustart gleich.
- Ohne Spielende lehnt der Server den Start mit 400 „Leg zuerst mindestens eine Person an.“ ab, bei laufendem Spiel mit 409 „Das Spiel läuft schon.“ Die Meldung steht am Button.
- Läuft das Spiel, heißt die Einrichtungsseite wie der aktuelle Schritt („<Phase>“ bzw. „<Phase> · <Name>“). Das Panel zeigt „Schritt <n> von <m>“, den aktuellen Schritt, „Als Nächstes: <Schritt>“ und den Button „Weiter“ („Schaltet weiter …“ während der Anfrage). Am letzten Schritt steht „Das ist der letzte Schritt.“ und „Weiter“ ist deaktiviert. Hat die aktuelle Phase eine Admin-Ansicht, steht sie unter dem Panel. Der Stand bleibt nach Neuladen und Serverneustart erhalten.
- „Weiter“ sendet die Position, von der aus weitergeschaltet wird. Stimmt sie nicht mehr, antwortet der Server mit 409 „Jemand hat schon weitergeschaltet.“ und ändert nichts, am letzten Schritt mit 409 „Das ist schon der letzte Schritt.“ Das Panel lädt nach einem Konflikt den aktuellen Stand; die Meldung bleibt am Button, bis zum nächsten Tipp auf „Weiter“. Zurückschalten gibt es nicht.
- Start und Weiter ohne Admin-Session antworten mit 401 „Bitte melde dich als Admin an.“
- Sobald das Spiel läuft, steht über den Panels für Spielende und Phasenfolge „Das Spiel läuft. Spielende und Phasenfolge sind gesperrt.“ Namensfeld, „Hinzufügen“, „Entfernen“, Schalter, Pfeile und „Speichern“ sind deaktiviert; der Server lehnt Spielende anlegen, Spielende entfernen und Phasenfolge speichern mit 409 „Das Spiel läuft schon.“ ab. Join-Links und „Link kopieren“ funktionieren weiter.
- Wird ein Schritt aktuell, ruft der Server genau einmal den `enter`-Hook der Phase aus der Server-Registry auf, falls es einen gibt, und sendet danach das Live-Signal.

## Live-Ansicht

- `/play` folgt dem aktuellen Schritt live ohne Neuladen; ein Handy zeigt Start und „Weiter“ innerhalb von 2 Sekunden. Bis der neue Zustand da ist, bleibt die bisherige Ansicht stehen, ohne „Lädt …“. `GET /api/events` sendet bei jeder Änderung nur ein inhaltsloses Signal, danach lädt der Client `GET /api/state` neu.
- Im Schritt Lobby steht „Hallo, <Name>! Gleich geht's los.“, im Schritt Abschluss „Danke fürs Mitspielen, <Name>!“. Jede Phase ohne eigenes Modul zeigt ihren Namen und „Warte, bis der Admin weiterschaltet.“ Bei einem Schritt mit Person steht dazwischen „Es spricht: <Name>“, auf dem Handy der sprechenden Person „Du bist dran.“
- Bricht die Live-Verbindung ab, zeigt `/play` unter der App-Leiste fixiert den Hinweis „Verbindung unterbrochen. Verbinde neu …“. Steht die Verbindung wieder, verschwindet er, und das Handy zeigt den aktuellen Schritt.

## Zustände und Bedienung

- Die Einrichtungsseite zeigt beim Laden „Lädt …“, bei einem Fehler die Meldung des Servers mit „Nochmal versuchen“. Während Login, Hinzufügen, Entfernen, Speichern, Start und Weiter ist der jeweilige Button deaktiviert; Fehler stehen an der Aktion.
- Login, Einrichtung, Startseite, `/play` und alle Ansichten des Spielablaufs sind ab 360 px ohne horizontales Scrollen bedienbar; alle Buttons und Schalter sind mindestens 44 px hoch.
