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
    slug: 'trainingspuls-prozent-wovon',
    titel: 'Prozent wovon? Zwei Rechenwege, zwei Pulswerte',
    teaser: 'Dieselben 60 Prozent bedeuten 111 oder 137 Schläge je Minute – je nachdem, ob sich die Angabe auf den Maximalpuls oder auf die Herzfrequenzreserve bezieht. Der Abstand hat eine geschlossene Form: Ruhepuls mal (1 − Intensität), der Maximalpuls kürzt sich heraus. Dazu: warum die frühere Fassung dieses Rechners den Ruhepuls abfragte, ohne ihn zu benutzen, und in 30,3 % aller Eingaben eine Trainingszone nannte, die unter dem Ruhepuls begann.',
    datum: '2026-09-23',
    thema: 'Gesundheit',
    rechner: ['optimalerpuls-rechner', 'kalorien-verbrennen'],
    aufRechnerseite: true,
  },
  {
    slug: 'broca-ideal-liegt-unter-der-mitte',
    titel: 'Zwei Zahlen, die beide „normal" heißen',
    teaser: 'Der Rechner zeigt das Broca-Idealgewicht und den BMI-Normalbereich nebeneinander – sie decken sich nicht. Bei 160 cm und weiblich liegt das Ideal 22 % tief im Normalbereich, bei 190 cm und männlich bei 62 %. Über den gesamten Eingabebereich von 100 bis 220 cm erreicht das Frauen-Ideal die Mitte des Bereichs bei keiner einzigen Körpergröße: Broca addiert linear, der BMI wächst mit dem Quadrat.',
    datum: '2026-09-23',
    thema: 'Gesundheit',
    rechner: ['idealgewicht-rechner', 'bmi-rechner'],
    aufRechnerseite: true,
  },
  {
    slug: 'schlafzyklen-neunzig-minuten-sind-ein-mittelwert',
    titel: 'Ab dem fünften Zyklus trägt das Raster nicht mehr',
    teaser: 'Der Rechner teilt die Nacht in Blöcke zu 90 Minuten und nennt eine Uhrzeit auf die Minute genau. Das NIH gibt die Zykluslänge mit 80 bis 100 Minuten an – die Unsicherheit wächst mit jedem Zyklus um 20 Minuten und überholt bei fünf Zyklen den Abstand von 90 Minuten, der die drei Empfehlungen trennt. Bei fünf Zyklen und 100 Minuten liegt die genannte Weckzeit exakt einen halben Zyklus daneben.',
    datum: '2026-09-23',
    thema: 'Gesundheit',
    rechner: ['schlaf-rechner'],
    aufRechnerseite: true,
  },
  {
    slug: 'makro-prozentpunkt-in-gramm',
    titel: 'Ein Prozentpunkt wiegt je Nährstoff etwas anderes',
    teaser: 'Makroverteilungen bespricht man in Prozent, gegessen wird in Gramm. Weil Fett 9 kcal je Gramm liefert und Protein und Kohlenhydrate je 4, steht hinter demselben Prozentpunkt einmal 5,8 g und einmal 2,6 g. Dazu: warum der Proteinanteil von 17,7 auf 11,2 Prozent fällt, ohne dass sich ein Gramm ändert – und ein Eingabefall, in dem die drei Nährstoffe mehr Kalorien ergeben als die ausgewiesene Tagesenergie.',
    datum: '2026-09-23',
    thema: 'Gesundheit',
    rechner: ['makronaehrstoff-rechner', 'grundumsatz-rechner'],
    aufRechnerseite: true,
  },
  {
    slug: 'quadratmeterpreis-flaeche-im-nenner',
    titel: 'Der Vergleichswert hängt an der Flächendefinition',
    teaser: 'Eine Wohnung für 360.000 € mit beworbenen 85 m² hat nach § 4 WoFlV nur 72 m² Wohnfläche: 15,3 % weniger Fläche, aber 18,1 % mehr Preis je Quadratmeter – zwei Prozentsätze für denselben Vorgang. Drei Wohnungen mit identischen 5.000 €/m² unterscheiden sich um 16,4 %, sobald man nach der Fläche mit voller Stehhöhe fragt. Und derselbe Grundriss hat je nach Anrechnung der Terrasse zwei zulässige Quadratmeterpreise.',
    datum: '2026-09-23',
    thema: 'Wohnen',
    rechner: ['quadratmeterpreis-vergleich', 'hauskauf-rechner', 'immobilienkauf-nebenkosten'],
    aufRechnerseite: true,
  },
  {
    slug: 'mwst-anteil-statt-aufschlag',
    titel: '19 Prozent drauf und 19 Prozent runter ist nicht null',
    teaser: 'Wer aus 119 € die Steuer herausnimmt, indem er 19 % abzieht, landet bei 96,39 € statt bei 100 € – die Lücke ist exakt das Quadrat des Steuersatzes. Im Bruttopreis stecken nicht 19 %, sondern 15,97 %. Dazu: warum die Steuer nur bei vollen Euro-Beträgen glatt aufgeht, wie 0,03 € Unterschied zwischen positionsweiser und summarischer Rundung entstehen, und was seit 2026 auf einer Restaurantrechnung steht.',
    datum: '2026-09-23',
    thema: 'Einheiten',
    rechner: ['mwst-rechner'],
    aufRechnerseite: true,
  },
  {
    slug: 'zweiter-rentenpunkt-unerreichbar',
    titel: 'Die Obergrenze ist eine Division, keine politische Zahl',
    teaser: 'Ein Entgeltpunkt kostet 51.944 € Bruttoentgelt, Beiträge werden aber nur bis 101.400 € erhoben. Daraus folgt eine Decke von 1,9521 Punkten im Jahr – die fehlenden 0,0479 sind mit keinem Gehalt zu bekommen. Bis 2022 war das anders. Warum der Wert 2023 unter zwei fiel, liegt an zwei Fortschreibungen, von denen eine mit dem Doppelten der Lohnveränderung rechnet.',
    datum: '2026-09-23',
    thema: 'Familie',
    rechner: ['rentenpunkte-rechner'],
    aufRechnerseite: true,
  },
  {
    slug: 'sparquote-schlaegt-rendite',
    titel: 'Wie lange es dauert, hängt nicht am Einkommen',
    teaser: 'Zwei Menschen sparen 40 % ihres Einkommens – der eine 24.000 € im Jahr, der andere 400.000 €. Beide brauchen exakt gleich lange bis zur finanziellen Unabhängigkeit, weil sich das Einkommen aus der Rechnung herauskürzt. Wer die Sparquote von 20 auf 40 Prozent verdoppelt, spart gut 17 Jahre; ein Prozentpunkt mehr Rendite bringt an derselben Stelle nur gut vier. Dazu: was die deutsche Abgeltungsteuer aus dem 25-Fachen macht.',
    datum: '2026-09-18',
    thema: 'Geld',
    rechner: ['fire-rechner', 'etf-sparplan-rechner', 'sparen-rechner'],
    aufRechnerseite: true,
  },
  {
    slug: 'co2-kosten-stufen-mieter-vermieter',
    titel: 'Wer saniert, spart am wenigsten',
    teaser: 'Eine Sanierung senkt die Heizenergie – aber das Geld landet nicht bei dem, der sie bezahlt. Von jeder eingesparten Kilowattstunde Erdgas kommen beim Vermieter höchstens 1,13 Cent an, beim Mieter mindestens 9,87 Cent. Und je gründlicher saniert wird, desto kleiner wird der Anteil des Vermieters: von 20,0 auf 11,2 Prozent. Dazu die Stufengrenzen des CO2KostAufG, umgerechnet in Kilowattstunden je Quadratmeter.',
    datum: '2026-09-18',
    thema: 'Energie',
    rechner: ['co2-einsparung-renovierung', 'heizkosten-rechner', 'energieausweis-vorberechnung'],
    aufRechnerseite: true,
  },
  {
    slug: 'drittelregel-gegenstrom-grenze',
    titel: 'Die Drittelregel hält nur bis zu einem Drittel Strom',
    teaser: 'Ein Drittel hin, ein Drittel zurück, ein Drittel Reserve: Bei 1,5 kn Versatz bleiben von 200 l Tank am Steg nicht 66,7 l übrig, sondern 22,3 l. Ab einem Versatz von einem Drittel der Marschfahrt reicht der volle Tank nicht einmal mehr zurück – unabhängig von Tankgröße und Verbrauch. Ein großer Tank hilft gegen Entfernung, nicht gegen Strom.',
    datum: '2026-09-18',
    thema: 'Boot',
    rechner: ['spritverbrauch-boot', 'rumpfgeschwindigkeit', 'ankerkette-rechner'],
    aufRechnerseite: true,
  },
  {
    slug: 'rumpfgeschwindigkeit-was-der-faktor-verschweigt',
    titel: 'Die Formel kennt das Gewicht des Bootes nicht',
    teaser: 'Die Rumpfgeschwindigkeit hat genau eine Eingabe: die Wasserlinienlänge. Rechnet man den Faktor 2,43 gegen ein gängiges Konstrukteursmodell zurück, beschreibt er ein Boot, das bei 9 m Wasserlinie rund 9.000 kg wiegt. Eine 5,5-Tonnen-Yacht derselben Länge kommt auf 8,51 kn statt 7,29 kn – ohne zu gleiten. Dazu: warum 2,43 und 1,34 dieselbe Regel sind und was die letzten 20 Prozent Fahrt kosten.',
    datum: '2026-09-18',
    thema: 'Boot',
    rechner: ['rumpfgeschwindigkeit', 'spritverbrauch-boot'],
    aufRechnerseite: true,
  },
  {
    slug: 'spaete-geburt-verlaengert-den-mutterschutz',
    titel: 'Eine späte Geburt verlängert den Mutterschutz',
    teaser: 'Der errechnete Termin ist ein einzelner Kalendertag, und § 3 MuSchG rechnet fest damit, dass er nicht eintrifft. Wer sieben Tage zu früh entbindet, hat am Ende dieselbe Schutzfrist wie bei einer Geburt am Termin – wer sieben Tage zu spät entbindet, hat sieben Tage mehr. Bei 2.200 € Nettoentgelt sind das 513,31 € zusätzlich, von denen die Krankenkasse 91,00 € trägt.',
    datum: '2026-09-18',
    thema: 'Familie',
    rechner: ['schwangerschafts-rechner', 'mutterschutz-rechner', 'elterngeld-rechner'],
    aufRechnerseite: true,
  },
  {
    slug: 'gmbh-break-even-ist-ein-hebesatz',
    titel: 'Der Break-even ist ein Hebesatz, kein Gewinn',
    teaser: 'Die Regel „ab rund 80.000 € Gewinn lohnt die GmbH“ hält dem Nachrechnen nicht stand. Wer voll ausschüttet, zahlt bei einem Hebesatz von 410 % konstant 48,59 % – bei jedem Gewinn. Das Einzelunternehmen kommt selbst bei unbegrenzt wachsendem Gewinn nie über 47,05 %. Zwischen 341 % und 576 % Hebesatz gewinnt die GmbH bei Vollausschüttung nie; erst das Einbehalten dreht das Bild, und das ist eine Stundung.',
    datum: '2026-09-18',
    thema: 'Geld',
    rechner: ['gmbh-vs-einzelunternehmen', 'gewerbesteuer-rechner', 'abgeltungsteuer-rechner'],
    aufRechnerseite: true,
  },
  {
    slug: 'blutdruck-optimal-und-erhoeht',
    titel: 'Optimal und erhöht zugleich',
    teaser: 'Für Blutdruck gibt es in Europa zwei Tabellen, und sie sind sich nur an einer Stelle einig: ab 140/90 mmHg ist es Bluthochdruck. Darunter nennt die ESH-Leitlinie 118/75 „optimal“, die ESC-Leitlinie „erhöht“. Welche Kategorie gilt, entscheidet außerdem immer der ungünstigere der beiden Werte – und der Ort, an dem gemessen wurde: Zu Hause liegt die Grenze bei 135/85.',
    datum: '2026-09-18',
    thema: 'Gesundheit',
    rechner: ['blutdruck-bewerter', 'optimalerpuls-rechner'],
    aufRechnerseite: true,
  },
  {
    slug: 'dienstreise-kilometerpauschale-gegen-arbeitsweg',
    titel: 'Die kleinere Kilometerpauschale ist die größere',
    teaser: 'Für den Arbeitsweg setzt das Finanzamt 0,38 € je Kilometer an, für eine Dienstreise nur 0,30 €. Trotzdem bringt dieselbe Strecke als Dienstreise rund 58 % mehr, weil die Entfernungspauschale nur die einfache Entfernung zählt. Und wer die Pauschale vom Arbeitgeber erstattet bekommt, statt sie abzusetzen, hat bei 4.800 km im Jahr 1.440 € in der Tasche statt 70 € Steuerersparnis.',
    datum: '2026-09-18',
    thema: 'Auto',
    rechner: ['anfahrtskosten-rechner', 'fahrtkosten-rechner', 'km-kostenrechner'],
    aufRechnerseite: true,
  },
  {
    slug: 'festgeld-zinszahlung-und-pauschbetrag',
    titel: 'Wer Zinsen erst am Ende bekommt, zahlt mehr Steuer',
    teaser: 'Zwei Festgelder, beide 3 %, beide 5 Jahre, beide 30.000 €: Das eine schreibt die Zinsen jedes Jahr gut, das andere zahlt sie am Ende. Nach Steuer liegt das zweite 993 € zurück, ohne Zinseszins sogar 1.198 €. Der Grund ist der Sparer-Pauschbetrag, der nur im Kalenderjahr gilt und nicht vorgetragen wird.',
    datum: '2026-09-18',
    thema: 'Geld',
    rechner: ['sparen-rechner', 'abgeltungsteuer-rechner'],
    aufRechnerseite: true,
  },
  {
    slug: 'kalorienbedarf-aktivitaetsfaktor',
    titel: 'Der Aktivitätsfaktor wiegt schwerer als das Gewicht',
    teaser: 'Vier Eingaben des Kalorienrechners sind gemessen, eine ist geschätzt – und die entscheidet: Ein Zehntel mehr Aktivitätsfaktor verschiebt den Tagesbedarf so stark wie 11,1 kg mehr Körpergewicht. Allein die Spanne der FAO-Kategorie „sitzend oder leicht aktiv“ macht 492 kcal aus. Dazu die Rechnung, warum dauerhaft 100 kcal mehr am Tag nicht 5,2 kg pro Jahr bedeuten, sondern 6,5 kg insgesamt.',
    datum: '2026-09-18',
    thema: 'Gesundheit',
    rechner: ['kalorien-rechner', 'grundumsatz-rechner', 'kalorien-verbrennen'],
    aufRechnerseite: true,
  },
  {
    slug: 'null-prozent-finanzierung-barzahlerrabatt',
    titel: 'Null Prozent Zinsen kosten den Barzahlerrabatt',
    teaser: 'Eine 0-%-Finanzierung ist nur gratis, wenn es ohne sie keinen Nachlass gegeben hätte. Wer für sie auf 5 % Barzahlerrabatt verzichtet, zahlt bei 25.000 € Kaufpreis über 12 Monate umgerechnet 12,78 % effektiven Jahreszins, über 60 Monate nur 2,60 %. Und je höher die Anzahlung, desto teurer wird die Null.',
    datum: '2026-09-18',
    thema: 'Geld',
    rechner: ['autofinanzierung-rechner', 'kreditvergleich', 'leasing-rechner'],
    aufRechnerseite: true,
  },
  {
    slug: 'unterversicherung-luecke-vor-dem-totalschaden',
    titel: 'Die größte Lücke klafft vor dem Totalschaden',
    teaser: 'Wer 80 % seines Hauswerts versichert hat, bekommt den Totalschaden bis zur Versicherungssumme ersetzt – einen Schaden in Höhe dieser Summe aber nur zu 80 %. Die Differenz zur Erwartung ist genau dort am größten. Und eine Summe, die im Mai 2021 gestimmt hat, deckt nach dem Baupreisindex heute nur noch 70,4 % des Werts.',
    datum: '2026-09-18',
    thema: 'Versicherungen',
    rechner: ['elementar-rechner'],
    aufRechnerseite: true,
  },
  {
    slug: 'zahnersatz-bonusheft-und-tarif',
    titel: 'Das Bonusheft spart oft der Versicherer, nicht Sie',
    teaser: 'Zehn Jahre lückenloses Bonusheft erhöhen den Festzuschuss im Beispiel von 900 € auf 1.125 €. Wer eine Zusatzversicherung mit „90 % inklusive Kassenleistung“ hat, zahlt danach trotzdem genau so viel wie vorher: 300 €. Erst ein Höchstbetrag im Tarif dreht das um – und der bestimmt die Rechnung früher, als die meisten erwarten.',
    datum: '2026-09-18',
    thema: 'Versicherungen',
    rechner: ['zahnzusatz-rechner'],
    aufRechnerseite: true,
  },
  {
    slug: 'bmi-punkt-kilogramm-koerpergroesse',
    titel: 'Ein BMI-Punkt wiegt nicht überall gleich viel',
    teaser: 'Bei 1,50 m entspricht ein BMI-Punkt 2,25 kg, bei 2,00 m 4,00 kg. Das Normalgewicht umfasst deshalb bei 1,50 m nur 14,6 kg, bei 2,00 m 26,0 kg. Wer eine Gestalt maßstäblich von 1,60 m auf 1,90 m vergrößert, macht aus BMI 22 einen BMI von 26,13 – Übergewicht bei gleichen Proportionen.',
    datum: '2026-09-17',
    thema: 'Gesundheit',
    rechner: ['bmi-rechner', 'idealgewicht-rechner'],
    aufRechnerseite: true,
  },
  {
    slug: 'prozent-hin-und-zurueck',
    titel: 'Wer 20 Prozent verliert, braucht 25 zurück',
    teaser: 'Nach −20 % braucht es +25 %, nach −50 % eine Verdopplung. Wer denselben Satz auf- und wieder abschlägt, verliert genau dessen Quadrat. Eine Steuersenkung um 12 Prozentpunkte sind 63 % weniger Steuer, senkt den Preis aber höchstens um 10,08 %. Und ein Depot mit abwechselnd +25 % und −20 % legt im Schnitt 2,5 % im Jahr zu und steht nach 20 Jahren exakt am Anfang.',
    datum: '2026-09-17',
    thema: 'Einheiten',
    rechner: ['prozent-rechner', 'rabatt-rechner'],
    aufRechnerseite: true,
  },
  {
    slug: 'durchschnittsrendite-und-reihenfolge',
    titel: 'Sieben Prozent im Schnitt sind keine sieben Prozent',
    teaser: 'Plus 50 und minus 50 Prozent ergeben im Schnitt null, und trotzdem ist ein Viertel des Geldes weg. Beim Sparplan der Rechner-Voreinstellung ergeben dieselben zwanzig Jahresrenditen je nach Reihenfolge 138.659 € oder 502.861 €. Über alle 1.048.576 gleich wahrscheinlichen Verläufe enden 59,6 Prozent unter dem Wert der glatten Rechnung.',
    datum: '2026-09-17',
    thema: 'Geld',
    rechner: ['etf-renditerechner', 'etf-sparplan-rechner'],
    aufRechnerseite: true,
  },
  {
    slug: 'warmmiete-vorauszahlung-nachzahlung',
    titel: 'Die günstigere Warmmiete ist oft die teurere Wohnung',
    teaser: 'Wohnung A wirkt im Inserat mit 950 € warm um 40 € günstiger als Wohnung B, kostet bei durchschnittlichen Nebenkosten aber 30 € im Monat mehr. Bis zur ersten Abrechnung dürfen bis zu 23 Monate vergehen – bei teurer Heizung läuft bis dahin eine Nachzahlung auf, die höher ist als die höchstzulässige Kaution.',
    datum: '2026-09-17',
    thema: 'Wohnen',
    rechner: ['mietrechner', 'nebenkosten-rechner'],
    aufRechnerseite: true,
  },
  {
    slug: 'kita-zuschuss-und-steuerdeckel',
    titel: 'Der Kita-Zuschuss wirkt am stärksten bei teuren Kitas',
    teaser: 'Ein steuerfreier Kita-Zuschuss von 1.200 € im Jahr bringt bei 300 € Monatsbeitrag nur 881 €, bei 800 € die vollen 1.200 €. Ab 500 € im Monat senkt kein weiterer Beitragseuro mehr die Steuer – und genau diese Euro übernimmt der Zuschuss zuerst. Als Gehaltserhöhung blieben von denselben 1.200 € nur 625 €.',
    datum: '2026-09-17',
    thema: 'Familie',
    rechner: ['betreuungskosten-rechner', 'brutto-netto-rechner'],
    aufRechnerseite: true,
  },
  {
    slug: 'kfz-rueckstufung-selbst-zahlen',
    titel: 'Eine Rückstufung wird erst in SF 35 eingeholt',
    teaser: 'Wer aus SF 10 bei 500 € Jahresbeitrag einen Haftpflichtschaden meldet, zahlt nach den Tabellen der GHV in zehn Jahren 1.229,71 € mehr – insgesamt aber 2.148,64 €, denn der Abstand schließt sich erst im 32. Jahr. Ob Selbstzahlen sich lohnt, lässt sich als Vielfaches des eigenen Jahresbeitrags ablesen.',
    datum: '2026-09-17',
    thema: 'Versicherungen',
    rechner: ['kfz-versicherung-rechner', 'unterhaltskosten-auto'],
    aufRechnerseite: true,
  },
  {
    slug: 'schnellladen-gegen-benzin-schwelle',
    titel: 'Am Schnelllader trennen Strom und Benzin vier Prozent',
    teaser: 'Der Corsa verbraucht nach Norm 5,1 l Benzin oder 15,7 kWh Strom. Daraus folgt eine Schwelle von 62,37 ct je kWh: Mit Haushaltsstrom darf das E-Auto 69 % mehr verbrauchen und fährt trotzdem billiger, am Schnelllader nur noch 3,9 %. Keiner der 11 Ad-hoc-Preise, die der ADAC an Autobahnen erhoben hat, liegt unter der Schwelle.',
    datum: '2026-09-17',
    thema: 'Auto',
    rechner: ['spritkosten-vergleich', 'elektroauto-tco-rechner'],
    aufRechnerseite: true,
  },
  {
    slug: 'solarspeicher-zyklen-statt-kapazitaet',
    titel: 'Ein Speicher verdient an Zyklen, nicht an Kapazität',
    teaser: 'Eine Kilowattstunde Speicherkapazität, die an allen 250 Ladetagen voll durchläuft, bringt in jedem Haushalt gleich viel. Der Verbrauch bestimmt nur, wie viele Kilowattstunden so arbeiten. Die 5 kWh, die einen 15-kWh-Speicher von einem 10-kWh-Speicher unterscheiden, sind für sich gerechnet erst nach über hundert Jahren bezahlt.',
    datum: '2026-09-17',
    thema: 'Energie',
    rechner: ['solarspeicher-dimensionierung', 'stromspeicher-rechner', 'photovoltaik-rechner'],
    aufRechnerseite: true,
  },
  {
    slug: 'kaufnebenkosten-und-die-zehnjahresfrist',
    titel: 'Die Kaufnebenkosten und die Zehnjahresfrist laufen gegen dieselbe Uhr',
    teaser: 'Bei 300.000 € Kaufpreis in Nordrhein-Westfalen kommen 33.429 € Kaufnebenkosten hinzu, und die Nettorendite sinkt von 3,97 auf 3,57 Prozent. Bei einem Prozent Wertsteigerung sind die Nebenkosten erst nach 10,6 Jahren eingespielt. Wer genau am zehnten Jahrestag verkauft, bekommt weniger zurück, als er eingesetzt hat – und versteuert trotzdem einen Gewinn, weil § 23 Abs. 3 Satz 4 EStG die Abschreibungen zurückrechnet.',
    datum: '2026-09-13',
    thema: 'Wohnen',
    rechner: ['mietrendite-rechner', 'immobilienkauf-nebenkosten', 'hauskauf-rechner'],
    aufRechnerseite: true,
  },
  {
    slug: 'effektivzins-gegen-ratensumme',
    titel: 'Der niedrigere effektive Jahreszins kann der teurere Kredit sein',
    teaser: 'Zwei Angebote über 20.000 € zu 5,9 % Sollzins, beide mit derselben zwingenden Restschuldversicherung: über 36 Monate 11,73 % effektiver Jahreszins, über 84 Monate nur 8,60 % – und 2.798 € mehr Kosten. Umgekehrt hält die Ratensumme einen Zwölfmonatskredit zu 32,27 % für genauso teuer wie einen über 84 Monate zu 4,9 %. Warum bei ungleicher Laufzeit beide Vergleichszahlen versagen.',
    datum: '2026-09-13',
    thema: 'Geld',
    rechner: ['kreditvergleich', 'ratenkredit-detailrechner', 'autofinanzierung-rechner'],
    aufRechnerseite: true,
  },
  {
    slug: 'anfangstilgung-laufzeit-restschuld',
    titel: 'Anfangstilgung: Für die Laufzeit wird jeder Prozentpunkt weniger wert – für die Restschuld nicht',
    teaser: 'Bei einem Immobiliendarlehen verkürzt jeder zusätzliche Prozentpunkt Anfangstilgung die Laufzeit um weniger als der vorige. Auf die Restschuld am Ende der Zinsbindung wirkt dagegen jeder Schritt gleich stark – und genau diese Zahl entscheidet über die Anschlussfinanzierung. Durchgerechnet mit Tilgungsplan, Effektivzins und dem Kündigungsrecht nach § 489 BGB.',
    datum: '2026-09-13',
    thema: 'Wohnen',
    rechner: ['tilgungs-kreditrechner', 'tilgungsplan', 'hauskauf-rechner'],
    aufRechnerseite: true,
  },
  {
    slug: 'leasingfaktor-was-er-verschweigt',
    titel: 'Der Leasingfaktor lässt sich kaufen',
    teaser: 'Leasingangebote werden über den Leasingfaktor verglichen: Monatsrate geteilt durch Fahrzeugpreis, mal hundert. Eine Anzahlung von 10.000 € drückt ihn im Beispiel von 1,570 auf 0,735 – um 53 Prozent, während die Gesamtkosten desselben Vertrags nur um 2,7 Prozent sinken. Ab 17.000 € Anzahlung fällt der Faktor weiter, während der Vertrag teurer wird. Dazu die Rechnung, warum es beim Leasing gar keinen Effektivzins gibt.',
    datum: '2026-09-13',
    thema: 'Auto',
    rechner: ['leasing-rechner', 'km-kostenrechner'],
    aufRechnerseite: true,
  },
  {
    slug: 'rentenbeginn-der-teuerste-monat',
    titel: 'Der teuerste Monat eines Rentenlebens',
    teaser: 'Wer 45 Beitragsjahre hat und seine Altersgrenze abwartet, geht ohne Abschlag. Wer einen einzigen Monat früher beginnt, verliert die Rentenart und bekommt den Abschlag für die ganze Strecke bis zur Regelaltersgrenze: 7,5 Prozentpunkte auf einmal, im Beispiel 138,83 € Bruttorente im Monat, dauerhaft. Der Monat davor ist 8,30 € wert, der Monat danach 3,12 €. Und an der Regelaltersgrenze sind die 45 Beitragsjahre für die Rentenhöhe exakt nichts mehr wert.',
    datum: '2026-09-13',
    thema: 'Familie',
    rechner: ['renten-rechner', 'rentenpunkte-rechner', 'rentenlucken-rechner'],
    aufRechnerseite: true,
  },
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
    titel: 'Der Wertverlust halbiert sich zwischen dem dritten und dem achten Jahr – gerechnet aus 9.772 Gebrauchtwagenpreisen',
    teaser: 'Ein Neuwagen verliert in den ersten beiden Jahren mehr als das Vierfache eines sieben Jahre alten Wagens. Eigene Auswertung der DAT-Preisnotierungen – und die Schwelle, bis zu der sich höhere Werkstattkosten eines Älteren rechnen.',
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
