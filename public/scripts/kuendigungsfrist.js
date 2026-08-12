// Kündigungsfristen im Arbeitsverhältnis
//
// Rechtsgrundlagen (Stand August 2026):
//   § 622 Abs. 1 BGB  – Grundfrist: vier Wochen zum Fünfzehnten oder zum Monatsende
//   § 622 Abs. 2 BGB  – Staffel für die Kündigung durch den Arbeitgeber
//   § 622 Abs. 3 BGB  – Probezeit: zwei Wochen, längstens für sechs Monate
//   § 622 Abs. 6 BGB  – Die Frist des Arbeitnehmers darf nie länger sein als die des Arbeitgebers
//   §§ 187, 188 BGB   – Fristbeginn und Fristende
//   § 1 Abs. 1 KSchG  – Wartezeit von sechs Monaten bis zum Kündigungsschutz
//   § 4 KSchG         – Klagefrist von drei Wochen ab Zugang
//
// Alle Datumsangaben laufen als ISO-Strings (JJJJ-MM-TT) durch das Modul. Die
// Rechnung selbst arbeitet auf UTC-Werten, damit kein Zeitzonenversatz die
// Tagesgrenzen verschiebt.

export const KUENDIGUNGSFRIST_STAND = '2026-08';

/** § 622 Abs. 1 BGB: vier Wochen sind achtundzwanzig Tage. */
export const GRUNDFRIST_TAGE = 28;

/** § 622 Abs. 3 BGB: zwei Wochen, ohne Bindung an einen Kündigungstermin. */
export const PROBEZEIT_FRIST_TAGE = 14;

/** § 622 Abs. 3 BGB: Die Probezeit darf höchstens sechs Monate dauern. */
export const PROBEZEIT_MAX_MONATE = 6;

/** § 1 Abs. 1 KSchG: Der Kündigungsschutz greift erst nach mehr als sechs Monaten. */
export const KSCHG_WARTEZEIT_MONATE = 6;

/** § 4 Satz 1 KSchG: drei Wochen ab Zugang der schriftlichen Kündigung. */
export const KLAGEFRIST_WOCHEN = 3;

/**
 * Fristen für die Kündigung durch den Arbeitgeber.
 *
 * Die erste Zeile ist die Grundfrist des Absatzes 1 und gilt für beide Seiten.
 * Sie ist eine Wochenfrist mit zwei möglichen Terminen – die Vorgängerfassung
 * führte sie als Monatsfrist und rechnete deshalb etwas anderes, als daneben
 * im Text stand.
 */
export const AG_FRISTEN = [
  { abJahre: 0,  monate: 0, tage: GRUNDFRIST_TAGE, text: '4 Wochen zum 15. oder zum Monatsende', grundlage: '§ 622 Abs. 1 BGB' },
  { abJahre: 2,  monate: 1, text: '1 Monat zum Monatsende',   grundlage: '§ 622 Abs. 2 Nr. 1 BGB' },
  { abJahre: 5,  monate: 2, text: '2 Monate zum Monatsende',  grundlage: '§ 622 Abs. 2 Nr. 2 BGB' },
  { abJahre: 8,  monate: 3, text: '3 Monate zum Monatsende',  grundlage: '§ 622 Abs. 2 Nr. 3 BGB' },
  { abJahre: 10, monate: 4, text: '4 Monate zum Monatsende',  grundlage: '§ 622 Abs. 2 Nr. 4 BGB' },
  { abJahre: 12, monate: 5, text: '5 Monate zum Monatsende',  grundlage: '§ 622 Abs. 2 Nr. 5 BGB' },
  { abJahre: 15, monate: 6, text: '6 Monate zum Monatsende',  grundlage: '§ 622 Abs. 2 Nr. 6 BGB' },
  { abJahre: 20, monate: 7, text: '7 Monate zum Monatsende',  grundlage: '§ 622 Abs. 2 Nr. 7 BGB' },
];

/** Einzelvertraglich zulässige Abweichungen nach § 622 Abs. 5 BGB. */
export const KUERZERE_FRIST_ZULAESSIG = [
  'bei Aushilfen, solange das Arbeitsverhältnis nicht über drei Monate hinaus fortgesetzt wird (§ 622 Abs. 5 Satz 1 Nr. 1 BGB)',
  'in Betrieben mit in der Regel höchstens 20 Arbeitnehmern ohne die Auszubildenden, und auch dort nie unter vier Wochen (§ 622 Abs. 5 Satz 1 Nr. 2 BGB)',
];

function teile(isoDatum) {
  const treffer = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(isoDatum ?? ''));
  if (!treffer) throw new Error('Bitte ein Datum im Format JJJJ-MM-TT angeben.');
  const [, jahr, monat, tag] = treffer.map(Number);
  if (monat < 1 || monat > 12 || tag < 1 || tag > letzterTag(jahr, monat)) {
    throw new Error('Dieses Datum gibt es nicht.');
  }
  return { jahr, monat, tag };
}

function letzterTag(jahr, monat) {
  return new Date(Date.UTC(jahr, monat, 0)).getUTCDate();
}

function alsIso(jahr, monat, tag) {
  return `${String(jahr).padStart(4, '0')}-${String(monat).padStart(2, '0')}-${String(tag).padStart(2, '0')}`;
}

function plusTage(isoDatum, tage) {
  const { jahr, monat, tag } = teile(isoDatum);
  const d = new Date(Date.UTC(jahr, monat - 1, tag + tage));
  return alsIso(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate());
}

/**
 * Monatsfrist nach § 188 Abs. 2 BGB. Fehlt im Zielmonat der Tag mit derselben
 * Zahl, endet die Frist nach Absatz 3 am letzten Tag dieses Monats – der
 * 31. Januar plus einen Monat ist also der 28. Februar.
 */
function plusMonate(isoDatum, monate) {
  const { jahr, monat, tag } = teile(isoDatum);
  const gesamt = (jahr * 12) + (monat - 1) + monate;
  const zieljahr = Math.floor(gesamt / 12);
  const zielmonat = (gesamt % 12) + 1;
  return alsIso(zieljahr, zielmonat, Math.min(tag, letzterTag(zieljahr, zielmonat)));
}

function monatsende(isoDatum) {
  const { jahr, monat } = teile(isoDatum);
  return alsIso(jahr, monat, letzterTag(jahr, monat));
}

/**
 * Vollendete Jahre zwischen Eintritt und Stichtag – kalendarisch gezählt.
 *
 * Die Vorgängerfassung teilte die Differenz in Millisekunden durch 365,25 Tage.
 * Zwei Jahre ohne Schaltjahr dazwischen sind aber nur 730 Tage und damit
 * rechnerisch 1,998 Jahre: Genau an der Stufengrenze fiel das Ergebnis um eine
 * Stufe zurück und verkürzte die Frist um einen Monat.
 */
export function betriebszugehoerigkeitJahre(eintrittsdatum, stichtag) {
  const ein = teile(eintrittsdatum);
  const bis = teile(stichtag);
  let jahre = bis.jahr - ein.jahr;
  // Fehlt der Eintrittstag im Vergleichsmonat – Eintritt am 29. Februar –, ist
  // nach § 188 Abs. 3 BGB der letzte Tag dieses Monats maßgeblich.
  const jahrestag = Math.min(ein.tag, letzterTag(bis.jahr, bis.monat));
  if (bis.monat < ein.monat || (bis.monat === ein.monat && bis.tag < jahrestag)) jahre -= 1;
  return Math.max(0, jahre);
}

/**
 * Erster Tag, an dem das Arbeitsverhältnis länger als sechs Monate bestanden
 * hat und der allgemeine Kündigungsschutz greift (§ 1 Abs. 1 KSchG).
 */
export function kuendigungsschutzAb(eintrittsdatum) {
  return plusMonate(eintrittsdatum, KSCHG_WARTEZEIT_MONATE);
}

/** Ende der dreiwöchigen Klagefrist ab Zugang der Kündigung (§ 4 Satz 1 KSchG). */
export function klagefristEnde(zugangsdatum) {
  return plusTage(zugangsdatum, KLAGEFRIST_WOCHEN * 7);
}

/** Letzter Tag der Probezeit, gedeckelt auf sechs Monate (§ 622 Abs. 3 BGB). */
export function probezeitEnde(eintrittsdatum, monate = PROBEZEIT_MAX_MONATE) {
  const dauer = Math.min(Math.max(Number(monate) || 0, 0), PROBEZEIT_MAX_MONATE);
  return plusTage(plusMonate(eintrittsdatum, dauer), -1);
}

function stufeFuer(betriebsjahre) {
  return AG_FRISTEN.reduce((gewaehlt, stufe) => (betriebsjahre >= stufe.abJahre ? stufe : gewaehlt), AG_FRISTEN[0]);
}

/**
 * Nächster zulässiger Beendigungstermin ab dem Tag, an dem die Frist abläuft.
 * Die Grundfrist kennt zwei Termine im Monat, die Monatsfristen nur einen.
 */
function naechsterTermin(fristablauf, auchZumFuenfzehnten) {
  const { jahr, monat, tag } = teile(fristablauf);
  if (auchZumFuenfzehnten && tag <= 15) return alsIso(jahr, monat, 15);
  return monatsende(fristablauf);
}

/**
 * Berechnet die maßgebliche Kündigungsfrist und den frühesten Beendigungstermin.
 *
 * Für die Staffel des § 622 Abs. 2 BGB zählt die Beschäftigungsdauer im
 * Zeitpunkt des Zugangs der Kündigung, nicht im Zeitpunkt des Fristablaufs
 * (BAG, Urteil vom 18.09.2003 – 2 AZR 330/02).
 */
export function berechneKuendigungsfrist({
  eintrittsdatum,
  kuendigungsdatum,
  seite = 'arbeitgeber',
  probezeitVereinbart = false,
  probezeitMonate = PROBEZEIT_MAX_MONATE,
}) {
  const e = teile(eintrittsdatum);
  const k = teile(kuendigungsdatum);
  const eintritt = alsIso(e.jahr, e.monat, e.tag);
  const zugang = alsIso(k.jahr, k.monat, k.tag);
  if (zugang < eintritt) {
    throw new Error('Die Kündigung kann nicht vor dem Eintrittsdatum zugehen.');
  }

  const betriebsjahre = betriebszugehoerigkeitJahre(eintritt, zugang);
  const probeEnde = probezeitVereinbart ? probezeitEnde(eintritt, probezeitMonate) : null;
  const inProbezeit = probeEnde !== null && zugang <= probeEnde;

  const schutzAb = kuendigungsschutzAb(eintritt);
  const gemeinsam = {
    betriebsjahre,
    inProbezeit,
    probezeitEnde: probeEnde,
    kuendigungsschutz: { ab: schutzAb, greift: zugang >= schutzAb },
    klagefristEnde: klagefristEnde(zugang),
  };

  if (inProbezeit) {
    const ende = plusTage(zugang, PROBEZEIT_FRIST_TAGE);
    return {
      ...gemeinsam,
      fristText: '2 Wochen zu jedem Tag',
      monate: 0,
      wochen: 2,
      tage: PROBEZEIT_FRIST_TAGE,
      fristablauf: ende,
      endDatum: ende,
      grundlage: '§ 622 Abs. 3 BGB',
      hinweis: 'In einer vereinbarten Probezeit gilt für beide Seiten eine Frist von zwei Wochen, ohne Bindung an den Fünfzehnten oder das Monatsende. Sie greift, solange die Kündigung spätestens am letzten Tag der Probezeit zugeht.',
    };
  }

  // § 622 Abs. 2 BGB verlängert die Frist nur für den Arbeitgeber. Der
  // Arbeitnehmer bleibt in jedem Fall bei der Grundfrist des Absatzes 1.
  const stufe = seite === 'arbeitnehmer' ? AG_FRISTEN[0] : stufeFuer(betriebsjahre);
  const istGrundfrist = stufe.monate === 0;
  const fristablauf = istGrundfrist
    ? plusTage(zugang, GRUNDFRIST_TAGE)
    : plusMonate(zugang, stufe.monate);

  return {
    ...gemeinsam,
    fristText: stufe.text,
    monate: stufe.monate,
    wochen: istGrundfrist ? 4 : null,
    tage: istGrundfrist ? GRUNDFRIST_TAGE : null,
    fristablauf,
    endDatum: naechsterTermin(fristablauf, istGrundfrist),
    grundlage: stufe.grundlage,
    hinweis: seite === 'arbeitnehmer'
      ? 'Für die Kündigung durch den Arbeitnehmer bleibt es unabhängig von der Betriebszugehörigkeit bei den vier Wochen des § 622 Abs. 1 BGB. Eine längere Frist als für den Arbeitgeber darf nicht vereinbart werden (§ 622 Abs. 6 BGB).'
      : 'Gesetzliche Mindestfrist. Arbeits- oder Tarifvertrag können längere Fristen vorsehen; ein Tarifvertrag darf nach § 622 Abs. 4 BGB auch kürzere vorsehen.',
  };
}
