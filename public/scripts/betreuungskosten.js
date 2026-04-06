const REGION_FAKTOR = { low: 0.7, mid: 1.0, high: 1.4 };
const ALTER_FAKTOR = { krippe: 1.5, kita: 1.0 };

function berechneBetreuungskosten({ einkommen, kinder, stunden, alter, region }) {
  const stundenFaktor = { 4: 0.7, 6: 1.0, 8: 1.2, 10: 1.4 };
  const faktor = stundenFaktor[stunden] || 1.0;
  const regionFaktor = REGION_FAKTOR[region] || 1.0;
  const alterFaktor = ALTER_FAKTOR[alter] || 1.0;
  
  const basiskosten = 150 * faktor * regionFaktor * alterFaktor;
  const einkommenszuschlag = Math.max(0, (einkommen - 30000) * 0.002);
  const kostenProKind = basiskosten + einkommenszuschlag;
  const gesamtkosten = kostenProKind * kinder;
  const geschwisterRabatt = kinder > 1 ? (kostenProKind * Math.min(0.5, (kinder - 1) * 0.25)) : 0;
  const elternbeitrag = Math.max(0, gesamtkosten - geschwisterRabatt);
  
  return {
    kostenProKind: Math.round(kostenProKind * 100) / 100,
    grundgebuehr: Math.round(basiskosten * 100) / 100,
    einkommenszuschlag: Math.round(einkommenszuschlag * 100) / 100,
    gesamtkosten: Math.round(gesamtkosten * 100) / 100,
    elternbeitrag: Math.round(elternbeitrag * 100) / 100,
    geschwisterRabatt: Math.round(geschwisterRabatt * 100) / 100,
  };
}

export { berechneBetreuungskosten };
