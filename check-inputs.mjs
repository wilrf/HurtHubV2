import { chromium } from 'playwright';

async function checkInputFields() {
  const baseUrl = process.argv[2] || 'https://hurt-hub-v2.vercel.app';
  console.log('Testing URL:', baseUrl);
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();

  const results = {
    dashboard: [],
    businessIntelligence: [],
    communityPulse: [],
    gpt5Test: []
  };

  try {
    // Check Dashboard
    console.log('Checking Dashboard page...');
    await page.goto(`${baseUrl}/`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    // Find all input elements
    const dashboardInputs = await page.locator('input[type="text"], input[type="search"], textarea').all();
    for (const input of dashboardInputs) {
      const placeholder = await input.getAttribute('placeholder');
      const type = await input.getAttribute('type');
      const isVisible = await input.isVisible();
      if (isVisible) {
        results.dashboard.push({
          type: type || 'text',
          placeholder: placeholder || 'No placeholder',
          selector: await input.evaluate(el => {
            const id = el.id ? `#${el.id}` : '';
            const className = el.className ? `.${el.className.split(' ').join('.')}` : '';
            return id || className || 'input';
          })
        });
      }
    }

    // Check Business Intelligence page
    console.log('Checking Business Intelligence page...');
    await page.goto(`${baseUrl}/business-intelligence`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    const biInputs = await page.locator('input[type="text"], input[type="search"], textarea').all();
    for (const input of biInputs) {
      const placeholder = await input.getAttribute('placeholder');
      const type = await input.getAttribute('type');
      const isVisible = await input.isVisible();
      if (isVisible) {
        results.businessIntelligence.push({
          type: type || 'text',
          placeholder: placeholder || 'No placeholder',
          selector: await input.evaluate(el => {
            const id = el.id ? `#${el.id}` : '';
            const className = el.className ? `.${el.className.split(' ').join('.')}` : '';
            return id || className || 'input';
          })
        });
      }
    }

    // Check Community Pulse page
    console.log('Checking Community Pulse page...');
    await page.goto(`${baseUrl}/community`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    const cpInputs = await page.locator('input[type="text"], input[type="search"], textarea').all();
    for (const input of cpInputs) {
      const placeholder = await input.getAttribute('placeholder');
      const type = await input.getAttribute('type');
      const isVisible = await input.isVisible();
      if (isVisible) {
        results.communityPulse.push({
          type: type || 'text',
          placeholder: placeholder || 'No placeholder',
          selector: await input.evaluate(el => {
            const id = el.id ? `#${el.id}` : '';
            const className = el.className ? `.${el.className.split(' ').join('.')}` : '';
            return id || className || 'input';
          })
        });
      }
    }

    // Check GPT-5 Test page
    console.log('Checking GPT-5 Test page...');
    await page.goto(`${baseUrl}/gpt5-test`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    const gptInputs = await page.locator('input[type="text"], input[type="search"], textarea').all();
    for (const input of gptInputs) {
      const placeholder = await input.getAttribute('placeholder');
      const type = await input.getAttribute('type');
      const isVisible = await input.isVisible();
      if (isVisible) {
        results.gpt5Test.push({
          type: type || 'text',
          placeholder: placeholder || 'No placeholder',
          selector: await input.evaluate(el => {
            const id = el.id ? `#${el.id}` : '';
            const className = el.className ? `.${el.className.split(' ').join('.')}` : '';
            return id || className || 'input';
          })
        });
      }
    }

    // Print results
    console.log('\n=== HURT HUB INPUT FIELDS REPORT ===\n');
    
    console.log('📍 GLOBAL (appears on all pages):');
    console.log('  • Search bar in header: "Search companies, news, developments..."');
    console.log('    Location: MainLayout.tsx:189-195\n');

    console.log('📍 DASHBOARD PAGE (/):');
    if (results.dashboard.length > 0) {
      results.dashboard.forEach((input, i) => {
        if (!input.placeholder.includes('Search companies, news')) {
          console.log(`  ${i+1}. Type: ${input.type}`);
          console.log(`     Placeholder: "${input.placeholder}"`);
          console.log(`     Component: BusinessSearch (src/pages/Dashboard.tsx:199)`);
        }
      });
    }

    console.log('\n📍 BUSINESS INTELLIGENCE PAGE (/business-intelligence):');
    if (results.businessIntelligence.length > 0) {
      results.businessIntelligence.forEach((input, i) => {
        if (!input.placeholder.includes('Search companies, news')) {
          console.log(`  ${i+1}. Type: ${input.type}`);
          console.log(`     Placeholder: "${input.placeholder}"`);
          console.log(`     Component: BusinessAIChat (src/pages/BusinessIntelligence.tsx:203)`);
        }
      });
    }

    console.log('\n📍 COMMUNITY PULSE PAGE (/community):');
    if (results.communityPulse.length > 0) {
      results.communityPulse.forEach((input, i) => {
        if (!input.placeholder.includes('Search companies, news')) {
          console.log(`  ${i+1}. Type: ${input.type}`);
          console.log(`     Placeholder: "${input.placeholder}"`);
          console.log(`     Component: BusinessAIChat (src/pages/CommunityPulse.tsx:221)`);
        }
      });
    }

    console.log('\n📍 GPT-5 TEST PAGE (/gpt5-test):');
    if (results.gpt5Test.length > 0) {
      results.gpt5Test.forEach((input, i) => {
        if (!input.placeholder.includes('Search companies, news')) {
          console.log(`  ${i+1}. Type: ${input.type}`);
          console.log(`     Placeholder: "${input.placeholder}"`);
          console.log(`     Component: Direct input (src/pages/GPT5Test.tsx:271-279)`);
        }
      });
    }

    console.log('\n=== SUMMARY ===');
    console.log('Total unique input types:');
    console.log('  1. Global search bar (all pages)');
    console.log('  2. Business search input (Dashboard)');
    console.log('  3. AI chat inputs (Business Intelligence, Community Pulse)');
    console.log('  4. GPT-5 test chat input');

  } catch (error) {
    console.error('Error checking inputs:', error);
  } finally {
    await browser.close();
  }
}

checkInputFields();