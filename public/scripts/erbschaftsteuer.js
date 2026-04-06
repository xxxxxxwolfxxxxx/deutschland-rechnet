const FREIBETRAEGE = {
  I1: 500000,
  I2: 400000,
  I3: 200000,
  I4: 100000,
  II: 20000,
  III: 0,
};

const STEUERSATZ = {
  I1: [{ bis: 500000, satz: 7 }, { bis: 1500000, satz: 11 }, { bis: 6000000, satz: 17 }, { bis: 13000000, satz: 25 }, { bis: 30000000, satz: 30 }, { bis: Infinity, satz: 43 }],
  I2: [{ bis: 75000, satz: 7 }, { bis: 300000, satz: 11 }, { bis: 6000000, satz: 17 }, { bis: 13000000, satz: 25 }, { bis: 30000000, satz: 30 }, { bis: Infinity, satz: 43 }],
  I3: [{ bis: 75000, satz: 7 }, { bis: 300000, satz: 11 }, { bis: 6000000, satz: 17 }, { bis: 13000000, satz: 25 }, { bis: Infinity, satz: 43 }],
  I4: [{ bis: 75000, satz: 7 }, { bis: 300000, satz: 11 }, { bis: 6000000, satz: 17 }, { bis: Infinity, satz: 30 }],
  II: [{ bis: 75000, satz: 15 }, { bis: 300000, satz: 20 }, { bis: 6000000, satz: 25 }, { bis: Infinity, satz: 43 }],
  III: [{ bis: Infinity, satz: 43 }],
};

function berechneErbschaftsteuer({ nachlass, klasse }) {
  const freibetrag = FREIBETRAEGE[klasse] || 0;
  const zuVersteuern = Math.max(0, nachlass - freibetrag);
  const stufen = STEUERSATZ[klasse] || STEUERSATZ.III;
  let steuer = 0;
  let verbleibend = zuVersteuern;
  let letzteGrenze = 0;
  for (const stufe of stufen) {
    if (verbleibend <= 0) break;
    const betragInStufe = Math.min(verbleibend, stufe.bis - letzteGrenze);
    steuer += betragInStufe * (stufe.satz / 100);
    verbleibend -= betragInStufe;
    letzteGrenze = stufe.bis;
  }
  const effektiv = nachlass > 0 ? (steuer / nachlass * 100) : 0;
  return {
    steuer: Math.round(steuer * 100) / 100,
    freibetrag,
    zuVersteuern,
    satz: stufen[0].satz,
    effektiv: effektiv.toFixed(2),
  };
}

export { berechneErbschaftsteuer };
