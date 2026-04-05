// src/data/calculators.ts
export type Category =
  | 'geld'
  | 'wohnen'
  | 'energie'
  | 'auto'
  | 'familie'
  | 'gesundheit'
  | 'einheiten';

export interface Calculator {
  slug: string;         // URL-Segment: 'brutto-netto-rechner'
  title: string;        // Anzeigename: 'Brutto-Netto-Rechner'
  description: string;  // Kurzbeschreibung für Cards
  category: Category;
  featured?: boolean;   // Erscheint in RelatedLinks anderer Kategorien
  live?: boolean;       // Nur live=true werden in Navigation gezeigt
}

export const CATEGORIES: Record<Category, { label: string; emoji: string; description: string; color: string; colorLight: string; image: string }> = {
  geld:      { label: 'Geld & Gehalt',        emoji: '💰', description: 'Gehalt, Steuern, Sozialleistungen',       color: '#1e7e34', colorLight: '#e8f5e9', image: '/images/categories/geld.png' },
  wohnen:    { label: 'Wohnen & Immobilien',  emoji: '🏠', description: 'Miete, Kauf, Kredit, Nebenkosten',        color: '#1565c0', colorLight: '#e3f2fd', image: '/images/categories/wohnen.png' },
  energie:   { label: 'Energie',              emoji: '⚡', description: 'Strom, Heizung, Photovoltaik',            color: '#b8860b', colorLight: '#fff8e1', image: '/images/categories/energie.png' },
  auto:      { label: 'Auto & Mobilität',     emoji: '🚗', description: 'Kfz-Steuer, Sprit, Fahrtkosten',          color: '#b71c1c', colorLight: '#ffebee', image: '/images/categories/auto.png' },
  familie:   { label: 'Familie & Soziales',   emoji: '👨‍👩‍👧', description: 'Elterngeld, Kindergeld, Rente',      color: '#e65100', colorLight: '#fff3e0', image: '/images/categories/familie.png' },
  gesundheit:{ label: 'Gesundheit & Fitness', emoji: '🏃', description: 'BMI, Kalorien, Promille',                  color: '#00796b', colorLight: '#e0f2f1', image: '/images/categories/gesundheit.png' },
  einheiten: { label: 'Einheiten & Mathe',    emoji: '📐', description: 'Länge, Gewicht, Temperatur, Inflation',  color: '#6a1b9a', colorLight: '#f3e5f5', image: '/images/categories/einheiten.png' },
};

export const CALCULATORS: Calculator[] = [
  // GELD
  { slug: 'brutto-netto-rechner',      title: 'Brutto-Netto-Rechner',      description: 'Nettolohn aus Bruttogehalt berechnen – mit Steuerklasse und Bundesland.',    category: 'geld',      featured: true,  live: true },
  { slug: 'unterhaltsrechner',         title: 'Unterhaltsrechner',         description: 'Kindesunterhalt nach Düsseldorfer Tabelle 2026 berechnen.',                  category: 'geld',      featured: true,  live: true },
  { slug: 'elterngeld-rechner',        title: 'Elterngeld-Rechner',        description: 'Elterngeld und ElterngeldPlus nach BEEG berechnen.',                         category: 'geld',      featured: false, live: true },
  { slug: 'kurzarbeitergeld-rechner',  title: 'Kurzarbeitergeld-Rechner',  description: 'Kurzarbeitergeld Höhe berechnen.',                                           category: 'geld',      featured: false, live: false },
  { slug: 'abfindungsrechner',         title: 'Abfindungsrechner',         description: 'Abfindung bei Kündigung berechnen.',                                         category: 'geld',      featured: false, live: false },
  { slug: 'mindestlohn-rechner',       title: 'Mindestlohn-Rechner',       description: 'Stunden in Mindestlohn-Gehalt umrechnen.',                                   category: 'geld',      featured: false, live: false },
  { slug: 'kuendigungsfrist-rechner',  title: 'Kündigungsfrist-Rechner',   description: 'Gesetzliche Kündigungsfrist nach Betriebszugehörigkeit.',                   category: 'geld',      featured: false, live: false },
  { slug: 'ueberstunden-rechner',      title: 'Überstunden-Rechner',       description: 'Überstundenvergütung berechnen.',                                           category: 'geld',      featured: false, live: false },
  { slug: 'steuerklassen-vergleich',   title: 'Steuerklassen-Vergleich',   description: 'Steuerklassen I–VI vergleichen.',                                           category: 'geld',      featured: false, live: false },
  { slug: 'pfaendungsfreigrenze-rechner', title: 'Pfändungsfreigrenze',    description: 'Pfändbares Einkommen berechnen.',                                           category: 'geld',      featured: false, live: false },
  // WOHNEN
  { slug: 'tilgungs-kreditrechner',    title: 'Kreditrechner',             description: 'Monatliche Rate, Zinsen und Tilgung für Darlehen berechnen.',               category: 'wohnen',    featured: true,  live: true },
  { slug: 'grunderwerbsteuer-rechner', title: 'Grunderwerbsteuer-Rechner', description: 'Grunderwerbsteuer nach Bundesland berechnen.',                              category: 'wohnen',    featured: true,  live: true },
  { slug: 'mietpreisbremse-rechner',   title: 'Mietpreisbremse-Rechner',   description: 'Zulässige Miethöhe nach Mietpreisbremse prüfen.',                           category: 'wohnen',    featured: false, live: false },
  { slug: 'nebenkosten-rechner',       title: 'Nebenkosten-Rechner',       description: 'Monatliche Nebenkosten für Wohnungen berechnen.',                           category: 'wohnen',    featured: false, live: false },
  { slug: 'immobilienkauf-nebenkosten',title: 'Immobilienkauf-Nebenkosten', description: 'Notar, Makler und Grunderwerbsteuer beim Immobilienkauf.',                 category: 'wohnen',    featured: false, live: false },
  // ENERGIE
  { slug: 'stromkosten-rechner',       title: 'Stromkosten-Rechner',       description: 'Stromkosten aus kWh-Verbrauch und Preis berechnen.',                        category: 'energie',   featured: true,  live: true },
  { slug: 'heizkosten-rechner',        title: 'Heizkosten-Rechner',        description: 'Jährliche Heizkosten berechnen.',                                           category: 'energie',   featured: false, live: false },
  { slug: 'photovoltaik-rechner',      title: 'Photovoltaik-Rechner',      description: 'Amortisationszeit einer PV-Anlage berechnen.',                             category: 'energie',   featured: false, live: false },
  // AUTO
  { slug: 'kfz-steuer-rechner',        title: 'Kfz-Steuer-Rechner',        description: 'Kfz-Steuer für Benziner, Diesel und Elektro berechnen.',                  category: 'auto',      featured: true,  live: true },
  { slug: 'spritkosten-rechner',       title: 'Spritkosten-Rechner',       description: 'Kraftstoffkosten für eine Fahrt berechnen.',                               category: 'auto',      featured: false, live: false },
  { slug: 'fahrtkosten-rechner',       title: 'Fahrtkosten-Rechner',       description: 'Steuerliche Kilometerpauschale berechnen.',                                category: 'auto',      featured: false, live: false },
  // FAMILIE
  { slug: 'kindergeld-rechner',        title: 'Kindergeld-Rechner',        description: 'Kindergeld nach Anzahl der Kinder berechnen.',                             category: 'familie',   featured: false, live: false },
  { slug: 'wohngeld-rechner',          title: 'Wohngeld-Rechner',          description: 'Anspruch auf Wohngeld prüfen.',                                            category: 'familie',   featured: false, live: false },
  { slug: 'rentenpunkte-rechner',      title: 'Rentenpunkte-Rechner',      description: 'Entgeltpunkte und Rentenanspruch berechnen.',                              category: 'familie',   featured: false, live: false },
  { slug: 'mutterschutz-rechner',      title: 'Mutterschutz-Rechner',      description: 'Mutterschutz-Beginn und -Ende aus Geburtstermin berechnen.',              category: 'familie',   featured: false, live: false },
  // GESUNDHEIT
  { slug: 'bmi-rechner',               title: 'BMI-Rechner',               description: 'Body-Mass-Index nach WHO-Formel berechnen.',                               category: 'gesundheit',featured: true,  live: true },
  { slug: 'kalorien-rechner',          title: 'Kalorien-Rechner',          description: 'Täglichen Kalorienbedarf nach Mifflin-St-Jeor berechnen.',                category: 'gesundheit',featured: false, live: true },
  { slug: 'promille-rechner',          title: 'Promille-Rechner',          description: 'Blutalkohol nach Widmark-Formel berechnen.',                              category: 'gesundheit',featured: false, live: false },
  // EINHEITEN
  { slug: 'einheitenrechner',          title: 'Einheitenrechner',          description: 'Länge, Gewicht, Temperatur, Volumen umrechnen.',                          category: 'einheiten', featured: true,  live: true },
  { slug: 'inflationsrechner',         title: 'Inflationsrechner',         description: 'Kaufkraftverlust durch Inflation berechnen.',                             category: 'einheiten', featured: false, live: false },
];

export function getByCategory(category: Category): Calculator[] {
  return CALCULATORS.filter(c => c.category === category && c.live);
}

export function getRelated(current: Calculator, limit = 6): Calculator[] {
  const same = CALCULATORS.filter(c => c.category === current.category && c.slug !== current.slug && c.live);
  if (same.length >= 3) return same.slice(0, limit);
  const featured = CALCULATORS.filter(c => c.featured && c.slug !== current.slug && c.live && c.category !== current.category);
  return [...same, ...featured].slice(0, limit);
}
