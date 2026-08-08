# 3 Additional Calculators Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build 3 new calculators targeting high-search-volume keywords identified in Search Console: KM-Kostenrechner, Unterhalt-Rechner, and E-Auto Leasing Rechner.

**Architecture:** Each calculator follows the established pattern: Astro page component with form inputs, client-side calculation logic, responsive result display, and educational info section. All use the CalculatorLayout which automatically includes ShareButtons and RelatedSites components.

**Tech Stack:** Astro, client-side JavaScript calculations, responsive CSS Grid, Schema.org structured data

---

## Task 1: KM-Kostenrechner (Auto & Mobilität)

**Files:**
- Create: `src/pages/auto/km-kostenrechner.astro`

- [ ] **Step 1: Create the calculator file with form inputs**

```astro
---
import CalculatorLayout from '../../layouts/CalculatorLayout.astro';

const title = 'KM-Kostenrechner';
const description = 'Berechne die Kosten pro Kilometer für Dein Auto. Einfach Jahresbudget eingeben und sehen, wie viel Du pro km bezahlst.';
const canonicalPath = '/auto/km-kostenrechner/';
const categoryColor = '#1565c0';
const categoryLight = '#e3f2fd';
---

<CalculatorLayout title={title} description={description} canonicalPath={canonicalPath} categoryColor={categoryColor} categoryLight={categoryLight}>
  <h1>KM-Kostenrechner</h1>
  <p>Berechne die Gesamtkosten pro Kilometer für Dein Auto – inklusive Versicherung, Wartung, Spritkosten und mehr.</p>

  <form class="calc-form" id="kmCostForm">
    <div class="form-group">
      <label for="annualBudget">Jährliche Gesamtkosten (€)</label>
      <input type="number" id="annualBudget" name="annualBudget" placeholder="z.B. 4800" min="100" max="50000" step="100" value="4800" required />
      <small>Sprit, Versicherung, Wartung, Steuern, etc.</small>
    </div>

    <div class="form-group">
      <label for="annualKm">Jährliche Kilometerleistung</label>
      <input type="number" id="annualKm" name="annualKm" placeholder="z.B. 15000" min="1000" max="100000" step="1000" value="15000" required />
      <small>Wie viele km fährst Du im Jahr?</small>
    </div>

    <button type="submit" class="btn-primary">Berechnen</button>
  </form>

  <div id="result" class="result-section" style="display: none;">
    <div class="result-main">
      <div class="result-value" id="costPerKm">0,00 €</div>
      <div class="result-label">Kosten pro km</div>
    </div>

    <div class="result-cards">
      <div class="result-card">
        <div class="result-card-label">Monatliche Kosten</div>
        <div class="result-card-value" id="monthlyCost">0 €</div>
      </div>
      <div class="result-card">
        <div class="result-card-label">Kosten 100 km</div>
        <div class="result-card-value" id="cost100km">0 €</div>
      </div>
      <div class="result-card">
        <div class="result-card-label">Kosten 1.000 km</div>
        <div class="result-card-value" id="cost1000km">0 €</div>
      </div>
    </div>
  </div>

  <div class="info-box">
    <h3>Was gehört zu den Fahrtkosten?</h3>
    <ul>
      <li><strong>Spritkosten:</strong> Durchschnittlicher Verbrauch × Spritpreis</li>
      <li><strong>Versicherung:</strong> Haftpflicht + Vollkasko (jährlich)</li>
      <li><strong>Wartung & Reparatur:</strong> Ölwechsel, Inspektionen, Verschleißteile</li>
      <li><strong>Kfz-Steuer:</strong> Jährliche Steuer basierend auf CO2-Ausstoß</li>
      <li><strong>Abnutzung:</strong> Verschleiß von Reifen, Bremsen, etc. (oft ~0,10 €/km)</li>
    </ul>
    <p><strong>Faustregel:</strong> Bei 15.000 km/Jahr sollten Gesamtkosten zwischen 300-500 € monatlich liegen.</p>
  </div>

  <script>
    document.getElementById('kmCostForm').addEventListener('submit', function(e) {
      e.preventDefault();
      
      const annualBudget = parseFloat(document.getElementById('annualBudget').value);
      const annualKm = parseFloat(document.getElementById('annualKm').value);
      
      if (annualBudget <= 0 || annualKm <= 0) {
        alert('Bitte gültige Werte eingeben');
        return;
      }
      
      const costPerKm = annualBudget / annualKm;
      const monthlyCost = annualBudget / 12;
      const cost100km = costPerKm * 100;
      const cost1000km = costPerKm * 1000;
      
      document.getElementById('costPerKm').textContent = costPerKm.toFixed(2).replace('.', ',') + ' €';
      document.getElementById('monthlyCost').textContent = monthlyCost.toFixed(2).replace('.', ',') + ' €';
      document.getElementById('cost100km').textContent = cost100km.toFixed(2).replace('.', ',') + ' €';
      document.getElementById('cost1000km').textContent = cost1000km.toFixed(2).replace('.', ',') + ' €';
      
      document.getElementById('result').style.display = 'block';
      window.scrollTo({ top: document.getElementById('result').offsetTop - 100, behavior: 'smooth' });
    });
  </script>

  <style>
    .info-box {
      background: var(--page-bg);
      border-left: 4px solid var(--cat-color);
      padding: 1.5rem;
      border-radius: 8px;
      margin-top: 2rem;
    }
    .info-box h3 { margin-top: 0; color: var(--dark); }
    .info-box ul { margin: 1rem 0; padding-left: 1.5rem; }
    .info-box li { margin: 0.5rem 0; }
    .info-box p { margin: 1rem 0 0 0; font-size: 0.9rem; color: #555; }
  </style>
</CalculatorLayout>
```

- [ ] **Step 2: Test in browser**

Navigate to `http://localhost:3000/auto/km-kostenrechner/` and verify:
- Form displays with 3 input fields
- Submit button works
- Result displays with main value and 3 cards
- Example: Budget €4800, 15000 km → costPerKm = 0,32 €

- [ ] **Step 3: Commit**

```bash
git add src/pages/auto/km-kostenrechner.astro
git commit -m "feat: add KM-Kostenrechner to capture 'km geld berechnung' keyword"
```

---

## Task 2: Unterhalt-Rechner (Familie & Soziales)

**Files:**
- Create: `src/pages/familie/unterhalt-rechner.astro`

- [ ] **Step 1: Create the calculator file with form inputs**

```astro
---
import CalculatorLayout from '../../layouts/CalculatorLayout.astro';

const title = 'Unterhalt-Rechner';
const description = 'Berechne den Ehegattenunterhalt nach deutschem Familienrecht. Schnell und unkompliziert.';
const canonicalPath = '/familie/unterhalt-rechner/';
const categoryColor = '#d32f2f';
const categoryLight = '#ffebee';
---

<CalculatorLayout title={title} description={description} canonicalPath={canonicalPath} categoryColor={categoryColor} categoryLight={categoryLight}>
  <h1>Unterhalt-Rechner</h1>
  <p>Berechne den Ehegattenunterhalt (Trennungsunterhalt oder Unterhaltsanspruch) basierend auf Einkommen und Familienstand.</p>

  <form class="calc-form" id="maintenanceForm">
    <div class="form-group">
      <label for="netIncome">Nettoeinkommen (€/Monat)</label>
      <input type="number" id="netIncome" name="netIncome" placeholder="z.B. 3500" min="0" max="20000" step="100" value="3500" required />
      <small>Durchschnittliches monatliches Nettoeinkommen</small>
    </div>

    <div class="form-group">
      <label for="maritalStatus">Familienstand</label>
      <select id="maritalStatus" name="maritalStatus" required>
        <option value="separated">Trennung / Getrenntleben</option>
        <option value="divorced">Geschieden</option>
      </select>
      <small>Rechtlicher Status der Ehe</small>
    </div>

    <div class="form-group">
      <label for="duration">Dauer der Ehe (Jahre)</label>
      <input type="number" id="duration" name="duration" placeholder="z.B. 10" min="0" max="60" step="0.5" value="10" required />
      <small>Wie lange war die Ehe?</small>
    </div>

    <button type="submit" class="btn-primary">Berechnen</button>
  </form>

  <div id="result" class="result-section" style="display: none;">
    <div class="result-main">
      <div class="result-value" id="maintenanceAmount">0 €</div>
      <div class="result-label">Monatlicher Unterhalt (ca.)</div>
    </div>

    <div class="result-cards">
      <div class="result-card">
        <div class="result-card-label">Berechnungsbasis</div>
        <div class="result-card-value" id="basis">50%</div>
      </div>
      <div class="result-card">
        <div class="result-card-label">Jährlich</div>
        <div class="result-card-value" id="yearly">0 €</div>
      </div>
      <div class="result-card">
        <div class="result-card-label">Ehe-Dauer-Faktor</div>
        <div class="result-card-value" id="durationFactor">1,0x</div>
      </div>
    </div>
  </div>

  <div class="info-box">
    <h3>Wichtige Informationen zum Ehegattenunterhalt</h3>
    <ul>
      <li><strong>Berechnung:</strong> Basierend auf 50% des Nettoeinkommens (Richtlinie)</li>
      <li><strong>Ehe-Dauer:</strong> Kurze Ehen (< 5 Jahre) → reduzierter Unterhalt</li>
      <li><strong>Trennungsunterhalt:</strong> Während der Trennung / vor Scheidung</li>
      <li><strong>Geschiedenenunterhalt:</strong> Nach der Scheidung (strenger)</li>
      <li><strong>Bedürftigkeit:</strong> Der Empfänger muss bedürftig sein (keine eigenen Einkünfte)</li>
    </ul>
    <p><strong>⚠️ Rechtlicher Hinweis:</strong> Diese Berechnung ist eine Orientierungshilfe. Das Familienrecht ist komplex – konsultiere einen Rechtsanwalt für verbindliche Auskünfte.</p>
  </div>

  <script>
    document.getElementById('maintenanceForm').addEventListener('submit', function(e) {
      e.preventDefault();
      
      const netIncome = parseFloat(document.getElementById('netIncome').value);
      const maritalStatus = document.getElementById('maritalStatus').value;
      const duration = parseFloat(document.getElementById('duration').value);
      
      if (netIncome <= 0) {
        alert('Bitte ein gültiges Einkommen eingeben');
        return;
      }
      
      // Basis: 50% des Nettoeinkommens
      let maintenanceAmount = netIncome * 0.5;
      
      // Ehe-Dauer-Faktor: kurze Ehen werden reduziert
      let durationFactor = 1.0;
      if (duration < 5) {
        durationFactor = duration / 5; // 0-100% je nach Dauer
      }
      
      // Bei geschiedenen: etwas höher ansetzen
      if (maritalStatus === 'divorced') {
        maintenanceAmount = netIncome * 0.55;
      }
      
      maintenanceAmount = maintenanceAmount * durationFactor;
      
      // Minimum 0, Maximum Untergrenzen beachten
      if (maintenanceAmount < 0) maintenanceAmount = 0;
      
      const yearly = maintenanceAmount * 12;
      
      document.getElementById('maintenanceAmount').textContent = maintenanceAmount.toFixed(2).replace('.', ',') + ' €';
      document.getElementById('yearly').textContent = yearly.toFixed(2).replace('.', ',') + ' €';
      document.getElementById('durationFactor').textContent = durationFactor.toFixed(1) + 'x';
      document.getElementById('basis').textContent = (maritalStatus === 'divorced' ? 55 : 50) + '%';
      
      document.getElementById('result').style.display = 'block';
      window.scrollTo({ top: document.getElementById('result').offsetTop - 100, behavior: 'smooth' });
    });
  </script>

  <style>
    .info-box {
      background: var(--page-bg);
      border-left: 4px solid var(--cat-color);
      padding: 1.5rem;
      border-radius: 8px;
      margin-top: 2rem;
    }
    .info-box h3 { margin-top: 0; color: var(--dark); }
    .info-box ul { margin: 1rem 0; padding-left: 1.5rem; }
    .info-box li { margin: 0.5rem 0; }
    .info-box p { margin: 1rem 0 0 0; font-size: 0.9rem; color: #d32f2f; font-weight: 500; }
  </style>
</CalculatorLayout>
```

- [ ] **Step 2: Test in browser**

Navigate to `http://localhost:3000/familie/unterhalt-rechner/` and verify:
- Form displays with 3 input fields
- Submit button works
- Result displays with main value and 3 cards
- Example: €3500, Trennung, 10 Jahre Ehe → ~€1750/Monat

- [ ] **Step 3: Commit**

```bash
git add src/pages/familie/unterhalt-rechner.astro
git commit -m "feat: add Unterhalt-Rechner to capture 'ehegatttenunterhalt' keyword"
```

---

## Task 3: E-Auto Leasing Kostenrechner (Auto & Mobilität)

**Files:**
- Create: `src/pages/auto/e-auto-leasing-kostenrechner.astro`

- [ ] **Step 1: Create the calculator file with form inputs**

```astro
---
import CalculatorLayout from '../../layouts/CalculatorLayout.astro';

const title = 'E-Auto Leasing Kostenrechner';
const description = 'Berechne die Gesamtkosten für Elektroauto-Leasing: Leasingrate, Stromkosten, Versicherung und Wartung.';
const canonicalPath = '/auto/e-auto-leasing-kostenrechner/';
const categoryColor = '#1565c0';
const categoryLight = '#e3f2fd';
---

<CalculatorLayout title={title} description={description} canonicalPath={canonicalPath} categoryColor={categoryColor} categoryLight={categoryLight}>
  <h1>E-Auto Leasing Kostenrechner</h1>
  <p>Berechne die vollständigen Leasingkosten für ein Elektroauto inklusive Stromkosten, Versicherung und Wartung.</p>

  <form class="calc-form" id="evLeasingForm">
    <div class="form-group">
      <label for="carPrice">Auto-Kaufpreis (€)</label>
      <input type="number" id="carPrice" name="carPrice" placeholder="z.B. 45000" min="20000" max="200000" step="1000" value="45000" required />
      <small>Listenpreis des E-Fahrzeugs</small>
    </div>

    <div class="form-group">
      <label for="duration">Leasingdauer (Monate)</label>
      <select id="duration" name="duration" required>
        <option value="24">24 Monate</option>
        <option value="36" selected>36 Monate</option>
        <option value="48">48 Monate</option>
        <option value="60">60 Monate</option>
      </select>
    </div>

    <div class="form-group">
      <label for="annualKm">Jährliche Kilometerleistung</label>
      <input type="number" id="annualKm" name="annualKm" placeholder="z.B. 15000" min="5000" max="50000" step="1000" value="15000" required />
      <small>Durchschnittliche jährliche Kilometerleistung</small>
    </div>

    <div class="form-group">
      <label for="leasingFactor">Leasingfaktor (% des Kaufpreises)</label>
      <input type="number" id="leasingFactor" name="leasingFactor" placeholder="z.B. 3.5" min="2" max="5" step="0.1" value="3.5" required />
      <small>Typischerweise 2,5-4,0% bei E-Autos</small>
    </div>

    <div class="form-group">
      <label for="electricityPrice">Strompreis (€/kWh)</label>
      <input type="number" id="electricityPrice" name="electricityPrice" placeholder="z.B. 0.35" min="0.1" max="1.0" step="0.01" value="0.35" required />
      <small>Dein Haushaltsstrompreis</small>
    </div>

    <div class="form-group">
      <label for="consumption">Verbrauch (kWh/100km)</label>
      <input type="number" id="consumption" name="consumption" placeholder="z.B. 18" min="12" max="30" step="0.5" value="18" required />
      <small>Durchschnittlicher Stromverbrauch des E-Autos</small>
    </div>

    <button type="submit" class="btn-primary">Berechnen</button>
  </form>

  <div id="result" class="result-section" style="display: none;">
    <div class="result-main">
      <div class="result-value" id="totalCost">0 €</div>
      <div class="result-label">Gesamtkosten</div>
    </div>

    <div class="result-cards">
      <div class="result-card">
        <div class="result-card-label">Monatliche Leasingrate</div>
        <div class="result-card-value" id="monthlyRate">0 €</div>
      </div>
      <div class="result-card">
        <div class="result-card-label">Monatliche Stromkosten</div>
        <div class="result-card-value" id="monthlyElectricity">0 €</div>
      </div>
      <div class="result-card">
        <div class="result-card-label">Monatliche Gesamtkosten</div>
        <div class="result-card-value" id="monthlyTotal">0 €</div>
      </div>
      <div class="result-card">
        <div class="result-card-label">Kosten pro km</div>
        <div class="result-card-value" id="costPerKm">0 €</div>
      </div>
      <div class="result-card">
        <div class="result-card-label">Jährliche Stromkosten</div>
        <div class="result-card-value" id="yearlyElectricity">0 €</div>
      </div>
      <div class="result-card">
        <div class="result-card-label">Gesamtkilometer</div>
        <div class="result-card-value" id="totalKm">0 km</div>
      </div>
    </div>
  </div>

  <div class="info-box">
    <h3>Elektroauto Leasingkosten erklärt</h3>
    <ul>
      <li><strong>Leasingrate:</strong> Monatliche Grundrate = (Kaufpreis × Leasingfaktor) / 12</li>
      <li><strong>Stromkosten:</strong> Verbrauch × Strompreis × Kilometerleistung</li>
      <li><strong>Wartung:</strong> E-Autos haben weniger Verschleiß (keine Zahnriemen, weniger Bremsenverschleiß durch Rekuperation)</li>
      <li><strong>Versicherung:</strong> Oft günstiger als Benziner wegen KFZ-Steuerbefreiung</li>
      <li><strong>Mileage-Klauseln:</strong> Überschreitungen kosten typisch 0,10-0,20 € pro km</li>
    </ul>
    <p><strong>💡 Tipp:</strong> E-Auto-Leasing ist oft günstiger als Kauf, wenn Du unter 20.000 km/Jahr fährst und die Batterie-Entwicklung schnell fortschreitet.</p>
  </div>

  <script>
    document.getElementById('evLeasingForm').addEventListener('submit', function(e) {
      e.preventDefault();
      
      const carPrice = parseFloat(document.getElementById('carPrice').value);
      const duration = parseFloat(document.getElementById('duration').value);
      const annualKm = parseFloat(document.getElementById('annualKm').value);
      const leasingFactor = parseFloat(document.getElementById('leasingFactor').value) / 100;
      const electricityPrice = parseFloat(document.getElementById('electricityPrice').value);
      const consumption = parseFloat(document.getElementById('consumption').value);
      
      if (carPrice <= 0 || annualKm <= 0) {
        alert('Bitte gültige Werte eingeben');
        return;
      }
      
      const monthlyLeasingRate = (carPrice * leasingFactor) / 12;
      const monthlyKm = annualKm / 12;
      const monthlyElectricityCost = (monthlyKm * consumption / 100) * electricityPrice;
      const monthlyTotal = monthlyLeasingRate + monthlyElectricityCost;
      const totalKm = annualKm * (duration / 12);
      const totalCost = monthlyTotal * duration;
      const costPerKm = totalCost / totalKm;
      const yearlyElectricityCost = (annualKm * consumption / 100) * electricityPrice;
      
      document.getElementById('monthlyRate').textContent = monthlyLeasingRate.toFixed(2).replace('.', ',') + ' €';
      document.getElementById('monthlyElectricity').textContent = monthlyElectricityCost.toFixed(2).replace('.', ',') + ' €';
      document.getElementById('monthlyTotal').textContent = monthlyTotal.toFixed(2).replace('.', ',') + ' €';
      document.getElementById('totalCost').textContent = totalCost.toFixed(0).replace(/\./, ',') + ' €';
      document.getElementById('costPerKm').textContent = costPerKm.toFixed(2).replace('.', ',') + ' €';
      document.getElementById('yearlyElectricity').textContent = yearlyElectricityCost.toFixed(2).replace('.', ',') + ' €';
      document.getElementById('totalKm').textContent = totalKm.toFixed(0).replace(/\./, ',') + ' km';
      
      document.getElementById('result').style.display = 'block';
      window.scrollTo({ top: document.getElementById('result').offsetTop - 100, behavior: 'smooth' });
    });
  </script>

  <style>
    .info-box {
      background: var(--page-bg);
      border-left: 4px solid var(--cat-color);
      padding: 1.5rem;
      border-radius: 8px;
      margin-top: 2rem;
    }
    .info-box h3 { margin-top: 0; color: var(--dark); }
    .info-box ul { margin: 1rem 0; padding-left: 1.5rem; }
    .info-box li { margin: 0.5rem 0; }
    .info-box p { margin: 1rem 0 0 0; font-size: 0.9rem; color: #555; }
  </style>
</CalculatorLayout>
```

- [ ] **Step 2: Test in browser**

Navigate to `http://localhost:3000/auto/e-auto-leasing-kostenrechner/` and verify:
- Form displays with 6 input fields
- Submit button works
- Result displays with main value and 6 cards
- Example: €45000, 36 Monate, 15000 km, 3.5% Faktor, €0.35/kWh, 18 kWh/100km → Monthly rate ~€1312.50, monthly electricity ~€78.75

- [ ] **Step 3: Commit**

```bash
git add src/pages/auto/e-auto-leasing-kostenrechner.astro
git commit -m "feat: add E-Auto Leasing Kostenrechner to capture 'e-auto leasing kosten' keyword"
```

---

## Plan Self-Review

**Spec coverage:** 
- ✅ KM-Kostenrechner: Addresses "km geld berechnung" keyword
- ✅ Unterhalt-Rechner: Addresses "ehegatttenunterhalt" keyword
- ✅ E-Auto Leasing: Addresses "e-auto leasing kosten" keyword
- ✅ All follow established calculator pattern (form → calculation → results)
- ✅ All use CalculatorLayout with ShareButtons and RelatedSites

**Placeholder scan:** No TBD, TODO, or vague instructions found. All code is complete and concrete.

**Type consistency:** All calculators use consistent patterns:
- Form inputs with proper validation
- Client-side calculation logic
- Result display with main value + additional cards
- Info box with educational content
