// Überstundenvergütung
export function berechneUeberstunden({ bruttoMonat, stundenProWoche, ueberstunden, zuschlagProzent }) {
  const stundenProMonat = (stundenProWoche * 52) / 12;
  const stundenlohn = Math.round(bruttoMonat / stundenProMonat * 100) / 100;
  const zuschlag = zuschlagProzent / 100;
  const vergütung = Math.round(stundenlohn * ueberstunden * (1 + zuschlag) * 100) / 100;
  return { stundenlohn, vergütung, stundenProMonat: Math.round(stundenProMonat * 10) / 10 };
}
