const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const { startStaticServer } = require('./helpers/static-server');

const PORT = 8766;
const ROOT = path.resolve(__dirname, '..');
const EVIDENCE_DIR = path.resolve(__dirname, 'evidence-desktop');
const BASE_URL = `http://localhost:${PORT}`;
const DESKTOP_URL = `${BASE_URL}/?sceneTier=desktop&sceneForceDesktopFX=1`;

function ensureEvidenceDir() {
  fs.mkdirSync(EVIDENCE_DIR, { recursive: true });
}

async function getDiagnostics(page) {
  return page.evaluate(() => (typeof window.__sceneDiagnostics === 'function' ? window.__sceneDiagnostics() : null));
}

async function waitForDesktopScene(page) {
  await page.waitForFunction(() => document.getElementById('preloader')?.classList.contains('hidden'), { timeout: 15000 });
  await page.waitForFunction(() => typeof window.__sceneDiagnostics === 'function', { timeout: 15000 });
  await page.waitForFunction(() => {
    const diag = window.__sceneDiagnostics?.();
    return diag
      && diag.bootHealthy
      && diag.assetMode === 'hero-primary'
      && diag.heroAssetVerificationState === 'final-ready'
      && diag.toolAssetSource?.hammer === 'hero-glb'
      && diag.toolAssetSource?.wrench === 'hero-glb'
      && diag.toolAssetSource?.saw === 'hero-glb';
  }, { timeout: 15000 });
}

async function setPhase(page, phase) {
  await page.evaluate((nextPhase) => {
    window.__setSceneDirectorPhaseForTest?.(nextPhase);
  }, phase);
  await page.waitForTimeout(260);
}

async function capturePhase(page, phase, filename) {
  await setPhase(page, phase);
  await page.screenshot({ path: path.join(EVIDENCE_DIR, filename) });
  return getDiagnostics(page);
}

async function getWrenchCenter(page) {
  const diag = await getDiagnostics(page);
  const bounds = diag?.projectedToolBounds?.wrench;
  if (!bounds || !Number.isFinite(bounds.left) || !Number.isFinite(bounds.right)) {
    throw new Error('Missing wrench bounds.');
  }
  return {
    x: Math.round((bounds.left + bounds.right) * 0.5),
    y: Math.round((bounds.top + bounds.bottom) * 0.5),
  };
}

async function dragWrench(page) {
  const point = await getWrenchCenter(page);
  await page.mouse.move(point.x, point.y, { steps: 6 });
  await page.mouse.down();
  await page.mouse.move(point.x + 150, point.y - 10, { steps: 20 });
  await page.waitForTimeout(180);
  await page.mouse.up();
  return point;
}

async function inspectPanelPlacement(page) {
  return page.evaluate(() => {
    const panel = document.getElementById('tool-info-panel');
    const nav = document.querySelector('.nav__inner');
    const diag = window.__sceneDiagnostics?.();
    const panelRect = panel?.getBoundingClientRect?.();
    const navRect = nav?.getBoundingClientRect?.();
    const readability = diag?.readabilityWindow?.active
      ? {
          left: diag.readabilityWindow.left,
          top: diag.readabilityWindow.top,
          right: diag.readabilityWindow.left + diag.readabilityWindow.width,
          bottom: diag.readabilityWindow.top + diag.readabilityWindow.height,
        }
      : null;
    const wrench = diag?.projectedToolBounds?.wrench || null;
    const overlaps = (a, b) => {
      if (!a || !b) return false;
      return !(a.right <= b.left || a.left >= b.right || a.bottom <= b.top || a.top >= b.bottom);
    };

    return {
      visible: !!panel
        && panel.style.visibility !== 'hidden'
        && parseFloat(panel.style.opacity || '0') > 0.5
        && !!panelRect
        && panelRect.width > 0
        && panelRect.height > 0
        && panelRect.right > 0
        && panelRect.bottom > 0,
      panelRect: panelRect
        ? { left: panelRect.left, top: panelRect.top, right: panelRect.right, bottom: panelRect.bottom, width: panelRect.width, height: panelRect.height }
        : null,
      navOverlap: overlaps(panelRect, navRect),
      readabilityOverlap: overlaps(panelRect, readability),
      wrenchOverlap: overlaps(panelRect, wrench),
      wrench,
      readability,
    };
  });
}

(async () => {
  ensureEvidenceDir();

  console.log('\n╔══════════════════════════════════════════╗');
  console.log('║ Hero Scene Validation (Desktop Lockup)  ║');
  console.log('╚══════════════════════════════════════════╝\n');

  const server = await startStaticServer(ROOT, PORT);
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const pageErrors = [];
  const checks = [];

  page.on('pageerror', (error) => {
    pageErrors.push(error.stack || error.message || String(error));
  });

  const record = (name, pass, detail = '') => {
    checks.push({ name, pass, detail });
    console.log(`  ${pass ? '✓ PASS' : '✗ FAIL'} ${name}${detail ? ` — ${detail}` : ''}`);
  };

  try {
    await page.goto(DESKTOP_URL, { waitUntil: 'domcontentloaded' });
    await waitForDesktopScene(page);

    const bootDiag = await getDiagnostics(page);
    const revealDiag = await capturePhase(page, 'reveal', 'desktop-reveal.png');
    const staticDiag = await capturePhase(page, 'staticLayout', 'desktop-static-layout.png');
    const lockupDiag = await capturePhase(page, 'lockup', 'desktop-lockup.png');
    const idleDiag = await capturePhase(page, 'interactiveIdle', 'desktop-interactive-idle.png');
    const scrollDiag = await capturePhase(page, 'scrollTransition', 'desktop-scroll-transition.png');

    record('Desktop scene loads without page errors', pageErrors.length === 0, pageErrors[0] || '');
    record(
      'Desktop diagnostics report the assembly orbit hero pack',
      bootDiag?.heroAssetBuildStage === 'assembly-orbit-external-support'
        && bootDiag?.heroAssetVerificationState === 'final-ready'
        && bootDiag?.toolAssetSource?.hammer === 'hero-glb'
        && bootDiag?.toolAssetSource?.wrench === 'hero-glb'
        && bootDiag?.toolAssetSource?.saw === 'hero-glb'
        && bootDiag?.assetLicense === 'CC0',
      `stage=${bootDiag?.heroAssetBuildStage} verify=${bootDiag?.heroAssetVerificationState} sources=${JSON.stringify(bootDiag?.toolAssetSource || {})}`
    );
    record(
      'Desktop post stack stays bloom-first with optional scatter configuration',
      bootDiag?.desktopScatter?.configured === true
        && ['disabled', 'desktop-base', 'desktop-scatter'].includes(bootDiag?.desktopScatter?.mode),
      `configured=${bootDiag?.desktopScatter?.configured} mode=${bootDiag?.desktopScatter?.mode} authority=${bootDiag?.perfAuthority}`
    );
    record(
      'Desktop diagnostics expose material, environment, interaction, and post cues',
      typeof bootDiag?.materialProfile === 'string'
        && typeof bootDiag?.environmentCue === 'string'
        && typeof idleDiag?.interactionCue === 'string'
        && typeof idleDiag?.postFxMode === 'string',
      `material=${bootDiag?.materialProfile} env=${bootDiag?.environmentCue} interaction=${idleDiag?.interactionCue} post=${idleDiag?.postFxMode}`
    );
    record(
      'Desktop lockup resolves to the dedicated desktop preset',
      staticDiag?.orbitLayout?.key === 'desktop' && staticDiag?.compositionMode === 'stillLifeDesktop',
      `layout=${staticDiag?.orbitLayout?.key} composition=${staticDiag?.compositionMode}`
    );
    record(
      'Desktop wrench fills the authored hero height and framing margins',
      (staticDiag?.heroViewportHeightRatio ?? 0) >= 0.58
        && (staticDiag?.heroViewportHeightRatio ?? 0) <= 0.65
        && (staticDiag?.heroViewportAreaRatio ?? 0) >= 0.17
        && (staticDiag?.heroViewportAreaRatio ?? 0) <= 0.21
        && (staticDiag?.heroClearancePx?.top ?? 0) >= 63
        && (staticDiag?.heroClearancePx?.right ?? 0) >= 86
        && (staticDiag?.heroClearancePx?.bottom ?? 0) >= 99
        && (staticDiag?.heroHeadlineOverlapRatio ?? 0) >= 0.05
        && (staticDiag?.heroHeadlineOverlapRatio ?? 0) <= 0.11
        && (staticDiag?.heroArtLaneOccupancy ?? 0) >= 0.29
        && (staticDiag?.heroArtLaneOccupancy ?? 0) <= 0.35
        && (staticDiag?.heroRightThirdOffsetPx ?? 0) >= -48
        && (staticDiag?.heroRightThirdOffsetPx ?? 0) <= -22,
      `ratio=${staticDiag?.heroViewportHeightRatio} area=${staticDiag?.heroViewportAreaRatio} overlap=${staticDiag?.heroHeadlineOverlapRatio} artLane=${staticDiag?.heroArtLaneOccupancy} offset=${staticDiag?.heroRightThirdOffsetPx} clearance=${JSON.stringify(staticDiag?.heroClearancePx || {})}`
    );
    record(
      'Reveal-to-lockup phases keep strong hero and world separation',
      (revealDiag?.heroReadMetrics?.focalContrast ?? 0) >= 6
        && (lockupDiag?.heroReadMetrics?.focalContrast ?? 0) >= 3.8
        && (lockupDiag?.worldReadMetrics?.backgroundSeparation ?? 0) >= 0.18
        && (scrollDiag?.worldReadMetrics?.copyContamination ?? 1) <= 0.24,
      `reveal=${revealDiag?.heroReadMetrics?.focalContrast ?? 'n/a'} lockup=${lockupDiag?.heroReadMetrics?.focalContrast ?? 'n/a'} separation=${lockupDiag?.worldReadMetrics?.backgroundSeparation ?? 'n/a'} contamination=${scrollDiag?.worldReadMetrics?.copyContamination ?? 'n/a'}`
    );
    record(
      'Desktop staging elements stay inside the authored hero lane',
      (staticDiag?.heroBacklightCoverage ?? 0) >= 0.95
        && (staticDiag?.heroShadowCoverage ?? 0) >= 0.95,
      `backlight=${staticDiag?.heroBacklightCoverage ?? 'n/a'} shadow=${staticDiag?.heroShadowCoverage ?? 'n/a'}`
    );

    record(
      'Lockup keeps the desktop hero wrench-only with no support clutter',
      (lockupDiag?.supportVisibleCount ?? 99) === 0
        && lockupDiag?.mobileSupportState?.hammer !== 'visible'
        && lockupDiag?.mobileSupportState?.saw !== 'visible',
      `support=${JSON.stringify(lockupDiag?.supportPolicy || lockupDiag?.mobileSupportState || {})} visible=${lockupDiag?.supportVisibleCount ?? 'n/a'}`
    );

    record(
      'Interactive idle preserves safe zones and clean hero framing',
      !Object.values(idleDiag?.safeZoneViolations?.nav || {}).some(Boolean)
        && !Object.values(idleDiag?.safeZoneViolations?.viewport || {}).some(Boolean)
        && idleDiag?.safeZoneViolations?.readability?.wrench === false
        && idleDiag?.ctaLaneIntrusions?.wrench === false
        && (idleDiag?.heroReadMetrics?.focalContrast ?? 0) >= 4.2
        && (idleDiag?.particleStrokeCrossings?.headlineZone ?? 1) === 0
        && (idleDiag?.particleStrokeCrossings?.bodyZone ?? 1) === 0
        && (idleDiag?.particleStrokeCrossings?.ctaZone ?? 1) === 0
        && (idleDiag?.particleLongStrokeCount ?? 1) === 0
        && (idleDiag?.particleRodCount ?? 1) === 0
        && (idleDiag?.particleOutOfHeroLaneCount ?? 1) === 0
        && (idleDiag?.gridLuminanceUnderCopy ?? 1) <= 0.16,
      `safe=${JSON.stringify(idleDiag?.safeZoneViolations || {})} cta=${JSON.stringify(idleDiag?.ctaLaneIntrusions || {})} focal=${idleDiag?.heroReadMetrics?.focalContrast} particles=${JSON.stringify(idleDiag?.particleStrokeCrossings || {})} long=${idleDiag?.particleLongStrokeCount} rod=${idleDiag?.particleRodCount} out=${idleDiag?.particleOutOfHeroLaneCount} grid=${idleDiag?.gridLuminanceUnderCopy}`
    );

    record(
      'Interactive idle keeps support props intentionally absent',
      (idleDiag?.supportVisibleCount ?? 99) === 0
        && idleDiag?.mobileSupportState?.hammer !== 'visible'
        && idleDiag?.mobileSupportState?.saw !== 'visible',
      `support=${JSON.stringify(idleDiag?.supportPolicy || idleDiag?.mobileSupportState || {})} visible=${idleDiag?.supportVisibleCount ?? 'n/a'}`
    );

    await setPhase(page, 'interactiveIdle');
    const dragPoint = await dragWrench(page);
    await page.waitForTimeout(420);
    const dragDiag = await getDiagnostics(page);
    record(
      'Dragging the wrench produces localized hero response',
      (dragDiag?.toolInfluenceState?.wrench ?? 0) >= 0.14
        && (dragDiag?.releaseEnvelope ?? 0) >= 0.03
        && typeof dragDiag?.interactionCue === 'string',
      `wrench=${dragDiag?.toolInfluenceState?.wrench ?? 'n/a'} release=${dragDiag?.releaseEnvelope ?? 'n/a'} interaction=${dragDiag?.interactionCue ?? 'n/a'} @ ${dragPoint.x},${dragPoint.y}`
    );

    await page.evaluate(() => window.__openToolPanelForTest?.('wrench'));
    await page.waitForTimeout(220);
    const panelState = await inspectPanelPlacement(page);
    record(
      'Anchored callout avoids the nav and active object',
      panelState.visible === true
        && panelState.navOverlap === false
        && panelState.wrenchOverlap === false,
      JSON.stringify(panelState)
    );

    await page.waitForTimeout(3600);
    const perfDiag = await getDiagnostics(page);
    const perfPass = perfDiag?.perfAuthority !== 'local-hardware'
      || (
        (perfDiag?.avgFrameMs ?? Number.POSITIVE_INFINITY) <= 19
        && (perfDiag?.approxFps ?? 0) >= 58
      );
    record(
      'Performance reporting respects local-hardware versus software-ci authority',
      perfPass,
      perfDiag?.perfAuthority === 'local-hardware'
        ? `fps=${perfDiag?.approxFps ?? 'n/a'} frame=${perfDiag?.avgFrameMs ?? 'n/a'} post=${perfDiag?.avgPostMs ?? 'n/a'}`
        : `informational ${perfDiag?.perfAuthority} fps=${perfDiag?.approxFps ?? 'n/a'} frame=${perfDiag?.avgFrameMs ?? 'n/a'} post=${perfDiag?.avgPostMs ?? 'n/a'}`
    );

    const snapshot = await page.evaluate(() => window.__captureSceneSnapshot?.('validate-effects-desktop'));
    fs.writeFileSync(path.join(EVIDENCE_DIR, 'results.json'), JSON.stringify({
      generatedAt: new Date().toISOString(),
      bootDiag,
      revealDiag,
      staticDiag,
      lockupDiag,
      idleDiag,
      scrollDiag,
      dragDiag,
      panelState,
      perfDiag,
      snapshot,
      checks,
    }, null, 2));

    if (checks.some((check) => !check.pass)) {
      process.exitCode = 1;
    }
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
  } finally {
    await browser.close();
    await server.close();
  }
})();
