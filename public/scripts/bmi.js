// WHO-Formel
const KATEGORIEN = [
  [18.5, 'Untergewicht'],
  [25,   'Normalgewicht'],
  [30,   'Übergewicht'],
  [35,   'Adipositas Grad I'],
  [40,   'Adipositas Grad II'],
  [Infinity, 'Adipositas Grad III'],
];

export function berechneBMI({ gewichtKg, groesseCm }) {
  const groesseM = groesseCm / 100;
  const bmi = Math.round((gewichtKg / (groesseM * groesseM)) * 100) / 100;
  const kategorie = KATEGORIEN.find(([grenze]) => bmi < grenze)?.[1] ?? 'Adipositas Grad III';
  return { bmi, kategorie };
}
