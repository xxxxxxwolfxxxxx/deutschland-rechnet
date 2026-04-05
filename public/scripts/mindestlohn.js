// Mindestlohn 2025: 12,82 €/h (§ 1 MiLoG, gültig ab 1. Jan 2025)
const MINDESTLOHN = 12.82;

export function berechneMindestlohn({ stundenProWoche, urlaubstage = 24 }) {
  const arbeitstageProJahr = 365 - 104 - urlaubstage; // ca. 230 Arbeitstage
  const stundenProMonat = (stundenProWoche * 52) / 12;
  const stundenProJahr = stundenProWoche * 52;
  const monat = Math.round(stundenProMonat * MINDESTLOHN * 100) / 100;
  const jahr = Math.round(stundenProJahr * MINDESTLOHN * 100) / 100;
  return { monat, jahr, stundenProMonat: Math.round(stundenProMonat * 10) / 10, mindestlohn: MINDESTLOHN };
}
