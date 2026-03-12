/**
 * validate-effects-desktop.js — Desktop-forced hero fidelity validation
 *
 * Runs the hero scene with explicit query-param overrides so the desktop
 * scatter pipeline is exercised even in automated environments that would
 * otherwise default to the low tier.
 */

const { chromium } = require('playwright');
const { PNG } = require('pngjs');
const fs = require('fs');
const path = require('path');
const { startStaticServer } = require('./helpers/static-server');

const PORT = 8766;
const ROOT = path.resolve(__dirname, '..');
const EVIDENCE_DIR = path.resolve(__dirname, 'evidence-desktop');
const BASE_URL = `http://localhost:${PORT}`;
const DESKTOP_URL = `${BASE_URL}/?sceneTier=desktop&sceneForceDesktopFX=1&sceneDisablePerfAutoDowngrade=1`;
const SCENE_CLIP = { x: 120, y: 120, width: 1040, height: 620 };
const QUIET_CLIP_REGION = { x: 960, y: 80, width: 80, height: 80 };
const FOCAL_CLIP_REGION = { x: 300, y: 140, width: 460, height: 320 };
const BURST_CLIP_REGION = { x: 450, y: 200, width: 160, height: 160 };

const CRITERIA = {
  D1_MIN_SCATTER_SAMPLES: 180,
  D2_MIN_IDLE_SCATTER_INTENSITY: 0.05,
  D3_MIN_FOCAL_RATIO: 1.5,
  D4_MIN_DRAG_SCATTER_DELTA: 0.025,
  D5_MIN_RELEASE_SCATTER_DELTA: 0.035,
  D6_MIN_DRAG_WAKE_BRIGHTNESS_DELTA: 26,
  D7_MIN_RELEASE_BRIGHTNESS_DELTA: 34,
  D8_MAX_COPY_ZONE_DENSITY: 0.26,
  D8_MAX_COPY_SHIELD_OPACITY: 0.28,
  D8_MAX_COPY_REGION_MEAN: 108,
  D9_MAX_FRAME_MS_HARDWARE: 18,
  D9_MAX_POST_MS_HARDWARE: 8,
};

async function getDiagnostics(page) {
  return page.evaluate(() => (typeof window.__sceneDiagnostics === 'function' ? window.__sceneDiagnostics() : null));
}

async function getToolScreenPosition(page, toolId) {
  return page.evaluate((id) => {
    const diag = typeof window.__sceneDiagnostics === 'function' ? window.__sceneDiagnostics() : null;
    return diag?.toolScreenPositions?.[id] || null;
  }, toolId);
}

async function hoverTool(page, toolId) {
  const pos = await getToolScreenPosition(page, toolId);
  if (!pos) throw new Error(`Missing screen position for ${toolId}`);

  const offsets = [[0, 0]];
  for (const radius of [18, 32, 52, 76, 96]) {
    for (const dx of [-radius, 0, radius]) {
      for (const dy of [-radius, 0, radius]) {
        if (dx === 0 && dy === 0) continue;
        offsets.push([dx, dy]);
      }
    }
  }

  for (const [dx, dy] of offsets) {
    await page.mouse.move(pos.x + dx, pos.y + dy, { steps: 6 });
    await page.waitForTimeout(80);
    const diag = await getDiagnostics(page);
    if (diag?.hoverTarget === toolId) {
      return { x: pos.x + dx, y: pos.y + dy };
    }
  }

  throw new Error(`Unable to hover ${toolId}`);
}

async function resolveToolTarget(page, preferredToolIds) {
  const ids = Array.isArray(preferredToolIds) ? preferredToolIds : [preferredToolIds];
  for (const id of ids) {
    try {
      const hovered = await hoverTool(page, id);
      return { toolId: id, ...hovered };
    } catch {
      // try next
    }
  }

  throw new Error(`Unable to hover any preferred tool: ${ids.join(', ')}`);
}

async function dragTool(page, preferredToolIds, deltaX = 170, steps = 20) {
  const target = await resolveToolTarget(page, preferredToolIds);
  await page.mouse.move(target.x, target.y, { steps: 4 });
  await page.waitForTimeout(120);
  await page.mouse.down();
  await page.mouse.move(target.x + deltaX, target.y - 10, { steps });
  await page.waitForTimeout(180);
  const diag = await getDiagnostics(page);
  await page.mouse.up();
  return {
    ...diag,
    interactedTool: target.toolId,
    interactionPoint: { x: target.x, y: target.y },
  };
}

async function getBurstPoint(page, viewportSize) {
  const diag = await getDiagnostics(page);
  const tools = Object.values(diag?.toolScreenPositions || {});
  const candidates = [
    { x: Math.round(viewportSize.width * 0.5), y: Math.round(viewportSize.height * 0.62) },
    { x: Math.round(viewportSize.width * 0.44), y: Math.round(viewportSize.height * 0.58) },
    { x: Math.round(viewportSize.width * 0.56), y: Math.round(viewportSize.height * 0.58) },
    { x: Math.round(viewportSize.width * 0.5), y: Math.round(viewportSize.height * 0.69) },
  ];

  const scored = candidates.map((point) => {
    const nearest = tools.reduce((best, tool) => Math.min(best, Math.hypot(point.x - tool.x, point.y - tool.y)), Infinity);
    return { point, nearest };
  }).sort((a, b) => b.nearest - a.nearest);

  return scored[0]?.point || { x: Math.round(viewportSize.width * 0.5), y: Math.round(viewportSize.height * 0.64) };
}

function decodePng(buffer) {
  return PNG.sync.read(buffer);
}

async function captureSceneFrame(page, filename) {
  const options = { clip: SCENE_CLIP };
  if (filename) options.path = path.join(EVIDENCE_DIR, filename);

  const buffer = await page.screenshot(options);
  return {
    buffer,
    png: decodePng(buffer),
  };
}

async function captureScenePng(page, filename) {
  const frame = await captureSceneFrame(page, filename);
  return frame.png;
}

function percentile(sortedValues, ratio) {
  if (!sortedValues.length) return 0;
  const index = Math.min(sortedValues.length - 1, Math.max(0, Math.floor((sortedValues.length - 1) * ratio)));
  return sortedValues[index];
}

function regionStats(png, region) {
  const brightness = [];
  let brightnessSum = 0;
  let count = 0;
  const maxX = Math.min(png.width, region.x + region.width);
  const maxY = Math.min(png.height, region.y + region.height);

  for (let y = region.y; y < maxY; y += 4) {
    for (let x = region.x; x < maxX; x += 4) {
      const idx = (png.width * y + x) * 4;
      const sum = png.data[idx] + png.data[idx + 1] + png.data[idx + 2];
      brightness.push(sum);
      brightnessSum += sum;
      count++;
    }
  }

  brightness.sort((a, b) => a - b);
  return {
    meanBrightness: count ? brightnessSum / count : 0,
    p95Brightness: percentile(brightness, 0.95),
    p99Brightness: percentile(brightness, 0.99),
  };
}

function diffRegionStats(basePng, nextPng, region) {
  const brightnessDelta = [];
  let totalBrightnessDelta = 0;
  let count = 0;
  const maxX = Math.min(basePng.width, nextPng.width, region.x + region.width);
  const maxY = Math.min(basePng.height, nextPng.height, region.y + region.height);

  for (let y = region.y; y < maxY; y += 4) {
    for (let x = region.x; x < maxX; x += 4) {
      const idx = (basePng.width * y + x) * 4;
      const baseBrightness = basePng.data[idx] + basePng.data[idx + 1] + basePng.data[idx + 2];
      const nextBrightness = nextPng.data[idx] + nextPng.data[idx + 1] + nextPng.data[idx + 2];
      const delta = nextBrightness - baseBrightness;
      brightnessDelta.push(delta);
      totalBrightnessDelta += Math.abs(delta);
      count++;
    }
  }

  brightnessDelta.sort((a, b) => a - b);
  return {
    meanAbsBrightnessDelta: count ? totalBrightnessDelta / count : 0,
    p95BrightnessDelta: percentile(brightnessDelta, 0.95),
    p99BrightnessDelta: percentile(brightnessDelta, 0.99),
  };
}

function makeClipRegionFromScreen(screenX, screenY, width, height) {
  const x = Math.max(0, Math.round(screenX - SCENE_CLIP.x - width / 2));
  const y = Math.max(0, Math.round(screenY - SCENE_CLIP.y - height / 2));
  return {
    x,
    y,
    width: Math.max(8, Math.min(SCENE_CLIP.width - x, Math.round(width))),
    height: Math.max(8, Math.min(SCENE_CLIP.height - y, Math.round(height))),
  };
}

function makeCopyCleanRegion(diag) {
  const windowRect = diag?.readabilityWindow;
  if (!windowRect?.active) return { x: 700, y: 180, width: 140, height: 160 };

  const width = Math.max(90, Math.min(150, Math.round(windowRect.width * 0.18)));
  const height = Math.max(90, Math.min(170, Math.round(windowRect.height * 0.26)));
  const centerX = windowRect.left + windowRect.width * 0.78;
  const centerY = windowRect.top + windowRect.height * 0.50;
  return makeClipRegionFromScreen(centerX, centerY, width, height);
}

(async () => {
  console.log('\n╔══════════════════════════════════════════╗');
  console.log('║   Desktop Hero Fidelity — Playwright    ║');
  console.log('╚══════════════════════════════════════════╝\n');

  fs.mkdirSync(EVIDENCE_DIR, { recursive: true });

  const server = await startStaticServer(ROOT, PORT);
  console.log(`[server] Listening on ${BASE_URL}`);

  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  const pageErrors = [];
  const results = [];

  const record = (test, pass, detail) => {
    results.push({ test, pass, detail });
    console.log(`  ${pass ? '✓ PASS' : '✗ FAIL'} ${test}${detail ? ` — ${detail}` : ''}`);
  };

  page.on('pageerror', (error) => {
    const detail = error.stack || error.message || String(error);
    pageErrors.push(detail);
    console.error(`  [pageerror] ${detail}`);
  });

  try {
    console.log('[init] Loading desktop-forced hero...');
    await page.goto(DESKTOP_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => typeof window.__sceneDiagnostics === 'function', { timeout: 15000 });
    await page.waitForFunction(() => {
      const diag = window.__sceneDiagnostics?.();
      return diag
        && diag.bootHealthy
        && diag.activeTier === 'desktop'
        && diag.featureFlags?.halfResScatterPass === true
        && diag.desktopScatter?.configured === true;
    }, { timeout: 20000 });
    await page.waitForTimeout(2200);

    const initialDiag = await getDiagnostics(page);
    record(
      'Desktop overrides apply',
      initialDiag?.activeTier === 'desktop'
        && initialDiag?.queryOverrides?.sceneTier === 'desktop'
        && initialDiag?.queryOverrides?.forceDesktopFX === true
        && initialDiag?.queryOverrides?.disablePerfAutoDowngrade === true,
      `active=${initialDiag?.activeTier ?? 'n/a'} mode=${initialDiag?.desktopScatter?.mode ?? 'n/a'}`
    );

    record(
      'Scatter pass active on load',
      !!initialDiag
        && initialDiag.featureFlags.halfResScatterPass === true
        && initialDiag.desktopScatter?.configured === true
        && initialDiag.desktopScatter?.mode === 'desktop-scatter'
        && initialDiag.desktopScatter?.active === true,
      `mode=${initialDiag?.desktopScatter?.mode ?? 'n/a'} active=${initialDiag?.desktopScatter?.active ?? 'n/a'}`
    );

    const idleSamplesPass = !!initialDiag
      && (initialDiag.visualMetrics?.volumetricScatterSamples ?? 0) >= CRITERIA.D1_MIN_SCATTER_SAMPLES
      && (initialDiag.visualMetrics?.scatterPassIntensity ?? 0) >= CRITERIA.D2_MIN_IDLE_SCATTER_INTENSITY;
    record(
      'Idle scatter density present',
      idleSamplesPass,
      `samples=${initialDiag?.visualMetrics?.volumetricScatterSamples ?? 'n/a'} intensity=${initialDiag?.visualMetrics?.scatterPassIntensity ?? 'n/a'}`
    );

    const idlePng = await captureScenePng(page, 'desktop-idle.png');
    const copyPng = await captureScenePng(page, 'desktop-copy-clean.png');
    const idleFocalStats = regionStats(idlePng, FOCAL_CLIP_REGION);
    const idleQuietStats = regionStats(idlePng, QUIET_CLIP_REGION);
    const focalRatio = idleFocalStats.p99Brightness / Math.max(1, idleQuietStats.meanBrightness);
    record(
      'Idle depth layering',
      focalRatio > CRITERIA.D3_MIN_FOCAL_RATIO,
      `${focalRatio.toFixed(2)}×`
    );

    const dragDiag = await dragTool(page, ['saw', 'hammer', 'wrench'], 170, 20);
    await page.waitForTimeout(180);
    const dragPng = await captureScenePng(page, 'desktop-drag-wake.png');
    const dragRegion = makeClipRegionFromScreen(
      dragDiag?.interactionPoint?.x || 640,
      dragDiag?.interactionPoint?.y || 360,
      220,
      220
    );
    const dragDiff = diffRegionStats(idlePng, dragPng, dragRegion);
    const dragScatterDelta = (dragDiag?.visualMetrics?.scatterPassIntensity ?? 0) - (initialDiag?.visualMetrics?.scatterPassIntensity ?? 0);
    record(
      'Hover/drag scatter rises',
      dragScatterDelta >= CRITERIA.D4_MIN_DRAG_SCATTER_DELTA,
      `${dragScatterDelta.toFixed(3)}`
    );
    record(
      'Hover/drag wake screenshot gate',
      dragDiff.p99BrightnessDelta >= CRITERIA.D6_MIN_DRAG_WAKE_BRIGHTNESS_DELTA,
      `p99Δ=${dragDiff.p99BrightnessDelta.toFixed(2)}`
    );

    await page.mouse.move(60, 60, { steps: 6 });
    await page.waitForTimeout(300);
    const burstPoint = await getBurstPoint(page, page.viewportSize());
    await page.mouse.click(burstPoint.x, burstPoint.y);
    let releaseElapsedMs = 0;
    const releaseCandidates = [];
    for (const stepMs of [120, 80, 80, 80, 80, 120]) {
      await page.waitForTimeout(stepMs);
      releaseElapsedMs += stepMs;
      const frame = await captureSceneFrame(page);
      const diag = await getDiagnostics(page);
      releaseCandidates.push({
        label: `${releaseElapsedMs}ms`,
        frame,
        diag,
        diff: diffRegionStats(idlePng, frame.png, BURST_CLIP_REGION),
      });
    }
    const releaseCandidate = releaseCandidates.reduce((best, candidate) => (
      candidate.diff.p99BrightnessDelta > best.diff.p99BrightnessDelta ? candidate : best
    ));
    fs.writeFileSync(path.join(EVIDENCE_DIR, 'desktop-release-lift.png'), releaseCandidate.frame.buffer);
    const releaseDiag = releaseCandidate.diag;
    const releaseDiff = releaseCandidate.diff;
    const releaseScatterDelta = (releaseDiag?.visualMetrics?.scatterPassIntensity ?? 0) - (initialDiag?.visualMetrics?.scatterPassIntensity ?? 0);
    record(
      'Release scatter rises',
      releaseScatterDelta >= CRITERIA.D5_MIN_RELEASE_SCATTER_DELTA,
      `${releaseScatterDelta.toFixed(3)}`
    );
    record(
      'Release atmospheric lift screenshot gate',
      releaseDiff.p99BrightnessDelta >= CRITERIA.D7_MIN_RELEASE_BRIGHTNESS_DELTA,
      `p99Δ=${releaseDiff.p99BrightnessDelta.toFixed(2)} @${releaseCandidate.label}`
    );

    const copyRegion = makeCopyCleanRegion(initialDiag);
    const copyStats = regionStats(copyPng, copyRegion);
    const copyPass = !!initialDiag
      && (initialDiag.visualMetrics?.densityInCopyZone ?? 1) <= CRITERIA.D8_MAX_COPY_ZONE_DENSITY
      && (initialDiag.visualMetrics?.copyShieldOpacity ?? 1) <= CRITERIA.D8_MAX_COPY_SHIELD_OPACITY
      && copyStats.meanBrightness <= CRITERIA.D8_MAX_COPY_REGION_MEAN;
    record(
      'Copy corridor cleanliness',
      copyPass,
      `density=${initialDiag?.visualMetrics?.densityInCopyZone ?? 'n/a'} shield=${initialDiag?.visualMetrics?.copyShieldOpacity ?? 'n/a'} mean=${copyStats.meanBrightness.toFixed(1)}`
    );

    const representativeHardware = !initialDiag?.environment?.lowEndGpu;
    const perfPass = !representativeHardware || (
      (initialDiag?.avgFrameMs ?? Number.POSITIVE_INFINITY) <= CRITERIA.D9_MAX_FRAME_MS_HARDWARE
      && (initialDiag?.avgPostMs ?? Number.POSITIVE_INFINITY) <= CRITERIA.D9_MAX_POST_MS_HARDWARE
    );
    record(
      'Desktop performance target',
      perfPass,
      representativeHardware
        ? `frame=${initialDiag?.avgFrameMs ?? 'n/a'}ms post=${initialDiag?.avgPostMs ?? 'n/a'}ms`
        : `software/low-end renderer; observed frame=${initialDiag?.avgFrameMs ?? 'n/a'}ms post=${initialDiag?.avgPostMs ?? 'n/a'}ms`
    );

    record(
      'No page errors',
      pageErrors.length === 0,
      pageErrors[0] || ''
    );

    const failed = results.some((result) => !result.pass);
    fs.writeFileSync(
      path.join(EVIDENCE_DIR, 'results.json'),
      JSON.stringify({
        url: DESKTOP_URL,
        generatedAt: new Date().toISOString(),
        results,
      }, null, 2)
    );

    console.log('\n  Evidence PNGs saved to: tests/evidence-desktop/');
    console.log(`\n  Overall: ${failed ? '✗ Desktop fidelity checks FAILED' : '✓ Desktop fidelity checks passed'}`);
    process.exitCode = failed ? 1 : 0;
  } catch (error) {
    console.error(`\n  ✗ FAIL ${error.stack || error.message || String(error)}`);
    process.exitCode = 1;
  } finally {
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
})();
