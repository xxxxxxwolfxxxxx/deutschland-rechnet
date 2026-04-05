// Kindergeld 2025 nach §66 EStG
// Ab 2025: einheitlich 255 € pro Kind pro Monat
const BETRAG_MONAT = 255;

export function berechneKindergeld({ anzahlKinder }) {
  const monat = anzahlKinder * BETRAG_MONAT;
  const jahr = monat * 12;
  return { monat, jahr, betragProKind: BETRAG_MONAT };
}
