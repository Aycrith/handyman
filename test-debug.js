const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  
  // Check vite preview server
  console.log('Testing vite preview server at http://127.0.0.1:4173');
  try {
    await page.goto('http://127.0.0.1:4173', { waitUntil: 'networkidle', timeout: 5000 });
    const skipLink = await page.$('.skip-link');
    const mainEl = await page.$('#main-content');
    const ambientParticles = await page.$('.ambient-particles');
    
    console.log('skip-link exists:', !!skipLink);
    console.log('main-content exists:', !!mainEl);
    console.log('ambient-particles exists:', !!ambientParticles);
  } catch (err) {
    console.log('Preview server not ready or error:', err.message);
  }
  
  await browser.close();
})();
