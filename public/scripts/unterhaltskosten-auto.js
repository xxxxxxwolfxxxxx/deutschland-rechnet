/**
 * Jährliche Unterhaltskosten eines Autos.
 *
 * Anders als der KM-Kostenrechner, der auf den einzelnen Kilometer schaut,
 * beantwortet dieser Rechner die Haushaltsfrage: Was kostet mich das Auto im
 * Jahr – und wie viel davon fällt an, auch wenn es nur herumsteht?
 *
 * Deshalb die Trennung in Fixkosten (Wertverlust, Versicherung, Steuer,
 * Sonstiges) und variable Kosten (Sprit, Wartung/Verschleiß). Der Wertverlust
 * ist bei jungen Fahrzeugen meist der größte Posten und wird am häufigsten
 * übersehen, weil er nie als Rechnung im Briefkasten liegt.
 */

function runde(betrag) {
  return Math.round(betrag * 100) / 100;
}

function positiv(wert) {
  return Math.max(0, wert || 0);
}

function berechneUnterhaltskosten({
  kaufpreis,
  restwert,
  haltedauerJahre,
  kmProJahr,
  verbrauch,
  spritpreis,
  versicherungProJahr,
  steuerProJahr,
  wartungProJahr,
  sonstigesProJahr,
}) {
  const km = positiv(kmProJahr);
  const jahre = positiv(haltedauerJahre);

  // Ein Restwert über dem Kaufpreis wäre ein Wertgewinn – für die
  // Unterhaltsrechnung zählt er als 0, nicht als negative Kosten.
  const wertverlustGesamt = Math.max(0, positiv(kaufpreis) - positiv(restwert));
  const wertverlustProJahr = jahre > 0 ? wertverlustGesamt / jahre : wertverlustGesamt;

  const spritkostenProJahr = (km / 100) * positiv(verbrauch) * positiv(spritpreis);

  const fixkostenProJahr =
    wertverlustProJahr + positiv(versicherungProJahr) + positiv(steuerProJahr) + positiv(sonstigesProJahr);
  const variableKostenProJahr = spritkostenProJahr + positiv(wartungProJahr);
  const gesamtProJahr = fixkostenProJahr + variableKostenProJahr;

  return {
    gesamtProJahr: runde(gesamtProJahr),
    gesamtProMonat: runde(gesamtProJahr / 12),
    fixkostenProJahr: runde(fixkostenProJahr),
    variableKostenProJahr: runde(variableKostenProJahr),
    wertverlustProJahr: runde(wertverlustProJahr),
    spritkostenProJahr: runde(spritkostenProJahr),
    centProKm: km > 0 ? runde((gesamtProJahr / km) * 100) : 0,
    fixkostenAnteilProzent: gesamtProJahr > 0 ? runde((fixkostenProJahr / gesamtProJahr) * 100) : 0,
  };
}

export { berechneUnterhaltskosten };
