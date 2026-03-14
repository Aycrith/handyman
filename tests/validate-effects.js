const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const { startStaticServer } = require('./helpers/static-server');

const PORT = 8765;
const ROOT = path.resolve(__dirname, '..');
const EVIDENCE_DIR = path.resolve(__dirname, 'evidence');
const BASE_URL = `http://localhost:${PORT}`;
const HERO_URL = `${BASE_URL}/?sceneTier=desktop&sceneFreeze=staticLayout`;
const EXPECTED_ASSET_SET_VERSION = 'hero-pack-v5';
const EXPECTED_CONTRACT_VERSION = 'hero-asset-contract-v4';
const EXPECTED_BUILD_STAGE = 'assembly-orbit-bespoke-pack';

const VIEWPORTS = [
  { name: 'desktop-1440x900', viewport: { width: 1440, height: 900 }, expectedLayout: 'desktop', expectedComposition: 'stillLifeDesktop', heroHeightRange: [0.58, 0.65], heroAreaRange: [0.18, 0.21], heroOverlapRange: [0.05, 0.12], heroArtLaneRange: [0.30, 0.35], heroRightThirdRange: [-48, -22], allowHammerInteractive: false },
  { name: 'desktop-1280x800', viewport: { width: 1280, height: 800 }, expectedLayout: 'desktop', expectedComposition: 'stillLifeDesktop', heroHeightRange: [0.58, 0.65], heroAreaRange: [0.18, 0.21], heroOverlapRange: [0.05, 0.11], heroArtLaneRange: [0.30, 0.36], heroRightThirdRange: [-48, -22], allowHammerInteractive: false },
  { name: 'tablet-768x1024', viewport: { width: 768, height: 1024 }, expectedLayout: 'tablet', expectedComposition: 'tabletCluster', heroHeightRange: [0.46, 0.51], heroAreaRange: [0.20, 0.23], heroOverlapRange: [0.00, 0.02], heroArtLaneRange: [0.32, 0.36], heroRightThirdRange: [-36, -22], allowHammerInteractive: false },
  { name: 'mobile-430x932', viewport: { width: 430, height: 932 }, expectedLayout: 'mobile', expectedComposition: 'crownMobile', heroHeightRange: [0.38, 0.42], heroAreaRange: [0.17, 0.20], heroOverlapRange: [0, 0], heroArtLaneRange: [0.25, 0.29], heroRightThirdRange: [-48, -30], allowHammerInteractive: false },
  { name: 'narrow-390x844', viewport: { width: 390, height: 844 }, expectedLayout: 'narrow', expectedComposition: 'wrenchOnlyNarrow', heroHeightRange: [0.35, 0.39], heroAreaRange: [0.14, 0.17], heroOverlapRange: [0, 0], heroArtLaneRange: [0.20, 0.24], heroRightThirdRange: [-50, -34], allowHammerInteractive: false },
];

function ensureEvidenceDir() {
  fs.mkdirSync(EVIDENCE_DIR, { recursive: true });
}

function allClear(violations = {}) {
  return Object.values(violations).every((value) => value === false);
}

function ratio(numerator, denominator) {
  return denominator > 0 ? numerator / denominator : 0;
}

function center(rect = {}) {
  return {
    x: ((rect.left || 0) + (rect.right || 0)) * 0.5,
    y: ((rect.top || 0) + (rect.bottom || 0)) * 0.5,
  };
}

function isVisibleSupport(diag, toolId) {
  return diag?.mobileSupportState?.[toolId] === 'visible';
}

async function getDiagnostics(page) {
  return page.evaluate(() => (typeof window.__sceneDiagnostics === 'function' ? window.__sceneDiagnostics() : null));
}

async function waitForSceneReady(page) {
  await page.waitForFunction(() => document.getElementById('preloader')?.classList.contains('hidden'), { timeout: 15000 });
  await page.waitForFunction(() => typeof window.__sceneDiagnostics === 'function', { timeout: 15000 });
  await page.waitForFunction(({ assetSetVersion, contractVersion, buildStage }) => {
    const diag = window.__sceneDiagnostics?.();
    return diag
      && diag.bootHealthy
      && diag.assetMode === 'hero-primary'
      && diag.assetSetVersion === assetSetVersion
      && diag.assetContractVersion === contractVersion
      && diag.heroAssetBuildStage === buildStage
      && diag.heroAssetVerificationState === 'final-ready'
      && diag.toolAssetSource?.hammer === 'hero-glb'
      && diag.toolAssetSource?.wrench === 'hero-glb'
      && diag.toolAssetSource?.saw === 'hero-glb';
  }, {
    assetSetVersion: EXPECTED_ASSET_SET_VERSION,
    contractVersion: EXPECTED_CONTRACT_VERSION,
    buildStage: EXPECTED_BUILD_STAGE,
  }, {
    timeout: 15000,
  });
}

async function setPhase(page, phase) {
  await page.evaluate((nextPhase) => {
    window.__setSceneDirectorPhaseForTest?.(nextPhase);
  }, phase);
  await page.waitForTimeout(260);
}

(async () => {
  ensureEvidenceDir();

  console.log('\n╔══════════════════════════════════════════╗');
  console.log('║   Hero Scene Validation (Layout Gate)   ║');
  console.log('╚══════════════════════════════════════════╝\n');

  const server = await startStaticServer(ROOT, PORT);
  const browser = await chromium.launch({ headless: true });
  const checks = [];
  const results = [];

  const record = (name, pass, detail = '') => {
    checks.push({ name, pass, detail });
    console.log(`  ${pass ? '✓ PASS' : '✗ FAIL'} ${name}${detail ? ` — ${detail}` : ''}`);
  };

  try {
    for (const spec of VIEWPORTS) {
      const page = await browser.newPage({ viewport: spec.viewport });
      const pageErrors = [];

      page.on('pageerror', (error) => {
        pageErrors.push(error.stack || error.message || String(error));
      });

      await page.goto(HERO_URL, { waitUntil: 'domcontentloaded' });
      await waitForSceneReady(page);

      const staticDiag = await getDiagnostics(page);
      await page.screenshot({
        path: path.join(EVIDENCE_DIR, `${spec.name}-static-layout.png`),
      });

      record(`${spec.name}: scene loads without page errors`, pageErrors.length === 0, pageErrors[0] || '');
      record(
        `${spec.name}: freeze query locks the scene in static layout`,
        staticDiag?.queryOverrides?.freezePhase === 'static-layout' && staticDiag?.directorPhase === 'static-layout',
        `freeze=${staticDiag?.queryOverrides?.freezePhase} phase=${staticDiag?.directorPhase}`
      );
      record(
        `${spec.name}: runtime ships the three-tool bespoke hero pack`,
        staticDiag?.heroAssetBuildStage === EXPECTED_BUILD_STAGE
          && staticDiag?.assetSetVersion === EXPECTED_ASSET_SET_VERSION
          && staticDiag?.assetContractVersion === EXPECTED_CONTRACT_VERSION
          && staticDiag?.heroAssetVerificationState === 'final-ready'
          && staticDiag?.toolAssetSource?.hammer === 'hero-glb'
          && staticDiag?.toolAssetSource?.wrench === 'hero-glb'
          && staticDiag?.toolAssetSource?.saw === 'hero-glb'
          && typeof staticDiag?.assetLicense === 'string'
          && staticDiag.assetLicense.length > 0,
        `assetSet=${staticDiag?.assetSetVersion} contract=${staticDiag?.assetContractVersion} stage=${staticDiag?.heroAssetBuildStage} verify=${staticDiag?.heroAssetVerificationState} sources=${JSON.stringify(staticDiag?.toolAssetSource || {})}`
      );
      record(
        `${spec.name}: additive material and environment diagnostics remain available`,
        typeof staticDiag?.materialProfile === 'string'
          && typeof staticDiag?.environmentCue === 'string'
          && typeof staticDiag?.postFxMode === 'string',
        `material=${staticDiag?.materialProfile} env=${staticDiag?.environmentCue} post=${staticDiag?.postFxMode}`
      );
      record(
        `${spec.name}: viewport resolves the expected orbit layout tier`,
        staticDiag?.orbitLayout?.key === spec.expectedLayout,
        `expected=${spec.expectedLayout} actual=${staticDiag?.orbitLayout?.key}`
      );
      record(
        `${spec.name}: viewport resolves the expected authored composition`,
        staticDiag?.compositionMode === spec.expectedComposition,
        `expected=${spec.expectedComposition} actual=${staticDiag?.compositionMode}`
      );

      const wrenchBounds = staticDiag?.projectedToolBounds?.wrench || {};
      const hammerBounds = staticDiag?.projectedToolBounds?.hammer || {};
      const sawBounds = staticDiag?.projectedToolBounds?.saw || {};
      const wrenchCenter = center(wrenchBounds);
      const heroViewportHeightRatio = staticDiag?.heroViewportHeightRatio ?? 0;

      if (spec.expectedComposition === 'stillLifeDesktop' || spec.expectedComposition === 'tabletCluster') {
        const topMargin = wrenchBounds.top ?? 0;
        const rightMargin = spec.viewport.width - (wrenchBounds.right ?? spec.viewport.width);
        const bottomMargin = spec.viewport.height - (wrenchBounds.bottom ?? spec.viewport.height);
        const minTop = spec.viewport.height * 0.08 - 8;
        const minRight = spec.viewport.width * 0.10 - 8;
        const minBottom = spec.viewport.height * 0.14 - 10;
        record(
          `${spec.name}: wrench stays fully framed with desktop/tablet margins`,
          topMargin >= minTop && rightMargin >= minRight && bottomMargin >= minBottom,
          `top=${topMargin?.toFixed?.(1) || topMargin} right=${rightMargin?.toFixed?.(1) || rightMargin} bottom=${bottomMargin?.toFixed?.(1) || bottomMargin}`
        );
      } else {
        const artLane = staticDiag?.artLane || {};
        const artLanePass = (wrenchBounds.top ?? 0) >= (artLane.top ?? 0)
          && (wrenchBounds.right ?? 0) <= (artLane.right ?? spec.viewport.width)
          && (wrenchBounds.bottom ?? 0) <= (artLane.bottom ?? spec.viewport.height)
          && (wrenchBounds.left ?? 0) >= (artLane.left ?? 0);
        record(
          `${spec.name}: wrench stays contained inside the mobile art lane`,
          artLanePass,
          `wrench=${JSON.stringify(wrenchBounds)} artLane=${JSON.stringify(artLane)}`
        );
      }

      record(
        `${spec.name}: wrench fills the authored viewport height range`,
        heroViewportHeightRatio >= spec.heroHeightRange[0] && heroViewportHeightRatio <= spec.heroHeightRange[1],
        `heroRatio=${heroViewportHeightRatio} expected=${spec.heroHeightRange.join('..')}`
      );
      record(
        `${spec.name}: wrench occupies the intended viewport area`,
        (staticDiag?.heroViewportAreaRatio ?? 0) >= spec.heroAreaRange[0]
          && (staticDiag?.heroViewportAreaRatio ?? 0) <= spec.heroAreaRange[1],
        `heroArea=${staticDiag?.heroViewportAreaRatio ?? 'n/a'} expected=${spec.heroAreaRange.join('..')}`
      );
      record(
        `${spec.name}: editorial overlap and art-lane occupancy stay in range`,
        (staticDiag?.heroHeadlineOverlapRatio ?? 0) >= spec.heroOverlapRange[0]
          && (staticDiag?.heroHeadlineOverlapRatio ?? 0) <= spec.heroOverlapRange[1]
          && (staticDiag?.heroArtLaneOccupancy ?? 0) >= spec.heroArtLaneRange[0]
          && (staticDiag?.heroArtLaneOccupancy ?? 0) <= spec.heroArtLaneRange[1]
          && (staticDiag?.heroRightThirdOffsetPx ?? 0) >= spec.heroRightThirdRange[0]
          && (staticDiag?.heroRightThirdOffsetPx ?? 0) <= spec.heroRightThirdRange[1],
        `overlap=${staticDiag?.heroHeadlineOverlapRatio ?? 'n/a'} artLane=${staticDiag?.heroArtLaneOccupancy ?? 'n/a'} rightThird=${staticDiag?.heroRightThirdOffsetPx ?? 'n/a'}`
      );

      record(
        `${spec.name}: static layout keeps support props suppressed`,
        (staticDiag?.supportVisibleCount ?? 99) === 0
          && !isVisibleSupport(staticDiag, 'hammer')
          && !isVisibleSupport(staticDiag, 'saw'),
        `supportPolicy=${JSON.stringify(staticDiag?.supportPolicy || staticDiag?.mobileSupportState || {})} visible=${staticDiag?.supportVisibleCount ?? 'n/a'} hammer=${hammerBounds.height} saw=${sawBounds.height}`
      );

      const navClear = (spec.expectedLayout === 'desktop' || spec.expectedLayout === 'tablet')
        ? !Object.values(staticDiag?.safeZoneViolations?.nav || {}).some(Boolean)
        : true;
      const viewportClear = allClear(staticDiag?.safeZoneViolations?.viewport);
      const contentClear = !Object.entries(staticDiag?.safeZoneViolations?.readability || {})
        .some(([toolId, collides]) => toolId === 'wrench' && collides);
      const ctaClear = !Object.entries(staticDiag?.ctaLaneIntrusions || {})
        .some(([toolId, collides]) => toolId === 'wrench' && collides);
      const trustClear = !Object.entries(staticDiag?.trustRowIntrusions || {})
        .some(([toolId, collides]) => toolId === 'wrench' && collides);
      record(
        `${spec.name}: the hero stays clear of protected content lanes`,
        navClear && viewportClear && contentClear && ctaClear && trustClear,
        `nav=${JSON.stringify(staticDiag?.safeZoneViolations?.nav || {})} readability=${JSON.stringify(staticDiag?.safeZoneViolations?.readability || {})} cta=${JSON.stringify(staticDiag?.ctaLaneIntrusions || {})} trust=${JSON.stringify(staticDiag?.trustRowIntrusions || {})} viewport=${JSON.stringify(staticDiag?.safeZoneViolations?.viewport || {})}`
      );

      record(
        `${spec.name}: particle strokes stay out of protected text and CTA zones`,
        (staticDiag?.particleStrokeCrossings?.headlineZone ?? 1) === 0
          && (staticDiag?.particleStrokeCrossings?.bodyZone ?? 1) === 0
          && ((staticDiag?.particleStrokeCrossings?.ctaZone ?? 0) + (staticDiag?.particleStrokeCrossings?.ctaStackZone ?? 0)) === 0
          && (staticDiag?.particleStrokeCrossings?.trustRowZone ?? 0) === 0
          && (staticDiag?.particleLongStrokeCount ?? 1) === 0
          && (staticDiag?.particleRodCount ?? 1) === 0
          && (staticDiag?.particleOutOfHeroLaneCount ?? 1) === 0,
        `particles=${JSON.stringify(staticDiag?.particleStrokeCrossings || {})} long=${staticDiag?.particleLongStrokeCount ?? 'n/a'} rod=${staticDiag?.particleRodCount ?? 'n/a'} out=${staticDiag?.particleOutOfHeroLaneCount ?? 'n/a'}`
      );

      record(
        `${spec.name}: grid luminance under copy stays suppressed`,
        (staticDiag?.gridLuminanceUnderCopy ?? 1) <= ((spec.expectedLayout === 'mobile' || spec.expectedLayout === 'narrow') ? 0.12 : 0.16),
        `grid=${staticDiag?.gridLuminanceUnderCopy ?? 'n/a'}`
      );
      record(
        `${spec.name}: hero backlight and grounding shadow stay within the authored lane`,
        (staticDiag?.heroBacklightCoverage ?? 0) >= ((spec.expectedLayout === 'mobile' || spec.expectedLayout === 'narrow') ? 0.84 : 0.95)
          && (staticDiag?.heroShadowCoverage ?? 0) >= ((spec.expectedLayout === 'mobile' || spec.expectedLayout === 'narrow') ? 0.69 : 0.95),
        `backlight=${staticDiag?.heroBacklightCoverage ?? 'n/a'} shadow=${staticDiag?.heroShadowCoverage ?? 'n/a'}`
      );

      await setPhase(page, 'lockup');
      const lockupDiag = await getDiagnostics(page);
      await setPhase(page, 'interactiveIdle');
      const idleDiag = await getDiagnostics(page);
      await page.screenshot({
        path: path.join(EVIDENCE_DIR, `${spec.name}-interactive-idle.png`),
      });
      record(
        `${spec.name}: lockup remains wrench-first with no visible support props`,
        (lockupDiag?.supportVisibleCount ?? 99) === 0
          && !isVisibleSupport(lockupDiag, 'hammer')
          && !isVisibleSupport(lockupDiag, 'saw'),
        `lockupSupport=${JSON.stringify(lockupDiag?.supportPolicy || lockupDiag?.mobileSupportState || {})} visible=${lockupDiag?.supportVisibleCount ?? 'n/a'}`
      );

      record(
        `${spec.name}: interactive idle keeps the hero wrench-only`,
        (idleDiag?.supportVisibleCount ?? 99) === 0
          && idleDiag?.mobileSupportState?.hammer !== 'visible'
          && idleDiag?.mobileSupportState?.saw !== 'visible'
          && typeof idleDiag?.interactionCue === 'string',
        `idleSupport=${JSON.stringify(idleDiag?.supportPolicy || idleDiag?.mobileSupportState || {})} visible=${idleDiag?.supportVisibleCount ?? 'n/a'} interaction=${idleDiag?.interactionCue ?? 'n/a'}`
      );

      const snapshot = await page.evaluate((label) => window.__captureSceneSnapshot?.(label), `${spec.name}-layout-gate`);
      results.push({
        viewport: spec,
        staticDiag,
        lockupDiag,
        idleDiag,
        snapshot,
      });

      await page.close();
    }

    fs.writeFileSync(path.join(EVIDENCE_DIR, 'results.json'), JSON.stringify({
      generatedAt: new Date().toISOString(),
      results,
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
