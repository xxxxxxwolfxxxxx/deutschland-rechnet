// Mutterschutzfristen nach § 3 MuSchG
// Schutzfrist vor Geburt: 6 Wochen (42 Tage)
// Schutzfrist nach Geburt: 8 Wochen (56 Tage), bei Früh-/Mehrlingsgeburt 12 Wochen

export function berechneMutterschutz({ geburtstermin, fruehgeburt = false }) {
  const geburt = new Date(geburtstermin);
  const schutzvorGeburt = 42; // 6 Wochen
  const schutzNachGeburt = fruehgeburt ? 84 : 56; // 12 oder 8 Wochen

  const beginn = new Date(geburt);
  beginn.setDate(beginn.getDate() - schutzvorGeburt);

  const ende = new Date(geburt);
  ende.setDate(ende.getDate() + schutzNachGeburt);

  return {
    beginn: beginn.toISOString().split('T')[0],
    ende: ende.toISOString().split('T')[0],
    schutzvorGeburt,
    schutzNachGeburt,
  };
}
