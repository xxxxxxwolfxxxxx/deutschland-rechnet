// Kündigungsfristen nach § 622 BGB (Stand 2025)

// Arbeitgeber-Fristen nach Betriebszugehörigkeit (§ 622 Abs. 2 BGB)
const AG_FRISTEN = [
  { jahre: 0,  monate: 1,  text: '4 Wochen zum 15. oder Monatsende' },
  { jahre: 2,  monate: 1,  text: '1 Monat zum Monatsende' },
  { jahre: 5,  monate: 2,  text: '2 Monate zum Monatsende' },
  { jahre: 8,  monate: 3,  text: '3 Monate zum Monatsende' },
  { jahre: 10, monate: 4,  text: '4 Monate zum Monatsende' },
  { jahre: 12, monate: 5,  text: '5 Monate zum Monatsende' },
  { jahre: 15, monate: 6,  text: '6 Monate zum Monatsende' },
  { jahre: 20, monate: 7,  text: '7 Monate zum Monatsende' },
];

export function berechneKuendigungsfrist({ eintrittsdatum, kuendigungsdatum, seite }) {
  const eintritt = new Date(eintrittsdatum);
  const kuendigung = new Date(kuendigungsdatum);
  const diffMs = kuendigung - eintritt;
  const diffJahre = diffMs / (1000 * 60 * 60 * 24 * 365.25);
  const betriebsjahrePruef = Math.max(0, Math.floor(diffJahre));

  if (seite === 'arbeitnehmer') {
    // AN: immer 4 Wochen zum 15. oder Monatsende (§ 622 Abs. 1)
    const endDatum = berechneEnddatum(kuendigung, 0, true);
    return {
      fristText: '4 Wochen zum 15. oder Monatsende',
      monate: 0,
      wochen: 4,
      endDatum,
      betriebsjahre: betriebsjahrePruef,
      hinweis: 'Gilt für ordentliche Kündigung durch den Arbeitnehmer (§ 622 Abs. 1 BGB). Abweichende tarifvertragliche Regelungen möglich.',
    };
  }

  // Arbeitgeber: Staffelung nach § 622 Abs. 2
  let frist = AG_FRISTEN[0];
  for (const f of AG_FRISTEN) {
    if (betriebsjahrePruef >= f.jahre) frist = f;
  }

  const endDatum = frist.monate > 0
    ? berechneEnddatum(kuendigung, frist.monate, false)
    : berechneEnddatum(kuendigung, 0, true);

  return {
    fristText: frist.text,
    monate: frist.monate,
    wochen: frist.monate === 0 ? 4 : null,
    endDatum,
    betriebsjahre: betriebsjahrePruef,
    hinweis: 'Gesetzliche Mindestkündigungsfrist nach § 622 Abs. 2 BGB. Tarifvertrag oder Einzelvertrag kann längere Fristen vorsehen.',
  };
}

function berechneEnddatum(vonDatum, monate, vierWochen) {
  const d = new Date(vonDatum);
  if (vierWochen) {
    d.setDate(d.getDate() + 28);
    // Zum 15. oder Monatsende
    if (d.getDate() <= 15) {
      d.setDate(15);
    } else {
      d.setMonth(d.getMonth() + 1, 0); // letzter Tag des Monats
    }
  } else {
    d.setMonth(d.getMonth() + monate, 0); // letzter Tag des Zielmonats
  }
  return d;
}
