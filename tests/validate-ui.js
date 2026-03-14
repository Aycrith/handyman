const { chromium } = require('playwright');
const path = require('path');
const { startStaticServer } = require('./helpers/static-server');

const ROOT = path.resolve(__dirname, '..');
const PORT = 8767;
const BASE_URL = `http://localhost:${PORT}`;

(async () => {
  console.log('\n╔══════════════════════════════════════════╗');
  console.log('║        Landing Page UI Smoke Tests      ║');
  console.log('╚══════════════════════════════════════════╝\n');

  const server = await startStaticServer(ROOT, PORT);
  console.log(`[server] Listening on ${BASE_URL}`);

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const pageErrors = [];

  page.on('pageerror', (error) => {
    const detail = error.stack || error.message || String(error);
    pageErrors.push(detail);
    console.error(`  [pageerror] ${detail}`);
  });

  const checks = [];
  const record = (name, pass, detail = '') => {
    checks.push({ name, pass, detail });
    console.log(`  ${pass ? '✓ PASS' : '✗ FAIL'} ${name}${detail ? ` — ${detail}` : ''}`);
  };
  const assertNoPageErrors = (stage) => {
    if (!pageErrors.length) return;
    throw new Error(`Page errors during ${stage}: ${pageErrors[0]}`);
  };

  try {
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });

    await page.waitForSelector('#preloader');
    await page.waitForFunction(() => document.getElementById('preloader')?.classList.contains('hidden'), { timeout: 12000 });
    assertNoPageErrors('initial load');
    record('Preloader dismisses after scene ready', true, 'hidden class applied');

    await page.waitForFunction(() => typeof window.__sceneDiagnostics === 'function', { timeout: 10000 });
    const sceneBoot = await page.evaluate(async () => {
      const canvas = document.getElementById('three-canvas');
      const first = window.__sceneDiagnostics?.();
      await new Promise((resolve) => setTimeout(resolve, 300));
      const second = window.__sceneDiagnostics?.();
      return {
        hasCanvas: !!canvas,
        bootHealthy: !!second?.bootHealthy,
        assetMode: second?.assetMode || 'missing',
        assetSetVersion: second?.assetSetVersion || 'missing',
        assetContractVersion: second?.assetContractVersion || 'missing',
        heroAssetVariant: second?.heroAssetVariant || 'missing',
        heroAssetBuildStage: second?.heroAssetBuildStage || 'missing',
        heroAssetVerificationState: second?.heroAssetVerificationState || 'missing',
        heroAssetVerification: second?.heroAssetVerification || null,
        toolAssetSource: second?.toolAssetSource || null,
        particleCue: second?.particleCue || 'missing',
        signatureCue: second?.signatureCue || 'missing',
        worldCue: second?.worldCue || 'missing',
        depthLayerMix: second?.depthLayerMix || null,
        lensEvent: second?.lensEvent || 'missing',
        magicIntensity: second?.magicIntensity ?? null,
        releaseEnvelope: second?.releaseEnvelope ?? null,
        corridorEvacuation: second?.corridorEvacuation ?? null,
        heroEmberLevel: second?.heroEmberLevel ?? null,
        particleBudgetTier: second?.particleBudgetTier || 'missing',
        shotBeat: second?.shotBeat || 'missing',
        lightingCue: second?.lightingCue || 'missing',
        gradePreset: second?.gradePreset || 'missing',
        materialProfile: second?.materialProfile || 'missing',
        environmentCue: second?.environmentCue || 'missing',
        interactionCue: second?.interactionCue || 'missing',
        postFxMode: second?.postFxMode || 'missing',
        heroReadMetrics: second?.heroReadMetrics || null,
        worldReadMetrics: second?.worldReadMetrics || null,
        orbitLayout: second?.orbitLayout || null,
        compositionMode: second?.compositionMode || null,
        orbitCenterScreen: second?.orbitCenterScreen || null,
        supportAnglesDeg: second?.supportAnglesDeg || null,
        projectedToolBounds: second?.projectedToolBounds || null,
        safeZoneViolations: second?.safeZoneViolations || null,
        protectedZones: second?.protectedZones || null,
        artLane: second?.artLane || null,
        contentLane: second?.contentLane || null,
        headlineSoftBand: second?.headlineSoftBand || null,
        heroTargetFrame: second?.heroTargetFrame || null,
        heroBacklightRect: second?.heroBacklightRect || null,
        heroShadowRect: second?.heroShadowRect || null,
        particleEmissionRect: second?.particleEmissionRect || null,
        particleExclusionLane: second?.particleExclusionLane || null,
        gridMaskRect: second?.gridMaskRect || null,
        mobileSupportState: second?.mobileSupportState || null,
        supportPolicy: second?.supportPolicy || null,
        particleZoneIntrusions: second?.particleZoneIntrusions || null,
        particleStrokeCrossings: second?.particleStrokeCrossings || null,
        heroViewportHeightRatio: second?.heroViewportHeightRatio ?? null,
        heroViewportAreaRatio: second?.heroViewportAreaRatio ?? null,
        heroHeadlineOverlapRatio: second?.heroHeadlineOverlapRatio ?? null,
        heroArtLaneOccupancy: second?.heroArtLaneOccupancy ?? null,
        heroClearancePx: second?.heroClearancePx || null,
        heroRightThirdOffsetPx: second?.heroRightThirdOffsetPx ?? null,
        supportProjectedHeightRatio: second?.supportProjectedHeightRatio || null,
        supportVisibleCount: second?.supportVisibleCount ?? null,
        gridLuminanceUnderCopy: second?.gridLuminanceUnderCopy ?? null,
        particleLongStrokeCount: second?.particleLongStrokeCount ?? null,
        particleRodCount: second?.particleRodCount ?? null,
        particleOutOfHeroLaneCount: second?.particleOutOfHeroLaneCount ?? null,
        heroBacklightCoverage: second?.heroBacklightCoverage ?? null,
        heroShadowCoverage: second?.heroShadowCoverage ?? null,
        toolContrast: second?.toolContrast || null,
        perfAuthority: second?.perfAuthority || 'missing',
        frames: [first?.renderedFrameCount ?? 0, second?.renderedFrameCount ?? 0],
        frameAdvanced: (second?.renderedFrameCount ?? 0) > (first?.renderedFrameCount ?? 0),
      };
    });
    const sceneBootPass = sceneBoot.hasCanvas && sceneBoot.bootHealthy && sceneBoot.frameAdvanced;
    record('3D hero scene boots successfully', sceneBootPass, `asset=${sceneBoot.assetMode} frames=${sceneBoot.frames.join('->')}`);
    record(
      'Hero asset diagnostics present',
      !!sceneBoot.toolAssetSource
        && typeof sceneBoot.assetSetVersion === 'string'
        && typeof sceneBoot.assetContractVersion === 'string'
        && typeof sceneBoot.heroAssetVariant === 'string'
        && typeof sceneBoot.heroAssetBuildStage === 'string'
        && typeof sceneBoot.heroAssetVerificationState === 'string'
        && sceneBoot.heroAssetVerification?.manifestLoaded === true
        && sceneBoot.heroAssetVerification?.packVerified === true
        && sceneBoot.heroAssetBuildStage === 'assembly-orbit-external-support'
        && sceneBoot.heroAssetVerificationState === 'final-ready'
        && sceneBoot.toolAssetSource.hammer === 'hero-glb'
        && sceneBoot.toolAssetSource.wrench === 'hero-glb'
        && sceneBoot.toolAssetSource.saw === 'hero-glb',
      `assetSet=${sceneBoot.assetSetVersion} contract=${sceneBoot.assetContractVersion} variant=${sceneBoot.heroAssetVariant} stage=${sceneBoot.heroAssetBuildStage} verify=${sceneBoot.heroAssetVerificationState} sources=${JSON.stringify(sceneBoot.toolAssetSource || {})}`
    );
    record(
      'Hero particle diagnostics present',
      typeof sceneBoot.particleCue === 'string'
        && typeof sceneBoot.signatureCue === 'string'
        && typeof sceneBoot.magicIntensity === 'number'
        && typeof sceneBoot.releaseEnvelope === 'number'
        && typeof sceneBoot.corridorEvacuation === 'number'
        && typeof sceneBoot.heroEmberLevel === 'number'
        && ['desktop', 'mobile', 'low'].includes(sceneBoot.particleBudgetTier),
      `cue=${sceneBoot.particleCue} sig=${sceneBoot.signatureCue} magic=${sceneBoot.magicIntensity} ember=${sceneBoot.heroEmberLevel} tier=${sceneBoot.particleBudgetTier}`
    );
    record(
      'Hero cinematic diagnostics present',
      typeof sceneBoot.shotBeat === 'string'
        && typeof sceneBoot.lightingCue === 'string'
        && typeof sceneBoot.gradePreset === 'string'
        && typeof sceneBoot.materialProfile === 'string'
        && typeof sceneBoot.environmentCue === 'string'
        && typeof sceneBoot.interactionCue === 'string'
        && typeof sceneBoot.postFxMode === 'string'
        && typeof sceneBoot.worldCue === 'string'
        && typeof sceneBoot.lensEvent === 'string'
        && typeof sceneBoot.depthLayerMix?.total === 'number'
        && typeof sceneBoot.heroReadMetrics?.focalContrast === 'number'
        && typeof sceneBoot.heroReadMetrics?.copyCalm === 'number'
        && typeof sceneBoot.worldReadMetrics?.backgroundSeparation === 'number'
        && typeof sceneBoot.worldReadMetrics?.copyContamination === 'number'
        && typeof sceneBoot.worldReadMetrics?.heroWorldBalance === 'number',
      `beat=${sceneBoot.shotBeat} world=${sceneBoot.worldCue} env=${sceneBoot.environmentCue} interaction=${sceneBoot.interactionCue} post=${sceneBoot.postFxMode} grade=${sceneBoot.gradePreset} material=${sceneBoot.materialProfile}`
    );
    record(
      'Orbit composition diagnostics are exposed',
      typeof sceneBoot.orbitLayout?.key === 'string'
        && typeof sceneBoot.compositionMode === 'string'
        && typeof sceneBoot.orbitCenterScreen?.x === 'number'
        && typeof sceneBoot.supportAnglesDeg?.hammer === 'number'
        && typeof sceneBoot.projectedToolBounds?.wrench?.height === 'number'
        && typeof sceneBoot.safeZoneViolations?.nav?.wrench === 'boolean'
        && typeof sceneBoot.protectedZones?.headlineZone?.width === 'number'
        && typeof sceneBoot.artLane?.width === 'number'
        && typeof sceneBoot.contentLane?.width === 'number'
        && typeof sceneBoot.headlineSoftBand?.width === 'number'
        && typeof sceneBoot.heroTargetFrame?.width === 'number'
        && typeof sceneBoot.heroBacklightRect?.width === 'number'
        && typeof sceneBoot.heroShadowRect?.width === 'number'
        && typeof sceneBoot.particleEmissionRect?.width === 'number'
        && typeof sceneBoot.particleExclusionLane?.width === 'number'
        && typeof sceneBoot.gridMaskRect?.width === 'number'
        && typeof sceneBoot.mobileSupportState?.hammer === 'string'
        && typeof sceneBoot.supportPolicy?.hammer === 'string'
        && typeof sceneBoot.particleZoneIntrusions?.headlineZone === 'number'
        && typeof sceneBoot.particleStrokeCrossings?.headlineZone === 'number'
        && typeof sceneBoot.heroViewportHeightRatio === 'number'
        && typeof sceneBoot.heroViewportAreaRatio === 'number'
        && typeof sceneBoot.heroHeadlineOverlapRatio === 'number'
        && typeof sceneBoot.heroArtLaneOccupancy === 'number'
        && typeof sceneBoot.heroClearancePx?.top === 'number'
        && typeof sceneBoot.heroRightThirdOffsetPx === 'number'
        && typeof sceneBoot.supportProjectedHeightRatio?.hammer === 'number'
        && typeof sceneBoot.supportVisibleCount === 'number'
        && typeof sceneBoot.gridLuminanceUnderCopy === 'number'
        && typeof sceneBoot.particleLongStrokeCount === 'number'
        && typeof sceneBoot.particleRodCount === 'number'
        && typeof sceneBoot.particleOutOfHeroLaneCount === 'number'
        && typeof sceneBoot.heroBacklightCoverage === 'number'
        && typeof sceneBoot.heroShadowCoverage === 'number'
        && typeof sceneBoot.toolContrast?.wrench === 'number'
        && typeof sceneBoot.perfAuthority === 'string',
      `layout=${sceneBoot.orbitLayout?.key} composition=${sceneBoot.compositionMode} center=${JSON.stringify(sceneBoot.orbitCenterScreen)}`
    );
    assertNoPageErrors('3D scene boot');

    await page.waitForTimeout(1400);

    const heroVisible = await page.evaluate(() => {
      const selectors = ['.hero__title', '.hero__sub', '.hero__ctas'];
      return selectors.every((selector) => {
        const element = document.querySelector(selector);
        if (!element) return false;
        const styles = window.getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        return parseFloat(styles.opacity) > 0.9 && styles.visibility !== 'hidden' && rect.height > 0;
      });
    });
    record('Hero content becomes visible', heroVisible, heroVisible ? 'title, subcopy, and CTAs visible' : 'hero content stayed hidden');

    const heroOwnershipPass = await page.evaluate(() => !document.getElementById('hero-copy'));
    record('3D scene defers hero messaging to DOM copy', heroOwnershipPass, heroOwnershipPass ? 'no duplicate scene-owned hero copy' : 'duplicate hero copy still injected');

    await page.evaluate(() => window.__setSceneDirectorPhaseForTest?.('interactiveIdle'));
    await page.waitForTimeout(260);
    await page.evaluate(() => window.__openToolPanelForTest?.('wrench'));
    await page.waitForTimeout(420);
    const panelPlacement = await page.evaluate(() => {
      const panel = document.getElementById('tool-info-panel');
      const nav = document.querySelector('.nav__inner');
      const diag = window.__sceneDiagnostics?.();
      const panelRect = panel?.getBoundingClientRect?.();
      const navRect = nav?.getBoundingClientRect?.();
      const wrench = diag?.projectedToolBounds?.wrench || null;
      const readability = diag?.readabilityWindow?.active
        ? {
            left: diag.readabilityWindow.left,
            top: diag.readabilityWindow.top,
            right: diag.readabilityWindow.left + diag.readabilityWindow.width,
            bottom: diag.readabilityWindow.top + diag.readabilityWindow.height,
          }
        : null;
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
        navOverlap: overlaps(panelRect, navRect),
        readabilityOverlap: overlaps(panelRect, readability),
        wrenchOverlap: overlaps(panelRect, wrench),
      };
    });
    record(
      'Tool callout opens without covering the active wrench',
      panelPlacement.visible === true
        && panelPlacement.wrenchOverlap === false,
      JSON.stringify(panelPlacement)
    );

    const placeholderAudit = await page.evaluate(() => {
      const headText = document.head.innerHTML;
      const jsonLd = document.querySelector('script[type="application/ld+json"]')?.textContent || '';
      return !(/\[Business Name\]|\[City\]|\[State\]|\(000\) 000-0000/.test(headText) || /\[Business Name\]|\[City\]|\[State\]/.test(jsonLd));
    });
    record('SEO placeholders removed', placeholderAudit, placeholderAudit ? '' : 'placeholder token still present');

    const servicesLayout = await page.evaluate(() => {
      const services = document.getElementById('services');
      const pin = document.getElementById('servicesPin');
      const track = document.querySelector('.services__scroll-track');
      const grid = document.querySelector('.services__grid');
      if (!services || !pin) return null;

      return {
        horizontal: services.classList.contains('services--horizontal'),
        servicesHeight: services.getBoundingClientRect().height,
        pinHeight: pin.getBoundingClientRect().height,
        viewportHeight: window.innerHeight,
        overflow: track && grid ? grid.scrollWidth - (track.parentElement?.clientWidth || window.innerWidth) : 0,
      };
    });
    const servicesSpacer = servicesLayout ? Math.max(0, servicesLayout.servicesHeight - servicesLayout.pinHeight) : Number.POSITIVE_INFINITY;
    const servicesLayoutPass = !!servicesLayout && (
      servicesLayout.horizontal
        ? servicesSpacer <= servicesLayout.viewportHeight * 0.95
        : servicesLayout.overflow <= 0 && servicesLayout.servicesHeight <= servicesLayout.viewportHeight * 1.25
    );
    record('Services section avoids oversized spacer', servicesLayoutPass, `mode=${servicesLayout?.horizontal ? 'horizontal' : 'grid'} height=${Math.round(servicesLayout?.servicesHeight || 0)}px spacer=${Math.round(servicesSpacer)}px`);

    await page.click('.nav__link[href="#about"]');
    await page.waitForTimeout(1600);
    const activeNavLinks = await page.locator('.nav__link--active').evaluateAll((links) => links.map((link) => link.getAttribute('href')));
    const aboutActive = activeNavLinks.length === 1 && activeNavLinks[0] === '#about';
    record('Navigation highlights current section', aboutActive, `active=${activeNavLinks.join(',') || 'none'}`);

    await page.evaluate(() => document.getElementById('contact')?.scrollIntoView({ behavior: 'instant', block: 'start' }));
    await page.waitForTimeout(500);

    await page.click('.form-submit');
    const invalidStatus = (await page.locator('#formStatus').textContent()) || '';
    record('Contact form blocks empty submit', /Please add your name/i.test(invalidStatus), invalidStatus.trim());

    await page.fill('#contactName', 'Jordan Avery');
    await page.fill('#contactPhone', '(217) 555-0111');
    await page.selectOption('#contactService', 'painting');
    await page.fill('#contactMessage', 'Need help repainting a living room and patching two drywall seams next week.');
    await page.click('.form-submit');
    await page.waitForTimeout(150);

    const successStatus = (await page.locator('#formStatus').textContent()) || '';
    const followupVisible = await page.locator('#formFollowup').isVisible();
    const smsHref = await page.locator('#formSmsLink').getAttribute('href');
    record('Contact form shows follow-up shortcuts', /Estimate request ready/i.test(successStatus) && followupVisible, successStatus.trim());
    record('Contact form generates SMS payload', typeof smsHref === 'string' && smsHref.startsWith('sms:+12175550182?body='), smsHref || 'missing href');
    assertNoPageErrors('UI smoke run');
  } catch (error) {
    record('UI smoke suite execution', false, error.message);
  } finally {
    await browser.close();
    server.close();
  }

  const failed = checks.filter((check) => !check.pass);
  console.log(`\n  Overall: ${failed.length ? '✗ UI smoke checks failed' : '✓ UI smoke checks passed'}`);
  process.exit(failed.length ? 1 : 0);
})();
