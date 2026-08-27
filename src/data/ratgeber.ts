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
  /** Slugs der Rechner, die auf diesen Artikel verweisen sollen. */
  rechner: string[];
}

export const ARTIKEL: Artikel[] = [
  {
    slug: 'kindesunterhalt-volljaehrigkeit',
    titel: 'Kindesunterhalt: Warum der 18. Geburtstag den Zahlbetrag senkt',
    teaser: 'Der Bedarf steigt, der überwiesene Betrag sinkt – in allen fünfzehn Einkommensgruppen, um 39,50 bis 77,50 € im Monat. Dazu die Spanne von 856 €, in der jeder zusätzliche Euro vollständig an die Kinder geht, und der Euro an der Gruppengrenze, der 1.080 € im Jahr auslöst.',
    datum: '2026-08-27',
    thema: 'Familie',
    rechner: ['unterhaltsrechner', 'ehegattenunterhalt-rechner', 'kindergeld-rechner'],
  },
  {
    slug: 'wohngeld-mietenstufe-gegen-einkommen',
    titel: 'Wohngeld: Bei 300 € Miete zahlen alle sieben Mietenstufen dasselbe',
    teaser: 'Die Mietenstufe wirkt nur als Deckel – unterhalb davon ergeben Stufe I und Stufe VII denselben Betrag. Wo sie wirkt, ist der Sprung von I auf VII bis zu 295 € im Monat wert – so viel wie 459 € mehr Monatsbrutto. Dazu die Schwelle, an der ein Euro Mehrverdienst 63 € mehr Wohngeld bringt.',
    datum: '2026-08-27',
    thema: 'Familie',
    rechner: ['wohngeld-rechner'],
  },
  {
    slug: 'inflation-was-die-rate-verschweigt',
    titel: 'Die Inflationsrate erlebt niemand',
    teaser: 'Hinter dem Durchschnitt von 25,6 Prozent seit 2020 liegen 38,5 Prozentpunkte Spanne – Verkehr +37,7 Prozent, Post und Telekommunikation billiger als damals. Alle zwölf Abteilungen des Verbraucherpreisindex einzeln, samt dem Rechenfehler bei der Kaufkraft.',
    datum: '2026-08-15',
    thema: 'Einheiten',
    rechner: ['inflationsrechner'],
  },
  {
    slug: 'promille-abbau-und-grenzwerte',
    titel: 'Promille: Zwei am Abend sind 0,8 am Morgen',
    teaser: 'Der Körper baut 0,15 Promille je Stunde ab – acht Stunden Schlaf schaffen also nicht mehr als 1,20. Dazu die vier Grenzwerte, von denen nur drei im Gesetz stehen, und warum der Bußgeldkatalog zwischen 0,5 und 1,1 Promille gar nicht unterscheidet.',
    datum: '2026-08-15',
    thema: 'Gesundheit',
    rechner: ['promille-rechner', 'busgeldrechner'],
  },
  {
    slug: 'bootstrailer-fuehrerschein-tempo-100',
    titel: 'Bootstrailer: Warum das größere Zugfahrzeug den kleineren Trailer erlaubt',
    teaser: 'Klasse B deckt bei 1.600 kg Zugfahrzeug einen Trailer von 1.900 kg, bei 2.500 kg nur noch 1.000 kg – die Kombinationsgrenze ist fest. Und über Tempo 100 entscheidet nicht das Gewicht, sondern ob am Trailer Schwingungsdämpfer sitzen.',
    datum: '2026-08-15',
    thema: 'Boot',
    rechner: ['bootstrailer-fuehrerschein'],
  },
  {
    slug: 'pflegeversicherung-beitrag-und-luecke',
    titel: 'Pflegeversicherung: Der Beitrag ist die kleine Zahl',
    teaser: 'Ein Kinderloser mit 3.000 € Monatsbrutto zahlt 72 € im Monat – im Pflegeheim bleiben ihm 3.364 € monatlich selbst. Beitrag, Leistung und Eigenanteil durchgerechnet, samt der Regel, nach der ein Heimplatz mit den Jahren billiger wird.',
    datum: '2026-08-15',
    thema: 'Versicherungen',
    rechner: ['pflege-rechner'],
  },
  {
    slug: 'elterngeld-ersatzrate',
    titel: 'Elterngeld: Warum die 67 Prozent für die meisten 43 sind',
    teaser: 'Die Regelersatzrate gilt nur zwischen rund 1.400 und 1.700 € Brutto, darüber sind es 65 Prozent – und gemessen am Bruttogehalt bleiben bei einem mittleren Einkommen 43. Dazu der Irrtum über ElterngeldPlus, der bis zu 6.996 € kostet.',
    datum: '2026-08-14',
    thema: 'Familie',
    rechner: ['elterngeld-rechner', 'mutterschutz-rechner'],
  },
  {
    slug: 'nebenkosten-was-umlagefaehig-ist',
    titel: 'Nebenkosten: Was der Vermieter umlegen darf – und was nicht',
    teaser: 'Die Heizung macht fast die Hälfte aus, Aufzug, Garten und Hauswart zusammen 563 € im Jahr, und § 1 Abs. 2 BetrKV schließt nur zwei Posten aus. Alle Positionen einzeln aufgeschlüsselt – samt der beiden Zwölfmonatsfristen, die regelmäßig verwechselt werden.',
    datum: '2026-08-14',
    thema: 'Wohnen',
    rechner: ['nebenkosten-rechner', 'mietrechner'],
  },
  {
    slug: 'photovoltaik-eigenverbrauch',
    titel: 'Photovoltaik: Der Eigenverbrauch entscheidet, nicht die Anlagengröße',
    teaser: 'Eine selbst verbrauchte Kilowattstunde ist fast fünfmal so viel wert wie eine eingespeiste. Dieselbe Anlage bringt je nach Eigenverbrauchsquote ein Minus oder 27.000 € – und die größere Anlage ist bei gleichem Verbrauch die schlechtere.',
    datum: '2026-08-14',
    thema: 'Energie',
    rechner: ['photovoltaik-rechner', 'stromspeicher-rechner', 'solarspeicher-dimensionierung'],
  },
  {
    slug: 'steuerklasse-wechseln-was-bringt',
    titel: 'Steuerklasse wechseln: Was es wirklich bringt – und was nicht',
    teaser: 'Alle vier Kombinationen führen zur selben Jahressteuer – nur was unterjährig einbehalten wird, unterscheidet sich, bei einem Paar um 2.830 € im Jahr. Durchgerechnet für drei Einkommensverteilungen, samt der einen Situation, in der ein Wechsel echtes Geld bringt.',
    datum: '2026-08-14',
    thema: 'Geld',
    rechner: ['steuerklasse-optimieren', 'steuerklassen-vergleich', 'brutto-netto-rechner'],
  },
  {
    slug: 'elektroauto-gegen-verbrenner',
    titel: 'Elektroauto gegen Verbrenner: Die Rechnung entscheidet sich an der Steckdose',
    teaser: 'Derselbe Opel Corsa mit zwei Antrieben, über acht Jahre gerechnet. Zu Hause geladen spart der Stromer vierstellig, öffentlich schnellgeladen kostet er drauf – plus das Detail, das die Steuerbefreiung nach § 3d KraftStG verkürzt.',
    datum: '2026-08-14',
    thema: 'Auto',
    rechner: ['elektroauto-tco-rechner', 'spritkosten-vergleich', 'e-auto-leasing-kostenrechner'],
  },
  {
    slug: 'gebrauchtwagen-alter-kosten',
    titel: 'Das günstigste Autojahr ist das sechste – gerechnet aus 9.772 Gebrauchtwagenpreisen',
    teaser: 'Der Wertverlust halbiert sich zwischen dem dritten und dem achten Jahr, die Werkstattkosten steigen deutlich langsamer. Eigene Auswertung der DAT-Preisnotierungen – samt der Antwort, warum ein Gebrauchter den Neuwagen nie einholt.',
    datum: '2026-08-14',
    thema: 'Auto',
    rechner: ['wartungskosten-auto', 'unterhaltskosten-auto'],
  },
  {
    slug: 'autokosten-wertverlust',
    titel: 'Was ein Auto wirklich pro Kilometer kostet – und warum der Sprit der kleinere Posten ist',
    teaser: 'Der Wertverlust macht 30 bis 57 Prozent der Autokosten aus, der Kraftstoff nur 14 bis 31. Fünf Modelle nach ADAC-Daten aufgeschlüsselt – samt der Rechnung, warum derselbe Golf als Diesel teurer ist.',
    datum: '2026-08-14',
    thema: 'Auto',
    rechner: ['km-kostenrechner', 'unterhaltskosten-auto', 'spritkosten-rechner'],
  },
  {
    slug: 'pendlerpauschale-was-sie-bringt',
    titel: 'Pendlerpauschale 2026: Warum sie bei zehn Kilometern nichts bringt',
    teaser: 'Seit 2026 gilt ein einheitlicher Satz von 0,38 € je Kilometer. Durchgerechnet für sechs Entfernungen und zwei Einkommen – samt der Schwelle, unterhalb der die Pauschale null bewirkt.',
    datum: '2026-08-14',
    thema: 'Auto',
    rechner: ['fahrtkosten-rechner', 'homeoffice-pauschale'],
  },
  {
    slug: 'kfz-steuer-erstzulassung',
    titel: 'Kfz-Steuer: Warum dasselbe Auto je nach Zulassungsdatum dreimal so viel kostet',
    teaser: 'Drei Steuerregime gelten nebeneinander, und ein Fahrzeug wechselt nie in ein neueres. Dasselbe Auto durch alle drei gerechnet – plus die Frage, warum ein Wagen von 2010 weniger zahlt als einer von 2022.',
    datum: '2026-08-14',
    thema: 'Auto',
    rechner: ['kfz-steuer-rechner', 'kfz-steuer-co2'],
  },
  {
    slug: 'grunderwerbsteuer-bundeslaender',
    titel: 'Grunderwerbsteuer 2026: Was ein Hauskauf in jedem Bundesland kostet',
    teaser: 'Alle 16 Sätze durchgerechnet für 400.000 € Kaufpreis – inklusive Gültigkeitsdaten, der Wirkung auf das Eigenkapital und der einen legalen Stellschraube.',
    datum: '2026-08-10',
    thema: 'Wohnen',
    rechner: ['grunderwerbsteuer-rechner', 'immobilienkauf-nebenkosten', 'hauskauf-rechner'],
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

/** Artikel, die den Rechner mit diesem Slug erklären. */
export function artikelZuRechner(slug: string): Artikel[] {
  return ARTIKEL.filter((a) => a.rechner.includes(slug));
}
