// Minimaler Markdown-Renderer für die Kategorie-Texte.
//
// Die Kategorieseiten setzten den Inhalt von src/content/categories/*.md bisher
// unverändert per set:html in die Seite. Dadurch stand auf jeder Kategorieseite
// wörtlich "## Häufige Fehler" und "**Fehler 1: ...**" im Text, und die Seiten
// hatten keine einzige echte Überschrift — weder für Leser noch für Google.
//
// Astro bringt zwar einen Markdown-Renderer mit, der ist aber nur über den
// Content-Layer erreichbar; loadCategoryContent liest die Dateien bewusst über
// fs. Statt die Architektur umzubauen, deckt dieser Renderer genau die Syntax
// ab, die in den Kategorie-Dateien vorkommt.
//
// Sicherheit: Die Quellen sind eigene Dateien aus dem Repository, kein
// Nutzereingabe. Roher HTML-Durchgriff wird trotzdem entschärft, damit ein
// künftiger Text nicht versehentlich Markup einschleust.

/** Wandelt die Zeichen um, mit denen sich HTML einschleusen ließe. */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/** Inline-Auszeichnungen: fett, kursiv, Links. Erwartet bereits escapten Text. */
function renderInline(text: string): string {
  return text
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_match, label: string, href: string) => {
      // Nur http(s) und seiteninterne Ziele — kein javascript: o. Ä.
      const safe = /^(https?:\/\/|\/|#)/.test(href) ? href : '#';
      const external = safe.startsWith('http');
      const attrs = external ? ' target="_blank" rel="noopener"' : '';
      return `<a href="${safe}"${attrs}>${label}</a>`;
    })
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*]+)\*/g, '$1<em>$2</em>');
}

/**
 * Rendert Markdown zu HTML.
 *
 * Unterstützt Überschriften (# bis ###), Absätze, Aufzählungen sowie fett,
 * kursiv und Links. Alles andere bleibt Fließtext.
 */
export function renderMarkdown(markdown: string): string {
  const lines = escapeHtml(markdown).split('\n');
  const out: string[] = [];

  let paragraph: string[] = [];
  let listItems: string[] = [];

  const flushParagraph = (): void => {
    if (paragraph.length === 0) return;
    out.push(`<p>${renderInline(paragraph.join(' '))}</p>`);
    paragraph = [];
  };

  const flushList = (): void => {
    if (listItems.length === 0) return;
    const items = listItems.map((item) => `<li>${renderInline(item)}</li>`).join('');
    out.push(`<ul>${items}</ul>`);
    listItems = [];
  };

  const flushAll = (): void => {
    flushParagraph();
    flushList();
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (line === '') {
      flushAll();
      continue;
    }

    const heading = line.match(/^(#{1,3})\s+(.*)$/);
    if (heading) {
      flushAll();
      const level = heading[1].length;
      out.push(`<h${level}>${renderInline(heading[2])}</h${level}>`);
      continue;
    }

    const listItem = line.match(/^[-*]\s+(.*)$/);
    if (listItem) {
      flushParagraph();
      listItems.push(listItem[1]);
      continue;
    }

    flushList();
    paragraph.push(line);
  }

  flushAll();
  return out.join('\n');
}
