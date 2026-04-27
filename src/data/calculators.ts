// src/data/calculators.ts
export type Category =
  | 'geld'
  | 'wohnen'
  | 'energie'
  | 'auto'
  | 'familie'
  | 'gesundheit'
  | 'versicherungen'
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
  gesundheit:{ label: 'Gesheit & Fitness', emoji: '🏃', description: 'BMI, Kalorien, Promille',                  color: '#00796b', colorLight: '#b2dfdb', image: 'images/categories/gesundheit.png' },
  versicherungen: { label: 'Versicherungen', emoji: '🛡️', description: 'Rechtsschutz, Zahnzusatz, Pflege, Elementarschutz', color: '#e65100', colorLight: '#fff3e0', image: 'images/categories/versicherungen.png' },
  einheiten: { label: 'Einheiten & Mathe',    emoji: '📐', description: 'Länge, Gewicht, Temperatur, Inflation',  color: '#6a1b9a', colorLight: '#e1bee7', image: 'images/categories/einheiten.png' },
};

export const CALCULATORS: Calculator[] = [
  // GELD
  { slug: 'brutto-netto-rechner',        title: 'Brutto-Netto-Rechner',        description: 'Nettolohn aus Bruttogehalt berechnen.',                                            category: 'geld',      featured: true,  live: true },
  { slug: 'trinkgeld-rechner',           title: 'Trinkgeld-Rechner',           description: 'Trinkgeld für Restaurant berechnen.',                                            category: 'geld',      featured: false, live: true },
  { slug: 'kurzarbeitergeld-rechner',    title: 'Kurzarbeitergeld-Rechner',    description: 'Kurzarbeitergeld Höhe berechnen.',                                              category: 'geld',      featured: false, live: true },
  { slug: 'abfindungsrechner',           title: 'Abfindungsrechner',           description: 'Abfindung bei Kündigung berechnen.',                                            category: 'geld',      featured: false, live: true },
  { slug: 'mindestlohn-rechner',         title: 'Mindestlohn-Rechner',         description: 'Stunden in Mindestlohn-Gehalt umrechnen.',                                      category: 'geld',      featured: false, live: true },
  { slug: 'kuendigungsfrist-rechner',    title: 'Kündigungsfrist-Rechner',     description: 'Gesetzliche Kündigungsfrist nach Betriebszugehörigkeit.',                      category: 'geld',      featured: false, live: true },
  { slug: 'ueberstunden-rechner',        title: 'Überstunden-Rechner',         description: 'Überstundenvergütung berechnen.',                                              category: 'geld',      featured: false, live: true },
  { slug: 'steuerklassen-vergleich',     title: 'Steuerklassen-Vergleich',     description: 'Steuerklassen I–VI vergleichen.',                                              category: 'geld',      featured: false, live: true },
  { slug: 'pfaendungsfreigrenze-rechner', title: 'Pfändungsfreigrenze',         description: 'Pfändbares Einkommen berechnen.',                                              category: 'geld',      featured: false, live: true },
  { slug: 'kirchensteuer-rechner',       title: 'Kirchensteuer-Rechner',       description: 'Kirchensteuer nach Bundesland berechnen.',                                      category: 'geld',      featured: false, live: true },
  { slug: 'arbeitslosengeld-rechner',    title: 'Arbeitslosengeld-Rechner',    description: 'Arbeitslosengeld (ALG 1) nach SGB III berechnen.',                             category: 'geld',      featured: true,  live: true },
  { slug: 'steuernachzahlung-rechner',   title: 'Steuernachzahlung-Rechner',   description: 'Steuernachzahlung oder Erstattung schätzen.',                                   category: 'geld',      featured: false, live: true },
  { slug: 'gehaltserhoehung-rechner',    title: 'Gehaltserhöhung-Rechner',     description: 'Nettoeffekt einer Gehaltserhöhung berechnen.',                                 category: 'geld',      featured: false, live: true },
  { slug: 'kreditvergleich',            title: 'Kreditvergleich',           description: 'Kredite vergleichen und effektiven Zins berechnen.',                           category: 'geld',      featured: false, live: true },
  { slug: 'sparen-rechner',            title: 'Sparen-Rechner',           description: 'Guthaben mit Zinseszins berechnen.',                                           category: 'geld',      featured: false, live: true },
  { slug: 'steuerklasse-optimieren',   title: 'Steuerklasse optimieren',  description: 'Optimalen Steuerklassen-Wechsel berechnen.',                                category: 'geld',      featured: false, live: true },
  { slug: 'abgeltungsteuer-rechner',   title: 'Abgeltungsteuer-Rechner', description: 'Kapitalerträge mit Abgeltungsteuer berechnen.',                               category: 'geld',      featured: false, live: true },
  { slug: 'etf-sparplan-rechner',      title: 'ETF-Sparplan-Rechner',    description: 'Vermögensaufbau mit ETF-Sparplan berechnen.',                                 category: 'geld',      featured: false, live: true },
  { slug: 'fire-rechner',             title: 'FIRE-Rechner',          description: 'Finanzielle Unabhängigkeit durch Sparquote und Rendite berechnen.',         category: 'geld',      featured: false, live: true },
  { slug: 'gewerbesteuer-rechner',    title: 'Gewerbesteuer-Rechner', description: 'Gewerbesteuer nach Hebesatz und Rechtsform berechnen.',                            category: 'geld',      featured: false, live: true },
  { slug: 'gmbh-vs-einzelunternehmen', title: 'GmbH vs. Einzelunternehmen', description: 'Steuerbelastung: GmbH oder Einzelunternehmen?',                       category: 'geld',      featured: false, live: true },
  { slug: 'schuldentilgungs-rechner',  title: 'Schuldentilgungs-Rechner', description: 'Schneeball- vs. Lawinenmethode zum Schulden tilgen.',                    category: 'geld',      featured: false, live: true },
  { slug: 'notgroschen-rechner',       title: 'Notgroschen-Rechner',     description: 'Empfohlene Höhe des Notgroschens berechnen.',                                     category: 'geld',      featured: false, live: true },
  { slug: 'krypto-steuern-rechner',    title: 'Krypto-Steuern-Rechner',  description: 'Steuerfreiheit und Freibeträge für Krypto-Gewinne prüfen.',                     category: 'geld',      featured: false, live: true },
  { slug: 'homeoffice-pauschale',      title: 'Homeoffice-Pauschale',    description: 'Steuervorteil der Homeoffice-Pauschale berechnen.',                                category: 'geld',      featured: false, live: true },
  { slug: 'risikoprofil-rechner',      title: 'Risikoprofil-Rechner',    description: 'Persönliches Anlegerprofil ermitteln und passende Strategie finden.',             category: 'geld',      featured: false, live: true },
  { slug: 'ratenkredit-detailrechner', title: 'Ratenkredit-Detailrechner', description: 'Kreditsumme, Laufzeit und Zinsen mit Tilgungsplan berechnen.',                    category: 'geld',      featured: false, live: true },
  { slug: 'autofinanzierung-rechner',  title: 'Autofinanzierung-Rechner',  description: 'Monatliche Rate und Gesamtkosten der Autofinanzierung berechnen.',              category: 'geld',      featured: false, live: true },
  { slug: 'rentenlucken-rechner',      title: 'Rentenlücken-Rechner',      description: 'Monatliche Rentenlücke und notwendige Sparquote berechnen.',                   category: 'geld',      featured: false, live: true },
  { slug: 'etf-renditerechner',        title: 'ETF-Renditerechner',        description: 'Vermögensaufbau und Renditeentwicklung von ETF-Sparplan berechnen.',           category: 'geld',      featured: false, live: true },
  // WOHNEN
  { slug: 'tilgungs-kreditrechner',      title: 'Kreditrechner',               description: 'Monatliche Rate, Zinsen und Tilgung berechnen.',                               category: 'wohnen',    featured: true,  live: true },
  { slug: 'grunderwerbsteuer-rechner',   title: 'Grunderwerbsteuer-Rechner',   description: 'Grunderwerbsteuer nach Bundesland berechnen.',                                  category: 'wohnen',    featured: true,  live: true },
  { slug: 'mietpreisbremse-rechner',     title: 'Mietpreisbremse-Rechner',     description: 'Zulässige Miethöhe prüfen.',                                                   category: 'wohnen',    featured: false, live: true },
  { slug: 'nebenkosten-rechner',          title: 'Nebenkosten-Rechner',          description: 'Monatliche Nebenkosten für Wohnungen berechnen.',                              category: 'wohnen',    featured: false, live: true },
  { slug: 'immobilienkauf-nebenkosten', title: 'Immobilienkauf-Nebenkosten',  description: 'Notar, Makler und Grunderwerbsteuer berechnen.',                               category: 'wohnen',    featured: false, live: true },
  { slug: 'hauskauf-rechner',            title: 'Hauskauf-Rechner',             description: 'Gesamtkosten beim Hauskauf berechnen.',                                        category: 'wohnen',    featured: false, live: true },
  { slug: 'mietrechner',                 title: 'Mietrechner',                 description: 'Kaltmiete zu Warmmiete umrechnen.',                                            category: 'wohnen',    featured: false, live: true },
  { slug: 'quadratmeterpreis-vergleich', title: 'Quadratmeterpreis',            description: 'Immobilienpreise pro m² nach Region vergleichen.',                             category: 'wohnen',    featured: false, live: true },
  { slug: 'grundbuch-eintragung',      title: 'Grundbuch-Eintragung',      description: 'Kosten für Grundbucheintragung berechnen.',                                category: 'wohnen',    featured: false, live: true },
  { slug: 'kaufen-vs-mieten',          title: 'Kaufen vs. Mieten',         description: 'Vergleich: Immobilienkauf oder Mieten – was ist günstiger?',                category: 'wohnen',    featured: false, live: true },
  { slug: 'mietrendite-rechner',          title: 'Mietrendite-Rechner',            description: 'Brutto- und Nettorendite von Mietimmobilien berechnen.',                 category: 'wohnen',    featured: false, live: true },
  { slug: 'wie-viel-haus',                title: 'Wie viel Haus kann ich mir leisten?', description: 'Maximalen Kaufpreis basierend auf Einkommen berechnen.',              category: 'wohnen',    featured: false, live: true },
  { slug: 'tilgungsplan',             title: 'Tilgungsplan',               description: 'Tilgungsplan für Baudarlehen erstellen.',                                     category: 'wohnen',    featured: false, live: true },
  // ENERGIE
  { slug: 'stromkosten-rechner',          title: 'Stromkosten-Rechner',          description: 'Stromkosten aus kWh-Verbrauch berechnen.',                                     category: 'energie',   featured: true,  live: true },
  { slug: 'heizkosten-rechner',          title: 'Heizkosten-Rechner',           description: 'Jährliche Heizkosten berechnen.',                                              category: 'energie',   featured: false, live: true },
  { slug: 'photovoltaik-rechner',         title: 'Photovoltaik-Rechner',         description: 'Amortisationszeit einer PV-Anlage berechnen.',                                category: 'energie',   featured: false, live: true },
  { slug: 'waermepumpe-rechner',         title: 'Wärmepumpe-Rechner',           description: 'Heizkosten-Vergleich: Wärmepumpe vs. Gas.',                                   category: 'energie',   featured: false, live: true },
  { slug: 'stromspeicher-rechner',        title: 'Stromspeicher-Rechner',        description: 'Amortisation eines Stromspeichers berechnen.',                                category: 'energie',   featured: false, live: true },
  // AUTO
  { slug: 'kfz-steuer-rechner',          title: 'Kfz-Steuer-Rechner',           description: 'Kfz-Steuer für Benziner, Diesel und Elektro berechnen.',                        category: 'auto',      featured: true,  live: true },
  { slug: 'spritkosten-rechner',         title: 'Spritkosten-Rechner',          description: 'Kraftstoffkosten für eine Fahrt berechnen.',                                 category: 'auto',      featured: false, live: true },
  { slug: 'fahrtkosten-rechner',         title: 'Fahrtkosten-Rechner',          description: 'Steuerliche Kilometerpauschale berechnen.',                                  category: 'auto',      featured: false, live: true },
  { slug: 'busgeldrechner',              title: 'Bußgeldrechner',               description: 'Bußgeld, Punkte und Fahrverbot berechnen.',                                  category: 'auto',      featured: true,  live: true },
  { slug: 'leasing-rechner',             title: 'Leasing-Rechner',              description: 'Monatliche Leasingrate berechnen.',                                        category: 'auto',      featured: false, live: true },
  { slug: 'kfz-versicherung-rechner',    title: 'Kfz-Versicherung',             description: 'Kfz-Versicherungsbeitrag schätzen.',                                       category: 'auto',      featured: false, live: true },
  { slug: 'anfahrtskosten-rechner',      title: 'Anfahrtskosten-Rechner',       description: 'Anfahrtskosten für Umzug berechnen.',                                      category: 'auto',      featured: false, live: true },
  { slug: 'kfz-steuer-co2',           title: 'Kfz-Steuer nach CO²',       description: 'Kfz-Steuer für Benziner und Diesel nach CO²-Ausstoß berechnen.',            category: 'auto',      featured: false, live: true },
  { slug: 'fuehrerschein-kosten',     title: 'Führerschein-Kosten',       description: 'Kosten für Auto- oder Motorradführerschein schätzen.',                       category: 'auto',      featured: false, live: true },
  { slug: 'elektroauto-tco-rechner',   title: 'Elektroauto TCO-Rechner',   description: 'Gesamtkosten E-Auto vs. Benziner über 5-10 Jahre berechnen.',                 category: 'auto',      featured: false, live: true },
  { slug: 'spritkosten-vergleich',     title: 'Spritkosten-Vergleich',     description: 'Kosten für Benzin vs. Strom vergleichen.',                                   category: 'auto',      featured: false, live: true },
  // VERSICHERUNGEN
  { slug: 'rechtsschutz-rechner',      title: 'Rechtsschutzversicherung',  description: 'Monatliche Prämie für Rechtsschutzversicherung berechnen.',                  category: 'versicherungen', featured: false, live: true },
  { slug: 'zahnzusatz-rechner',        title: 'Zahnzusatzversicherung',    description: 'Kostenersparnis durch Zahnzusatzversicherung berechnen.',                   category: 'versicherungen', featured: false, live: true },
  { slug: 'pflege-rechner',            title: 'Pflegeversicherung',        description: 'Monatlicher Pflegeversicherungsbeitrag berechnen.',                         category: 'versicherungen', featured: false, live: true },
  { slug: 'elementar-rechner',         title: 'Elementarversicherung',     description: 'Risiko-Bewertung und Prämie für Elementarschäden berechnen.',               category: 'versicherungen', featured: false, live: true },
  // FAMILIE
  { slug: 'kindergeld-rechner',          title: 'Kindergeld-Rechner',           description: 'Kindergeld nach Anzahl der Kinder berechnen.',                               category: 'familie',   featured: false, live: true },
  { slug: 'unterhaltsrechner',           title: 'Unterhaltsrechner',           description: 'Kindesunterhalt nach Düsseldorfer Tabelle berechnen.',                           category: 'familie',   featured: true,  live: true },
  { slug: 'elterngeld-rechner',          title: 'Elterngeld-Rechner',          description: 'Elterngeld und ElterngeldPlus nach BEEG berechnen.',                              category: 'familie',   featured: false, live: true },
  { slug: 'wohngeld-rechner',            title: 'Wohngeld-Rechner',             description: 'Anspruch auf Wohngeld prüfen.',                                            category: 'familie',   featured: false, live: true },
  { slug: 'renten-rechner',              title: 'Renten-Rechner',               description: 'Gesetzliche Rente und Rentenlücke berechnen.',                              category: 'familie',   featured: false, live: true },
  { slug: 'rentenpunkte-rechner',        title: 'Rentenpunkte-Rechner',         description: 'Entgeltpunkte und Rentenanspruch berechnen.',                              category: 'familie',   featured: false, live: true },
  { slug: 'mutterschutz-rechner',        title: 'Mutterschutz-Rechner',         description: 'Mutterschutz-Beginn und -Ende berechnen.',                                 category: 'familie',   featured: false, live: true },
  { slug: 'schwangerschafts-rechner',    title: 'Schwangerschafts-Rechner',     description: 'Geburtstermin und Mutterschaftsgeld berechnen.',                           category: 'familie',   featured: false, live: true },
  { slug: 'betreuungskosten-rechner',    title: 'Betreuungskosten-Rechner',     description: 'Kita-Gebühren nach Einkommen berechnen.',                                category: 'familie',   featured: false, live: true },
  { slug: 'erbschaftsteuer-rechner',     title: 'Erbschaftsteuer-Rechner',      description: 'Erbschaftsteuer nach Verwandtschaftsgrad berechnen.',                      category: 'familie',   featured: false, live: true },
  { slug: 'scheidungskosten-rechner',  title: 'Scheidungskosten-Rechner',  description: 'Kosten für Scheidung schätzen.',                                        category: 'familie',   featured: false, live: true },
  { slug: 'ehegattenunterhalt-rechner', title: 'Ehegattenunterhalt-Rechner', description: 'Trennungsunterhalt und nachehelichen Unterhalt berechnen.',                category: 'familie',   featured: false, live: true },
  { slug: 'bafoeg-rechner',            title: 'BAföG-Rechner',             description: 'BAföG-Höhe nach Eltern-Einkommen, Vermögen und Geschwistern berechnen.',          category: 'familie',   featured: false, live: true },
  // GESUNDHEIT
  { slug: 'bmi-rechner',                 title: 'BMI-Rechner',                   description: 'Body-Mass-Index nach WHO-Formel berechnen.',                               category: 'gesundheit',featured: true,  live: true },
  { slug: 'kalorien-rechner',             title: 'Kalorien-Rechner',              description: 'Täglichen Kalorienbedarf nach Mifflin-St-Jeor berechnen.',                category: 'gesundheit',featured: false, live: true },
  { slug: 'promille-rechner',             title: 'Promille-Rechner',              description: 'Blutalkohol nach Widmark-Formel berechnen.',                              category: 'gesundheit',featured: false, live: true },
  { slug: 'grundumsatz-rechner',         title: 'Grundumsatz-Rechner',           description: 'Grundumsatz (BMR) nach Harris-Benedict berechnen.',                      category: 'gesundheit',featured: false, live: true },
  { slug: 'optimalerpuls-rechner',        title: 'Optimaler Puls-Rechner',        description: 'Optimalen Trainingspuls nach Alter berechnen.',                          category: 'gesundheit',featured: false, live: true },
  { slug: 'kalorien-verbrennen',      title: 'Kalorien verbrennen',       description: 'Kalorienverbrauch beim Sport berechnen.',                                 category: 'gesundheit',featured: false, live: true },
  { slug: 'idealgewicht-rechner',      title: 'Idealgewicht-Rechner',        description: 'Idealgewicht nach Broca und BMI berechnen.',                               category: 'gesundheit',featured: false, live: true },
  { slug: 'makronaehrstoff-rechner',   title: 'Makronährstoff-Rechner',      description: 'Täglichen Protein-, Fett- und Kohlenhydratbedarf berechnen.',                  category: 'gesundheit',featured: false, live: true },
  { slug: 'schlaf-rechner',            title: 'Schlaf-Rechner',              description: 'Optimale Schlafens- und Aufwachzeiten nach Schlafzyklen berechnen.',           category: 'gesundheit',featured: false, live: true },
  { slug: 'blutdruck-bewerter',        title: 'Blutdruck-Bewerter',          description: 'Blutdruckwerte nach WHO-Klassifikation einordnen.',                            category: 'gesundheit',featured: false, live: true },
  // EINHEITEN
  { slug: 'einheitenrechner',             title: 'Einheitenrechner',               description: 'Länge, Gewicht, Temperatur umrechnen.',                                  category: 'einheiten', featured: true,  live: true },
  { slug: 'inflationsrechner',            title: 'Inflationsrechner',              description: 'Kaufkraftverlust durch Inflation berechnen.',                             category: 'einheiten', featured: false, live: true },
  { slug: 'prozent-rechner',              title: 'Prozent-Rechner',                description: 'Prozentwerte, Grundwerte und prozentuale Veränderungen berechnen.',       category: 'einheiten', featured: false, live: true },
  { slug: 'mwst-rechner',                 title: 'MwSt-Rechner',                   description: 'Netto und Brutto mit 19% oder 7% MwSt umrechnen.',                      category: 'einheiten', featured: false, live: true },
  { slug: 'rabatt-rechner',               title: 'Rabatt-Rechner',                 description: 'Rabatte und Endpreise bei Einzel- und Mehrfachrabatten berechnen.',      category: 'einheiten', featured: false, live: true },
  { slug: 'heizkosten-vergleich',         title: 'Heizkosten-Vergleich',           description: 'Heizkosten verschiedener Energieträger vergleichen.',                category: 'energie',   featured: false, live: true },
  { slug: 'solarspeicher-dimensionierung',title: 'Solarspeicher-Dimensionierung',  description: 'Optimale Batteriegröße für deine PV-Anlage berechnen.',              category: 'energie',   featured: false, live: true },
  { slug: 'jahresenergieverbrauch',       title: 'Jahresenergieverbrauch',         description: 'Strom-, Gas- und Wasserverbrauch deines Haushalts berechnen.',     category: 'energie',   featured: false, live: true },
  { slug: 'co2-einsparung-renovierung',   title: 'CO₂-Einsparung durch Renovierung',description: 'Energie- und CO₂-Einsparung durch Sanierungsmaßnahmen berechnen.',category: 'energie',   featured: false, live: true },
  { slug: 'energieausweis-vorberechnung', title: 'Energieausweis-Vorberechnung',   description: 'Wichtige Kennwerte für den Energieausweis deines Hauses ermitteln.',category: 'energie',   featured: false, live: true },
  { slug: 'unterhaltskosten-auto',        title: 'Unterhaltskosten Auto',          description: 'Jährliche Kosten deines Autos inkl. Wertverlust, Steuer, Versicherung.', category: 'auto',      featured: false, live: true },
  { slug: 'elektroauto-verbrennungsmotor',title: 'Elektroauto vs Verbrennungsmotor',description: 'Kostenvergleich E-Auto und Verbrenner über die gesamte Nutzungsdauer.',category: 'auto',      featured: false, live: true },
  { slug: 'e-auto-leasing-kostenrechner', title: 'E-Auto Leasing Kostenrechner',   description: 'Gesamtkosten und monatliche Rate für E-Auto-Leasing berechnen.',        category: 'auto',      featured: false, live: true },
  { slug: 'reichweite-elektroauto',       title: 'Reichweite Elektroauto',         description: 'Realistische Reichweite abhängig von Temperatur, Fahrstil und Gelände.',   category: 'auto',      featured: false, live: true },
  { slug: 'treibstoffkosten-reise',       title: 'Treibstoffkosten für Reise',     description: 'Spritkosten für eine geplante Strecke berechnen.',                 category: 'auto',      featured: false, live: true },
  { slug: 'co2-flotte-berechnung',        title: 'CO₂-Flotten-Berechnung',         description: 'Flottenemissionen für Unternehmen berechnen und ausgleichen.',       category: 'auto',      featured: false, live: true },
  { slug: 'wartungskosten-auto',          title: 'Wartungskosten Auto',            description: 'Voraussichtliche Instandhaltungskosten nach Alter und Laufleistung.',  category: 'auto',      featured: false, live: true },
  { slug: 'familienzuschuss-rechner',     title: 'Familienzuschuss-Rechner',       description: 'Zulässige Höhe des Familienzuschusses beim Finanzamt prüfen.',       category: 'familie',   featured: false, live: true },
  { slug: 'unterhaltsvorschuss-rechner',  title: 'Unterhaltsvorschuss-Rechner',    description: 'Höhe des staatlichen Unterhaltsvorschusses für Alleinerziehende.',     category: 'familie',   featured: false, live: true },
  { slug: 'schwangerengeld-rechner',      title: 'Schwangerengeld-Rechner',        description: 'Zuschuss zum Mutterschaftsgeld bei freiwilliger Versicherung berechnen.',category: 'familie',   featured: false, live: true }
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
