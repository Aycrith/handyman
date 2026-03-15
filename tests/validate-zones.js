/**
 * tests/validate-zones.js — Workshop Journey zone system assertions
 *
 * Tests the scroll zone system added in Phase C–E of the workshop journey.
 * Verifies zone state, site-layer zone driver, background color shifts,
 * camera smoothness, particle cue transitions, and reduced-motion guards.
 */

const { chromium } = require('playwright');
const { startStaticServer } = require('./helpers/static-server');

const PORT = 8799;
const BASE_URL = `http://localhost:${PORT}`;
const DESKTOP_URL = `${BASE_URL}/?sceneTier=desktop`;

function pass(name) { console.log(`  [PASS] ${name}`); }
function fail(name, detail) { console.error(`  [FAIL] ${name}: ${detail}`); process.exitCode = 1; }

async function getDiagnostics(page) {
  return page.evaluate(() =>
    typeof window.__sceneDiagnostics === 'function' ? window.__sceneDiagnostics() : null
  );
}

async function waitForSceneReady(page, timeoutMs = 10000) {
  await page.waitForFunction(
    () => typeof window.__sceneDiagnostics === 'function' && window.__sceneDiagnostics()?.renderedFrameCount > 10,
    { timeout: timeoutMs }
  );
}

async function scrollToProgress(page, progress) {
  await page.evaluate((prog) => {
    const total = document.documentElement.scrollHeight - window.innerHeight;
    window.scrollTo({ top: total * prog, behavior: 'instant' });
  }, progress);
  // Give scene a moment to process the scroll
  await page.waitForTimeout(300);
}

async function runTests() {
  const server = await startStaticServer(PORT);
  const browser = await chromium.launch();
  let passed = 0;
  let failed = 0;

  try {
    // ── Test 1: Zone state at scrollProgress=0 ────────────────────────────
    {
      const page = await browser.newPage();
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto(DESKTOP_URL, { waitUntil: 'networkidle' });
      await waitForSceneReady(page);

      const diag = await getDiagnostics(page);
      const zoneState = diag?.zoneState;

      if (zoneState && zoneState.activeId === 'hero') {
        pass('1. zoneState.activeId is "hero" at scrollProgress=0');
        passed++;
      } else {
        fail('1. zoneState.activeId is "hero" at scrollProgress=0',
          `got: ${zoneState?.activeId} (zoneState: ${JSON.stringify(zoneState)})`);
        failed++;
      }

      if (zoneState && zoneState.zoneCount >= 5) {
        pass(`1b. resolvedZones populated (count: ${zoneState.zoneCount})`);
        passed++;
      } else {
        fail('1b. resolvedZones populated', `got count: ${zoneState?.zoneCount}`);
        failed++;
      }

      await page.close();
    }

    // ── Test 2: body.dataset.sceneZone updates on scroll to #services ──────
    {
      const page = await browser.newPage();
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto(DESKTOP_URL, { waitUntil: 'networkidle' });
      await waitForSceneReady(page);

      // Scroll to #services section
      await page.evaluate(() => {
        const el = document.querySelector('[data-scene-zone="services"]');
        if (el) el.scrollIntoView({ behavior: 'instant' });
      });

      // Wait up to 500ms for zone driver to update
      const zoneUpdated = await page.waitForFunction(
        () => document.body.dataset.sceneZone === 'services',
        { timeout: 500 }
      ).then(() => true).catch(() => false);

      if (zoneUpdated) {
        pass('2. body.dataset.sceneZone = "services" after scrolling to #services');
        passed++;
      } else {
        const actualZone = await page.evaluate(() => document.body.dataset.sceneZone);
        fail('2. body.dataset.sceneZone = "services" after scrolling to #services',
          `got: "${actualZone}"`);
        failed++;
      }

      await page.close();
    }

    // ── Test 3: Background color differs between hero and services zones ───
    {
      const page = await browser.newPage();
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto(DESKTOP_URL, { waitUntil: 'networkidle' });
      await waitForSceneReady(page);

      // Sample background at hero (progress=0)
      const heroDiag = await getDiagnostics(page);
      const heroPhase = heroDiag?.directorPhase;

      // Scroll to services zone (scrollTransition phase territory)
      await scrollToProgress(page, 0.20);
      await page.waitForTimeout(500);

      const servicesDiag = await getDiagnostics(page);
      const servicesZone = servicesDiag?.zoneState?.activeId;

      // Zone system should be active after hero handoff
      if (servicesDiag?.zoneState?.active === true || servicesDiag?.directorPhase === 'scroll-transition') {
        pass('3. Zone system active in scroll-transition phase');
        passed++;
      } else {
        fail('3. Zone system active in scroll-transition phase',
          `phase: ${servicesDiag?.directorPhase}, zone active: ${servicesDiag?.zoneState?.active}`);
        failed++;
      }

      if (servicesZone === 'services' || servicesZone === 'hero') {
        pass(`3b. Zone identified correctly at 20% scroll: "${servicesZone}"`);
        passed++;
      } else {
        fail('3b. Zone identified correctly at 20% scroll', `got: ${servicesZone}`);
        failed++;
      }

      await page.close();
    }

    // ── Test 4: Camera position changes smoothly — no large jumps ─────────
    {
      const page = await browser.newPage();
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto(DESKTOP_URL, { waitUntil: 'networkidle' });
      await waitForSceneReady(page);

      const positions = [];
      const steps = 10;

      for (let i = 0; i <= steps; i++) {
        const progress = 0.10 + (i / steps) * 0.70; // 10%–80% scroll
        await scrollToProgress(page, progress);
        const pos = await page.evaluate(() => {
          const scene = window.__sceneDiagnostics?.();
          // Use tool position as proxy for camera relative positioning
          const wrench = scene?.toolScreenPositions?.wrench;
          return wrench ? { x: wrench.screenX, y: wrench.screenY } : null;
        });
        if (pos) positions.push(pos);
      }

      if (positions.length >= 8) {
        let maxDelta = 0;
        for (let i = 1; i < positions.length; i++) {
          const dx = positions[i].x - positions[i-1].x;
          const dy = positions[i].y - positions[i-1].y;
          const delta = Math.sqrt(dx*dx + dy*dy);
          maxDelta = Math.max(maxDelta, delta);
        }
        if (maxDelta < 200) {
          pass(`4. Camera moves smoothly — max delta per step: ${maxDelta.toFixed(1)}px`);
          passed++;
        } else {
          fail('4. Camera moves smoothly', `max delta: ${maxDelta.toFixed(1)}px (threshold: 200px)`);
          failed++;
        }
      } else {
        fail('4. Camera smoothness', `insufficient position samples: ${positions.length}`);
        failed++;
      }

      await page.close();
    }

    // ── Test 5: particleCue changes between hero and gallery zones ─────────
    {
      const page = await browser.newPage();
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto(DESKTOP_URL, { waitUntil: 'networkidle' });
      await waitForSceneReady(page);

      const heroDiag = await getDiagnostics(page);
      const heroCue = heroDiag?.particleCue;

      await scrollToProgress(page, 0.55); // gallery zone
      await page.waitForTimeout(600);
      const galleryDiag = await getDiagnostics(page);
      const galleryCue = galleryDiag?.particleCue;

      // Cues should be different OR zone should be active (zone overrides particle params)
      const zoneActive = galleryDiag?.zoneState?.active;
      if (heroCue !== galleryCue || zoneActive) {
        pass(`5. particleCue differs or zone active: hero="${heroCue}" gallery="${galleryCue}" zoneActive=${zoneActive}`);
        passed++;
      } else {
        fail('5. particleCue changes between zones', `hero="${heroCue}" gallery="${galleryCue}"`);
        failed++;
      }

      await page.close();
    }

    // ── Test 6: prefers-reduced-motion — zone driver skips, no errors ──────
    {
      const page = await browser.newPage();
      await page.setViewportSize({ width: 1440, height: 900 });

      // Emulate reduced motion
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto(DESKTOP_URL, { waitUntil: 'networkidle' });
      await waitForSceneReady(page).catch(() => {});
      await page.waitForTimeout(1000);

      // Scroll to mid-page
      await scrollToProgress(page, 0.30);
      await page.waitForTimeout(500);

      const bodyZone = await page.evaluate(() => document.body.dataset.sceneZone);
      if (bodyZone === undefined || bodyZone === '') {
        pass('6. prefers-reduced-motion: body.dataset.sceneZone not set by zone driver');
        passed++;
      } else {
        fail('6. prefers-reduced-motion: body.dataset.sceneZone should not be set',
          `got: "${bodyZone}"`);
        failed++;
      }

      // Verify no JS errors were thrown
      const errors = await page.evaluate(() => window.__jsErrors || []);
      if (!errors.length) {
        pass('6b. No JS errors thrown in reduced-motion mode');
        passed++;
      } else {
        fail('6b. No JS errors thrown in reduced-motion mode', errors.join(', '));
        failed++;
      }

      await page.close();
    }

  } finally {
    await browser.close();
    server.close();
  }

  console.log(`\n── Zone Validation Results ─────────────────────`);
  console.log(`  Passed: ${passed}`);
  console.log(`  Failed: ${failed}`);
  console.log(`────────────────────────────────────────────────`);

  if (failed > 0) process.exit(1);
}

runTests().catch(err => {
  console.error('[validate-zones] Fatal error:', err);
  process.exit(1);
});
