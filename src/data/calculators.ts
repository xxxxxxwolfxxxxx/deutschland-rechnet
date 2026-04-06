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
  geld:      { label: 'Geld & Gehalt',        emoji: '💰', description: 'Gehalt, Steuern, Sozialleistungen',       color: '#1e7e34', colorLight: '#c8e6c9', image: 'images/categories/geld.png' },
  wohnen:    { label: 'Wohnen & Immobilien',  emoji: '🏠', description: 'Miete, Kauf, Kredit, Nebenkosten',        color: '#1565c0', colorLight: '#bbdefb', image: 'images/categories/wohnen.png' },
  energie:   { label: 'Energie',              emoji: '⚡', description: 'Strom, Heizung, Photovoltaik',            color: '#b8860b', colorLight: '#ffe082', image: 'images/categories/energie.png' },
  auto:      { label: 'Auto & Mobilität',     emoji: '🚗', description: 'Kfz-Steuer, Sprit, Fahrtkosten',          color: '#b71c1c', colorLight: '#ffcdd2', image: 'images/categories/auto.png' },
  familie:   { label: 'Familie & Soziales',   emoji: '👨‍👩‍👧', description: 'Elterngeld, Kindergeld, Rente',      color: '#e65100', colorLight: '#ffccbc', image: 'images/categories/familie.png' },
  gesundheit:{ label: 'Gesundheit & Fitness', emoji: '🏃', description: 'BMI, Kalorien, Promille',                  color: '#00796b', colorLight: '#b2dfdb', image: 'images/categories/gesundheit.png' },
  einheiten: { label: 'Einheiten & Mathe',    emoji: '📐', description: 'Länge, Gewicht, Temperatur, Inflation',  color: '#6a1b9a', colorLight: '#e1bee7', image: 'images/categories/einheiten.png' },
};

export const CALCULATORS: Calculator[] = [
  // GELD
  { slug: 'brutto-netto-rechner',      title: 'Brutto-Netto-Rechner',      description: 'Nettolohn aus Bruttogehalt berechnen – mit Steuerklasse und Bundesland.',    category: 'geld',      featured: true,  live: true },
  { slug: 'unterhaltsrechner',         title: 'Unterhaltsrechner',         description: 'Kindesunterhalt nach Düsseldorfer Tabelle 2026 berechnen.',                  category: 'geld',      featured: true,  live: true },
  { slug: 'elterngeld-rechner',        title: 'Elterngeld-Rechner',        description: 'Elterngeld und ElterngeldPlus nach BEEG berechnen.',                         category: 'geld',      featured: false, live: true },
  { slug: 'kurzarbeitergeld-rechner',  title: 'Kurzarbeitergeld-Rechner',  description: 'Kurzarbeitergeld Höhe berechnen.',                                           category: 'geld',      featured: false, live: true },
  { slug: 'abfindungsrechner',         title: 'Abfindungsrechner',         description: 'Abfindung bei Kündigung berechnen.',                                         category: 'geld',      featured: false, live: true },
  { slug: 'mindestlohn-rechner',       title: 'Mindestlohn-Rechner',       description: 'Stunden in Mindestlohn-Gehalt umrechnen.',                                   category: 'geld',      featured: false, live: true },
  { slug: 'kuendigungsfrist-rechner',  title: 'Kündigungsfrist-Rechner',   description: 'Gesetzliche Kündigungsfrist nach Betriebszugehörigkeit.',                   category: 'geld',      featured: false, live: true },
  { slug: 'ueberstunden-rechner',      title: 'Überstunden-Rechner',       description: 'Überstundenvergütung berechnen.',                                           category: 'geld',      featured: false, live: true },
  { slug: 'steuerklassen-vergleich',   title: 'Steuerklassen-Vergleich',   description: 'Steuerklassen I–VI vergleichen.',                                           category: 'geld',      featured: false, live: true },
  { slug: 'pfaendungsfreigrenze-rechner', title: 'Pfändungsfreigrenze',    description: 'Pfändbares Einkommen berechnen.',                                           category: 'geld',      featured: false, live: true },
  { slug: 'kirchensteuer-rechner',     title: 'Kirchensteuer-Rechner',     description: 'Kirchensteuer nach Bundesland und Konfession berechnen.',                   category: 'geld',      featured: false, live: true },
  // WOHNEN
  { slug: 'tilgungs-kreditrechner',    title: 'Kreditrechner',             description: 'Monatliche Rate, Zinsen und Tilgung für Darlehen berechnen.',               category: 'wohnen',    featured: true,  live: true },
  { slug: 'grunderwerbsteuer-rechner', title: 'Grunderwerbsteuer-Rechner', description: 'Grunderwerbsteuer nach Bundesland berechnen.',                              category: 'wohnen',    featured: true,  live: true },
  { slug: 'mietpreisbremse-rechner',   title: 'Mietpreisbremse-Rechner',   description: 'Zulässige Miethöhe nach Mietpreisbremse prüfen.',                           category: 'wohnen',    featured: false, live: true },
  { slug: 'nebenkosten-rechner',       title: 'Nebenkosten-Rechner',       description: 'Monatliche Nebenkosten für Wohnungen berechnen.',                           category: 'wohnen',    featured: false, live: true },
  { slug: 'immobilienkauf-nebenkosten',title: 'Immobilienkauf-Nebenkosten', description: 'Notar, Makler und Grunderwerbsteuer beim Immobilienkauf.',                 category: 'wohnen',    featured: false, live: true },
  // ENERGIE
  { slug: 'stromkosten-rechner',       title: 'Stromkosten-Rechner',       description: 'Stromkosten aus kWh-Verbrauch und Preis berechnen.',                        category: 'energie',   featured: true,  live: true },
  { slug: 'heizkosten-rechner',        title: 'Heizkosten-Rechner',        description: 'Jährliche Heizkosten berechnen.',                                           category: 'energie',   featured: false, live: true },
  { slug: 'photovoltaik-rechner',      title: 'Photovoltaik-Rechner',      description: 'Amortisationszeit einer PV-Anlage berechnen.',                             category: 'energie',   featured: false, live: true },
  // AUTO
  { slug: 'kfz-steuer-rechner',        title: 'Kfz-Steuer-Rechner',        description: 'Kfz-Steuer für Benziner, Diesel und Elektro berechnen.',                  category: 'auto',      featured: true,  live: true },
  { slug: 'spritkosten-rechner',       title: 'Spritkosten-Rechner',       description: 'Kraftstoffkosten für eine Fahrt berechnen.',                               category: 'auto',      featured: false, live: true },
  { slug: 'fahrtkosten-rechner',       title: 'Fahrtkosten-Rechner',       description: 'Steuerliche Kilometerpauschale berechnen.',                                category: 'auto',      featured: false, live: true },
  { slug: 'busgeldrechner',            title: 'Bußgeldrechner',            description: 'Bußgeld, Punkte und Fahrverbot nach aktuellem Bußgeldkatalog berechnen.',    category: 'auto',      featured: true,  live: true },
  // FAMILIE
  { slug: 'kindergeld-rechner',        title: 'Kindergeld-Rechner',        description: 'Kindergeld nach Anzahl der Kinder berechnen.',                             category: 'familie',   featured: false, live: true },
  { slug: 'wohngeld-rechner',          title: 'Wohngeld-Rechner',          description: 'Anspruch auf Wohngeld prüfen.',                                            category: 'familie',   featured: false, live: true },
  { slug: 'renten-rechner',            title: 'Renten-Rechner',            description: 'Gesetzliche Rente und Rentenlücke berechnen.',                              category: 'familie',   featured: false, live: true },
  { slug: 'rentenpunkte-rechner',      title: 'Rentenpunkte-Rechner',      description: 'Entgeltpunkte und Rentenanspruch berechnen.',                              category: 'familie',   featured: false, live: true },
  { slug: 'mutterschutz-rechner',      title: 'Mutterschutz-Rechner',      description: 'Mutterschutz-Beginn und -Ende aus Geburtstermin berechnen.',              category: 'familie',   featured: false, live: true },
  // GESUNDHEIT
  { slug: 'bmi-rechner',               title: 'BMI-Rechner',               description: 'Body-Mass-Index nach WHO-Formel berechnen.',                               category: 'gesundheit',featured: true,  live: true },
  { slug: 'kalorien-rechner',          title: 'Kalorien-Rechner',          description: 'Täglichen Kalorienbedarf nach Mifflin-St-Jeor berechnen.',                category: 'gesundheit',featured: false, live: true },
  { slug: 'promille-rechner',          title: 'Promille-Rechner',          description: 'Blutalkohol nach Widmark-Formel berechnen.',                              category: 'gesundheit',featured: false, live: true },
  // EINHEITEN
  { slug: 'einheitenrechner',          title: 'Einheitenrechner',          description: 'Länge, Gewicht, Temperatur, Volumen umrechnen.',                          category: 'einheiten', featured: true,  live: true },
  { slug: 'inflationsrechner',         title: 'Inflationsrechner',         description: 'Kaufkraftverlust durch Inflation berechnen.',                             category: 'einheiten', featured: false, live: true },
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
