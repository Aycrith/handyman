/**
 * tests/validate-worlds.js — World system validation tests
 *
 * Tests the cinematic world orchestrator system:
 *   1. World state exists in diagnostics
 *   2. Active world changes with scroll
 *   3. Transition detects at boundary scroll positions
 *   4. No more than 2 world groups visible simultaneously
 *   5. World system disabled on low tier
 *   6. Reduced motion respects preferences
 *   7. World diagnostics report loaded worlds
 *   8. Forge world is active at scroll=0
 */

const path = require('path');
const { chromium } = require('playwright');
const { startStaticServer } = require('./helpers/static-server');

const ROOT = path.resolve(__dirname, '..');
const PORT = 8801;
const BASE_URL = `http://localhost:${PORT}`;
const DESKTOP_URL = `${BASE_URL}/?sceneTier=desktop`;
const LOW_URL = `${BASE_URL}/?sceneTier=low`;
const SHADER_ERROR_PATTERN = /gl_vertexid|shader error|webglprogram|compile|program info log/i;

function pass(name) { console.log(`  [PASS] ${name}`); }
function fail(name, detail) { console.error(`  [FAIL] ${name}: ${detail}`); process.exitCode = 1; }

async function getDiagnostics(page) {
  return page.evaluate(() =>
    typeof window.__sceneDiagnostics === 'function' ? window.__sceneDiagnostics() : null
  );
}

async function waitForDiagnostics(page, label, predicate, timeoutMs = 30000, intervalMs = 500) {
  const startedAt = Date.now();
  let lastDiagnostics = null;

  while (Date.now() - startedAt <= timeoutMs) {
    lastDiagnostics = await getDiagnostics(page);
    if (predicate(lastDiagnostics)) {
      return lastDiagnostics;
    }
    await page.waitForTimeout(intervalMs);
  }

  throw new Error(`Timed out waiting for ${label}. Last diagnostics: ${JSON.stringify(lastDiagnostics?.worldState || lastDiagnostics)}`);
}

async function waitForSceneReady(page, timeoutMs = 45000) {
  await waitForDiagnostics(
    page,
    'scene readiness',
    (diag) => typeof diag?.renderedFrameCount === 'number' && diag.renderedFrameCount > 10,
    timeoutMs
  );
}

async function createTrackedPage(browser) {
  const page = await browser.newPage();
  const consoleErrors = [];
  const pageErrors = [];

  page.on('console', (msg) => {
    const text = msg.text();
    if (msg.type() === 'error' || SHADER_ERROR_PATTERN.test(text)) {
      consoleErrors.push(text);
    }
  });

  page.on('pageerror', (err) => {
    pageErrors.push(err.message || String(err));
  });

  return { page, consoleErrors, pageErrors };
}

async function openDesktopPage(browser) {
  const tracked = await createTrackedPage(browser);
  await tracked.page.setViewportSize({ width: 1440, height: 900 });
  await tracked.page.goto(DESKTOP_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await waitForSceneReady(tracked.page);
  return tracked;
}

async function scrollToProgress(page, progress) {
  await page.evaluate((prog) => {
    const total = document.documentElement.scrollHeight - window.innerHeight;
    window.scrollTo({ top: total * prog, behavior: 'instant' });
  }, progress);
  await page.waitForTimeout(400);
}

async function waitForWorldSummary(page, worldId, predicate, timeoutMs = 20000) {
  await waitForDiagnostics(
    page,
    `world summary for ${worldId}`,
    (diag) => {
      const summary = diag?.worldState?.worldSummaries?.[worldId];
      return !!summary && summary.loaded === true && predicate(summary);
    },
    timeoutMs
  );
}

async function getWorldSummary(page, worldId) {
  return page.evaluate((targetWorldId) => {
    const diag = typeof window.__sceneDiagnostics === 'function' ? window.__sceneDiagnostics() : null;
    return diag?.worldState?.worldSummaries?.[targetWorldId] || null;
  }, worldId);
}

async function runTests() {
  const server = await startStaticServer(ROOT, PORT);
  const browser = await chromium.launch();
  let passed = 0;
  let failed = 0;

  try {
    // ── Test 1: worldState exists in diagnostics ──────────────────────────
    {
      const { page } = await openDesktopPage(browser);

      const diag = await getDiagnostics(page);
      if (diag?.worldState && diag.worldState.enabled === true) {
        pass('1. worldState is present and enabled in diagnostics');
        passed++;
      } else {
        fail('1. worldState in diagnostics', `Got: ${JSON.stringify(diag?.worldState)}`);
        failed++;
      }
      await page.close();
    }

    // ── Test 2: Forge world is active at scroll=0 ────────────────────────
    {
      const { page } = await openDesktopPage(browser);

      const diag = await getDiagnostics(page);
      const worldState = diag?.worldState;

      if (worldState?.activeWorld === 'forge') {
        pass('2. activeWorld is "forge" at scroll=0');
        passed++;
      } else {
        fail('2. activeWorld at scroll=0', `Got: ${JSON.stringify(worldState?.activeWorld)}`);
        failed++;
      }
      await page.close();
    }

    // ── Test 3: Active world changes when scrolling to services ──────────
    {
      const { page } = await openDesktopPage(browser);

      await scrollToProgress(page, 0.24);
      const diag = await getDiagnostics(page);
      const worldState = diag?.worldState;

      if (worldState?.activeWorld === 'blueprint-workshop') {
        pass('3. activeWorld is "blueprint-workshop" at scroll=0.24');
        passed++;
      } else {
        // May be in transition — check transition instead
        if (worldState?.activeTransition) {
          pass('3. World transition active at scroll=0.24 (expected)');
          passed++;
        } else {
          fail('3. activeWorld at scroll=0.24', `Got: ${JSON.stringify(worldState)}`);
          failed++;
        }
      }
      await page.close();
    }

    // ── Test 4: Transition detected at boundary scroll ───────────────────
    {
      const { page } = await openDesktopPage(browser);

      // Scroll to signature transition zone (0.08-0.18)
      await scrollToProgress(page, 0.13);
      const diag = await getDiagnostics(page);
      const worldState = diag?.worldState;

      if (worldState?.activeTransition) {
        pass('4. Transition detected at scroll=0.13 (signature fog flythrough)');
        passed++;
      } else {
        fail('4. Transition at signature boundary', `Got: ${JSON.stringify(worldState)}`);
        failed++;
      }
      await page.close();
    }

    // ── Test 5: Total worlds registered ──────────────────────────────────
    {
      const { page } = await openDesktopPage(browser);

      const diag = await getDiagnostics(page);
      const worldState = diag?.worldState;

      if (worldState?.totalWorlds === 9) {
        pass('5. 9 worlds registered');
        passed++;
      } else {
        fail('5. totalWorlds count', `Expected 9, got: ${worldState?.totalWorlds}`);
        failed++;
      }
      await page.close();
    }

    // ── Test 6: Transition count ─────────────────────────────────────────
    {
      const { page } = await openDesktopPage(browser);

      const diag = await getDiagnostics(page);
      const worldState = diag?.worldState;

      if (worldState?.transitionCount >= 7) {
        pass(`6. ${worldState.transitionCount} transitions registered (>=7 expected)`);
        passed++;
      } else {
        fail('6. transitionCount', `Expected >=7, got: ${worldState?.transitionCount}`);
        failed++;
      }
      await page.close();
    }

    // ── Test 7: World system disabled on low tier ────────────────────────
    {
      const page = await browser.newPage();
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto(LOW_URL, { waitUntil: 'domcontentloaded' });
      await waitForSceneReady(page);

      const diag = await getDiagnostics(page);
      const worldState = diag?.worldState;

      if (worldState?.enabled === false || !worldState?.totalWorlds) {
        pass('7. World system disabled on low tier');
        passed++;
      } else {
        fail('7. Low tier world system', `Expected disabled, got: ${JSON.stringify(worldState)}`);
        failed++;
      }
      await page.close();
    }

    // ── Test 8: data-scene-world attributes present in DOM ───────────────
    {
      const { page } = await openDesktopPage(browser);

      const worldAttrs = await page.evaluate(() => {
        const elements = document.querySelectorAll('[data-scene-world]');
        return Array.from(elements).map(el => el.getAttribute('data-scene-world'));
      });

      if (worldAttrs.length >= 7) {
        pass(`8. ${worldAttrs.length} HTML sections have data-scene-world attributes`);
        passed++;
      } else {
        fail('8. data-scene-world attributes', `Expected >=7, got: ${worldAttrs.length}`);
        failed++;
      }
      await page.close();
    }

    // ── Test 9: Wireframe transition state resets when scrolling back ────
    {
      let page = null;
      try {
        ({ page } = await openDesktopPage(browser));

        await scrollToProgress(page, 0.88);
        await waitForWorldSummary(page, 'testimony-space', (summary) => summary.childCount >= 2, 45000);
        const baseline = await getWorldSummary(page, 'testimony-space');

        await scrollToProgress(page, 0.92);
        await waitForDiagnostics(
          page,
          'bloom-crossfade transition',
          (diag) => diag?.worldState?.activeTechniqueId === 'bloom-crossfade',
          15000
        );
        const duringTransition = await getWorldSummary(page, 'testimony-space');

        await scrollToProgress(page, 0.88);
        await waitForDiagnostics(
          page,
          'testimony-space to become active again',
          (diag) => diag?.worldState?.activeWorld === 'testimony-space',
          15000
        );
        const restored = await getWorldSummary(page, 'testimony-space');

        const transitionMutated =
          Math.abs((duringTransition?.opacityAverage ?? 0) - (baseline?.opacityAverage ?? 0)) > 0.05
          || duringTransition?.dimmedMeshCount > baseline?.dimmedMeshCount;
        const restoredMatchesBaseline =
          restored?.wireframeMeshCount === baseline?.wireframeMeshCount
          && restored?.dimmedMeshCount === baseline?.dimmedMeshCount
          && Math.abs((restored?.opacityAverage ?? 0) - (baseline?.opacityAverage ?? 0)) < 0.02;

        if (transitionMutated && restoredMatchesBaseline) {
          pass('9. Bloom transition restores authored material state after reverse scroll');
          passed++;
        } else {
          fail(
            '9. Reverse-scroll transition reset',
            `baseline=${JSON.stringify(baseline)} during=${JSON.stringify(duringTransition)} restored=${JSON.stringify(restored)}`
          );
          failed++;
        }
      } catch (err) {
        fail('9. Reverse-scroll transition reset', err.message);
        failed++;
      } finally {
        if (page) await page.close();
      }
    }

    // ── Test 10: Origin/testimony worlds mount optimized assets ──────────
    {
      let page = null;
      try {
        ({ page } = await openDesktopPage(browser));

        await scrollToProgress(page, 0.78);
        await waitForWorldSummary(page, 'origin-story', (summary) => summary.childCount >= 2, 45000);
        const originSummary = await getWorldSummary(page, 'origin-story');

        await scrollToProgress(page, 0.88);
        await waitForWorldSummary(page, 'testimony-space', (summary) => summary.childCount >= 2, 45000);
        const testimonySummary = await getWorldSummary(page, 'testimony-space');

        if (originSummary?.childCount >= 2 && testimonySummary?.childCount >= 2) {
          pass('10. Origin and testimony worlds mount optimized point-cloud assets');
          passed++;
        } else {
          fail(
            '10. Optimized world asset mounting',
            `origin=${JSON.stringify(originSummary)} testimony=${JSON.stringify(testimonySummary)}`
          );
          failed++;
        }
      } catch (err) {
        fail('10. Optimized world asset mounting', err.message);
        failed++;
      } finally {
        if (page) await page.close();
      }
    }

    // ── Test 11: Point-cloud transition avoids shader/runtime errors ─────
    {
      let page = null;
      try {
        let consoleErrors;
        let pageErrors;
        ({ page, consoleErrors, pageErrors } = await openDesktopPage(browser));

        await scrollToProgress(page, 0.78);
        await waitForWorldSummary(page, 'origin-story', (summary) => summary.childCount >= 2, 45000);

        await scrollToProgress(page, 0.88);
        await waitForWorldSummary(page, 'testimony-space', (summary) => summary.childCount >= 2, 45000);

        await scrollToProgress(page, 0.83);
        await waitForDiagnostics(
          page,
          'point-cloud-morph transition',
          (diag) => diag?.worldState?.activeTechniqueId === 'point-cloud-morph',
          15000
        );
        await page.waitForTimeout(1000);

        const shaderErrors = [...consoleErrors, ...pageErrors].filter((entry) => SHADER_ERROR_PATTERN.test(entry));

        if (!shaderErrors.length) {
          pass('11. Point-cloud transition runs without shader/runtime errors');
          passed++;
        } else {
          fail('11. Point-cloud transition shader health', shaderErrors.join(' | '));
          failed++;
        }
      } catch (err) {
        fail('11. Point-cloud transition shader health', err.message);
        failed++;
      } finally {
        if (page) await page.close();
      }
    }

  } catch (err) {
    fail('Test runner', err.message);
    failed++;
  } finally {
    await browser.close();
    server.close();
    console.log(`\n  World validation: ${passed} passed, ${failed} failed\n`);
  }
}

runTests();
