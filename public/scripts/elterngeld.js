// BEEG § 2 (67%, Min 300€, Max 1800€)
export function berechneElterngeld({ nettoMonat }) {
  const berechnet = Math.round(nettoMonat * 0.67);
  const elterngeld = Math.min(1800, Math.max(300, berechnet));
  const elterngeldPlus = Math.round(elterngeld / 2);
  return { elterngeld, elterngeldPlus };
}
