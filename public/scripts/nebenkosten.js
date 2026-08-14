// Nebenkosten: umlagefähige Betriebskosten, Vorauszahlung und Fristen.
//
// Rechtsgrundlagen:
//   § 556 Abs. 3 BGB   – jährliche Abrechnung, Ausschlussfrist, Einwendungsfrist
//   § 556 Abs. 4 BGB   – Anspruch auf Belegeinsicht
//   § 556a Abs. 1 BGB  – Verteilerschlüssel: im Zweifel die Wohnfläche
//   § 1 Abs. 2 BetrKV  – was gerade NICHT umlagefähig ist
//   § 2 BetrKV         – die 17 umlagefähigen Betriebskostenarten
//   § 72 TKG           – Glasfaserbereitstellungsentgelt
//   § 7 Abs. 1 HeizkostenV – verbrauchsabhängiger Anteil der Heizkosten
//
// Die Richtwerte je Quadratmeter sind KEINE Rechtsgrößen, sondern Durchschnitte
// aus dem Betriebskostenspiegel des Deutschen Mieterbundes. Sie stehen hier als
// datierte Annahme; maßgeblich ist immer die eigene Abrechnung.

export const NEBENKOSTEN_STAND = '2026-08';

// Betriebskostenspiegel des Deutschen Mieterbundes.
// `durchschnittGesamt` ist das, was Mieter im Schnitt tatsächlich zahlen;
// `alleArtenGesamt` das, was zusammenkommt, wenn jede Kostenart anfällt.
export const BETRIEBSKOSTENSPIEGEL = {
  abrechnungsjahr: 2024,
  veroeffentlicht: '2025-12-18',
  durchschnittGesamt: 2.67,
  alleArtenGesamt: 3.68,
};

// Die vom Betriebskostenspiegel einzeln ausgewiesenen Arten, jeweils mit der
// Nummer des § 2 BetrKV, unter der sie umlagefähig sind.
//
// `euroProQmMonat` ist der Durchschnitt je Quadratmeter Wohnfläche und MONAT –
// nicht je Jahr. Die Vorgängerfassung führte dieselben Werte als Jahreswerte
// und teilte sie noch einmal durch zwölf; der Rechner wies dadurch rund ein
// Zwölftel der tatsächlichen Nebenkosten aus.
//
// `bedingung` gibt an, wovon die Position abhängt: 'immer' fällt in jedem
// Mietverhältnis an, die übrigen nur bei entsprechender Ausstattung.
export const BETRIEBSKOSTEN_ARTEN = [
  { nr: 1,      key: 'grundsteuer',       label: 'Grundsteuer',                       euroProQmMonat: 0.18, bedingung: 'immer',    verteiler: 'wohnflaeche' },
  { nr: [2, 3], key: 'wasser',            label: 'Wasser und Entwässerung',           euroProQmMonat: 0.29, bedingung: 'immer',    verteiler: 'verbrauch' },
  { nr: [4, 5], key: 'heizung',           label: 'Heizung und Warmwasser',            euroProQmMonat: 1.32, spitze: 2.18, bedingung: 'immer', verteiler: 'verbrauch' },
  { nr: 7,      key: 'aufzug',            label: 'Aufzug',                            euroProQmMonat: 0.20, bedingung: 'aufzug',   verteiler: 'wohnflaeche' },
  { nr: 8,      key: 'strassenreinigung', label: 'Straßenreinigung',                  euroProQmMonat: 0.04, bedingung: 'immer',    verteiler: 'wohnflaeche' },
  { nr: 8,      key: 'muell',             label: 'Müllbeseitigung',                   euroProQmMonat: 0.16, bedingung: 'immer',    verteiler: 'wohnflaeche' },
  { nr: 9,      key: 'reinigung',         label: 'Gebäudereinigung',                  euroProQmMonat: 0.21, bedingung: 'immer',    verteiler: 'wohnflaeche' },
  { nr: 10,     key: 'gartenpflege',      label: 'Gartenpflege',                      euroProQmMonat: 0.15, bedingung: 'garten',   verteiler: 'wohnflaeche' },
  { nr: 11,     key: 'beleuchtung',       label: 'Beleuchtung (Allgemeinstrom)',      euroProQmMonat: 0.06, bedingung: 'immer',    verteiler: 'wohnflaeche' },
  { nr: 12,     key: 'schornstein',       label: 'Schornsteinreinigung',              euroProQmMonat: 0.04, bedingung: 'immer',    verteiler: 'wohnflaeche' },
  { nr: 13,     key: 'versicherung',      label: 'Sach- und Haftpflichtversicherung', euroProQmMonat: 0.31, bedingung: 'immer',    verteiler: 'wohnflaeche' },
  { nr: 14,     key: 'hauswart',          label: 'Hauswart',                          euroProQmMonat: 0.32, bedingung: 'hauswart', verteiler: 'wohnflaeche' },
  { nr: 17,     key: 'sonstiges',         label: 'Sonstige Betriebskosten',           euroProQmMonat: 0.07, bedingung: 'immer',    verteiler: 'wohnflaeche' },
];

// Was der Vermieter NICHT umlegen darf.
//
// § 1 Abs. 2 BetrKV kennt dafür nur ZWEI Nummern: Verwaltungskosten (Nr. 1, die
// Aufsicht und die Prüfung des Jahresabschlusses gehören ausdrücklich dazu) und
// Instandhaltung/Instandsetzung (Nr. 2). Die Einschränkung beim Hauswart steht
// nicht dort, sondern in der Betriebskostenart selbst – § 2 Nr. 14 BetrKV nimmt
// Instandhaltung, Instandsetzung, Erneuerung, Schönheitsreparaturen und
// Hausverwaltung von der Umlage aus. Die Liste führt beides zusammen; die
// Fundstelle steht deshalb an jedem Eintrag.
export const NICHT_UMLAGEFAEHIG = [
  'Verwaltungskosten einschließlich der Hausverwaltung, der Aufsicht und der Prüfung des Jahresabschlusses (§ 1 Abs. 2 Nr. 1 BetrKV)',
  'Instandhaltung und Instandsetzung, also die Beseitigung von Mängeln aus Abnutzung, Alterung und Witterung (§ 1 Abs. 2 Nr. 2 BetrKV)',
  'Der Teil der Hauswartvergütung, der auf Instandhaltung, Instandsetzung, Erneuerung, Schönheitsreparaturen oder Hausverwaltung entfällt (§ 2 Nr. 14 BetrKV)',
];

// § 2 Nr. 15 Buchst. a und b BetrKV: das Nutzungsentgelt für Kabelfernsehen war
// nur bis zu diesem Tag umlagefähig ("Nebenkostenprivileg"). Seither trägt es
// der Mieter nur noch über einen eigenen Vertrag mit dem Anbieter.
export const KABEL_UMLAGE_ENDE = '2024-06-30';

// § 72 Abs. 2 TKG: an die Stelle des Kabelentgelts kann ein befristetes
// Glasfaserentgelt treten – gedeckelt und nur bei wirtschaftlicher Umsetzung
// (§ 556 Abs. 3a BGB).
export const GLASFASER_BEREITSTELLUNGSENTGELT = {
  maxEuroProJahr: 60,
  maxEuroGesamt: 540,
  maxJahre: 5,
  maxJahreVerlaengert: 9,
  schwelleAufwaendig: 300,
};

// § 7 Abs. 1 Satz 1 HeizkostenV: Anteil der Heizkosten, der nach dem erfassten
// Verbrauch verteilt werden muss. Der Rest geht nach Wohnfläche.
export const HEIZKOSTEN_VERBRAUCHSANTEIL = { min: 0.5, max: 0.7 };

function runde2(betrag) {
  return Math.round(betrag * 100) / 100;
}

/** War das Kabel-Nutzungsentgelt an diesem Tag noch als Betriebskosten umlagefähig? */
export function istKabelentgeltUmlagefaehig(datum) {
  return String(datum) <= KABEL_UMLAGE_ENDE;
}

/**
 * Datum ein Jahr später, am selben Kalendertag. Der 29. Februar rutscht dabei
 * auf den 28., statt in den März zu springen.
 */
function einJahrSpaeter(isoDatum) {
  const [jahr, monat, tag] = String(isoDatum).split('-').map(Number);
  if (!jahr || !monat || !tag) throw new Error('Datum bitte als JJJJ-MM-TT angeben.');
  const zieljahr = jahr + 1;
  const letzterTag = new Date(Date.UTC(zieljahr, monat, 0)).getUTCDate();
  const zieltag = Math.min(tag, letzterTag);
  return `${zieljahr}-${String(monat).padStart(2, '0')}-${String(zieltag).padStart(2, '0')}`;
}

/**
 * § 556 Abs. 3 Satz 2 BGB: Die Abrechnung muss dem Mieter spätestens bis zum
 * Ablauf des zwölften Monats nach Ende des Abrechnungszeitraums zugehen.
 * Danach ist eine Nachforderung ausgeschlossen – es sei denn, der Vermieter
 * hat die Verspätung nicht zu vertreten (Satz 3).
 */
export function abrechnungsfristEnde(endeAbrechnungszeitraum) {
  return einJahrSpaeter(endeAbrechnungszeitraum);
}

/**
 * § 556 Abs. 3 Satz 5 BGB: Einwendungen gegen die Abrechnung muss der Mieter
 * bis zum Ablauf des zwölften Monats nach Zugang mitteilen.
 */
export function einwendungsfristEnde(zugangDerAbrechnung) {
  return einJahrSpaeter(zugangDerAbrechnung);
}

/** Trifft eine Kostenart auf die angegebene Ausstattung zu? */
function faelltAn(art, { aufzug, garten, hauswart }) {
  if (art.bedingung === 'immer') return true;
  if (art.bedingung === 'aufzug') return Boolean(aufzug);
  if (art.bedingung === 'garten') return Boolean(garten);
  if (art.bedingung === 'hauswart') return Boolean(hauswart);
  return false;
}

/**
 * Monatliche Nebenkosten aus Wohnfläche und Ausstattung.
 *
 * Die Gesamtsumme ist immer die Summe der ausgewiesenen Positionen – es gibt
 * keinen zweiten, davon abweichenden Gesamtwert. Die Kennzahlen des
 * Betriebskostenspiegels dienen nur der Einordnung.
 */
export function berechneNebenkosten({
  flaeche,
  aufzug = false,
  garten = false,
  hauswart = false,
  heizungSpitze = false,
}) {
  if (!(flaeche > 0)) throw new Error('Die Wohnfläche muss größer als 0 m² sein.');

  const positionen = BETRIEBSKOSTEN_ARTEN
    .filter(art => faelltAn(art, { aufzug, garten, hauswart }))
    .map(art => {
      const proQm = heizungSpitze && art.spitze ? art.spitze : art.euroProQmMonat;
      return {
        key: art.key,
        label: art.label,
        nr: art.nr,
        verteiler: art.verteiler,
        euroProQmMonat: proQm,
        monat: runde2(flaeche * proQm),
        jahr: runde2(flaeche * proQm * 12),
      };
    });

  const gesamtMonat = runde2(positionen.reduce((summe, p) => summe + p.monat, 0));
  const gesamtJahr = runde2(gesamtMonat * 12);
  const euroProQmMonat = runde2(gesamtMonat / flaeche);

  return { positionen, gesamtMonat, gesamtJahr, euroProQmMonat, einordnung: einordnung(euroProQmMonat) };
}

/**
 * Einordnung eines Quadratmeterwerts gegenüber dem Betriebskostenspiegel.
 * Oberhalb von `alleArtenGesamt` fällt mehr an, als selbst bei voller
 * Ausstattung üblich ist – dann lohnt der Blick in die Belege (§ 556 Abs. 4 BGB).
 */
export function einordnung(euroProQmMonat) {
  const { durchschnittGesamt, alleArtenGesamt } = BETRIEBSKOSTENSPIEGEL;
  const eur = betrag => betrag.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (euroProQmMonat < durchschnittGesamt * 0.9) {
    return { stufe: 'unter', text: `Unter dem Bundesdurchschnitt von ${eur(durchschnittGesamt)} €/m² und Monat.` };
  }
  if (euroProQmMonat <= durchschnittGesamt * 1.1) {
    return { stufe: 'durchschnitt', text: `Im Bereich des Bundesdurchschnitts von ${eur(durchschnittGesamt)} €/m² und Monat.` };
  }
  if (euroProQmMonat <= alleArtenGesamt) {
    return { stufe: 'erhoeht', text: `Über dem Durchschnitt, aber noch unter den ${eur(alleArtenGesamt)} €/m², die bei voller Ausstattung zusammenkommen.` };
  }
  return { stufe: 'ueber', text: `Höher als die ${eur(alleArtenGesamt)} €/m², die selbst bei voller Ausstattung anfallen – ein Blick in die Belege lohnt sich.` };
}

/**
 * Vergleich der vereinbarten Vorauszahlung mit den erwarteten Kosten.
 * § 556 Abs. 2 Satz 2 BGB erlaubt Vorauszahlungen nur in angemessener Höhe.
 */
export function pruefeVorauszahlung({ vorauszahlungMonat, ...ausstattung }) {
  const { gesamtMonat, euroProQmMonat, positionen } = berechneNebenkosten(ausstattung);
  const differenzMonat = runde2(gesamtMonat - vorauszahlungMonat);
  return {
    erwartetMonat: gesamtMonat,
    euroProQmMonat,
    positionen,
    vorauszahlungMonat,
    differenzMonat,
    nachzahlungJahr: differenzMonat > 0 ? runde2(differenzMonat * 12) : 0,
    guthabenJahr: differenzMonat < 0 ? runde2(-differenzMonat * 12) : 0,
  };
}
