// Registry der Ratgeber-Artikel.
//
// Bewusst eine handgepflegte Liste statt einer Content-Collection: Die Sektion
// soll klein und kuratiert bleiben. Jeder Artikel muss eigene, gerechnete Daten
// mitbringen – nichts, was sich beliebig hochskalieren ließe.
//
// `rechner` verknüpft den Artikel mit den Rechnern, die er erklärt. Daraus baut
// CalculatorShell den Hinweis auf der Rechnerseite. Vorher hing jeder Artikel
// allein am Ratgeber-Index und bekam praktisch keine interne Verlinkung.

import { CALCULATORS } from './calculators';

export interface Artikel {
  slug: string;
  titel: string;
  teaser: string;
  /** ISO-Datum der Veröffentlichung bzw. letzten inhaltlichen Prüfung. */
  datum: string;
  thema: string;
  /**
   * Slugs der Rechner, die auf diesen Artikel verweisen sollen. Der ERSTE ist
   * die Heimat: Ist `aufRechnerseite` gesetzt, steht der Artikeltext auf dessen
   * Seite.
   */
  rechner: string[];
  /**
   * true: Der Artikeltext steht auf der Seite des erstgenannten Rechners,
   * /ratgeber/<slug>/ gibt es nicht mehr und wird per 301 dorthin geleitet.
   * Ohne das Feld liegt der Artikel weiter unter /ratgeber/<slug>/.
   *
   * Warum die Zusammenlegung: Getrennt war beides je eine halbe Seite. Google
   * hat mehrere Rechnerseiten als "Gecrawlt – zurzeit nicht indexiert"
   * aussortiert, waehrend die zugehoerigen Artikel null Impressionen hatten –
   * unter anderem promille-rechner und unterhaltsrechner, fuer die es laengst
   * einen durchgerechneten Artikel gab. Nur eben nicht auf derselben URL.
   *
   * Das Feld existiert, damit die Artikel einzeln umziehen koennen. Solange es
   * fehlt, bleibt fuer diesen Artikel alles beim Alten.
   */
  aufRechnerseite?: boolean;
}

export const ARTIKEL: Artikel[] = [
  {
    slug: 'mietpreisbremse-30-monate-frist',
    titel: 'Mietpreisbremse: Der Anspruch wächst 30 Monate und verfällt im 31.',
    teaser: 'Bei 12,00 €/m² Vergleichsmiete sind 13,20 €/m² zulässig; wer 14,50 €/m² zahlt, zahlt auf 70 m² 91 € im Monat zu viel. Die Rückforderung wächst 30 Monate lang auf 2.730 € – das 2,95-Fache einer zulässigen Monatsmiete – und fällt im 31. Monat auf null, weil § 556g Abs. 2 Satz 3 BGB dann nur noch die Zukunft erfasst. Dazu die Rechnung, warum eine vergessene Auskunft des Vermieters bis zu 2.730 € wert ist.',
    datum: '2026-09-13',
    thema: 'Wohnen',
    rechner: ['mietpreisbremse-rechner', 'mietrechner'],
    aufRechnerseite: true,
  },
  {
    slug: 'abgeltungsteuer-nie-25-prozent',
    titel: 'Abgeltungsteuer: Warum niemand 25 Prozent zahlt',
    teaser: 'Ohne Kirchensteuer sind es 26,375 Prozent, mit Kirchensteuer 27,995 – aber nicht, weil 9 Prozent obendrauf kommen. § 32d Abs. 1 Satz 3 EStG senkt die Kapitalertragsteuer auf 24,45 Prozent, sodass von jedem Euro Kirchensteuer nur 74 Cent ankommen. Dazu die Schwelle, unter der sich die Abgeltungsteuer gar nicht lohnt.',
    datum: '2026-09-12',
    thema: 'Geld',
    rechner: ['abgeltungsteuer-rechner', 'etf-renditerechner'],
    aufRechnerseite: true,
  },
  {
    slug: 'bussgeldkatalog-schwellenwerte',
    titel: 'Bußgeldkatalog: Wo ein einziges km/h den Preis vervielfacht',
    teaser: 'Innerorts trennt ein Kilometer pro Stunde 180 € von 260 € und dem ersten Fahrverbot. Der teuerste km/h steht aber beim Abstand: Von 80 auf 81 km/h springt derselbe gemessene Abstand von pauschal 25 € auf bis zu 320 €. Und bei 130 km/h trennt ein Meter – 28 Millisekunden – eine Geldbuße ohne Fahrverbot von einer mit.',
    datum: '2026-08-27',
    thema: 'Auto',
    rechner: ['busgeldrechner'],
    aufRechnerseite: true,
  },
  {
    slug: 'kuendigungsfrist-arbeitgeber-arbeitnehmer',
    titel: 'Kündigungsfrist: Warum der Arbeitgeber achtmal so lange warten muss',
    teaser: 'Die Staffel des § 622 Abs. 2 BGB gilt nur für die Kündigung durch den Arbeitgeber – wer selbst kündigt, bleibt sein Arbeitsleben lang bei vier Wochen. Nach 20 Jahren sind das 241 gegen 29 Tage. Dazu die Rechnung, warum „vier Wochen" real zwischen 28 und 43 Tagen dauern, und der Satz, den der EuGH kippte und der neun Jahre später verschwand.',
    datum: '2026-08-27',
    thema: 'Geld',
    rechner: ['kuendigungsfrist-rechner', 'abfindungsrechner', 'arbeitslosengeld-rechner'],
    aufRechnerseite: true,
  },
  {
    slug: 'strompreis-zusammensetzung',
    titel: 'Woraus der Strompreis besteht – und warum ein Anbieterwechsel nur die Hälfte trifft',
    teaser: 'Von 37,00 ct je Kilowattstunde entfallen 18,05 ct auf Beschaffung und Vertrieb – der einzige Teil, über den ein Tarifwechsel verhandelt. Die übrigen 51,2 Prozent stehen fest, bevor ein Vertrag unterschrieben ist: Ein Prozent Rabatt senkt die Jahresrechnung um 0,49 Prozent. Dazu die Frage, warum „34 Prozent Steuern und Abgaben" nicht heißt, dass der Staat 34 Prozent bekommt.',
    datum: '2026-08-27',
    thema: 'Energie',
    rechner: ['stromkosten-rechner', 'waermepumpe-rechner', 'stromspeicher-rechner', 'heizkosten-vergleich'],
    aufRechnerseite: true,
  },
  {
    slug: 'kindesunterhalt-volljaehrigkeit',
    titel: 'Kindesunterhalt: Warum der 18. Geburtstag den Zahlbetrag senkt',
    teaser: 'Der Bedarf steigt, der überwiesene Betrag sinkt – in allen fünfzehn Einkommensgruppen, um 39,50 bis 77,50 € im Monat. Dazu die Spanne von 856 €, in der jeder zusätzliche Euro vollständig an die Kinder geht, und der Euro an der Gruppengrenze, der 1.080 € im Jahr auslöst.',
    datum: '2026-08-27',
    thema: 'Familie',
    rechner: ['unterhaltsrechner', 'ehegattenunterhalt-rechner', 'kindergeld-rechner'],
    aufRechnerseite: true,
  },
  {
    slug: 'wohngeld-mietenstufe-gegen-einkommen',
    titel: 'Wohngeld: Bei 300 € Miete zahlen alle sieben Mietenstufen dasselbe',
    teaser: 'Die Mietenstufe wirkt nur als Deckel – unterhalb davon ergeben Stufe I und Stufe VII denselben Betrag. Wo sie wirkt, ist der Sprung von I auf VII bis zu 295 € im Monat wert – so viel wie 459 € mehr Monatsbrutto. Dazu die Schwelle, an der ein Euro Mehrverdienst 63 € mehr Wohngeld bringt.',
    datum: '2026-08-27',
    thema: 'Familie',
    rechner: ['wohngeld-rechner'],
    aufRechnerseite: true,
  },
  {
    slug: 'inflation-was-die-rate-verschweigt',
    titel: 'Die Inflationsrate erlebt niemand',
    teaser: 'Hinter dem Durchschnitt von 25,6 Prozent seit 2020 liegen 38,5 Prozentpunkte Spanne – Verkehr +37,7 Prozent, Post und Telekommunikation billiger als damals. Alle zwölf Abteilungen des Verbraucherpreisindex einzeln, samt dem Rechenfehler bei der Kaufkraft.',
    datum: '2026-08-15',
    thema: 'Einheiten',
    rechner: ['inflationsrechner'],
    aufRechnerseite: true,
  },
  {
    slug: 'promille-abbau-und-grenzwerte',
    titel: 'Promille: Zwei am Abend sind 0,8 am Morgen',
    teaser: 'Der Körper baut 0,15 Promille je Stunde ab – acht Stunden Schlaf schaffen also nicht mehr als 1,20. Dazu die vier Grenzwerte, von denen nur drei im Gesetz stehen, und warum der Bußgeldkatalog zwischen 0,5 und 1,1 Promille gar nicht unterscheidet.',
    datum: '2026-08-15',
    thema: 'Gesundheit',
    rechner: ['promille-rechner', 'busgeldrechner'],
    aufRechnerseite: true,
  },
  {
    slug: 'bootstrailer-fuehrerschein-tempo-100',
    titel: 'Bootstrailer: Warum das größere Zugfahrzeug den kleineren Trailer erlaubt',
    teaser: 'Klasse B deckt bei 1.600 kg Zugfahrzeug einen Trailer von 1.900 kg, bei 2.500 kg nur noch 1.000 kg – die Kombinationsgrenze ist fest. Und über Tempo 100 entscheidet nicht das Gewicht, sondern ob am Trailer Schwingungsdämpfer sitzen.',
    datum: '2026-08-15',
    thema: 'Boot',
    rechner: ['bootstrailer-fuehrerschein'],
    aufRechnerseite: true,
  },
  {
    slug: 'pflegeversicherung-beitrag-und-luecke',
    titel: 'Pflegeversicherung: Der Beitrag ist die kleine Zahl',
    teaser: 'Ein Kinderloser mit 3.000 € Monatsbrutto zahlt 72 € im Monat – im Pflegeheim bleiben ihm 3.364 € monatlich selbst. Beitrag, Leistung und Eigenanteil durchgerechnet, samt der Regel, nach der ein Heimplatz mit den Jahren billiger wird.',
    datum: '2026-08-15',
    thema: 'Versicherungen',
    rechner: ['pflege-rechner'],
    aufRechnerseite: true,
  },
  {
    slug: 'elterngeld-ersatzrate',
    titel: 'Elterngeld: Warum die 67 Prozent für die meisten 43 sind',
    teaser: 'Die Regelersatzrate gilt nur zwischen rund 1.400 und 1.700 € Brutto, darüber sind es 65 Prozent – und gemessen am Bruttogehalt bleiben bei einem mittleren Einkommen 43. Dazu der Irrtum über ElterngeldPlus, der bis zu 6.996 € kostet.',
    datum: '2026-08-14',
    thema: 'Familie',
    rechner: ['elterngeld-rechner', 'mutterschutz-rechner'],
    aufRechnerseite: true,
  },
  {
    slug: 'nebenkosten-was-umlagefaehig-ist',
    titel: 'Nebenkosten: Was der Vermieter umlegen darf – und was nicht',
    teaser: 'Die Heizung macht fast die Hälfte aus, Aufzug, Garten und Hauswart zusammen 563 € im Jahr, und § 1 Abs. 2 BetrKV schließt nur zwei Posten aus. Alle Positionen einzeln aufgeschlüsselt – samt der beiden Zwölfmonatsfristen, die regelmäßig verwechselt werden.',
    datum: '2026-08-14',
    thema: 'Wohnen',
    rechner: ['nebenkosten-rechner', 'mietrechner'],
    aufRechnerseite: true,
  },
  {
    slug: 'photovoltaik-eigenverbrauch',
    titel: 'Photovoltaik: Der Eigenverbrauch entscheidet, nicht die Anlagengröße',
    teaser: 'Eine selbst verbrauchte Kilowattstunde ist fast fünfmal so viel wert wie eine eingespeiste. Dieselbe Anlage bringt je nach Eigenverbrauchsquote ein Minus oder 27.000 € – und die größere Anlage ist bei gleichem Verbrauch die schlechtere.',
    datum: '2026-08-14',
    thema: 'Energie',
    rechner: ['photovoltaik-rechner', 'stromspeicher-rechner', 'solarspeicher-dimensionierung'],
    aufRechnerseite: true,
  },
  {
    slug: 'steuerklasse-wechseln-was-bringt',
    titel: 'Steuerklasse wechseln: Was es wirklich bringt – und was nicht',
    teaser: 'Alle vier Kombinationen führen zur selben Jahressteuer – nur was unterjährig einbehalten wird, unterscheidet sich, bei einem Paar um 2.830 € im Jahr. Durchgerechnet für drei Einkommensverteilungen, samt der einen Situation, in der ein Wechsel echtes Geld bringt.',
    datum: '2026-08-14',
    thema: 'Geld',
    rechner: ['steuerklasse-optimieren', 'steuerklassen-vergleich', 'brutto-netto-rechner'],
    aufRechnerseite: true,
  },
  {
    slug: 'elektroauto-gegen-verbrenner',
    titel: 'Elektroauto gegen Verbrenner: Die Rechnung entscheidet sich an der Steckdose',
    teaser: 'Derselbe Opel Corsa mit zwei Antrieben, über acht Jahre gerechnet. Zu Hause geladen spart der Stromer vierstellig, öffentlich schnellgeladen kostet er drauf – plus das Detail, das die Steuerbefreiung nach § 3d KraftStG verkürzt.',
    datum: '2026-08-14',
    thema: 'Auto',
    rechner: ['elektroauto-tco-rechner', 'spritkosten-vergleich', 'e-auto-leasing-kostenrechner'],
    aufRechnerseite: true,
  },
  {
    slug: 'gebrauchtwagen-alter-kosten',
    titel: 'Das günstigste Autojahr ist das sechste – gerechnet aus 9.772 Gebrauchtwagenpreisen',
    teaser: 'Der Wertverlust halbiert sich zwischen dem dritten und dem achten Jahr, die Werkstattkosten steigen deutlich langsamer. Eigene Auswertung der DAT-Preisnotierungen – samt der Antwort, warum ein Gebrauchter den Neuwagen nie einholt.',
    datum: '2026-08-14',
    thema: 'Auto',
    rechner: ['wartungskosten-auto', 'unterhaltskosten-auto'],
    aufRechnerseite: true,
  },
  {
    slug: 'autokosten-wertverlust',
    titel: 'Was ein Auto wirklich pro Kilometer kostet – und warum der Sprit der kleinere Posten ist',
    teaser: 'Der Wertverlust macht 30 bis 57 Prozent der Autokosten aus, der Kraftstoff nur 14 bis 31. Fünf Modelle nach ADAC-Daten aufgeschlüsselt – samt der Rechnung, warum derselbe Golf als Diesel teurer ist.',
    datum: '2026-08-14',
    thema: 'Auto',
    rechner: ['km-kostenrechner', 'unterhaltskosten-auto', 'spritkosten-rechner'],
    aufRechnerseite: true,
  },
  {
    slug: 'pendlerpauschale-was-sie-bringt',
    titel: 'Pendlerpauschale 2026: Warum sie bei zehn Kilometern nichts bringt',
    teaser: 'Seit 2026 gilt ein einheitlicher Satz von 0,38 € je Kilometer. Durchgerechnet für sechs Entfernungen und zwei Einkommen – samt der Schwelle, unterhalb der die Pauschale null bewirkt.',
    datum: '2026-08-14',
    thema: 'Auto',
    rechner: ['fahrtkosten-rechner', 'homeoffice-pauschale'],
    aufRechnerseite: true,
  },
  {
    slug: 'kfz-steuer-erstzulassung',
    titel: 'Kfz-Steuer: Warum dasselbe Auto je nach Zulassungsdatum dreimal so viel kostet',
    teaser: 'Drei Steuerregime gelten nebeneinander, und ein Fahrzeug wechselt nie in ein neueres. Dasselbe Auto durch alle drei gerechnet – plus die Frage, warum ein Wagen von 2010 weniger zahlt als einer von 2022.',
    datum: '2026-08-14',
    thema: 'Auto',
    rechner: ['kfz-steuer-rechner', 'kfz-steuer-co2'],
    aufRechnerseite: true,
  },
  {
    slug: 'grunderwerbsteuer-bundeslaender',
    titel: 'Grunderwerbsteuer 2026: Was ein Hauskauf in jedem Bundesland kostet',
    teaser: 'Alle 16 Sätze durchgerechnet für 400.000 € Kaufpreis – inklusive Gültigkeitsdaten, der Wirkung auf das Eigenkapital und der einen legalen Stellschraube.',
    datum: '2026-08-10',
    thema: 'Wohnen',
    rechner: ['grunderwerbsteuer-rechner', 'immobilienkauf-nebenkosten', 'hauskauf-rechner'],
    aufRechnerseite: true,
  },
];

// Tippfehler in einem Rechner-Slug wuerde den Hinweis stillschweigend
// verschlucken. Genau so ist frueher ein Link auf '/auto/bussgeldrechner/'
// entstanden – die Seite heisst 'busgeldrechner'. Deshalb bricht der Build.
const BEKANNTE_SLUGS = new Set(CALCULATORS.filter((c) => c.live).map((c) => c.slug));
for (const a of ARTIKEL) {
  for (const slug of a.rechner) {
    if (!BEKANNTE_SLUGS.has(slug)) {
      throw new Error(
        `Ratgeber-Artikel "${a.slug}" verweist auf unbekannten Rechner "${slug}".`
      );
    }
  }
}

export const ARTIKEL_SORTIERT = [...ARTIKEL].sort((a, b) => b.datum.localeCompare(a.datum));

/** Der Pfad der Seite, auf welcher der Artikeltext tatsächlich steht. */
export function artikelPfad(a: Artikel): string {
  if (!a.aufRechnerseite) return `ratgeber/${a.slug}/`;
  const calc = CALCULATORS.find((c) => c.slug === a.rechner[0]);
  if (!calc) {
    throw new Error(`Artikel "${a.slug}" ist auf "${a.rechner[0]}" umgezogen, den es nicht gibt.`);
  }
  return `${calc.category}/${calc.slug}/`;
}

/**
 * Pfad eines Artikels anhand seines Slugs – für Querverweise aus einem Artikel
 * in einen anderen. Ein Tippfehler bricht den Build, statt einen toten Link zu
 * hinterlassen; und wenn ein Artikel später umzieht, wandert der Verweis mit.
 */
export function artikelPfadVonSlug(slug: string): string {
  const a = ARTIKEL.find((x) => x.slug === slug);
  if (!a) throw new Error(`Querverweis auf unbekannten Artikel "${slug}".`);
  return artikelPfad(a);
}

/**
 * Artikel, die diesen Rechner erklären, deren Text aber WOANDERS steht – also
 * die, für die ein Hinweisblock sinnvoll ist. Der Artikel auf der eigenen Seite
 * braucht keinen Link auf sich selbst.
 */
export function artikelZuRechner(slug: string): Artikel[] {
  return ARTIKEL.filter(
    (a) => a.rechner.includes(slug) && !(a.aufRechnerseite && a.rechner[0] === slug),
  );
}
