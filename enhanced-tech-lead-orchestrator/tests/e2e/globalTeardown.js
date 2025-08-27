// Global teardown for E2E tests - closes Puppeteer browser
export default async function globalTeardown() {
  console.log('🧹 Starting E2E global teardown...');

  try {
    if (global.browser) {
      await global.browser.close();
      console.log('✅ E2E global teardown complete - Browser closed successfully');
    } else {
      console.log('⚠️ No browser instance found to close');
    }
  } catch (error) {
    console.error('❌ E2E global teardown failed:', error);
    // Don't throw here as this is cleanup - we want tests to report their actual results
  }
}
