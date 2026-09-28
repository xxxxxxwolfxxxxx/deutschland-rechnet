import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Echte Änderungsdaten der Seiten aus der Git-Historie.
 *
 * Zuvor setzte die Sitemap für jede URL das Build-Datum. Damit behauptete jeder
 * Deploy, alle 123 Seiten seien geändert worden – Google entwertet ein lastmod,
 * das sich so verhält, und ignoriert es dann komplett. Hier steht stattdessen
 * das Datum des letzten Commits, der die jeweilige Datei angefasst hat.
 *
 * Ohne Git-Historie (z. B. flacher Klon) bleibt die Map leer und die Aufrufer
 * lassen lastmod weg. Kein Datum ist besser als ein falsches.
 *
 * Seit die redaktionellen Artikel auf den Rechnerseiten stehen, reicht der Blick
 * auf src/pages nicht mehr: Der Artikeltext liegt in einer eigenen Datei unter
 * src/components/artikel/ und wird von der Seite nur importiert. Wer dort einen
 * Rechenfehler korrigiert, ändert den Seiteninhalt, ohne die Seitendatei
 * anzufassen – die Sitemap hätte das nicht gemeldet. Deshalb zählt hier das
 * jüngere der beiden Daten.
 */

const PAGES_ROOT = 'src/pages';
const ARTIKEL_ROOT = 'src/components/artikel';

function readGitLog(pfad) {
  try {
    return execFileSync(
      'git',
      ['log', '--pretty=format:@%cI', '--name-only', '--', pfad],
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] },
    );
  } catch {
    return '';
  }
}

/**
 * Artikeldateien, die ein Seitenquelltext einbindet – als Repo-Pfade.
 * Die Importe stehen als relative Pfade in der Datei; interessant ist nur der
 * Dateiname, weil alle Artikel flach in ARTIKEL_ROOT liegen.
 * @param {string} quelle Inhalt einer .astro-Seite
 * @returns {string[]}
 */
export function artikelImporte(quelle) {
  const treffer = [...quelle.matchAll(/from\s+['"][^'"]*\/artikel\/([A-Za-z0-9._-]+\.astro)['"]/g)];
  return treffer.map((m) => `${ARTIKEL_ROOT}/${m[1]}`);
}

/**
 * Welche Artikeldatei gehört zu welcher Route – gelesen aus den Seitendateien
 * selbst, nicht aus einer gepflegten Liste, damit beides nicht auseinanderläuft.
 * @returns {Map<string, string[]>}
 */
function leseAbhaengigkeiten(root = PAGES_ROOT) {
  const map = new Map();
  const gehe = (verzeichnis) => {
    let eintraege;
    try {
      eintraege = readdirSync(verzeichnis, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of eintraege) {
      const pfad = join(verzeichnis, e.name);
      if (e.isDirectory()) {
        gehe(pfad);
      } else if (e.name.endsWith('.astro')) {
        const route = toRoutePath(pfad);
        if (!route) continue;
        try {
          const artikel = artikelImporte(readFileSync(pfad, 'utf8'));
          if (artikel.length) map.set(route, artikel);
        } catch {
          // Nicht lesbar: Seite behält einfach ihr eigenes Commit-Datum.
        }
      }
    }
  };
  gehe(root);
  return map;
}

/**
 * Führt Seiten- und Artikeldaten zusammen: je Route gewinnt der spätere
 * Zeitpunkt. Verglichen wird über Date.parse, nicht über den String – die
 * Zeitstempel tragen Zeitzonen, und '…+02:00' sortiert sonst falsch gegen
 * '…-05:00'.
 * @param {Map<string,string>} seiten   Route -> ISO
 * @param {Map<string,string>} artikel  Artikelpfad -> ISO
 * @param {Map<string,string[]>} abhaengigkeiten Route -> Artikelpfade
 * @returns {Map<string,string>}
 */
export function vereinigeDaten(seiten, artikel, abhaengigkeiten) {
  const ergebnis = new Map(seiten);
  for (const [route, pfade] of abhaengigkeiten) {
    for (const pfad of pfade) {
      const kandidat = artikel.get(pfad);
      if (!kandidat) continue;
      const bisher = ergebnis.get(route);
      if (!bisher || Date.parse(kandidat) > Date.parse(bisher)) {
        ergebnis.set(route, kandidat);
      }
    }
  }
  return ergebnis;
}

/**
 * Wandelt einen Dateipfad in den Seitenpfad um, den Astro ausliefert.
 * src/pages/auto/km-kostenrechner.astro -> /auto/km-kostenrechner/
 * src/pages/auto/index.astro            -> /auto/
 * src/pages/index.astro                 -> /
 */
export function toRoutePath(filePath) {
  if (!filePath.startsWith(`${PAGES_ROOT}/`) || !filePath.endsWith('.astro')) return null;
  const withoutRoot = filePath.slice(PAGES_ROOT.length + 1, -'.astro'.length);
  const withoutIndex = withoutRoot.replace(/(^|\/)index$/, '');
  return withoutIndex === '' ? '/' : `/${withoutIndex}/`;
}

let cachedMap = null;

/**
 * Wie buildLastModifiedMap, aber nur einmal pro Build ausgeführt. Komponenten
 * rufen das je Seite auf – ohne Cache liefe git log über 100-mal.
 * @returns {Map<string, string>}
 */
export function getLastModifiedMap() {
  cachedMap ??= buildLastModifiedMap();
  return cachedMap;
}

/**
 * @returns {Map<string, string>} Route ('/auto/km-kostenrechner/') -> ISO-Zeitstempel
 */
export function buildLastModifiedMap() {
  const seiten = sammle(readGitLog(PAGES_ROOT), toRoutePath);
  const artikel = sammle(readGitLog(ARTIKEL_ROOT), (datei) =>
    datei.startsWith(`${ARTIKEL_ROOT}/`) && datei.endsWith('.astro') ? datei : null,
  );
  if (seiten.size === 0 && artikel.size === 0) return new Map();
  return vereinigeDaten(seiten, artikel, leseAbhaengigkeiten());
}

/**
 * Liest einen `git log --name-only`-Block in eine Map.
 * Commits kommen chronologisch absteigend – der erste Treffer je Datei gewinnt.
 */
function sammle(log, schluessel) {
  const dates = new Map();
  if (!log) return dates;
  let currentDate = null;
  for (const line of log.split('\n')) {
    if (line.startsWith('@')) {
      currentDate = line.slice(1);
      continue;
    }
    if (!line || !currentDate) continue;
    const k = schluessel(line);
    if (k && !dates.has(k)) dates.set(k, currentDate);
  }
  return dates;
}

/**
 * Schlägt das Änderungsdatum für eine volle URL nach.
 * @returns {string | undefined} ISO-Zeitstempel oder undefined, wenn unbekannt
 */
export function lookupLastModified(map, url) {
  try {
    return map.get(new URL(url).pathname);
  } catch {
    return undefined;
  }
}
