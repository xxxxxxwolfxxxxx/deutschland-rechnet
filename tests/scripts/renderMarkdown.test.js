import { describe, it, expect } from 'vitest';
import { renderMarkdown } from '../../src/utils/renderMarkdown.ts';

describe('renderMarkdown', () => {
  it('macht aus ## eine echte Überschrift', () => {
    expect(renderMarkdown('## Häufige Fehler')).toBe('<h2>Häufige Fehler</h2>');
  });

  it('unterstützt drei Überschriftenebenen', () => {
    expect(renderMarkdown('# Eins')).toBe('<h1>Eins</h1>');
    expect(renderMarkdown('### Drei')).toBe('<h3>Drei</h3>');
  });

  it('rendert **fett** als strong', () => {
    expect(renderMarkdown('Das ist **wichtig**.')).toBe('<p>Das ist <strong>wichtig</strong>.</p>');
  });

  it('fasst aufeinanderfolgende Zeilen zu einem Absatz zusammen', () => {
    expect(renderMarkdown('Erste Zeile\nzweite Zeile')).toBe('<p>Erste Zeile zweite Zeile</p>');
  });

  it('trennt Absätze an Leerzeilen', () => {
    const html = renderMarkdown('Absatz eins\n\nAbsatz zwei');
    expect(html).toBe('<p>Absatz eins</p>\n<p>Absatz zwei</p>');
  });

  it('rendert Aufzählungen als Liste', () => {
    expect(renderMarkdown('- eins\n- zwei')).toBe('<ul><li>eins</li><li>zwei</li></ul>');
  });

  it('rendert Links und öffnet externe in einem neuen Tab', () => {
    const html = renderMarkdown('Siehe [Karte](https://sportbootnavi.de) dort.');
    expect(html).toContain('<a href="https://sportbootnavi.de" target="_blank" rel="noopener">Karte</a>');
  });

  it('interne Links bekommen kein target', () => {
    const html = renderMarkdown('[Boot](/boot/)');
    expect(html).toBe('<p><a href="/boot/">Boot</a></p>');
  });

  it('entschärft eingebettetes HTML', () => {
    const html = renderMarkdown('<script>alert(1)</script>');
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
  });

  it('lässt javascript:-Links nicht durch', () => {
    const html = renderMarkdown('[böse](javascript:alert(1))');
    expect(html).toContain('href="#"');
    expect(html).not.toContain('javascript:');
  });

  it('gibt bei leerem Text nichts aus', () => {
    expect(renderMarkdown('')).toBe('');
  });
});
