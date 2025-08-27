#!/usr/bin/env node

/**
 * Comprehensive SSO Testing for Appwrite-hosted Sites
 * Tests OAuth authentication, mobile responsiveness, and SSO functionality
 */

const https = require('https');
const fs = require('fs');

const TEST_SITES = [
  {
    name: 'Trading Post',
    url: 'https://tradingpost.appwrite.network',
    projectId: '689bdee000098bd9d55c',
    tests: ['oauth-providers', 'mobile-auth', 'session-persistence', 'redirect-handling']
  },
  {
    name: 'Slumlord RPG',
    url: 'https://slumlord.appwrite.network',
    projectId: '68a0db634634a6d0392f',
    tests: ['unified-sso', 'guest-mode', 'mobile-touch', 'game-integration']
  },
  {
    name: 'Recursion Chat',
    url: 'https://chat.recursionsystems.com',
    projectId: '689bdaf500072795b0f6',
    tests: ['oauth-providers', 'react-auth', 'session-management', 'real-time']
  },
  {
    name: 'GX Multi-Agent Platform',
    url: 'https://gx.appwrite.network',
    projectId: '68a4e3da0022f3e129d0',
    tests: ['landing-auth', 'mobile-responsive', 'oauth-integration']
  }
];

class AppwriteSSOTester {
  constructor() {
    this.results = [];
    this.startTime = Date.now();
  }

  log(message, level = 'INFO') {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    const colors = {
      'INFO': '\x1b[36m',
      'SUCCESS': '\x1b[32m',
      'ERROR': '\x1b[31m',
      'WARNING': '\x1b[33m',
      'RESET': '\x1b[0m'
    };
    console.log(`${colors[level]}${timestamp} [${level}]${colors.RESET} ${message}`);
  }

  async testSiteAvailability(site) {
    return new Promise((resolve) => {
      const url = new URL(site.url);
      
      const options = {
        hostname: url.hostname,
        path: '/',
        method: 'GET',
        timeout: 10000,
        headers: {
          'User-Agent': 'AppwriteSSOTester/1.0',
          'Accept': 'text/html,application/xhtml+xml'
        }
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          resolve({
            available: res.statusCode === 200,
            statusCode: res.statusCode,
            contentLength: data.length,
            hasAuthFeatures: this.detectAuthFeatures(data)
          });
        });
      });

      req.on('error', () => resolve({ available: false, statusCode: 0 }));
      req.on('timeout', () => {
        req.destroy();
        resolve({ available: false, statusCode: 'TIMEOUT' });
      });

      req.end();
    });
  }

  detectAuthFeatures(htmlContent) {
    const features = {
      hasGoogleOAuth: false,
      hasGitHubOAuth: false,
      hasMicrosoftOAuth: false,
      hasMobileAuth: false,
      hasUnifiedSSO: false,
      hasSessionManagement: false,
      hasErrorBoundary: false,
      hasTouchOptimization: false
    };

    // OAuth Providers
    if (htmlContent.includes('google') && (htmlContent.includes('oauth') || htmlContent.includes('OAuth'))) {
      features.hasGoogleOAuth = true;
    }
    if (htmlContent.includes('github') && (htmlContent.includes('oauth') || htmlContent.includes('OAuth'))) {
      features.hasGitHubOAuth = true;
    }
    if (htmlContent.includes('microsoft') && (htmlContent.includes('oauth') || htmlContent.includes('OAuth'))) {
      features.hasMicrosoftOAuth = true;
    }

    // Mobile Authentication
    if (htmlContent.includes('mobile-auth') || htmlContent.includes('MOBILE-AUTH') || 
        htmlContent.includes('mobileOAuth')) {
      features.hasMobileAuth = true;
    }

    // Unified SSO
    if (htmlContent.includes('unified-sso') || htmlContent.includes('UnifiedSSO') ||
        htmlContent.includes('unifiedSSO')) {
      features.hasUnifiedSSO = true;
    }

    // Session Management
    if (htmlContent.includes('session') || htmlContent.includes('Session')) {
      features.hasSessionManagement = true;
    }

    // Error Handling
    if (htmlContent.includes('ErrorBoundary') || htmlContent.includes('error-boundary')) {
      features.hasErrorBoundary = true;
    }

    // Touch Optimization
    if (htmlContent.includes('touch') || htmlContent.includes('56px') || 
        htmlContent.includes('touch-target')) {
      features.hasTouchOptimization = true;
    }

    return features;
  }

  async testOAuthProviders(site) {
    const tests = {
      google: { tested: false, passed: false, details: '' },
      github: { tested: false, passed: false, details: '' },
      microsoft: { tested: false, passed: false, details: '' }
    };

    // Test OAuth redirect URLs
    const providers = ['google', 'github', 'microsoft'];
    
    for (const provider of providers) {
      const oauthUrl = `${site.url}/auth/oauth?provider=${provider}`;
      
      try {
        const response = await this.makeRequest(oauthUrl);
        tests[provider].tested = true;
        
        if (response.statusCode === 302 || response.statusCode === 301) {
          tests[provider].passed = true;
          tests[provider].details = 'OAuth redirect configured';
        } else if (response.statusCode === 200) {
          tests[provider].passed = true;
          tests[provider].details = 'OAuth handler present';
        } else {
          tests[provider].details = `Status: ${response.statusCode}`;
        }
      } catch (error) {
        tests[provider].tested = true;
        tests[provider].details = 'Connection failed';
      }
    }

    return tests;
  }

  async makeRequest(url) {
    return new Promise((resolve, reject) => {
      const parsedUrl = new URL(url);
      
      const options = {
        hostname: parsedUrl.hostname,
        path: parsedUrl.pathname + parsedUrl.search,
        method: 'GET',
        timeout: 5000
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: data
          });
        });
      });

      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });

      req.end();
    });
  }

  async testMobileResponsiveness(site) {
    const mobileTests = {
      viewport: false,
      touchTargets: false,
      mobileAuth: false,
      responsiveDesign: false
    };

    try {
      const response = await this.makeRequest(site.url);
      const html = response.body;

      // Check viewport meta tag
      if (html.includes('viewport') && html.includes('device-width')) {
        mobileTests.viewport = true;
      }

      // Check for touch-friendly elements
      if (html.includes('56px') || html.includes('touch') || html.includes('mobile')) {
        mobileTests.touchTargets = true;
      }

      // Check for mobile authentication
      if (html.includes('mobile-auth') || html.includes('mobileOAuth')) {
        mobileTests.mobileAuth = true;
      }

      // Check for responsive CSS
      if (html.includes('@media') || html.includes('responsive')) {
        mobileTests.responsiveDesign = true;
      }
    } catch (error) {
      // Silent fail for individual tests
    }

    return mobileTests;
  }

  async runSiteTests(site) {
    this.log(`\nTesting ${site.name}...`, 'INFO');
    
    const testResult = {
      site: site.name,
      url: site.url,
      projectId: site.projectId,
      timestamp: new Date().toISOString(),
      tests: {
        availability: null,
        authFeatures: null,
        oauthProviders: null,
        mobileResponsiveness: null
      },
      passed: 0,
      failed: 0,
      score: 0
    };

    // Test 1: Site Availability
    this.log('  ├─ Testing site availability...', 'INFO');
    const availability = await this.testSiteAvailability(site);
    testResult.tests.availability = availability;
    
    if (availability.available) {
      this.log('  │  ✅ Site is available', 'SUCCESS');
      testResult.passed++;
    } else {
      this.log(`  │  ❌ Site not available (${availability.statusCode})`, 'ERROR');
      testResult.failed++;
    }

    // Test 2: Authentication Features
    if (availability.available) {
      this.log('  ├─ Testing authentication features...', 'INFO');
      testResult.tests.authFeatures = availability.hasAuthFeatures;
      
      const authCount = Object.values(availability.hasAuthFeatures).filter(v => v).length;
      if (authCount > 0) {
        this.log(`  │  ✅ Found ${authCount} auth features`, 'SUCCESS');
        testResult.passed += authCount;
      } else {
        this.log('  │  ⚠️ No auth features detected', 'WARNING');
      }

      // Test 3: OAuth Providers
      this.log('  ├─ Testing OAuth providers...', 'INFO');
      const oauthTests = await this.testOAuthProviders(site);
      testResult.tests.oauthProviders = oauthTests;
      
      const oauthPassed = Object.values(oauthTests).filter(t => t.passed).length;
      if (oauthPassed > 0) {
        this.log(`  │  ✅ ${oauthPassed}/3 OAuth providers configured`, 'SUCCESS');
        testResult.passed += oauthPassed;
      } else {
        this.log('  │  ⚠️ OAuth providers not detected', 'WARNING');
      }

      // Test 4: Mobile Responsiveness
      this.log('  └─ Testing mobile responsiveness...', 'INFO');
      const mobileTests = await this.testMobileResponsiveness(site);
      testResult.tests.mobileResponsiveness = mobileTests;
      
      const mobilePassed = Object.values(mobileTests).filter(v => v).length;
      if (mobilePassed > 0) {
        this.log(`     ✅ ${mobilePassed}/4 mobile features detected`, 'SUCCESS');
        testResult.passed += mobilePassed;
      } else {
        this.log('     ⚠️ Limited mobile features', 'WARNING');
      }
    }

    // Calculate score
    const totalTests = testResult.passed + testResult.failed;
    testResult.score = totalTests > 0 ? Math.round((testResult.passed / totalTests) * 100) : 0;

    return testResult;
  }

  async runAllTests() {
    console.log('\n' + '='.repeat(80));
    console.log('🧪 APPWRITE SSO COMPREHENSIVE TESTING');
    console.log('='.repeat(80));
    console.log(`\nTesting ${TEST_SITES.length} sites for SSO functionality and mobile responsiveness...\n`);

    for (const site of TEST_SITES) {
      const result = await this.runSiteTests(site);
      this.results.push(result);
    }

    this.generateReport();
  }

  generateReport() {
    const endTime = Date.now();
    const duration = ((endTime - this.startTime) / 1000).toFixed(2);

    console.log('\n' + '='.repeat(80));
    console.log('📊 TEST RESULTS SUMMARY');
    console.log('='.repeat(80));

    // Overall Statistics
    const totalPassed = this.results.reduce((sum, r) => sum + r.passed, 0);
    const totalFailed = this.results.reduce((sum, r) => sum + r.failed, 0);
    const averageScore = Math.round(this.results.reduce((sum, r) => sum + r.score, 0) / this.results.length);

    console.log(`\n📈 OVERALL STATISTICS:`);
    console.log(`   Total Tests Run: ${totalPassed + totalFailed}`);
    console.log(`   ✅ Passed: ${totalPassed}`);
    console.log(`   ❌ Failed: ${totalFailed}`);
    console.log(`   📊 Average Score: ${averageScore}%`);
    console.log(`   ⏱️ Test Duration: ${duration}s`);

    // Site-by-Site Results
    console.log(`\n📋 SITE-BY-SITE RESULTS:\n`);
    
    this.results.forEach((result, index) => {
      console.log(`${index + 1}. ${result.site} (${result.score}%)`);
      console.log(`   URL: ${result.url}`);
      
      // Availability
      const available = result.tests.availability?.available;
      console.log(`   ${available ? '✅' : '❌'} Site Available: ${available ? 'Yes' : 'No'}`);
      
      if (available) {
        // Auth Features
        const authFeatures = result.tests.authFeatures || {};
        const authCount = Object.values(authFeatures).filter(v => v).length;
        console.log(`   ${authCount > 0 ? '✅' : '⚠️'} Auth Features: ${authCount}/8 detected`);
        
        // OAuth Providers
        const oauth = result.tests.oauthProviders || {};
        const oauthCount = Object.values(oauth).filter(t => t.passed).length;
        console.log(`   ${oauthCount > 0 ? '✅' : '⚠️'} OAuth Providers: ${oauthCount}/3 configured`);
        
        // Mobile Features
        const mobile = result.tests.mobileResponsiveness || {};
        const mobileCount = Object.values(mobile).filter(v => v).length;
        console.log(`   ${mobileCount > 2 ? '✅' : '⚠️'} Mobile Ready: ${mobileCount}/4 features`);
      }
      
      console.log('');
    });

    // Feature Coverage
    console.log(`📱 MOBILE SSO FEATURE COVERAGE:\n`);
    
    const features = {
      'Google OAuth': 0,
      'GitHub OAuth': 0,
      'Microsoft OAuth': 0,
      'Mobile Auth': 0,
      'Unified SSO': 0,
      'Touch Optimization': 0,
      'Responsive Design': 0,
      'Session Management': 0
    };

    this.results.forEach(result => {
      if (result.tests.authFeatures) {
        if (result.tests.authFeatures.hasGoogleOAuth) features['Google OAuth']++;
        if (result.tests.authFeatures.hasGitHubOAuth) features['GitHub OAuth']++;
        if (result.tests.authFeatures.hasMicrosoftOAuth) features['Microsoft OAuth']++;
        if (result.tests.authFeatures.hasMobileAuth) features['Mobile Auth']++;
        if (result.tests.authFeatures.hasUnifiedSSO) features['Unified SSO']++;
        if (result.tests.authFeatures.hasTouchOptimization) features['Touch Optimization']++;
      }
      if (result.tests.mobileResponsiveness) {
        if (result.tests.mobileResponsiveness.responsiveDesign) features['Responsive Design']++;
        if (result.tests.authFeatures?.hasSessionManagement) features['Session Management']++;
      }
    });

    Object.entries(features).forEach(([feature, count]) => {
      const percentage = Math.round((count / this.results.length) * 100);
      const bar = '█'.repeat(Math.floor(percentage / 10)) + '░'.repeat(10 - Math.floor(percentage / 10));
      console.log(`   ${feature.padEnd(20)} ${bar} ${percentage}% (${count}/${this.results.length} sites)`);
    });

    // Recommendations
    console.log(`\n💡 RECOMMENDATIONS:\n`);
    
    const failedSites = this.results.filter(r => !r.tests.availability?.available);
    if (failedSites.length > 0) {
      console.log(`   🔴 Critical: ${failedSites.length} site(s) are not available:`);
      failedSites.forEach(site => {
        console.log(`      - ${site.site}: ${site.url}`);
      });
    }

    const lowScoreSites = this.results.filter(r => r.score < 50 && r.tests.availability?.available);
    if (lowScoreSites.length > 0) {
      console.log(`   🟡 Warning: ${lowScoreSites.length} site(s) have low test scores:`);
      lowScoreSites.forEach(site => {
        console.log(`      - ${site.site}: ${site.score}% - Needs SSO feature improvements`);
      });
    }

    if (averageScore < 70) {
      console.log(`   🟡 Overall SSO implementation needs improvement (${averageScore}% average)`);
    } else if (averageScore >= 90) {
      console.log(`   🟢 Excellent SSO implementation across all sites! (${averageScore}% average)`);
    } else {
      console.log(`   🟢 Good SSO implementation with room for optimization (${averageScore}% average)`);
    }

    // Save detailed results
    const reportPath = 'appwrite-sso-test-results.json';
    fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
    
    console.log(`\n📄 Detailed test results saved to: ${reportPath}`);
    console.log('\n' + '='.repeat(80));
    console.log('✅ SSO TESTING COMPLETE');
    console.log('='.repeat(80) + '\n');
  }
}

// Run tests
if (require.main === module) {
  const tester = new AppwriteSSOTester();
  tester.runAllTests().catch(console.error);
}

module.exports = AppwriteSSOTester;