// Renten-Schnellrechner nach der Rentenformel des § 64 SGB VI
//
// Rechtsstand: 2026-07-01
//
// Monatsbetrag = persönliche Entgeltpunkte × Rentenartfaktor × aktueller
// Rentenwert, wobei die persönlichen Entgeltpunkte nach § 66 Abs. 1 SGB VI die
// mit dem Zugangsfaktor vervielfältigten Entgeltpunkte sind.
//
// Rechengrößen, Altersgrenzen, Zugangsfaktor und die Beiträge der Rentner
// stehen in rentenwerte.js, das Vergleichsnetto kommt aus brutto-netto.js.
//
// Vier Dinge rechnete dieses Modul vorher falsch:
// - Die Regelaltersgrenze lag fest bei 67, obwohl § 235 Abs. 2 SGB VI sie für
//   die Jahrgänge 1947 bis 1963 stufenweise anhebt.
// - Künftige Entgeltpunkte entstanden ohne Beitragsbemessungsgrenze, ein
//   Gehalt von 20.000 € im Monat ergab 4,6 Punkte im Jahr statt höchstens 1,95.
// - Bei den Abzügen war es genau vertauscht: In der Krankenversicherung wurde
//   mit dem vollen Satz gerechnet, obwohl § 249a SGB V ihn teilt, und in der
//   Pflegeversicherung mit einem halben, obwohl § 59 Abs. 1 SGB XI ihn dem
//   Rentner allein zuweist.
// - Das letzte Netto war mit 70 Prozent des Bruttogehalts angesetzt, eine
//   Quote ohne Grundlage. Jetzt wird es tatsächlich gerechnet.
//
// Nicht abgebildet: Entgeltpunkte aus Kindererziehungs-, Anrechnungs- und
// Berücksichtigungszeiten, Zuschläge aus Versorgungsausgleich oder Grundrente
// sowie die Einkommensteuer auf die Rente (§ 22 Nr. 1 Satz 3 Buchst. a
// Doppelbuchst. aa EStG).

import { berechneNettoGehalt } from './brutto-netto.js';
import {
  AKTUELLER_RENTENWERT,
  BBG_RENTE_JAHR,
  RENTENARTFAKTOR_ALTERSRENTE,
  entgeltpunkteAusJahresentgelt,
  rentnerBeitraege,
  zugangsfaktor as berechneZugangsfaktor,
} from './rentenwerte.js';

/**
 * Voraussichtliche Altersrente und Rentenlücke.
 *
 * Alles ist in heutigen Werten gerechnet: Das Durchschnittsentgelt, die
 * Beitragsbemessungsgrenze und der Rentenwert steigen künftig etwa im
 * Gleichlauf mit den Löhnen. Wer unterstellt, dass sein Gehalt dieser
 * Entwicklung folgt, erhält so die Rente in heutiger Kaufkraft – nicht den
 * späteren Zahlbetrag.
 *
 * Das Alter bei Rentenbeginn ergibt sich aus der Differenz der Kalenderjahre,
 * weil der Geburtsmonat nicht abgefragt wird. Die Altersgrenzen der Jahrgänge
 * 1947 bis 1963 sind dagegen monatsgenau; die Rechnung kann deshalb um bis zu
 * elf Monate danebenliegen.
 *
 * @param {object} eingabe
 * @param {number} eingabe.geburtsjahr Geburtsjahrgang
 * @param {number} eingabe.rentenbeginn Kalenderjahr des geplanten Rentenbeginns
 * @param {number} eingabe.entgeltpunkte Bisher erworbene Entgeltpunkte aus der Renteninformation
 * @param {number} eingabe.bruttoMonat Heutiges Bruttogehalt im Monat, in Euro
 * @param {boolean} [eingabe.wartezeit45] 45 Jahre mit Beiträgen (§ 51 Abs. 3a SGB VI)
 * @param {boolean} [eingabe.elternteil] Elterneigenschaft nach § 55 Abs. 3 SGB XI
 * @param {number} [eingabe.steuerklasse] 1 bis 6, für das Vergleichsnetto
 * @param {string} [eingabe.bundesland] Kürzel aus BUNDESLAENDER
 * @param {boolean} [eingabe.kirchensteuer] Mitglied einer steuererhebenden Religionsgemeinschaft
 * @param {number} [eingabe.zusatzbeitrag] Zusatzbeitragssatz der Krankenkasse
 * @param {number} [eingabe.aktuellesJahr] Laufendes Kalenderjahr
 */
export function berechneRente({
  geburtsjahr,
  rentenbeginn,
  entgeltpunkte = 0,
  bruttoMonat = 0,
  wartezeit45 = false,
  elternteil = true,
  steuerklasse = 1,
  bundesland = 'NW',
  kirchensteuer = false,
  zusatzbeitrag,
  aktuellesJahr = new Date().getFullYear(),
}) {
  const brutto = Number.isFinite(bruttoMonat) ? Math.max(0, bruttoMonat) : 0;
  const bestandsEP = Number.isFinite(entgeltpunkte) ? Math.max(0, entgeltpunkte) : 0;

  const gewuenschtesAlterMonate = (rentenbeginn - geburtsjahr) * 12;
  const zf = berechneZugangsfaktor({
    geburtsjahr,
    rentenbeginnAlterMonate: gewuenschtesAlterMonate,
    wartezeit45,
  });

  // Der Rentenbeginn verschiebt sich mit, wenn die Rente frühestens ab 63
  // beginnen kann – sonst würden Restjahre und Alter auseinanderlaufen.
  const beginnJahr = rentenbeginn + (zf.rentenbeginnAlterMonate - gewuenschtesAlterMonate) / 12;
  const restjahre = Math.max(0, Math.round(beginnJahr - aktuellesJahr));

  const bruttoJahr = brutto * 12;
  const epProJahr = entgeltpunkteAusJahresentgelt(bruttoJahr);
  const zukuenftigeEntgeltpunkte = runde4(epProJahr * restjahre);
  const gesamtEntgeltpunkte = runde4(bestandsEP + zukuenftigeEntgeltpunkte);

  const persoenlicheEntgeltpunkte = runde4(gesamtEntgeltpunkte * zf.zugangsfaktor);
  const renteBrutto = runde2(
    persoenlicheEntgeltpunkte * RENTENARTFAKTOR_ALTERSRENTE * AKTUELLER_RENTENWERT
  );

  const beitraege = rentnerBeitraege({ bruttorente: renteBrutto, elternteil, zusatzbeitrag });

  const letztesNetto = berechneNettoGehalt({
    bruttoMonat: brutto,
    steuerklasse,
    bundesland,
    kirchensteuer,
    zusatzbeitrag,
  }).netto;

  return {
    gesamtEntgeltpunkte,
    zukuenftigeEntgeltpunkte,
    persoenlicheEntgeltpunkte,
    entgeltpunkteProJahr: epProJahr,
    restjahre,
    ueberBeitragsbemessungsgrenze: bruttoJahr > BBG_RENTE_JAHR,

    zugangsfaktor: zf.zugangsfaktor,
    monateVorzeitig: zf.monateVorzeitig,
    monateAufgeschoben: zf.monateAufgeschoben,
    abschlagProzent: runde2(zf.monateVorzeitig * 0.3),
    zuschlagProzent: runde2(zf.monateAufgeschoben * 0.5),
    aufFruehestenBeginnAngehoben: zf.aufFruehestenBeginnAngehoben,
    renteneintrittsalter: Math.floor(zf.rentenbeginnAlterMonate / 12),
    renteneintrittsalterMonateRest: zf.rentenbeginnAlterMonate % 12,
    regelaltersgrenzeJahre: Math.floor(zf.regelaltersgrenzeMonate / 12),
    regelaltersgrenzeMonateRest: zf.regelaltersgrenzeMonate % 12,

    renteBrutto,
    krankenversicherung: beitraege.krankenversicherung,
    pflegeversicherung: beitraege.pflegeversicherung,
    renteNachBeitraegen: beitraege.netto,

    letztesNetto,
    rentenluecke: Math.max(0, runde2(letztesNetto - beitraege.netto)),

    rentenwert: AKTUELLER_RENTENWERT,
  };
}

function runde4(wert) {
  return Math.round(wert * 1e4) / 1e4;
}

function runde2(betrag) {
  return Math.round(betrag * 100) / 100;
}
