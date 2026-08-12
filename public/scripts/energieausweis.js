// Energieausweis-Vorberechnung: Emissionsfaktoren je Kilowattstunde Endenergie.
//
// Rechtsgrundlage:
//   Anlage 9 Nr. 3 GModG (zu § 85 Abs. 6) – Umrechnung in Treibhausgasemissionen
//
// Das Gebäudeenergiegesetz (GEG) heißt seit dem Änderungsgesetz vom 23.07.2026
// (BGBl. verkündet am 28.07.2026, in Kraft am 29.07.2026) Gebäudemodernisierungs-
// gesetz (GModG). Anlage 9 ist unverändert die Fassung BGBl. I 2020, 1788-1789.
// Quelle: https://www.gesetze-im-internet.de/geg/anlage_9.html, abgerufen am 12.08.2026
//
// ABGRENZUNG zu `emissionsfaktor()` aus heizkosten.js: Die dortigen Werte nach
// EBeV 2030 Anlage 2 Teil 4 (Erdgas 0,1814 kg/kWh, Heizöl 0,2664 kg/kWh) gelten
// je ABGERECHNETER Kilowattstunde – bei Erdgas also je Brennwert-Kilowattstunde,
// wie sie auf der Rechnung steht. Der Energieausweis bilanziert dagegen die
// Endenergie und hat dafür in Anlage 9 eigene, höhere Faktoren. Die beiden
// Zahlenreihen sind nicht austauschbar; hier gilt ausschließlich Anlage 9.

// Anlage 9 Nr. 3 GModG, Emissionsfaktoren in g CO2-Äquivalent je kWh.
// Enthalten sind die Zeilen, die dieser Rechner braucht; die laufende Nummer
// der Tabelle steht jeweils im Kommentar.
export const EMISSIONSFAKTOREN_G_JE_KWH = {
  heizoel: 310,                      // Nr. 1
  erdgas: 240,                       // Nr. 2
  fluessiggas: 270,                  // Nr. 3
  stromNetzbezogen: 560,             // Nr. 12
  fernwaermeKwkKohle: 300,           // Nr. 20 – KWK-Deckungsanteil >= 70 %
  fernwaermeKwkGasOel: 180,          // Nr. 21
  fernwaermeKwkErneuerbar: 40,       // Nr. 22
  fernwaermeHeizwerkKohle: 400,      // Nr. 23 – Heizwerk
  fernwaermeHeizwerkGasOel: 300,     // Nr. 24
  fernwaermeHeizwerkErneuerbar: 60,  // Nr. 25
};

// Fernwärme hat keinen bundesweit gültigen Emissionsfaktor: Anlage 9 trennt nach
// Erzeugung, und der netzscharfe Wert wird nach AGFW FW 309-1 vom Versorger
// ausgewiesen (AGFW, "GEG und Fernwärme", Stand 06/2025, abgerufen am
// 12.08.2026). Das Formular fragt die Erzeugung nicht ab, deshalb rechnet der
// Rechner mit dem in Deutschland häufigsten Fall – KWK mit gasförmigen oder
// flüssigen Brennstoffen – und weist das auf der Seite als Annahme aus:
// über 80 % der Fernwärme stammt aus KWK-Anlagen, Erdgas ist mit rund 45 % der
// meistgenutzte Brennstoff (AGFW-Hauptbericht, abgerufen am 12.08.2026).
export const FERNWAERME_RUECKFALL = 'fernwaermeKwkGasOel';

// Zuordnung der Auswahl im Formular zu einer Zeile der Anlage 9.
// Wärmepumpe und Nachtspeicher stehen beide auf netzbezogenem Strom: Die
// Jahresarbeitszahl steckt bereits im Endenergiebedarf, sie darf den Faktor
// nicht ein zweites Mal mindern.
const HEIZUNGSART_FAKTOR = {
  'gas-brennwert': 'erdgas',
  'oel-niedertemp': 'heizoel',
  'waermepumpe': 'stromNetzbezogen',
  'nachtspeicher': 'stromNetzbezogen',
  'fernwaerme': FERNWAERME_RUECKFALL,
};

/**
 * Emissionsfaktor einer Heizungsart in kg CO2-Äquivalent je kWh Endenergie.
 * Unbekannte Heizungsarten werfen: Ein stiller Rückfallwert wäre eine erfundene
 * Zahl, und das Auswahlfeld der Seite liefert nur die hier hinterlegten Werte.
 */
export function co2FaktorJeKwhEndenergie(heizungsart) {
  const schluessel = HEIZUNGSART_FAKTOR[heizungsart];
  if (!schluessel) {
    throw new Error(`Unbekannte Heizungsart: ${heizungsart}`);
  }
  return EMISSIONSFAKTOREN_G_JE_KWH[schluessel] / 1000;
}
