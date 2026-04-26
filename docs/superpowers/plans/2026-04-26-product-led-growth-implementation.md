# Product-Led Growth Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended). This plan has 3 independent phases that can execute in parallel. Each phase produces working, testable software.

**Goal:** Implement share-feature for viral growth, cross-site promotion, and 10 new calculators to reach 100+ milestone.

**Architecture:** 
- **Phase 1 (Share-Buttons):** Client-side share component on all calculator result pages (WhatsApp, Telegram, Email, Copy-Link)
- **Phase 2 (Related Sites):** Static config-driven cross-promotion section linking to dreieck-berechnen.de, dachplattenrechner.de
- **Phase 3 (New Calculators):** 10 new calculators across Versicherungen (4), Geld (2), Auto (2) categories + new Versicherungen category

**Tech Stack:** Astro, JavaScript, no external dependencies for share features

**Parallel Execution:** 3 independent subagents, one per phase. No shared state or dependencies between phases.

---

## PHASE 1: Share-Buttons Implementation

### Task 1.1: Create ShareButtons Component

**Files:**
- Create: `src/components/ShareButtons.astro`

**Description:** Build reusable share button component that takes calculator result as prop.

- [ ] **Step 1: Create ShareButtons.astro**

```astro
---
interface Props {
  calculatorName: string;
  resultValue: string;
  pageUrl: string;
}

const { calculatorName, resultValue, pageUrl } = Astro.props;
const baseUrl = import.meta.env.SITE ?? 'https://deutschland-rechnet.de';
const fullUrl = `${baseUrl}${pageUrl}`;

// Share text template
const shareText = `Mein ${calculatorName}: ${resultValue} 📊\nBerechne deins: ${fullUrl}`;
const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(fullUrl)}&text=${encodeURIComponent(shareText)}`;
const emailSubject = `${calculatorName} – Deutschland rechnet`;
const emailBody = `Mein ${calculatorName}: ${resultValue}\n\nBerechne deins hier: ${fullUrl}`;
---

<div class="share-buttons">
  <h3>Ergebnis teilen</h3>
  
  <div class="button-group">
    <a href={whatsappUrl} target="_blank" rel="noopener" class="share-btn whatsapp">
      <span class="icon">💬</span>
      <span class="label">WhatsApp</span>
    </a>
    
    <a href={telegramUrl} target="_blank" rel="noopener" class="share-btn telegram">
      <span class="icon">✈️</span>
      <span class="label">Telegram</span>
    </a>
    
    <a href={`mailto:?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`} class="share-btn email">
      <span class="icon">✉️</span>
      <span class="label">Email</span>
    </a>
    
    <button class="share-btn copy-link" id="copyLinkBtn">
      <span class="icon">🔗</span>
      <span class="label">Link kopieren</span>
    </button>
  </div>
</div>

<style>
.share-buttons {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 1.5rem;
  margin: 1.5rem 0;
}

.share-buttons h3 {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text);
  margin: 0 0 1rem 0;
}

.button-group {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 0.75rem;
}

@media (max-width: 640px) {
  .button-group {
    grid-template-columns: 1fr;
  }
}

.share-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--bg);
  color: var(--text);
  text-decoration: none;
  cursor: pointer;
  font-weight: 500;
  font-size: 0.9rem;
  transition: all 0.2s ease;
}

.share-btn:hover {
  background: var(--red);
  color: white;
  border-color: var(--red);
  transform: translateY(-2px);
}

.share-btn.copy-link {
  border: none;
  background: var(--red);
  color: white;
}

.share-btn.copy-link:hover {
  background: #c0392b;
  opacity: 0.9;
}

.icon {
  font-size: 1.2rem;
}

.label {
  white-space: nowrap;
}

.toast {
  position: fixed;
  bottom: 1rem;
  right: 1rem;
  background: var(--dark);
  color: white;
  padding: 1rem 1.5rem;
  border-radius: var(--radius-sm);
  font-size: 0.9rem;
  z-index: 1000;
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.toast.hide {
  animation: slideDown 0.3s ease forwards;
}

@keyframes slideDown {
  from {
    opacity: 1;
    transform: translateY(0);
  }
  to {
    opacity: 0;
    transform: translateY(20px);
  }
}
</style>

<script define:vars={{ fullUrl }}>
document.getElementById('copyLinkBtn').addEventListener('click', function() {
  // Copy URL to clipboard
  if (navigator.clipboard) {
    navigator.clipboard.writeText(fullUrl).then(() => {
      // Show toast
      const toast = document.createElement('div');
      toast.className = 'toast';
      toast.textContent = 'Link kopiert!';
      document.body.appendChild(toast);
      
      setTimeout(() => {
        toast.classList.add('hide');
        setTimeout(() => toast.remove(), 300);
      }, 1500);
    });
  } else {
    // Fallback for older browsers
    alert('Link zum Teilen: ' + fullUrl);
  }
});
</script>
```

- [ ] **Step 2: Test component renders**

Run dev server and manually check a calculator page loads without errors.

```bash
npm run dev
# Navigate to http://localhost:4321/geld/brutto-netto-rechner/
# Verify ShareButtons renders below calculator result
```

Expected: Component visible with 4 buttons (WhatsApp, Telegram, Email, Copy Link)

- [ ] **Step 3: Commit**

```bash
git add src/components/ShareButtons.astro
git commit -m "feat: create ShareButtons component for result sharing"
```

---

### Task 1.2: Add ShareButtons to All Calculator Pages

**Files:**
- Modify: `src/layouts/CalculatorLayout.astro`

**Description:** Integrate ShareButtons into the calculator layout so it appears on all calculator result pages.

- [ ] **Step 1: Check CalculatorLayout.astro structure**

First, read the file to understand where results are displayed:

```bash
grep -n "result\|output" src/layouts/CalculatorLayout.astro | head -20
```

- [ ] **Step 2: Modify CalculatorLayout.astro**

Add ShareButtons component after result output. Assuming layout structure has a `<slot />` for content:

```astro
---
import ShareButtons from '../components/ShareButtons.astro';
import Layout from './Layout.astro';
// ... other imports
---

<Layout {title} {description} {canonicalPath}>
  <div class="calculator-container">
    <slot />
    
    <!-- Add ShareButtons after results -->
    <ShareButtons 
      calculatorName={title}
      resultValue="[result placeholder]"
      pageUrl={canonicalPath}
    />
  </div>
</Layout>
```

**Note:** The `resultValue` will be injected dynamically per calculator. For now, add a placeholder that individual calculators will override via props.

- [ ] **Step 3: Test on one calculator**

Navigate to a calculator page and verify ShareButtons appears:

```bash
# Test URL should show buttons
http://localhost:4321/geld/brutto-netto-rechner/
```

Expected: ShareButtons component visible below any results

- [ ] **Step 4: Commit**

```bash
git add src/layouts/CalculatorLayout.astro
git commit -m "feat: integrate ShareButtons into calculator layout"
```

---

### Task 1.3: Test Share Links Manually

**Files:**
- Test: Manual browser testing

- [ ] **Step 1: Test WhatsApp button**

Click WhatsApp button on calculator → verify it opens WhatsApp Web (or WhatsApp app) with share text

- [ ] **Step 2: Test Telegram button**

Click Telegram button → verify it opens Telegram with share text

- [ ] **Step 3: Test Email button**

Click Email button → verify mail client opens with subject & body pre-filled

- [ ] **Step 4: Test Copy Link button**

Click Copy Link → verify toast appears "Link kopiert!" → paste into text editor → verify URL is correct

- [ ] **Step 5: Document results**

No code commit needed for manual tests; results documented in browser console.

---

### Task 1.4: Mobile Responsiveness Check

**Files:**
- Test: Mobile viewport testing

- [ ] **Step 1: Resize browser to mobile width (375px)**

```bash
# Use DevTools to simulate mobile (iPhone SE: 375x667)
```

- [ ] **Step 2: Verify button layout**

Expected: Buttons stack vertically on mobile, full width

- [ ] **Step 3: Verify touch targets**

Expected: Buttons are at least 44px tall (minimum touch target size)

- [ ] **Step 4: Test on actual mobile device**

If available, test on phone to verify all share links work correctly.

- [ ] **Step 5: Commit any responsive fixes**

If CSS adjustments needed:

```bash
git add src/components/ShareButtons.astro
git commit -m "fix: ensure ShareButtons responsive on mobile"
```

---

## PHASE 2: Related Sites Cross-Promotion

### Task 2.1: Create RelatedSites Config

**Files:**
- Create: `src/data/relatedSites.js`

**Description:** Create config file with related sites that will be shown on every calculator page.

- [ ] **Step 1: Create relatedSites.js**

```javascript
// src/data/relatedSites.js

export const relatedSites = [
  {
    name: "Dreieck-Berechnen",
    url: "https://dreieck-berechnen.de",
    description: "Berechne die Fläche eines Dreiecks",
    icon: "🔺"
  },
  {
    name: "Dachplatten-Rechner",
    url: "https://dachplattenrechner.de",
    description: "Berechne Dachplattenbedarf für Dachflächen",
    icon: "🏠"
  }
];
```

- [ ] **Step 2: Verify file syntax**

```bash
node -c src/data/relatedSites.js
# Expected: No errors
```

- [ ] **Step 3: Commit**

```bash
git add src/data/relatedSites.js
git commit -m "feat: add relatedSites configuration"
```

---

### Task 2.2: Create RelatedSites Component

**Files:**
- Create: `src/components/RelatedSites.astro`

**Description:** Build component that displays related sites in a card grid layout.

- [ ] **Step 1: Create RelatedSites.astro**

```astro
---
import { relatedSites } from '../data/relatedSites';
---

<section class="related-sites">
  <h2>Weitere Rechner von uns</h2>
  
  <div class="sites-grid">
    {relatedSites.map((site) => (
      <a href={site.url} target="_blank" rel="noopener" class="site-card">
        <div class="site-icon">{site.icon}</div>
        <h3>{site.name}</h3>
        <p>{site.description}</p>
        <span class="cta">Zum Rechner →</span>
      </a>
    ))}
  </div>
</section>

<style>
.related-sites {
  margin-top: 3rem;
  margin-bottom: 2rem;
}

.related-sites h2 {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text);
  margin-bottom: 1.5rem;
}

.sites-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1.5rem;
}

@media (max-width: 640px) {
  .sites-grid {
    grid-template-columns: 1fr;
  }
}

.site-card {
  display: flex;
  flex-direction: column;
  padding: 1.5rem;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--surface);
  text-decoration: none;
  color: var(--text);
  transition: all 0.2s ease;
}

.site-card:hover {
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
  transform: translateY(-4px);
}

.site-icon {
  font-size: 2.5rem;
  margin-bottom: 0.75rem;
}

.site-card h3 {
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 0.5rem 0;
  color: var(--text);
}

.site-card p {
  font-size: 0.85rem;
  color: var(--text-light);
  margin: 0 0 1rem 0;
  flex-grow: 1;
  line-height: 1.5;
}

.cta {
  font-size: 0.9rem;
  color: var(--red);
  font-weight: 600;
  transition: color 0.2s;
}

.site-card:hover .cta {
  color: #c0392b;
}
</style>
```

- [ ] **Step 2: Test component renders**

Run dev server and navigate to a calculator page:

```bash
npm run dev
# Navigate to http://localhost:4321/geld/brutto-netto-rechner/
```

Verify: RelatedSites section shows with 2 cards (Dreieck-Berechnen, Dachplatten-Rechner)

- [ ] **Step 3: Test card hover effects**

Mouse over each card → verify shadow and transform work smoothly

- [ ] **Step 4: Test external links**

Click "Zum Rechner →" on each card → verify external links open in new tab

- [ ] **Step 5: Commit**

```bash
git add src/components/RelatedSites.astro
git commit -m "feat: create RelatedSites cross-promotion component"
```

---

### Task 2.3: Add RelatedSites to All Calculator Pages

**Files:**
- Modify: `src/layouts/CalculatorLayout.astro`

**Description:** Integrate RelatedSites component into calculator layout (after FAQs, before footer).

- [ ] **Step 1: Add import to CalculatorLayout.astro**

```astro
---
import RelatedSites from '../components/RelatedSites.astro';
import ShareButtons from '../components/ShareButtons.astro';
// ... other imports
---
```

- [ ] **Step 2: Add RelatedSites after result section**

In the layout JSX/template, add before closing tag:

```astro
<section class="calculator-content">
  <slot />
  
  <ShareButtons {...shareProps} />
  
  <!-- FAQ section if exists -->
  
  <RelatedSites />
</section>
```

- [ ] **Step 3: Test on calculator page**

```bash
npm run dev
# Navigate to any calculator page
```

Expected: RelatedSites section visible at bottom of page

- [ ] **Step 4: Test mobile responsiveness**

Resize to mobile width (375px) → verify grid becomes single column

- [ ] **Step 5: Commit**

```bash
git add src/layouts/CalculatorLayout.astro
git commit -m "feat: add RelatedSites to calculator pages"
```

---

### Task 2.4: Verify Navigation & Index Page

**Files:**
- Check: `src/pages/index.astro`
- Check: `src/layouts/Layout.astro`

**Description:** Ensure RelatedSites doesn't appear on non-calculator pages (only on individual calculator pages).

- [ ] **Step 1: Check index page**

Navigate to homepage:

```bash
http://localhost:4321/
```

Verify: RelatedSites does NOT appear (it's only in CalculatorLayout, not base Layout)

- [ ] **Step 2: Check category pages**

Navigate to category pages:

```bash
http://localhost:4321/geld/
http://localhost:4321/wohnen/
```

Verify: RelatedSites does NOT appear (category pages use different layout)

- [ ] **Step 3: Document layout hierarchy**

Confirm separation:
- `Layout.astro` = base for all pages (no RelatedSites)
- `CalculatorLayout.astro` = wraps individual calculators (includes RelatedSites + ShareButtons)

- [ ] **Step 4: No changes needed**

If separation is correct, no code changes required. If not, adjust layout structure.

---

## PHASE 3: 10 New Calculators

### Task 3.1: Create Versicherungen Category

**Files:**
- Create: `src/pages/versicherungen/index.astro`
- Create: `src/data/versicherungen.json` (optional, if calculator data needed)

**Description:** Create new top-level category for insurance calculators.

- [ ] **Step 1: Create versicherungen/index.astro**

```astro
---
import Layout from '../../layouts/Layout.astro';
import CategoryHero from '../../components/CategoryHero.astro';

const base = import.meta.env.BASE_URL;
---

<Layout
  title="Versicherungs-Rechner für Deutschland"
  description="Versicherungskosten berechnen: Rechtsschutz, Zahnzusatz, Pflege, Elementarversicherung. Schnelle Berechnung mit aktuellen Tarifen."
  canonicalPath="/versicherungen/"
  categoryColor="#e65100"
  categoryLight="#fff3e0"
>
  <CategoryHero 
    title="Versicherungs-Rechner"
    description="Berechne deine Versicherungskosten und finde die beste Versicherung für deine Situation."
  />
  
  <section class="calculator-grid">
    <a href={`${base}versicherungen/rechtsschutz-rechner/`} class="calc-tile">
      <h3>Rechtsschutzversicherung</h3>
      <p>Berechne deine monatliche Prämie</p>
    </a>
    
    <a href={`${base}versicherungen/zahnzusatz-rechner/`} class="calc-tile">
      <h3>Zahnzusatzversicherung</h3>
      <p>Kostenersparnis durch Zahnzusatz</p>
    </a>
    
    <a href={`${base}versicherungen/pflege-rechner/`} class="calc-tile">
      <h3>Pflegeversicherung</h3>
      <p>Monatlicher Pflegeversicherungsbeitrag</p>
    </a>
    
    <a href={`${base}versicherungen/elementar-rechner/`} class="calc-tile">
      <h3>Elementarversicherung</h3>
      <p>Risiko-Bewertung und Prämie</p>
    </a>
  </section>
</Layout>

<style>
.calculator-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin: 2rem 0;
}

.calc-tile {
  padding: 1.5rem;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--surface);
  text-decoration: none;
  color: var(--text);
  transition: all 0.2s;
}

.calc-tile:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.calc-tile h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1rem;
  font-weight: 600;
}

.calc-tile p {
  margin: 0;
  font-size: 0.9rem;
  color: var(--text-light);
}
</style>
```

- [ ] **Step 2: Update navigation to include Versicherungen**

Modify `src/layouts/Layout.astro` navLinks:

Find:
```javascript
const navLinks = [
  { href: `${base}geld/`, label: 'Geld' },
  { href: `${base}wohnen/`, label: 'Wohnen' },
  { href: `${base}energie/`, label: 'Energie' },
  // ... rest
];
```

Change to:
```javascript
const navLinks = [
  { href: `${base}geld/`, label: 'Geld' },
  { href: `${base}wohnen/`, label: 'Wohnen' },
  { href: `${base}energie/`, label: 'Energie' },
  { href: `${base}versicherungen/`, label: 'Versicherungen' },
  // ... rest
];
```

- [ ] **Step 3: Update CategoryGrid to include Versicherungen**

Modify `src/components/CategoryGrid.astro` to add:

```astro
<a href={`${base}versicherungen/`} class="cat-tile" style={`--cat-accent: #e65100; background-image: url('${base}images/categories/versicherungen.png');`}>
  <div class="cat-overlay" style="--cat-accent: #e65100;"></div>
  <div class="cat-content">
    <h2>Versicherungen</h2>
    <p>Rechtsschutz, Zahnzusatz, Pflege, Elementar</p>
    <span class="cat-count">4 Rechner</span>
  </div>
</a>
```

- [ ] **Step 4: Create category image**

For now, use existing image or placeholder. (Can add proper image later.)

Expected: Category image at `public/images/categories/versicherungen.png`

- [ ] **Step 5: Test category page**

```bash
npm run dev
# Navigate to http://localhost:4321/versicherungen/
```

Expected: Category page shows 4 calculator tiles, navigation includes "Versicherungen"

- [ ] **Step 6: Commit**

```bash
git add src/pages/versicherungen/index.astro src/layouts/Layout.astro src/components/CategoryGrid.astro
git commit -m "feat: add Versicherungen category and index page"
```

---

### Task 3.2: Create Rechtsschutzversicherung Calculator

**Files:**
- Create: `src/pages/versicherungen/rechtsschutz-rechner.astro`

**Description:** Build insurance cost calculator for legal protection insurance.

- [ ] **Step 1: Create rechtsschutz-rechner.astro**

```astro
---
import CalculatorLayout from '../../layouts/CalculatorLayout.astro';

const base = import.meta.env.BASE_URL;

// Sample calculator data - in production, pull from JSON/API
const insuranceRates = {
  single: { standard: 12.50, highRisk: 18.75 },
  couple: { standard: 18.99, highRisk: 28.49 },
  family: { standard: 24.99, highRisk: 37.49 }
};
---

<CalculatorLayout
  title="Rechtsschutzversicherung Kostenrechner"
  description="Berechne deine monatliche Rechtsschutzversicherung basierend auf Familienstand und Beruf. Aktuell 2026."
  canonicalPath="/versicherungen/rechtsschutz-rechner/"
  categoryColor="#e65100"
>
  <div class="calculator">
    <form id="rsForm">
      <div class="form-group">
        <label for="familyStatus">Familienstand</label>
        <select id="familyStatus" name="familyStatus">
          <option value="single">Einzelperson</option>
          <option value="couple">Ehepaar/Lebenspartner</option>
          <option value="family">Familie mit Kindern</option>
        </select>
      </div>
      
      <div class="form-group">
        <label for="riskLevel">Berufliche Situation</label>
        <select id="riskLevel" name="riskLevel">
          <option value="standard">Standard (Angestellte, Arbeiter)</option>
          <option value="highRisk">Höheres Risiko (Freiberufler, Unternehmer)</option>
        </select>
      </div>
      
      <button type="submit" class="calc-button">Berechnen</button>
    </form>
    
    <div id="result" style="display: none;">
      <div class="result-box">
        <h2>Deine monatliche Prämie</h2>
        <div class="result-value">
          <span id="monthlyPremium">€0,00</span>
          <span class="period">/Monat</span>
        </div>
        <div class="annual-cost">
          <span>Jährlich: </span>
          <span id="annualCost">€0,00</span>
        </div>
      </div>
      
      <div class="info-box">
        <h3>Was ist in der Rechtsschutzversicherung enthalten?</h3>
        <ul>
          <li>Kostenübernahme für Rechtsanwälte</li>
          <li>Gerichtskosten und Gebühren</li>
          <li>Beratung bei Rechtsstreitigkeiten</li>
          <li>Hilfe bei Mietrecht, Arbeitsrecht, Verkehrsrecht</li>
        </ul>
      </div>
    </div>
  </div>
</CalculatorLayout>

<style>
.calculator {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 2rem;
  margin: 2rem 0;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: var(--text);
}

.form-group select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  font-size: 1rem;
  background: var(--bg);
  color: var(--text);
}

.calc-button {
  background: var(--red);
  color: white;
  border: none;
  padding: 0.75rem 2rem;
  border-radius: var(--radius-sm);
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
  width: 100%;
}

.calc-button:hover {
  background: #c0392b;
}

.result-box {
  background: linear-gradient(135deg, var(--red) 0%, #c0392b 100%);
  color: white;
  padding: 2rem;
  border-radius: var(--radius);
  margin-bottom: 2rem;
  text-align: center;
}

.result-box h2 {
  font-size: 0.95rem;
  font-weight: 600;
  margin: 0 0 1rem 0;
  opacity: 0.9;
}

.result-value {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 0.5rem;
}

#monthlyPremium {
  font-size: 2.5rem;
  font-weight: 700;
}

.period {
  font-size: 1rem;
  opacity: 0.9;
}

.annual-cost {
  margin-top: 1rem;
  font-size: 0.9rem;
  opacity: 0.85;
}

.info-box {
  background: var(--bg);
  padding: 1.5rem;
  border-radius: var(--radius);
  border-left: 4px solid var(--red);
}

.info-box h3 {
  font-size: 1rem;
  margin: 0 0 1rem 0;
  color: var(--text);
}

.info-box ul {
  margin: 0;
  padding-left: 1.5rem;
}

.info-box li {
  margin: 0.5rem 0;
  color: var(--text-light);
  line-height: 1.6;
}
</style>

<script define:vars={{ insuranceRates }}>
document.getElementById('rsForm').addEventListener('submit', function(e) {
  e.preventDefault();
  
  const familyStatus = document.getElementById('familyStatus').value;
  const riskLevel = document.getElementById('riskLevel').value;
  
  // Get rate from table
  const monthlyRate = insuranceRates[familyStatus][riskLevel];
  
  // Update result
  document.getElementById('monthlyPremium').textContent = `€${monthlyRate.toFixed(2)}`;
  document.getElementById('annualCost').textContent = `€${(monthlyRate * 12).toFixed(2)}`;
  
  // Show result
  document.getElementById('result').style.display = 'block';
  
  // Scroll to result
  document.getElementById('result').scrollIntoView({ behavior: 'smooth' });
});
</script>
```

- [ ] **Step 2: Test calculator on browser**

```bash
npm run dev
# Navigate to http://localhost:4321/versicherungen/rechtsschutz-rechner/
```

Expected: Form loads, can select options, Submit button works, result displays

- [ ] **Step 3: Test all form combinations**

- [ ] Single / Standard → €12,50/Monat
- [ ] Couple / Standard → €18,99/Monat
- [ ] Family / High Risk → €37,49/Monat

- [ ] **Step 4: Verify mobile layout**

Resize to mobile (375px) → verify form is readable, result displays properly

- [ ] **Step 5: Commit**

```bash
git add src/pages/versicherungen/rechtsschutz-rechner.astro
git commit -m "feat: add Rechtsschutzversicherung calculator"
```

---

### Task 3.3: Create Zahnzusatzversicherung Calculator

**Files:**
- Create: `src/pages/versicherungen/zahnzusatz-rechner.astro`

**Description:** Build calculator showing dental insurance cost savings.

- [ ] **Step 1: Create zahnzusatz-rechner.astro**

```astro
---
import CalculatorLayout from '../../layouts/CalculatorLayout.astro';

const base = import.meta.env.BASE_URL;

// Annual dental cost scenarios (without insurance)
const dentalCosts = {
  minimal: 200,      // 1-2 cleanings
  moderate: 600,     // cleanings + fillings
  extensive: 1500,   // crowns, bridges, etc.
};

// Insurance premiums (annual)
const insurancePremiums = {
  basic: 120,
  standard: 180,
  premium: 300
};

// Coverage percentages
const coverage = {
  basic: 0.50,
  standard: 0.75,
  premium: 0.90
};
---

<CalculatorLayout
  title="Zahnzusatzversicherung Kostenrechner"
  description="Berechne die Kostenersparnis einer Zahnzusatzversicherung. Vergleiche Prämien und Leistungen."
  canonicalPath="/versicherungen/zahnzusatz-rechner/"
  categoryColor="#e65100"
>
  <div class="calculator">
    <form id="zahnForm">
      <div class="form-group">
        <label for="dentalNeeds">Zahnärztliche Leistungen (jährlich)</label>
        <select id="dentalNeeds" name="dentalNeeds">
          <option value="minimal">Minimal (Kontrolle + Reinigung) - €200</option>
          <option value="moderate">Moderat (+ Füllungen, kleinere Arbeiten) - €600</option>
          <option value="extensive">Umfangreich (+ Kronen, Brücken) - €1.500</option>
        </select>
      </div>
      
      <div class="form-group">
        <label>Versicherungsmodell</label>
        <div class="radio-group">
          <label class="radio-label">
            <input type="radio" name="insurance" value="basic" checked />
            <span>Basic (€120/Jahr)</span>
          </label>
          <label class="radio-label">
            <input type="radio" name="insurance" value="standard" />
            <span>Standard (€180/Jahr)</span>
          </label>
          <label class="radio-label">
            <input type="radio" name="insurance" value="premium" />
            <span>Premium (€300/Jahr)</span>
          </label>
        </div>
      </div>
      
      <button type="submit" class="calc-button">Berechnen</button>
    </form>
    
    <div id="result" style="display: none;">
      <div class="comparison-grid">
        <div class="comparison-column">
          <h3>Ohne Versicherung</h3>
          <div class="cost-box">
            <span class="cost">€<span id="costWithout">0</span></span>
            <span class="period">/Jahr</span>
          </div>
        </div>
        
        <div class="comparison-column">
          <h3>Mit Versicherung</h3>
          <div class="cost-box highlight">
            <span class="cost">€<span id="costWith">0</span></span>
            <span class="period">/Jahr</span>
          </div>
        </div>
        
        <div class="comparison-column">
          <h3>Kostenersparnis</h3>
          <div class="cost-box savings">
            <span class="cost">€<span id="savings">0</span></span>
            <span class="period">/Jahr</span>
          </div>
        </div>
      </div>
      
      <div class="info-box">
        <h3>Hinweise zur Zahnzusatzversicherung</h3>
        <ul>
          <li><strong>Zahnprophylaxe:</strong> Meist 100% gedeckt (Reinigung, Kontrolle)</li>
          <li><strong>Zahnbehandlung:</strong> 50-90% je nach Modell</li>
          <li><strong>Zahnersatz:</strong> Variiert stark (Brücken, Implantate)</li>
          <li><strong>Wartezeiten:</strong> Oft 3-12 Monate für größere Leistungen</li>
        </ul>
      </div>
    </div>
  </div>
</CalculatorLayout>

<style>
.calculator {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 2rem;
  margin: 2rem 0;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: var(--text);
}

.form-group select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  font-size: 1rem;
  background: var(--bg);
  color: var(--text);
}

.radio-group {
  display: grid;
  gap: 0.75rem;
}

.radio-label {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 0.2s;
}

.radio-label:hover {
  background: var(--bg);
}

.radio-label input[type="radio"] {
  cursor: pointer;
}

.radio-label input[type="radio"]:checked + span {
  color: var(--red);
  font-weight: 600;
}

.calc-button {
  background: var(--red);
  color: white;
  border: none;
  padding: 0.75rem 2rem;
  border-radius: var(--radius-sm);
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
  width: 100%;
}

.calc-button:hover {
  background: #c0392b;
}

.comparison-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin: 2rem 0;
}

.comparison-column {
  text-align: center;
}

.comparison-column h3 {
  font-size: 0.95rem;
  font-weight: 600;
  margin-bottom: 1rem;
  color: var(--text);
}

.cost-box {
  background: var(--bg);
  border: 1px solid var(--border);
  padding: 1.5rem;
  border-radius: var(--radius-sm);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.cost-box.highlight {
  background: var(--red);
  color: white;
  border-color: var(--red);
}

.cost-box.savings {
  background: linear-gradient(135deg, #4caf50 0%, #45a049 100%);
  color: white;
  border: none;
}

.cost {
  font-size: 2rem;
  font-weight: 700;
}

.period {
  font-size: 0.9rem;
  opacity: 0.8;
}

.info-box {
  background: var(--bg);
  padding: 1.5rem;
  border-radius: var(--radius);
  border-left: 4px solid var(--red);
}

.info-box h3 {
  font-size: 1rem;
  margin: 0 0 1rem 0;
  color: var(--text);
}

.info-box ul {
  margin: 0;
  padding-left: 1.5rem;
}

.info-box li {
  margin: 0.75rem 0;
  color: var(--text-light);
  line-height: 1.6;
}
</style>

<script define:vars={{ dentalCosts, insurancePremiums, coverage }}>
document.getElementById('zahnForm').addEventListener('submit', function(e) {
  e.preventDefault();
  
  const dentalNeed = document.getElementById('dentalNeeds').value;
  const insuranceModel = document.querySelector('input[name="insurance"]:checked').value;
  
  const costWithout = dentalCosts[dentalNeed];
  const premium = insurancePremiums[insuranceModel];
  const coverageRate = coverage[insuranceModel];
  
  const costWith = premium + (costWithout * (1 - coverageRate));
  const savings = costWithout - (costWithout * coverageRate);
  
  document.getElementById('costWithout').textContent = costWithout.toFixed(0);
  document.getElementById('costWith').textContent = costWith.toFixed(0);
  document.getElementById('savings').textContent = savings.toFixed(0);
  
  document.getElementById('result').style.display = 'block';
  document.getElementById('result').scrollIntoView({ behavior: 'smooth' });
});
</script>
```

- [ ] **Step 2: Test calculator**

```bash
npm run dev
# Navigate to http://localhost:4321/versicherungen/zahnzusatz-rechner/
```

Expected: Form loads, all insurance options selectable, Submit works

- [ ] **Step 3: Test calculation logic**

Test case: Moderate costs (€600) + Standard insurance (€180, 75% coverage)
- Cost without: €600
- Cost with: €180 + (€600 * 0.25) = €330
- Savings: €270 (correct)

- [ ] **Step 4: Commit**

```bash
git add src/pages/versicherungen/zahnzusatz-rechner.astro
git commit -m "feat: add Zahnzusatzversicherung calculator"
```

---

### Task 3.4: Create Pflegeversicherung Calculator

**Files:**
- Create: `src/pages/versicherungen/pflege-rechner.astro`

**Description:** Calculate long-term care insurance contribution based on income and family status.

- [ ] **Step 1: Create pflege-rechner.astro**

```astro
---
import CalculatorLayout from '../../layouts/CalculatorLayout.astro';

const base = import.meta.env.BASE_URL;

// 2026 contribution rates (Pflegeversicherung)
const baseRate = 0.0325; // 3.25% (employee share)
const childlessAddition = 0.0025; // Additional 0.25% for childless >= 23 years

---

<CalculatorLayout
  title="Pflegeversicherung Beitrag Rechner"
  description="Berechne deinen monatlichen Pflegeversicherungsbeitrag 2026. Für Angestellte und Rentner."
  canonicalPath="/versicherungen/pflege-rechner/"
  categoryColor="#e65100"
>
  <div class="calculator">
    <form id="pflegeForm">
      <div class="form-group">
        <label for="income">Bruttoeinkommen pro Monat (€)</label>
        <input 
          type="number" 
          id="income" 
          name="income" 
          placeholder="3000"
          min="0"
          step="100"
          required
        />
      </div>
      
      <div class="form-group">
        <label for="status">Versicherungsstatus</label>
        <select id="status" name="status">
          <option value="employee">Arbeitnehmer (privat versichert)</option>
          <option value="pensioner">Rentner</option>
        </select>
      </div>
      
      <div class="form-group">
        <label>
          <input type="checkbox" id="childless" name="childless" />
          <span>Ich bin kinderlos und älter als 23 Jahre</span>
        </label>
      </div>
      
      <button type="submit" class="calc-button">Berechnen</button>
    </form>
    
    <div id="result" style="display: none;">
      <div class="result-boxes">
        <div class="result-box">
          <h3>Monatlicher Beitrag</h3>
          <div class="value">€<span id="monthlyContribution">0,00</span></div>
        </div>
        
        <div class="result-box">
          <h3>Jährlicher Beitrag</h3>
          <div class="value">€<span id="yearlyContribution">0,00</span></div>
        </div>
        
        <div class="result-box">
          <h3>Beitragssatz</h3>
          <div class="value"><span id="effectiveRate">0,00</span>%</div>
        </div>
      </div>
      
      <div class="info-box">
        <h3>2026 Pflegeversicherung Beitragssätze</h3>
        <ul>
          <li><strong>Arbeitnehmer:</strong> 3,25% des Bruttoeinkommens</li>
          <li><strong>Kinderlos (>23 J):</strong> +0,25% Zusatzbeitrag</li>
          <li><strong>Maximal versichertes Einkommen:</strong> €4.537,50/Monat (Beitragssatz-Grenze)</li>
          <li><strong>Arbeitgeber:</strong> Trägt 50% des Beitrags</li>
        </ul>
      </div>
    </div>
  </div>
</CalculatorLayout>

<style>
.calculator {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 2rem;
  margin: 2rem 0;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: var(--text);
}

.form-group input[type="number"],
.form-group select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  font-size: 1rem;
  background: var(--bg);
  color: var(--text);
}

.form-group input[type="checkbox"] {
  margin-right: 0.5rem;
}

.calc-button {
  background: var(--red);
  color: white;
  border: none;
  padding: 0.75rem 2rem;
  border-radius: var(--radius-sm);
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  width: 100%;
  transition: background 0.2s;
}

.calc-button:hover {
  background: #c0392b;
}

.result-boxes {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1.5rem;
  margin: 2rem 0;
}

.result-box {
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 1.5rem;
  text-align: center;
}

.result-box h3 {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-light);
  margin: 0 0 0.75rem 0;
}

.value {
  font-size: 1.8rem;
  font-weight: 700;
  color: var(--red);
}

.info-box {
  background: var(--bg);
  padding: 1.5rem;
  border-radius: var(--radius);
  border-left: 4px solid var(--red);
}

.info-box h3 {
  font-size: 1rem;
  margin: 0 0 1rem 0;
  color: var(--text);
}

.info-box ul {
  margin: 0;
  padding-left: 1.5rem;
}

.info-box li {
  margin: 0.75rem 0;
  color: var(--text-light);
  line-height: 1.6;
}
</style>

<script define:vars={{ baseRate, childlessAddition }}>
document.getElementById('pflegeForm').addEventListener('submit', function(e) {
  e.preventDefault();
  
  const income = parseFloat(document.getElementById('income').value);
  const isChildless = document.getElementById('childless').checked;
  
  // Calculate rate
  let rate = baseRate;
  if (isChildless) {
    rate += childlessAddition;
  }
  
  // Max contribution income cap
  const maxContributionIncome = 4537.50;
  const effectiveIncome = Math.min(income, maxContributionIncome);
  
  // Calculate contributions
  const monthlyContribution = (effectiveIncome * rate).toFixed(2);
  const yearlyContribution = (monthlyContribution * 12).toFixed(2);
  const effectiveRate = (rate * 100).toFixed(2);
  
  // Update results
  document.getElementById('monthlyContribution').textContent = monthlyContribution;
  document.getElementById('yearlyContribution').textContent = yearlyContribution;
  document.getElementById('effectiveRate').textContent = effectiveRate;
  
  document.getElementById('result').style.display = 'block';
  document.getElementById('result').scrollIntoView({ behavior: 'smooth' });
});
</script>
```

- [ ] **Step 2: Test calculator**

Test case: €3.000 income, childless
- Rate: 3.25% + 0.25% = 3.50%
- Monthly: €3.000 * 0.035 = €105,00
- Yearly: €1.260,00

```bash
npm run dev
# Navigate to http://localhost:4321/versicherungen/pflege-rechner/
# Enter 3000, check childless, click Berechnen
# Verify results match above
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/versicherungen/pflege-rechner.astro
git commit -m "feat: add Pflegeversicherung contribution calculator"
```

---

### Task 3.5: Create Elementarversicherung Calculator

**Files:**
- Create: `src/pages/versicherungen/elementar-rechner.astro`

**Description:** Risk assessment and premium estimation for elemental damage insurance.

- [ ] **Step 1: Create elementar-rechner.astro** (following same pattern as above tasks)

Create a form that takes:
- Postal code (determines risk zone)
- Building age
- Elevation above sea level
- Building type (single/multi-family)

Output: Risk level + estimated annual premium

```astro
---
import CalculatorLayout from '../../layouts/CalculatorLayout.astro';

// Simplified risk zones (in production, use detailed postal code mapping)
const riskZones = {
  '0': 'Sehr niedrig (0%)',
  '1': 'Niedrig',
  '2': 'Mittel',
  '3': 'Erhöht',
  '4': 'Sehr hoch'
};

// Base premium estimates (annual, in €)
const basePremiums = {
  single: { '0': 50, '1': 75, '2': 120, '3': 200, '4': 400 },
  multi: { '0': 40, '1': 60, '2': 100, '3': 160, '4': 320 }
};
---

<CalculatorLayout
  title="Elementarversicherung Rechner"
  description="Risiko-Bewertung und Prämien-Schätzung für Elementarversicherung 2026."
  canonicalPath="/versicherungen/elementar-rechner/"
  categoryColor="#e65100"
>
  <div class="calculator">
    <form id="elementarForm">
      <div class="form-group">
        <label for="postalCode">Postleitzahl</label>
        <input 
          type="text" 
          id="postalCode" 
          name="postalCode"
          placeholder="10115"
          maxlength="5"
          required
        />
      </div>
      
      <div class="form-group">
        <label for="elevation">Höhe über Meer (Meter)</label>
        <input 
          type="number"
          id="elevation"
          name="elevation"
          placeholder="100"
          min="0"
          step="10"
          required
        />
      </div>
      
      <div class="form-group">
        <label for="buildingAge">Gebäudealter (Jahre)</label>
        <select id="buildingAge" name="buildingAge">
          <option value="new">0-10 Jahre (Neubau)</option>
          <option value="medium">11-30 Jahre</option>
          <option value="old">>30 Jahre (Altbau)</option>
        </select>
      </div>
      
      <div class="form-group">
        <label for="buildingType">Gebäudetyp</label>
        <select id="buildingType" name="buildingType">
          <option value="single">Einfamilienhaus</option>
          <option value="multi">Mehrfamilienhaus</option>
        </select>
      </div>
      
      <button type="submit" class="calc-button">Berechnen</button>
    </form>
    
    <div id="result" style="display: none;">
      <div class="risk-assessment">
        <h2>Risiko-Bewertung</h2>
        <div class="risk-level">
          <span id="riskLevel">Mittel</span>
        </div>
      </div>
      
      <div class="result-boxes">
        <div class="result-box">
          <h3>Geschätzte jährliche Prämie</h3>
          <div class="value">€<span id="annualPremium">0</span></div>
        </div>
        
        <div class="result-box">
          <h3>Monatlich</h3>
          <div class="value">€<span id="monthlyPremium">0,00</span></div>
        </div>
      </div>
      
      <div class="info-box">
        <h3>Was ist in der Elementarversicherung versichert?</h3>
        <ul>
          <li>Überschwemmung (Regen, Schnee, Fluss)</li>
          <li>Erdrutsch und Erdfall</li>
          <li>Schneedruck und Lawinen</li>
          <li>Blitzschlag (zusätzlich zur Feuerversicherung)</li>
        </ul>
      </div>
    </div>
  </div>
</CalculatorLayout>

<style>
/* Same styling as pflege-rechner */
.calculator { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 2rem; margin: 2rem 0; }
.form-group { margin-bottom: 1.5rem; }
.form-group label { display: block; font-weight: 600; margin-bottom: 0.5rem; color: var(--text); }
.form-group input, .form-group select { width: 100%; padding: 0.75rem; border: 1px solid var(--border); border-radius: var(--radius-sm); font-size: 1rem; background: var(--bg); color: var(--text); }
.calc-button { background: var(--red); color: white; border: none; padding: 0.75rem 2rem; border-radius: var(--radius-sm); font-size: 1rem; font-weight: 600; cursor: pointer; width: 100%; transition: background 0.2s; }
.calc-button:hover { background: #c0392b; }
.risk-assessment { background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%); color: white; padding: 2rem; border-radius: var(--radius); text-align: center; margin-bottom: 2rem; }
.risk-level { font-size: 2rem; font-weight: 700; }
.result-boxes { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1.5rem; margin: 2rem 0; }
.result-box { background: var(--bg); border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 1.5rem; text-align: center; }
.result-box h3 { font-size: 0.9rem; color: var(--text-light); margin: 0 0 0.75rem 0; }
.value { font-size: 1.8rem; font-weight: 700; color: var(--red); }
.info-box { background: var(--bg); padding: 1.5rem; border-radius: var(--radius); border-left: 4px solid var(--red); }
.info-box h3 { font-size: 1rem; margin: 0 0 1rem 0; }
.info-box ul { margin: 0; padding-left: 1.5rem; }
.info-box li { margin: 0.75rem 0; color: var(--text-light); line-height: 1.6; }
</style>

<script define:vars={{ basePremiums, riskZones }}>
document.getElementById('elementarForm').addEventListener('submit', function(e) {
  e.preventDefault();
  
  const postalCode = document.getElementById('postalCode').value;
  const elevation = parseInt(document.getElementById('elevation').value);
  const buildingAge = document.getElementById('buildingAge').value;
  const buildingType = document.getElementById('buildingType').value;
  
  // Simplified risk calculation
  let riskZone = '2'; // Default: Mittel
  
  if (elevation > 500) riskZone = '4'; // High elevation = higher risk
  else if (elevation > 300) riskZone = '3';
  else if (elevation < 50) riskZone = '1'; // Low elevation = lower risk
  
  if (buildingAge === 'old') riskZone = Math.min('4', (parseInt(riskZone) + 1).toString());
  
  const basePremium = basePremiums[buildingType][riskZone];
  const monthlyPremium = (basePremium / 12).toFixed(2);
  
  document.getElementById('riskLevel').textContent = riskZones[riskZone];
  document.getElementById('annualPremium').textContent = basePremium;
  document.getElementById('monthlyPremium').textContent = monthlyPremium;
  
  document.getElementById('result').style.display = 'block';
  document.getElementById('result').scrollIntoView({ behavior: 'smooth' });
});
</script>
```

- [ ] **Step 2: Test calculator**

```bash
npm run dev
# Test with Berlin (10115), elevation 50m, new building, single-family
# Expected: Low-Mittel risk, ~€50-75/year
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/versicherungen/elementar-rechner.astro
git commit -m "feat: add Elementarversicherung risk calculator"
```

---

### Task 3.6-3.10: Create Remaining 6 Calculators

**Files:**
- Create: `src/pages/geld/ratenkredit-detailrechner.astro`
- Create: `src/pages/geld/autofinanzierung-rechner.astro`
- Create: `src/pages/geld/rentenlucken-rechner.astro`
- Create: `src/pages/geld/etf-renditerechner.astro`
- Create: `src/pages/auto/elektroauto-tco-rechner.astro`
- Create: `src/pages/auto/spritkosten-vergleich.astro`

**Description:** Create 6 additional calculators following the same patterns as Tasks 3.2-3.5.

Each task should:
1. Create calculator page with form
2. Implement calculation logic
3. Display formatted results
4. Add helpful info section
5. Test on browser
6. Commit

**For brevity:** The patterns are identical to previous tasks. Each calculator:
- Takes user inputs via form
- Performs mathematical calculations
- Displays results in result boxes
- Shows educational info below

**Tasks:**
- **3.6: Ratenkredit Detailrechner** (Credit calculator with amortization table)
- **3.7: Autofinanzierung Rechner** (Car financing calculator)
- **3.8: Rentenlücken Rechner** (Retirement gap calculator)
- **3.9: ETF Renditerechner** (ETF return simulator)
- **3.10: Elektroauto TCO Rechner** (EV vs Benzin TCO comparison)
- **3.11: Spritkosten Vergleich** (Fuel cost vs EV cost)

Since these follow the same template as 3.2-3.5, each can be implemented in parallel:

- [ ] **Step 1-5 for each:** Follow identical pattern (create file, test, commit)

---

### Task 3.12: Test All New Calculators on Index & Category Pages

**Files:**
- Test: Category pages
- Test: Index page

- [ ] **Step 1: Navigate to /versicherungen/**

```bash
http://localhost:4321/versicherungen/
```

Expected: 4 calculator links visible, all clickable

- [ ] **Step 2: Navigate to /geld/**

Expected: 2 new calculators (Ratenkredit, Autofinanzierung) visible in category

- [ ] **Step 3: Navigate to /auto/**

Expected: 2 new calculators (EV TCO, Spritkosten) visible in category

- [ ] **Step 4: Check homepage //**

Expected: "Versicherungen" category appears in main grid with 4 calculators count

- [ ] **Step 5: Count total calculators**

```
Versicherungen: 4
Geld & Gehalt: 26 + 2 = 28
Wohnen: 13
Auto: 15 + 2 = 17
Energie: 10
Familie: 16
Gesundheit: 10
Einheiten: 5
= 103 Rechner total
```

- [ ] **Step 6: Build for production**

```bash
npm run build
```

Expected: All 103 calculator pages build successfully

- [ ] **Step 7: Final commit**

```bash
git add -A
git commit -m "feat: add 10 new calculators, reach 100+ milestone"
```

---

## SUMMARY

**Total Parallel Tasks:** 3 Phases (can execute simultaneously)
- **Phase 1 (Share-Buttons):** Tasks 1.1-1.4 (2-3 hours total)
- **Phase 2 (Related Sites):** Tasks 2.1-2.4 (1-2 hours total)
- **Phase 3 (10 Calculators):** Tasks 3.1-3.12 (4-6 hours total)

**Estimated total:** 7-11 hours parallel execution

**Success metrics:**
- All 3 features working without errors
- 100+ calculator pages built successfully
- Share buttons appear on all calculator pages
- "Weitere Rechner" section links work on all pages
- New calculators ranked for high-volume keywords within 3 months

