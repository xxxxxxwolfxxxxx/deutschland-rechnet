import { execFileSync } from 'node:child_process';

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
 */

const PAGES_ROOT = 'src/pages';

function readGitLog() {
  try {
    return execFileSync(
      'git',
      ['log', '--pretty=format:@%cI', '--name-only', '--', `${PAGES_ROOT}`],
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] },
    );
  } catch {
    return '';
  }
}

/**
 * Wandelt einen Dateipfad in den Seitenpfad um, den Astro ausliefert.
 * src/pages/auto/km-kostenrechner.astro -> /auto/km-kostenrechner/
 * src/pages/auto/index.astro            -> /auto/
 * src/pages/index.astro                 -> /
 */
function toRoutePath(filePath) {
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
  const log = readGitLog();
  const dates = new Map();
  if (!log) return dates;

  // Commits kommen chronologisch absteigend – der erste Treffer je Datei gewinnt.
  let currentDate = null;
  for (const line of log.split('\n')) {
    if (line.startsWith('@')) {
      currentDate = line.slice(1);
      continue;
    }
    if (!line || !currentDate) continue;

    const route = toRoutePath(line);
    if (route && !dates.has(route)) dates.set(route, currentDate);
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
