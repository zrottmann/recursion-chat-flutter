/**
 * Domain Verification Fix for Trading Post Appwrite Sites
 * Diagnoses and fixes domain verification issues on free tier
 */

const { Client, Account, Storage } = require('appwrite');

// Configuration
const config = {
  endpoint: 'https://nyc.cloud.appwrite.io/v1',
  projectId: '689bdee000098bd9d55c',
  siteId: '689cb415001a367e69f8'
};

console.log('═══════════════════════════════════════════════════');
console.log('    Trading Post Domain Verification Diagnosis');
console.log('═══════════════════════════════════════════════════\n');

console.log('🔍 DOMAIN VERIFICATION FAILED DIAGNOSIS:\n');

console.log('The "Domain verification failed" error can be caused by:\n');

console.log('1. 🌐 CUSTOM DOMAIN ISSUES:');
console.log('   - tradingpost.appwrite.network may not be properly configured');
console.log('   - DNS settings might be incorrect');
console.log('   - SSL certificate not generated yet\n');

console.log('2. 📁 BUILD/DEPLOYMENT ISSUES:');
console.log('   - Build failed to create proper dist directory');
console.log('   - Missing index.html or assets');
console.log('   - Incorrect build configuration\n');

console.log('3. 🆓 FREE TIER LIMITATIONS:');
console.log('   - Custom domains may have restrictions');
console.log('   - Verification process may be slower\n');

console.log('═══════════════════════════════════════════════════');
console.log('                 IMMEDIATE FIXES');
console.log('═══════════════════════════════════════════════════\n');

console.log('🔧 FIX 1: Use Default .appwrite.global Domain\n');
console.log('Instead of custom domain, use the default:');
console.log('✅ https://689cb415001a367e69f8.appwrite.global\n');
console.log('This bypasses domain verification entirely.\n');

console.log('🔧 FIX 2: Check Appwrite Console Deployment\n');
console.log('1. Go to: https://cloud.appwrite.io/console/project-689bdee000098bd9d55c/hosting');
console.log('2. Check if deployment completed successfully');
console.log('3. Look for any build errors or warnings');
console.log('4. Try redeploying if necessary\n');

console.log('🔧 FIX 3: Manual Domain Configuration\n');
console.log('If using custom domain (tradingpost.appwrite.network):');
console.log('1. Go to your domain registrar');
console.log('2. Add CNAME record: tradingpost -> 689cb415001a367e69f8.appwrite.global');
console.log('3. Wait 24-48 hours for DNS propagation');
console.log('4. Retry verification in Appwrite console\n');

console.log('🔧 FIX 4: Force Redeploy\n');
console.log('If build/deployment is the issue:');
console.log('1. Make a small code change');
console.log('2. Commit and push to trigger new deployment');
console.log('3. Monitor deployment logs for errors\n');

console.log('═══════════════════════════════════════════════════');
console.log('               TESTING DOMAINS');
console.log('═══════════════════════════════════════════════════\n');

// Test domain accessibility
const domains = [
  'https://689cb415001a367e69f8.appwrite.global',
  'https://tradingpost.appwrite.network'
];

console.log('🔍 Testing domain accessibility:\n');
domains.forEach(domain => {
  console.log(`Testing: ${domain}`);
  console.log(`  - Try opening in browser`);
  console.log(`  - Check for SSL certificate`);
  console.log(`  - Verify OAuth redirect works`);
  console.log('');
});

console.log('═══════════════════════════════════════════════════');
console.log('              OAUTH COMPATIBILITY');
console.log('═══════════════════════════════════════════════════\n');

console.log('For OAuth to work, use whichever domain is accessible:');
console.log('');
console.log('If 689cb415001a367e69f8.appwrite.global works:');
console.log('  ✅ OAuth callback: https://689cb415001a367e69f8.appwrite.global/auth/callback');
console.log('  ✅ OAuth error: https://689cb415001a367e69f8.appwrite.global/auth/error');
console.log('');
console.log('If tradingpost.appwrite.network works:');
console.log('  ✅ OAuth callback: https://tradingpost.appwrite.network/auth/callback');
console.log('  ✅ OAuth error: https://tradingpost.appwrite.network/auth/error');
console.log('');

console.log('═══════════════════════════════════════════════════');
console.log('               NEXT STEPS');
console.log('═══════════════════════════════════════════════════\n');

console.log('1. 🌐 Test both domains in browser');
console.log('2. 📋 Use the working domain for OAuth configuration');  
console.log('3. 🔄 Update .env file with working domain');
console.log('4. 🧪 Test OAuth login with Google/GitHub');
console.log('5. 📞 If both fail, check Appwrite console deployment status');

console.log('\n═══════════════════════════════════════════════════');
console.log('Project ID:', config.projectId);
console.log('Site ID:', config.siteId);
console.log('Expected domains:');
console.log('- Default: https://689cb415001a367e69f8.appwrite.global');
console.log('- Custom: https://tradingpost.appwrite.network');
console.log('═══════════════════════════════════════════════════');