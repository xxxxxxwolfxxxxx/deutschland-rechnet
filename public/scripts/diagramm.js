// Gemeinsame Bausteine für die Diagramme und Tabellen der Rechnerseiten.
//
// Alle erzeugten Elemente tragen ihre Darstellung als Attribut oder als
// style-Eigenschaft. Das ist Absicht: Astro-Stile gelten nicht für Elemente,
// die per JavaScript entstehen (siehe die Reparaturen in den PR 9 und 16).
// Die Werte selbst kommen immer aus dem Rechenmodul der Seite.

const SVG_NS = 'http://www.w3.org/2000/svg';
const FARBE_TEXT = '#666';
const FARBE_GITTER = '#e3e3e3';

/** Gleichmäßige Werte von von bis bis (einschließlich), jeweils im Abstand schritt. */
export function reihe(von, bis, schritt, fn) {
  const punkte = [];
  for (let x = von; x <= bis + 1e-9; x += schritt) punkte.push({ x, ...fn(x) });
  return punkte;
}

/** Anzahl Achsenmarken gleichmäßig zwischen min und max, einschließlich beider Enden. */
export function achsenMarken(min, max, anzahl) {
  if (anzahl < 2) return [min];
  const schritt = (max - min) / (anzahl - 1);
  return Array.from({ length: anzahl }, (_, i) => min + i * schritt);
}

function el(name, attrs) {
  const n = document.createElementNS(SVG_NS, name);
  Object.entries(attrs).forEach(([k, v]) => n.setAttribute(k, v));
  return n;
}

function text(x, y, anker, inhalt) {
  const t = el('text', { x, y, 'text-anchor': anker, 'font-size': 11, fill: FARBE_TEXT });
  t.textContent = inhalt;
  return t;
}

/**
 * Liniendiagramm in ein <svg>. Die Breite folgt dem Elternelement.
 *
 * @param {SVGElement} svg
 * @param {object} o
 * @param {Array<{punkte: Array<{x:number,y:number}>, farbe?: string, gestrichelt?: boolean, stufe?: boolean}>} o.serien
 *        stufe: true zeichnet Treppenstufen statt schräger Linien
 * @param {{x:number,y:number}} [o.marker]
 * @param {(n:number)=>string} o.xFormat
 * @param {(n:number)=>string} o.yFormat
 * @param {number} [o.xMarken=5]
 * @param {number} [o.yMax]  sonst höchster y-Wert
 * @param {number} [o.yMin]  sonst der kleinere von 0 und dem niedrigsten y-Wert
 */
export function zeichneKurve(svg, o) {
  const breite = Math.max(280, Math.min(640, svg.parentElement.clientWidth || 640));
  const hoehe = breite < 480 ? 220 : 260;
  const r = { l: 56, r: 14, o: 14, u: 32 };
  const alle = o.serien.flatMap((s) => s.punkte);
  const xMin = Math.min(...alle.map((p) => p.x));
  const xMax = Math.max(...alle.map((p) => p.x));
  const yMax = o.yMax ?? Math.max(1, ...alle.map((p) => p.y));
  const yMin = o.yMin ?? Math.min(0, ...alle.map((p) => p.y));
  const x = (v) => r.l + ((v - xMin) / ((xMax - xMin) || 1)) * (breite - r.l - r.r);
  const y = (v) => hoehe - r.u - ((v - yMin) / ((yMax - yMin) || 1)) * (hoehe - r.u - r.o);

  svg.setAttribute('viewBox', `0 0 ${breite} ${hoehe}`);
  svg.replaceChildren();
  achsenMarken(yMin, yMax, 3).forEach((v) => {
    svg.appendChild(el('line', { x1: r.l, y1: y(v), x2: breite - r.r, y2: y(v), stroke: FARBE_GITTER, 'stroke-width': 1 }));
    svg.appendChild(text(r.l - 6, y(v) + 4, 'end', o.yFormat(v)));
  });
  if (yMin < 0) svg.appendChild(el('line', { x1: r.l, y1: y(0), x2: breite - r.r, y2: y(0), stroke: '#999', 'stroke-width': 1.5 }));
  achsenMarken(xMin, xMax, breite < 480 ? 3 : (o.xMarken ?? 5)).forEach((v) => {
    svg.appendChild(text(x(v), hoehe - 12, 'middle', o.xFormat(v)));
  });
  o.serien.forEach((s) => {
    const pfad = [];
    s.punkte.forEach((p, i) => {
      if (s.stufe && i > 0) pfad.push(`${x(p.x).toFixed(1)},${y(s.punkte[i - 1].y).toFixed(1)}`);
      pfad.push(`${x(p.x).toFixed(1)},${y(p.y).toFixed(1)}`);
    });
    const attrs = { points: pfad.join(' '), fill: 'none', stroke: s.farbe ?? '#c8102e', 'stroke-width': s.gestrichelt ? 2 : 2.5 };
    if (s.gestrichelt) attrs['stroke-dasharray'] = '5 4';
    svg.appendChild(el('polyline', attrs));
  });
  if (o.marker && o.marker.x >= xMin && o.marker.x <= xMax) {
    svg.appendChild(el('circle', { cx: x(o.marker.x), cy: y(o.marker.y), r: 5, fill: '#fff', stroke: '#1b1b1b', 'stroke-width': 2 }));
  }
}

/** Erneutes Zeichnen bei Größenänderung; gibt eine Funktion zum Abmelden zurück. */
export function beiGroessenaenderung(fn) {
  window.addEventListener('resize', fn);
  return () => window.removeEventListener('resize', fn);
}

/**
 * Gestapelter Balken aus <span>-Segmenten.
 * @param {HTMLElement} ziel
 * @param {Array<{wert:number,farbe:string,titel?:string}>} segmente
 * @param {number} skala Wert, der 100 % der Breite entspricht
 */
export function zeichneBalken(ziel, segmente, skala) {
  ziel.replaceChildren();
  Object.assign(ziel.style, { display: 'flex', height: '1.6rem', background: '#f1f1f1', borderRadius: '4px', overflow: 'hidden', minWidth: '0' });
  segmente.forEach((s) => {
    const teil = document.createElement('span');
    Object.assign(teil.style, { display: 'block', height: '100%', background: s.farbe, width: `${(Math.max(0, s.wert) / (skala || 1)) * 100}%` });
    if (s.titel) teil.title = s.titel;
    ziel.appendChild(teil);
  });
}

/**
 * Legende aus Farbfeld und Beschriftung.
 * @param {HTMLElement} ziel
 * @param {Array<{farbe:string,name:string}>} eintraege
 */
export function zeichneLegende(ziel, eintraege) {
  ziel.replaceChildren();
  Object.assign(ziel.style, { listStyle: 'none', padding: '0', margin: '0.5rem 0', display: 'flex', flexWrap: 'wrap', gap: '0.3rem 1rem', fontSize: '0.82rem' });
  eintraege.forEach((e) => {
    const li = document.createElement('li');
    const f = document.createElement('span');
    Object.assign(f.style, { display: 'inline-block', width: '0.8rem', height: '0.8rem', borderRadius: '2px', marginRight: '0.35rem', verticalAlign: '-1px', background: e.farbe });
    li.append(f, e.name);
    ziel.appendChild(li);
  });
}

/**
 * Tabelle in ein <table>. Erste Spalte links, übrige rechts.
 * @param {HTMLTableElement} tabelle
 * @param {string[]} kopf
 * @param {Array<{zellen:string[], markiert?:boolean, gedaempft?:boolean, summe?:boolean}>} zeilen
 */
export function fuelleTabelle(tabelle, kopf, zeilen) {
  tabelle.replaceChildren();
  Object.assign(tabelle.style, { width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem', marginTop: '0.5rem' });
  const zelle = (tag, inhalt, i, stil = {}) => {
    const z = document.createElement(tag);
    z.textContent = inhalt;
    Object.assign(z.style, { padding: '0.4rem 0.5rem', borderBottom: '1px solid #e3e3e3', textAlign: i === 0 ? 'left' : 'right' }, stil);
    return z;
  };
  const thead = document.createElement('thead');
  const kopfZeile = document.createElement('tr');
  kopf.forEach((k, i) => kopfZeile.appendChild(zelle('th', k, i, { fontSize: '0.78rem', color: FARBE_TEXT, fontWeight: '600' })));
  thead.appendChild(kopfZeile);
  const tbody = document.createElement('tbody');
  zeilen.forEach((z) => {
    const tr = document.createElement('tr');
    const stil = {};
    if (z.markiert) Object.assign(stil, { background: '#fff3cd', fontWeight: '600' });
    if (z.gedaempft) stil.color = '#8a8a8a';
    if (z.summe) Object.assign(stil, { fontWeight: '600', borderTop: '1.5px solid #999' });
    z.zellen.forEach((inhalt, i) => tr.appendChild(zelle('td', inhalt, i, stil)));
    tbody.appendChild(tr);
  });
  tabelle.append(thead, tbody);
}
