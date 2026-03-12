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
        frames: [first?.renderedFrameCount ?? 0, second?.renderedFrameCount ?? 0],
        frameAdvanced: (second?.renderedFrameCount ?? 0) > (first?.renderedFrameCount ?? 0),
      };
    });
    const sceneBootPass = sceneBoot.hasCanvas && sceneBoot.bootHealthy && sceneBoot.frameAdvanced;
    record('3D hero scene boots successfully', sceneBootPass, `asset=${sceneBoot.assetMode} frames=${sceneBoot.frames.join('->')}`);
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
