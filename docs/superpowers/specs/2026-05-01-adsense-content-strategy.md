# AdSense Content Strategy: Hauptseite + Kategorie-Pages

**Date:** 2026-05-01  
**Status:** Design Approved  
**Goal:** Add 1500+ words of high-quality, category-specific content to pass AdSense review

---

## Problem

AdSense rejected the site for "minderwertige Inhalte" (low-quality content). Current state:
- Hauptseite: Too thin, only brief intro + featured calculators
- Kategorie-Pages: Only hero + calculator grid, zero context content
- Rechner-Pages: Only calculator, no guides or explanations

Google wants: Original, valuable, helpful content that answers user questions.

---

## Solution: Content Module Architecture

### File Structure

```
src/
├── content/
│   └── categories/
│       ├── geld.md
│       ├── wohnen.md
│       ├── energie.md
│       ├── auto.md
│       ├── familie.md
│       ├── gesundheit.md
│       └── versicherungen.md
├── utils/
│   └── loadCategoryContent.ts
└── pages/
    ├── index.astro (extended)
    ├── geld/index.astro (uses geld.md)
    ├── wohnen/index.astro (uses wohnen.md)
    └── ... (other categories)
```

### Markdown Content Format

Each `{category}.md` file follows this structure:

```markdown
---
title: "Category Name"
slug: "category-slug"
---

# Main Heading (H1)

## Section: Das Wichtigste zuerst (300 words)
Why this category matters, what changed in 2026, overview.

## Section: Häufige Fehler (300-400 words total)
3-4 common mistakes with practical examples.

## Section: Was sich 2026 ändert (400 words)
Specific changes for 2026: tax rates, fees, laws, etc.

## Section: Best Practices (400-500 words)
5-6 actionable tips with real-world examples.

## Section: FAQ (300 words)
5-6 category-specific questions.
```

**Total per category:** ~1500-1700 words

---

## Category-Specific Content Focus

| Category | Key Topics |
|----------|-----------|
| **Geld** | Brutto-Netto, Steuern, Sozialversicherung, Einkommen-Strategien |
| **Wohnen** | Kaufentscheidung, Nebenkosten, Finanzierung, Förderung |
| **Energie** | Sparpotenziale, Tarifvergleich, 2026-Strompreise, Heizen |
| **Auto** | Leasing vs. Kauf, TCO, E-Auto, Versicherung |
| **Familie** | Kindergeld, Elterngeld, Unterhalt, Betreuung |
| **Gesundheit** | Versicherung, Selbstbeteiligung, Privat vs. Gesetzlich |
| **Versicherungen** | Welche braucht man, Fallstricke, Kostenfallen |

---

## Hauptseite (index.astro) Extension

Current structure:
1. Hero (keep)
2. Featured Calculators (keep)
3. [NEW] Comprehensive intro content (~1200 words)
   - Why correct calculations matter
   - What changed in 2026
   - General tips for financial decisions
4. [NEW] 7 Category Overviews (~200 words each + link)
   - Brief description + link to category page
5. FAQ Section (keep)
6. Persona Section (keep)

---

## Voice & Tone

**Freundlich & praktisch** (friendly & practical):
- Use "du" (second person)
- Practical examples with real numbers
- Relatable tone ("Das ist die schlechte Nachricht...")
- Help-focused, not academic

Example:
> "Du verdienst 3.500€ brutto? Dann sind es nach Steuern und Sozialversicherung nur noch ~2.450€. Warum? Das erklären wir hier."

---

## Implementation Phases

### Phase 1: Create Content Modules
1. Write 7 markdown files (geld.md, wohnen.md, etc.)
2. Each ~1500-1700 words
3. Follow template structure
4. Include 2026-specific data

### Phase 2: Build Loader & Update Pages
1. Create `loadCategoryContent.ts` utility
2. Update each category index.astro to render markdown
3. Extend index.astro with new intro content

### Phase 3: Deploy & Verify
1. Deploy to production
2. Test all pages render correctly
3. Verify text is visible (not hidden/broken)
4. Check Google Search Console

---

## Success Criteria

- ✅ All 7 category pages have 1500+ words of original content
- ✅ Main page has comprehensive intro (~1200 words)
- ✅ All markdown renders correctly (no broken formatting)
- ✅ Content is visible in Google Search Console (indexable)
- ✅ Tone is consistent (friendly, practical, Du-Ansprache)
- ✅ 2026-specific updates included where relevant
- ✅ No placeholder text or TODOs left

---

## Notes

- Voice: Friendly, practical, help-focused
- Length: Minimum 1500 words per category page
- 2026-focus: Include what changed this year
- Examples: Real numbers, practical scenarios
- Tone: "Du" (second person), not formal
