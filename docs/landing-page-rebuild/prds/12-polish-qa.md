# PRD 12 — Polish & QA Pass Strategy

**Status:** Planning
**Priority:** P2 (tests written in parallel with features, full suite run at end)
**Files:** `tests/validate-sections.js` (new), `tests/validate-a11y.js` (new), `tests/run-all.js`
**Depends on:** All implementation phases complete

---

## Objective

Define the acceptance bar for "done" and build test coverage for all new systems. The existing 4-suite test harness must be extended with 2 new suites covering section reveals and accessibility.

---

## Current Test Suite

| File | What It Tests | Status |
|------|-------------|--------|
| `validate-hero-assets.js` | GLB integrity: wrench, hammer, saw + manifest | ✓ Keep |
| `validate-ui.js` | Preloader dismiss, scene boot, canvas, scroll, viewport | ✓ Keep (update for Stage 3 loading) |
| `validate-effects.js` | Mobile/low tier: particles disabled, bloom off | ✓ Keep |
| `validate-effects-desktop.js` | Desktop: particles enabled, bloom on | ✓ Keep |
| `run-all.js` | Pipeline orchestrator | ✓ Update with 2 new suites |

---

## New Suite 1: validate-sections.js

**Goal:** Verify every section reveals correctly, has correct structure, and visible content.

```js
// tests/validate-sections.js
import { chromium } from 'playwright';

const BASE_URL = 'http://127.0.0.1:8767';
const SECTIONS = [
  { name: 'services',      selector: '#services',     title: '.section-title' },
  { name: 'rhetoric',      selector: '.rhetoric-section', title: null },
  { name: 'process',       selector: '#process',      title: '.section-title' },
  { name: 'gallery',       selector: '#gallery',      title: '.section-title' },
  { name: 'about',         selector: '#about',        title: '.section-title' },
  { name: 'testimonials',  selector: '#testimonials', title: '.section-title' },
  { name: 'cta-band',      selector: '.cta-band',     title: null },
  { name: 'contact',       selector: '#contact',      title: '.section-title' }
];

const fs = require('fs');
const path = require('path');

const EVIDENCE_DIR = path.join(__dirname, 'evidence-desktop');
fs.mkdirSync(EVIDENCE_DIR, { recursive: true });

async function runSectionTests() {
  const browser = await chromium.launch();
  let failures = 0;

  for (const viewport of [
    { width: 1280, height: 900, name: 'desktop' },
    { width: 430,  height: 932, name: 'mobile-430' },
    { width: 390,  height: 844, name: 'mobile-390' }
  ]) {
    const context = await browser.newContext({ viewport });
    const page = await context.newPage();
    await page.goto(BASE_URL);
    await page.waitForSelector('.preloader', { state: 'detached', timeout: 10000 });

    for (const section of SECTIONS) {
      // Scroll to section
      await page.evaluate((sel) => {
        const el = document.querySelector(sel);
        if (el) el.scrollIntoView({ behavior: 'instant' });
      }, section.selector);

      await page.waitForTimeout(800); // Allow reveals to complete

      // Assert section is visible
      const sectionEl = await page.$(section.selector);
      if (!sectionEl) {
        console.error(`FAIL [${viewport.name}] Section not found: ${section.name}`);
        failures++;
        continue;
      }

      const visible = await sectionEl.isVisible();
      if (!visible) {
        console.error(`FAIL [${viewport.name}] Section not visible: ${section.name}`);
        failures++;
        continue;
      }

      // Assert title visible (if expected)
      if (section.title) {
        const titleEl = await sectionEl.$(section.title);
        if (!titleEl) {
          console.error(`FAIL [${viewport.name}] Title not found in ${section.name}`);
          failures++;
        } else {
          const titleOpacity = await titleEl.evaluate(el =>
            parseFloat(window.getComputedStyle(el).opacity)
          );
          if (titleOpacity < 0.5) {
            console.error(`FAIL [${viewport.name}] Title opacity too low in ${section.name}: ${titleOpacity}`);
            failures++;
          }
        }
      }

      // Assert no horizontal overflow
      const hasOverflow = await page.evaluate((sel) => {
        const el = document.querySelector(sel);
        return el ? el.scrollWidth > el.clientWidth + 4 : false; // 4px tolerance
      }, section.selector);

      if (hasOverflow && viewport.name !== 'desktop') {
        // Services HScroll is expected on desktop, not mobile
        console.error(`FAIL [${viewport.name}] Horizontal overflow in ${section.name}`);
        failures++;
      }

      // Screenshot evidence
      const screenshotPath = path.join(
        EVIDENCE_DIR,
        `${viewport.name}-section-${section.name}.png`
      );
      await page.screenshot({
        path: screenshotPath,
        clip: await sectionEl.boundingBox()
      });

      console.log(`PASS [${viewport.name}] ${section.name}`);
    }

    await context.close();
  }

  await browser.close();
  return failures;
}

runSectionTests().then(failures => {
  if (failures > 0) {
    console.error(`\n${failures} section test(s) failed`);
    process.exit(1);
  } else {
    console.log('\nAll section tests passed');
  }
});
```

---

## New Suite 2: validate-a11y.js

**Goal:** Tab order, focus rings, skip link, reduced-motion, aria-label preservation.

```js
// tests/validate-a11y.js
import { chromium } from 'playwright';

const BASE_URL = 'http://127.0.0.1:8767';

async function runA11yTests() {
  const browser = await chromium.launch();
  let failures = 0;

  // --- Test 1: Skip link exists and navigates to #main ---
  {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto(BASE_URL);
    await page.waitForSelector('.preloader', { state: 'detached', timeout: 10000 });

    const skipLink = await page.$('.skip-link');
    if (!skipLink) {
      console.error('FAIL: Skip link not found (.skip-link)');
      failures++;
    } else {
      // Tab to skip link and check it's visible
      await page.keyboard.press('Tab');
      const isFocused = await page.evaluate(() =>
        document.activeElement?.classList.contains('skip-link')
      );
      if (!isFocused) {
        console.error('FAIL: Skip link not first focusable element');
        failures++;
      } else {
        console.log('PASS: Skip link is first focusable element');
        // Press Enter and check focus moves to #main
        await page.keyboard.press('Enter');
        const focusedId = await page.evaluate(() => document.activeElement?.id);
        if (focusedId !== 'main') {
          console.error(`FAIL: Skip link navigates to #${focusedId}, expected #main`);
          failures++;
        } else {
          console.log('PASS: Skip link navigates to #main');
        }
      }
    }
    await context.close();
  }

  // --- Test 2: Reduced-motion — text visible, animations absent ---
  {
    const context = await browser.newContext({
      reducedMotion: 'reduce'
    });
    const page = await context.newPage();
    await page.goto(BASE_URL);
    await page.waitForSelector('.preloader', { state: 'detached', timeout: 10000 });

    // Check all section titles are visible (opacity >= 0.9)
    const titles = await page.$$('.section-title');
    for (const title of titles) {
      const opacity = await title.evaluate(el =>
        parseFloat(window.getComputedStyle(el).opacity)
      );
      if (opacity < 0.9) {
        const text = await title.textContent();
        console.error(`FAIL [reduced-motion] Title "${text?.slice(0,30)}" opacity: ${opacity}`);
        failures++;
      }
    }

    // Check no ambient-drift animations running
    const animating = await page.evaluate(() => {
      const drifts = document.querySelectorAll('.ambient-drift');
      return Array.from(drifts).some(el => {
        const style = window.getComputedStyle(el);
        return style.animationName !== 'none';
      });
    });
    if (animating) {
      console.error('FAIL [reduced-motion] ambient-drift animations still running');
      failures++;
    } else {
      console.log('PASS [reduced-motion] ambient-drift animations disabled');
    }

    await context.close();
  }

  // --- Test 3: Focus ring visible on interactive elements ---
  {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto(BASE_URL);
    await page.waitForSelector('.preloader', { state: 'detached', timeout: 10000 });

    // Tab through page and check focus ring on CTA button
    await page.keyboard.press('Tab'); // skip link
    await page.keyboard.press('Tab'); // first nav link
    // ... tab to CTA button
    // Check outline is amber
    const ctaFocusColor = await page.evaluate(() => {
      const cta = document.querySelector('.btn--primary');
      if (!cta) return null;
      cta.focus();
      return window.getComputedStyle(cta).outlineColor;
    });
    if (!ctaFocusColor || ctaFocusColor === 'rgba(0, 0, 0, 0)') {
      console.error('FAIL: CTA button has no focus ring');
      failures++;
    } else {
      console.log(`PASS: CTA button focus ring: ${ctaFocusColor}`);
    }

    await context.close();
  }

  // --- Test 4: aria-label on SplitType elements ---
  {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto(BASE_URL);
    await page.waitForSelector('.preloader', { state: 'detached', timeout: 10000 });

    const titles = await page.$$('.section-title');
    for (const title of titles) {
      const ariaLabel = await title.getAttribute('aria-label');
      if (!ariaLabel) {
        const text = await title.textContent();
        console.error(`FAIL: section-title missing aria-label: "${text?.slice(0,40)}"`);
        failures++;
      }
    }
    console.log('PASS: aria-label present on section titles');

    await context.close();
  }

  await browser.close();
  return failures;
}

runA11yTests().then(failures => {
  if (failures > 0) {
    console.error(`\n${failures} a11y test(s) failed`);
    process.exit(1);
  } else {
    console.log('\nAll a11y tests passed');
  }
});
```

---

## run-all.js Update

```js
// tests/run-all.js — add 2 new suites
const suites = [
  { name: 'Hero Assets',     script: 'validate-hero-assets.js' },
  { name: 'UI Smoke',        script: 'validate-ui.js' },
  { name: 'Effects Mobile',  script: 'validate-effects.js' },
  { name: 'Effects Desktop', script: 'validate-effects-desktop.js' },
  { name: 'Sections',        script: 'validate-sections.js' },    // NEW
  { name: 'Accessibility',   script: 'validate-a11y.js' }         // NEW
];
```

---

## Manual QA Checklist (Pre-Ship)

Run these manually — Playwright cannot fully automate all visual quality checks:

### Visual Quality
- [ ] Section transitions feel smooth (no janky scroll reveals)
- [ ] Hero entrance: 3-beat sequence visible
- [ ] Services section: Blueprint grid subtle (not overwhelming)
- [ ] Gallery section: Evidence Room feel (editorial, not generic)
- [ ] Rhetoric section: Statement Room feel (type IS the design)
- [ ] CTA Band: amber warmth glow visible
- [ ] Particles: atmospheric (subtle) not distracting
- [ ] Film grain: cinematic texture visible, not noisy

### Motion Quality
- [ ] `cinematic-sweep` on section titles: skewY clears smoothly
- [ ] `precision-stagger` on cards: landing feel (mass, not just fade)
- [ ] `velocity-scrub` on rhetoric: different experience at fast vs. slow scroll
- [ ] Gallery tilt: smooth 3D response to mouse

### Cross-Browser
- [ ] Chrome 120+ (primary)
- [ ] Safari 17+ (WebKit — check SplitType, CSS grid, `backdrop-filter`)
- [ ] Firefox 122+ (Gecko — check WebGL, CSS grid)
- [ ] Edge 120+ (Chromium — same as Chrome, quick pass)

### Performance
- [ ] Chrome DevTools: ≤16.7ms frame time during scroll on desktop
- [ ] Chrome DevTools: no layout thrashing during animation
- [ ] Tab hidden for 30s, then return: no WebGL context loss
- [ ] Lighthouse: LCP ≤ 2.5s, CLS ≤ 0.1

---

## Acceptance Criteria

- [ ] `validate-sections.js` passes at 1280×900, 430×932, 390×844
- [ ] `validate-a11y.js` passes all 4 test cases
- [ ] `run-all.js` executes all 6 suites, reports 0 failures
- [ ] Evidence screenshots committed to `tests/evidence-desktop/`
- [ ] Manual QA checklist signed off
- [ ] No console errors in browser during normal page interaction
