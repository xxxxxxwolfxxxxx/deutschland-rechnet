// Affiliate-Angebote je Rechner.
//
// Ein Partner ohne url wird nirgends angezeigt. Sobald das Partnerprogramm
// bestätigt ist, genügt es, hier den Tracking-Link einzutragen (Awin: Link
// Builder → "Deeplink"). Es gibt bewusst keine Platzhalter-Links.
//
// Links müssen https sein und werden mit rel="sponsored nofollow" ausgegeben.

export const PARTNER = {
  kredit:       { name: 'Kreditvergleich',        url: '' },
  strom:        { name: 'Stromvergleich',         url: '' },
  versicherung: { name: 'Versicherungsvergleich', url: '' },
  baufi:        { name: 'Baufinanzierung',        url: '' },
};

export const ANGEBOTE = {
  'ratenkredit-detailrechner': {
    partner: 'kredit',
    text: 'Zinsen unterscheiden sich je nach Anbieter deutlich. Vergleiche aktuelle Angebote für deinen Kreditbetrag.',
    button: 'Kredite vergleichen',
  },
  'kreditvergleich': {
    partner: 'kredit',
    text: 'Passende Angebote für deine Laufzeit und Summe findest du im unabhängigen Vergleich.',
    button: 'Aktuelle Zinsen vergleichen',
  },
  'schuldentilgungs-rechner': {
    partner: 'kredit',
    text: 'Teure Schulden wie Dispo oder Kreditkarte lassen sich oft durch einen günstigeren Ratenkredit ersetzen.',
    button: 'Umschuldung prüfen',
  },
  'autofinanzierung-rechner': {
    partner: 'kredit',
    text: 'Die Händlerfinanzierung ist nicht immer die günstigste. Vergleiche Autokredite verschiedener Banken.',
    button: 'Autokredit vergleichen',
  },
  'tilgungs-kreditrechner': {
    partner: 'baufi',
    text: 'Schon 0,5 Prozentpunkte beim Zins machen über die Laufzeit mehrere Tausend Euro aus.',
    button: 'Baufinanzierung vergleichen',
  },
  'hauskauf-rechner': {
    partner: 'baufi',
    text: 'Bevor du dich festlegst: Hol dir Zinsangebote für deine Finanzierungssumme.',
    button: 'Baufinanzierung vergleichen',
  },
  'stromkosten-rechner': {
    partner: 'strom',
    text: 'Wer seinen Stromtarif lange nicht gewechselt hat, zahlt häufig mehr als nötig.',
    button: 'Stromtarife vergleichen',
  },
  'rechtsschutz-rechner': {
    partner: 'versicherung',
    text: 'Leistungen und Selbstbeteiligung unterscheiden sich stark. Vergleiche Tarife vor dem Abschluss.',
    button: 'Rechtsschutz vergleichen',
  },
  'zahnzusatz-rechner': {
    partner: 'versicherung',
    text: 'Erstattungssätze und Wartezeiten sind je Tarif verschieden. Ein Vergleich zeigt die Unterschiede.',
    button: 'Zahnzusatz vergleichen',
  },
  'pflege-rechner': {
    partner: 'versicherung',
    text: 'Die gesetzliche Pflegeversicherung deckt nur einen Teil ab. Prüfe, ob eine Zusatzvorsorge passt.',
    button: 'Pflegezusatz vergleichen',
  },
  'elementar-rechner': {
    partner: 'versicherung',
    text: 'Eine Elementarversicherung wird oft zusammen mit der Wohngebäudeversicherung angeboten. Vergleiche die Tarife.',
    button: 'Elementarschutz vergleichen',
  },
};

/**
 * Liefert das anzeigbare Angebot für einen Rechner oder null.
 * null heißt: nichts ausgeben (kein Angebot, kein Link oder kein https-Link).
 */
export function angebotFuerRechner(slug, partner = PARTNER, angebote = ANGEBOTE) {
  const angebot = angebote[slug];
  if (!angebot) return null;
  const p = partner[angebot.partner];
  if (!p || !p.url.startsWith('https://')) return null;
  return { name: p.name, url: p.url, text: angebot.text, button: angebot.button };
}
