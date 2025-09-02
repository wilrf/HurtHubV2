import { chromium } from 'playwright';

async function quickTest() {
  console.log('Testing Playwright functionality...');
  
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle', timeout: 10000 });
    const title = await page.title();
    console.log('✅ Playwright works - Page title:', title);
    
    // Quick check for search inputs
    const searchInputs = await page.locator('input[type="text"], input[type="search"]').count();
    console.log('✅ Found', searchInputs, 'search/text inputs');
    
    await browser.close();
    return true;
  } catch (error) {
    console.log('❌ Test failed:', error.message);
    await browser.close();
    return false;
  }
}

quickTest();