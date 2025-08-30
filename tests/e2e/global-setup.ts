import { chromium, type FullConfig } from '@playwright/test'

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting E2E test setup...')
  
  // Launch browser for setup
  const browser = await chromium.launch()
  const page = await browser.newPage()
  
  try {
    // Wait for the development server to be ready
    console.log('⏳ Waiting for development server...')
    await page.goto(config.webServer?.url || 'http://localhost:3000')
    await page.waitForSelector('body', { timeout: 30000 })
    
    // Perform any global setup tasks here
    // Example: seed test data, authenticate test users, etc.
    
    console.log('✅ E2E test setup completed')
  } catch (error) {
    console.error('❌ E2E test setup failed:', error)
    throw error
  } finally {
    await browser.close()
  }
}

export default globalSetup