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
- `/play` zeigt „Hallo, <Name>! Warte, bis das Spiel startet.“
- Ein ungültiges Token zeigt auf `/` „Dieser Link ist ungültig. Frag den Admin nach deinem Link.“ Ohne Token und ohne Session steht dort „Öffne den persönlichen Link, den du vom Admin bekommen hast.“
- Ein angemeldetes Gerät auf `/` wird nach `/play` geleitet, `/play` ohne gültige Session nach `/`.
- `GET /api/state` liefert Spieler-Geräten nur `me: { id, name }`, ohne Session `me: null`, nie Tokens, andere Spielende oder die Phasenfolge.
- Session-Cookies sind nur bei https `secure`, damit der Join im LAN über http funktioniert.

## Phasenfolge

- Der Phasen-Editor zeigt in einem frischen Spiel Lobby, Vorbereitung, Präsentation, Befragung, Auswertung und Abschluss, alle aktiv. Jede Phase lässt sich per Schalter aktivieren oder deaktivieren und mit „Nach oben“ und „Nach unten“ verschieben. Die erste aktive Phase trägt die Marke „Start“, die letzte die Marke „Ende“; inaktive Phasen sind geschwärzt.
- „Speichern“ speichert die aktiven Phasen in ihrer Reihenfolge und zeigt „Gespeichert.“ Nach Neuladen stehen die aktiven Phasen in dieser Reihenfolge vorn, die inaktiven dahinter in Katalogreihenfolge.
- Ist keine Phase aktiv, ist „Speichern“ deaktiviert und der Editor zeigt „Wähl mindestens eine Phase aus.“ Der Server lehnt leere Listen, unbekannte und doppelte IDs mit 400 „Ungültige Phasenfolge.“ ab. Fachliche Regeln zur Folge gibt es nicht.

## Zustände und Bedienung

- Die Einrichtungsseite zeigt beim Laden „Lädt …“, bei einem Fehler die Meldung des Servers mit „Nochmal versuchen“. Während Login, Hinzufügen, Entfernen und Speichern ist der jeweilige Button deaktiviert; Fehler stehen an der Aktion.
- Login, Einrichtung, Startseite und `/play` sind ab 360 px ohne horizontales Scrollen bedienbar; alle Buttons und Schalter sind mindestens 44 px hoch.
