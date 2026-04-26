# Product-Led Growth & Rechner-Expansion Design
**Date:** 2026-04-26  
**Status:** Design Phase  
**Scope:** Share-Feature + "Weitere Rechner" Sektion + 10 neue Rechner

---

## Overview

Zwei parallel laufende Features um **exponentielles Wachstum** zu generieren:

1. **Share-Feature:** Nutzer können ihre Rechner-Ergebnisse mit 3 Clicks teilen (WhatsApp, Telegram, Email)
2. **Cross-Promotion:** "Weitere Rechner von uns" Sektion auf jeder Seite
3. **Rechner-Expansion:** 10 neue, hochgesuchte Rechner hinzufügen → von 90+ auf 100+

---

## Feature 1: Share-Buttons auf ALLEN Rechner-Ergebnisseiten

### Platzierung & Layout
- **Position:** Direkt über dem Ergebnis-Output
- **Mobile:** Full-width Buttons (gestapelt)
- **Desktop:** Inline Buttons (horizontal)
- **Wrapper:** Leichte Hintergrundfarbe (grau/subtil), Padding 1rem

### Komponenten
```
[WhatsApp] [Telegram] [Email] [Link kopieren]
```

**Buttons:**
- Icon + Text ("WhatsApp teilen", "Telegram teilen", etc.)
- Hover-Effekt: Farbe aufhellen, leicht skalieren
- Mobile: 100% Breite pro Button

### Verhalten

**WhatsApp/Telegram:**
- Click → öffnet Browser-Link: `https://wa.me/?text=...`
- Share-Text (dynamisch mit Ergebnis):
  ```
  "Mein [RECHNER_NAME]: [ERGEBNIS_WERT] 📊
  Berechne dein(en) [RECHNER_NAME]: [APP_LINK]"
  ```
- Beispiel: "Mein Netto-Gehalt: €2.450/Monat 📊 Berechne deins: [Link]"

**Email:**
- Click → öffnet Mail-Client mit `mailto:?subject=...&body=...`
- Subject: "[RECHNER_NAME] – Deutschland rechnet"
- Body: Ergebnis + Link

**Link kopieren:**
- Click → kopiert `[domain]/[rechner-path]` in Clipboard
- Toast-Nachricht: "Link kopiert!" (1.5 Sek)
- Fallback für Browser ohne Clipboard-API: Alert-Dialog

### Implementation
- **Client-side Share API:** Nutze native Share-APIs (WhatsApp, Telegram Web Links)
- **Kein Backend:** Alles im Frontend
- **Keine Dependencies:** Standard JavaScript
- **Progressive Enhancement:** Ohne JS zeigen wir die Buttons nicht (oder deaktiviert)

---

## Feature 2: "Weitere Rechner von uns" Sektion

### Platzierung
- **Position:** Am Ende jeder Rechner-Seite (nach FAQs, vor Footer)
- **Alle Seiten:** Index + alle 90+ Rechner-Seiten

### Layout
```
┌─────────────────────────────────────┐
│ Weitere Rechner von uns             │
├─────────────────────────────────────┤
│ [Card 1] [Card 2] [Card 3]          │
│ [Card 4] [Card 5] [Card 6]          │
└─────────────────────────────────────┘
```

**Grid:** Responsive (Mobile: 1 Col, Tablet: 2 Col, Desktop: 3 Col)

### Card-Design
```
┌──────────────────────┐
│ [Icon/Logo]          │
│ Dreieck-Berechnen    │
│ Berechne die Fläche  │
│ eines Dreiecks.      │
│                      │
│ [Zum Rechner →]      │
└──────────────────────┘
```

**Card-Eigenschaften:**
- Icon/Logo oben (96x96px)
- Titel (Seitennamen)
- Kurzbeschreibung (40 Zeichen)
- Link "Zum Rechner →" (inline-block)
- Hover: leichte Schatten-Erhöhung, Link wird fett
- Border: subtil (1px, grau)
- Padding: 1.5rem

### Daten-Source
**Hardcoded Config** (1x/Jahr aktualisieren):
```javascript
// src/data/relatedSites.js
export const relatedSites = [
  {
    name: "Dreieck-Berechnen",
    url: "https://dreieck-berechnen.de",
    description: "Berechne die Fläche eines Dreiecks",
    icon: "🔺"
  },
  {
    name: "Dachplatten-Rechner",
    url: "https://dachplattenrechner.de",
    description: "Berechne Dachplattenbedarf für Dachflächen",
    icon: "🏠"
  }
];
```

**Rotation:** Alle Cards zeigen, aber randomisiert? (oder alle zeigen)  
→ Entscheidung: Alle zeigen, oben nach Name sortiert

---

## Feature 3: 10 neue Rechner (100+ Badge)

### Kategorien & Rechner

**Versicherungen (4 neue):**
1. **Rechtsschutzversicherung Kostenrechner**
   - Input: Familienstand, Beruf (Standard/hochrisiko)
   - Output: Monatliche Prämie, Selbstbeteiligung
   - Externe Daten: aktuelle Tarife (manuell, 1x/Jahr)

2. **Zahnzusatzversicherung Prämie-Rechner**
   - Input: Alter, Bonus-Malus, Vertragsvariante
   - Output: Monatl. Kostenersparnis vs. ohne Versicherung

3. **Pflegeversicherung Beitrag-Rechner**
   - Input: Einkommen, Kinderlosigkeit
   - Output: Monatl. Beitrag (inkl. Arbeitgeber-Anteil)

4. **Elementarversicherung Risiko-Rechner**
   - Input: PLZ, Gebäudealter, Höhe über Meer
   - Output: Geschätzte Prämie, Risiko-Level

**Kredit/Finanzierung (2 neue):**
5. **Ratenkredit-Detailrechner**
   - Input: Kreditsumme, Laufzeit, Zinssatz
   - Output: Monatliche Rate, Gesamtzinsen, Tilgungsplan
   - (Upgrade zu existierenden Kreditrechner)

6. **Autofinanzierung Rechner**
   - Input: Autopreis, Eigenkapital, Laufzeit, Zinssatz
   - Output: Monatliche Rate, Gesamtkosten

**Altersvorsorge (2 neue):**
7. **Rentenlücken-Rechner**
   - Input: Aktuelles Einkommen, Renteneintrittsalter, geplantes Ausgabenniveau
   - Output: Monatliche Rentenlücke, notwendige Sparquote

8. **ETF/Depot Renditerechner**
   - Input: Anfangsinvest, monatliche Sparrate, erwartete Rendite %, Jahre
   - Output: Endsumme, gewonnene Zinsen, Vermögen-Chart

**Auto/Mobilität (2 neue):**
9. **Elektroauto TCO Rechner (Total Cost of Ownership)**
   - Input: EV-Modell, Benziner-Vergleich, Jahres-KM, Strompreis, Benzinpreis
   - Output: 5/10-Jahr Gesamtkosten, Kostenersparnis EV vs. Benzin

10. **Spritkosten vs. Elektro Vergleich**
    - Input: Benzin-Automodell, Verbrauch, Strompreis, Benzinpreis
    - Output: €/100km, monatliche/jährliche Kosten, Break-even Punkt

### Kategorisierung
- **Versicherungen** → neue Kategorie? oder in "Familie & Soziales"?
  → **Entscheidung:** Neue Kategorie "Versicherungen" (4 Rechner)
- **Kredit** → bestehende "Geld & Gehalt" erweitern
- **Altersvorsorge** → "Geld & Gehalt" erweitern
- **Auto-Kosten** → bestehende "Auto & Mobilität" erweitern

### Neu-Kategorien
```
- Versicherungen (4 Rechner)
  → neuer Navigation-Link "/versicherungen/"
  → Index-Page mit Übersicht
```

---

## Implementation Order

### Phase 1: Share-Buttons (schnell, impact hoch)
1. Share-Button Komponente bauen
2. Auf allen Rechner-Templates aktivieren
3. Test + Deploy

### Phase 2: "Weitere Rechner" Sektion (schnell, impact mittel)
1. RelatedSites Config erstellen
2. Komponente bauen
3. Auf allen Seiten einbauen

### Phase 3: Neue Rechner (längerfristig, impact hoch)
1. Versicherungs-Kategorie + 4 Rechner
2. Kreditrechner erweitern
3. Altersvorsorge-Rechner (2)
4. Auto-TCO Rechner (2)
5. Testing + Deploy

---

## Success Metrics

- **Share-Buttons:** Click-Through Rate > 5% (gemessen via GA)
- **"Weitere Rechner":** Click-Through Rate > 2%
- **Neue Rechner:** Innerhalb 3 Monaten Top-100 Keywords ranken
- **Wachstum:** Exponentieller Anstieg sichtbar (Woche 1 → Woche 4)

---

## Scope Notes

- **Nicht im Scope:** Bezahlte Werbung, Newsletter, Social Media
- **Constraint:** Nur 1x/Jahr Content-Updates
- **Browser-Support:** Chrome, Firefox, Safari (letzte 2 Versionen)
- **Mobile-First:** Alle Features müssen auf Mobile funktionieren

---

## Open Questions / TBDs

- Sollen Share-Buttons auch auf der Index-Page sein? (oder nur auf Rechner-Seiten)
  → **Entscheidung:** Nur auf Rechner-Seiten mit Ergebnissen
- Versicherungen als neue Top-Level Kategorie oder Sub-Kategorie?
  → **Entscheidung:** Neue Kategorie "/versicherungen/"
- Welche 10 von den genannten Rechnern sind Priorität 1-3?
  → **Entscheidung:** Alle parallel (Teil von Phase 3)

