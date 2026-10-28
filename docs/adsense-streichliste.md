# Streichliste für die AdSense-Überprüfung

Stand: 28.10.2026. Quelle: Search Console (`sc-domain:deutschland-rechnet.de`), Leistung 27.07.–26.10. (3 Monate) und Seitenindexierung vom 23.10.

## Ausgangslage

- 183 Klicks, 21.800 Impressionen, Ø-Position 31,8.
- **Nur 68 Seiten indexiert, 64 „Gecrawlt – zurzeit nicht indexiert"** (im September waren es 20). Dazu 6× 404, 5× Weiterleitung, 1× noindex.
- Allein `/auto/km-kostenrechner/` bringt 142 von 183 Klicks. Zusammen mit den nächsten vier Seiten sind es 165.
- 120 Seiten haben Impressionen, aber nur 21 mindestens einen Klick.

Grundlage ist ausschließlich Indexstatus, Klicks und Themenüberschneidung. Den Inhalt der einzelnen Seiten habe ich dafür nicht erneut gelesen.

## A: Streichen (37 Rechner + 2 Kategorieseiten) – umgesetzt am 28.10.2026

Kriterium: nicht indexiert, höchstens 1 Klick, generisches Thema ohne eigenen Dreh oder Dublette einer stärkeren Seite. Umsetzung: aus Navigation, Kategorieseiten, Sitemap und `calculators.ts` entfernen, per 301 auf das Ziel leiten.

| Bereich | Seiten | Ziel |
|---|---|---|
| einheiten (komplett, 11) | einheitenrechner, gewicht-, temperatur-, flaechen-, laengen-, volumen-umrechner, prozent-, rabatt-, mwst-rechner, inflationsrechner, Kategorie | `/geld/` bzw. Startseite |
| vorlagen (komplett, 3) | protokoll-generator, qr-code-generator, Kategorie | Startseite |
| geld (8) | trinkgeld-, risikoprofil-, mindestlohn-, ueberstunden-, pfaendungsfreigrenze-, kirchensteuer-rechner, ratenkredit-detailrechner, steuerklassen-vergleich | `kreditvergleich`, `brutto-netto-rechner`, `steuerklasse-optimieren` |
| gesundheit (7) | kalorien-verbrennen, makronaehrstoff-, grundumsatz-, idealgewicht-, optimalerpuls-rechner, blutdruck-bewerter, schlaf-rechner | `bmi-rechner` |
| wohnen (4) | grundbuch-eintragung, quadratmeterpreis-vergleich, hauskauf-rechner, nebenkosten-rechner | `immobilienkauf-nebenkosten`, `mietrechner` |
| auto (4) | fahrtkosten-rechner, spritkosten-rechner, kfz-steuer-co2, fuehrerschein-kosten | `km-kostenrechner`, `spritkosten-vergleich`, `kfz-steuer-rechner` |
| energie (2) | jahresenergieverbrauch, heizkosten-vergleich | `stromkosten-rechner`, `heizkosten-rechner` |

Gesundheit ist YMYL, und Über-uns nennt nur „Softwareentwickler". Deshalb bleiben dort nur `bmi-rechner` und `promille-rechner`.

## B: Auf Bewährung, vorher umbauen (ca. 27 Seiten)

Nicht indexiert, aber mit echter Suchnachfrage. Diese Seiten werden zuerst zu eigenständigen Seitentypen umgebaut (Tabelle, Diagramm, Checkliste, Entscheidungsbaum). Wird eine Seite 6 Wochen nach dem Umbau nicht indexiert, wandert sie nach A.

- familie: ehegattenunterhalt (Pos. 7,3), wohngeld, bafoeg, kindergeld, elterngeld, erbschaftsteuer, scheidungskosten, schwangerschafts-rechner, rentenpunkte
- geld: gewerbesteuer, arbeitslosengeld, kurzarbeitergeld, krypto-steuern, etf-sparplan, homeoffice-pauschale, steuerklasse-optimieren
- wohnen: kaufen-vs-mieten, grunderwerbsteuer, immobilienkauf-nebenkosten, wie-viel-haus, tilgungsplan
- energie: heizkosten-rechner, waermepumpe, photovoltaik, energieausweis-vorberechnung
- auto: kfz-steuer-rechner, elektroauto-tco
- versicherungen: pflege-rechner

## C: Behalten (indexiert oder mit Klicks)

km-kostenrechner (142 Klicks), e-auto-leasing-kostenrechner, steuernachzahlung, anfahrtskosten, notgroschen, renten-rechner, leasing-rechner, stromspeicher, betreuungskosten, brutto-netto, einkommensteuer, kfz-versicherung, stromkosten, kuendigungsfrist, kreditvergleich, etf-renditerechner, mietpreisbremse, abgeltungsteuer, gehaltserhoehung, rechtsschutz, spritkosten-vergleich, bmi, promille, mietrechner, mietrendite, tilgungs-kreditrechner, busgeldrechner und die übrigen Seiten, die nicht auf der Nicht-indexiert-Liste stehen.

Darunter sind die Flaggschiffe für den Umbau auf eigene Seitentypen: km-kostenrechner, busgeldrechner, brutto-netto, einkommensteuer, mietpreisbremse, kuendigungsfrist, elektroauto-tco.

## Ergebnis

111 → 74 Rechner nach Schritt A (umgesetzt, Build und 1567 Tests grün), danach rund 50 bis 60 nach der Bewährung in B. Ausgang: nur noch Seiten, die Google selbst indexiert.

## Nebenbefunde

- 6× 404 mit fehlgeschlagener Validierung. Welche URLs das sind, habe ich noch nicht ausgelesen.
- `/auto/km-km-kostenrechner/` und `/auto/km-kundenrechner/` tauchen mit Impressionen auf. Vermutlich Tippfehler-URLs, die per 301 auf `km-kostenrechner` gehören.
- `https://www.deutschland-rechnet.de/` taucht ebenfalls auf. Die www-Variante sollte per 301 auf die Hauptdomain gehen.
- `ads.txt` steht in der Nicht-indexiert-Liste. Das ist normal.
