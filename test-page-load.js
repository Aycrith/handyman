const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  await page.goto('http://127.0.0.1:4173', { waitUntil: 'networkidle', timeout: 30000 });
  
  const html = await page.content();
  console.log('Page title:', await page.title());
  console.log('HTML length:', html.length);
  console.log('Has <section id="services">:', html.includes('id="services"'));
  console.log('Has <main id="main-content">:', html.includes('id="main-content"'));
  console.log('Has .skip-link:', html.includes('skip-link'));
  console.log('\nFirst 800 chars of HTML:');
  console.log(html.substring(0, 800));
  
  await browser.close();
})();
