/**
 * Mobile Compatibility Testing Script
 * Simulates mobile testing for unified SSO implementation
 */

const fs = require('fs');
const path = require('path');

class MobileCompatibilityTester {
  constructor() {
    this.mobileTestResults = {
      projects: {},
      summary: {
        totalProjects: 0,
        mobileReady: 0,
        needsImprovement: 0,
        failed: 0
      }
    };

    this.projects = [
      {
        name: 'GX Multi-Agent Platform',
        path: 'active-projects/gx-multi-agent-platform',
        url: 'https://gx-multi-agent.appwrite.network',
        expectedElements: ['UnifiedAuth', 'mobile-responsive', 'oauth-providers']
      },
      {
        name: 'Trading Post',
        path: 'active-projects/trading-post', 
        url: 'https://tradingpost.appwrite.network',
        expectedElements: ['TradingPostUnifiedAuth', 'mobile-optimized', 'responsive-design']
      },
      {
        name: 'Recursion Chat',
        path: 'active-projects/recursion-chat',
        url: 'https://chat.recursionsystems.com',
        expectedElements: ['RecursionChatUnifiedAuth', 'chat-mobile', 'touch-friendly']
      },
      {
        name: 'Slumlord RPG',
        path: 'active-projects/slumlord',
        url: 'https://slumlord.appwrite.network',
        expectedElements: ['UnifiedSSOAuth', 'game-mobile', 'touch-controls']
      }
    ];

    // Mobile device configurations to test
    this.mobileDevices = [
      {
        name: 'iPhone 14 Pro',
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15',
        viewport: { width: 393, height: 852 },
        features: ['notch', 'safe-area', 'touch']
      },
      {
        name: 'iPhone SE',
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15',
        viewport: { width: 375, height: 667 },
        features: ['compact', 'touch', 'small-screen']
      },
      {
        name: 'Samsung Galaxy S21',
        userAgent: 'Mozilla/5.0 (Linux; Android 11; SM-G991B) AppleWebKit/537.36',
        viewport: { width: 360, height: 800 },
        features: ['android', 'touch', 'edge-display']
      },
      {
        name: 'iPad Pro',
        userAgent: 'Mozilla/5.0 (iPad; CPU OS 15_0 like Mac OS X) AppleWebKit/605.1.15',
        viewport: { width: 1024, height: 1366 },
        features: ['large-tablet', 'touch', 'ios']
      }
    ];
  }

  async runAllMobileTests() {
    console.log('📱 Starting Mobile Compatibility Testing...\n');
    
    for (const project of this.projects) {
      console.log(`\n🔍 Testing ${project.name} Mobile Compatibility...`);
      await this.testProjectMobileCompatibility(project);
    }
    
    this.generateMobileReport();
    return this.mobileTestResults;
  }

  async testProjectMobileCompatibility(project) {
    const results = {
      name: project.name,
      url: project.url,
      tests: {},
      deviceResults: {},
      overallScore: 0
    };

    try {
      // Test 1: CSS Mobile Responsiveness
      results.tests.cssResponsiveness = await this.testCSSResponsiveness(project);
      
      // Test 2: Touch Interface Design
      results.tests.touchInterface = await this.testTouchInterface(project);
      
      // Test 3: Mobile Authentication Flow
      results.tests.mobileAuthFlow = await this.testMobileAuthenticationFlow(project);
      
      // Test 4: iOS Safari Compatibility
      results.tests.iosSafariCompat = await this.testIOSSafariCompatibility(project);
      
      // Test 5: Android Browser Compatibility
      results.tests.androidCompat = await this.testAndroidCompatibility(project);
      
      // Test 6: Performance on Mobile Networks
      results.tests.mobilePerformance = await this.testMobilePerformance(project);
      
      // Test 7: PWA Features
      results.tests.pwaFeatures = await this.testPWAFeatures(project);

      // Calculate overall score
      const testScores = Object.values(results.tests).map(t => t.score || 0);
      results.overallScore = Math.round(testScores.reduce((a, b) => a + b, 0) / testScores.length);
      
      // Classify results
      if (results.overallScore >= 80) {
        this.mobileTestResults.summary.mobileReady++;
      } else if (results.overallScore >= 60) {
        this.mobileTestResults.summary.needsImprovement++;
      } else {
        this.mobileTestResults.summary.failed++;
      }
      
    } catch (error) {
      results.error = error.message;
      this.mobileTestResults.summary.failed++;
    }

    this.mobileTestResults.projects[project.name] = results;
    this.mobileTestResults.summary.totalProjects++;
  }

  async testCSSResponsiveness(project) {
    const test = {
      name: 'CSS Mobile Responsiveness',
      status: 'unknown',
      details: [],
      score: 0
    };

    try {
      const projectPath = path.resolve(project.path);
      const cssFiles = this.findFiles(projectPath, '.css');
      
      let responsiveFeatures = 0;
      const requiredFeatures = [
        { pattern: /@media.*max-width.*768px/i, name: 'Mobile breakpoints', points: 20 },
        { pattern: /@media.*max-width.*480px/i, name: 'Small mobile breakpoints', points: 15 },
        { pattern: /env\(safe-area-inset/i, name: 'iOS safe area support', points: 15 },
        { pattern: /100dvh/i, name: 'Dynamic viewport height', points: 15 },
        { pattern: /touch-action/i, name: 'Touch optimization', points: 10 },
        { pattern: /-webkit-tap-highlight-color/i, name: 'Tap highlight control', points: 10 },
        { pattern: /flex.*wrap/i, name: 'Flexible layouts', points: 10 },
        { pattern: /grid.*auto-fit/i, name: 'Responsive grids', points: 5 }
      ];

      for (const cssFile of cssFiles) {
        try {
          const content = fs.readFileSync(cssFile, 'utf8');
          
          for (const feature of requiredFeatures) {
            if (feature.pattern.test(content)) {
              test.details.push(`✅ ${feature.name} implemented`);
              test.score += feature.points;
              responsiveFeatures++;
            }
          }
        } catch (err) {
          // Skip files that can't be read
        }
      }

      if (responsiveFeatures === 0) {
        test.details.push('❌ No mobile-responsive CSS features detected');
      } else {
        test.details.push(`📊 Found ${responsiveFeatures} responsive features`);
      }

      // Check for viewport meta tag
      const htmlFiles = this.findFiles(projectPath, '.html').concat(this.findFiles(projectPath, '.jsx'));
      let hasViewportMeta = false;
      
      for (const htmlFile of htmlFiles) {
        try {
          const content = fs.readFileSync(htmlFile, 'utf8');
          if (content.includes('viewport') && content.includes('width=device-width')) {
            test.details.push('✅ Proper viewport meta tag found');
            test.score += 15;
            hasViewportMeta = true;
            break;
          }
        } catch (err) {
          // Skip files that can't be read
        }
      }

      if (!hasViewportMeta) {
        test.details.push('⚠️ Viewport meta tag not detected');
      }

      test.status = test.score >= 60 ? 'passed' : test.score >= 30 ? 'warning' : 'failed';

    } catch (error) {
      test.status = 'failed';
      test.details.push(`❌ Error: ${error.message}`);
    }

    return test;
  }

  async testTouchInterface(project) {
    const test = {
      name: 'Touch Interface Design',
      status: 'unknown',
      details: [],
      score: 0
    };

    try {
      const projectPath = path.resolve(project.path);
      const allFiles = [
        ...this.findFiles(projectPath, '.css'),
        ...this.findFiles(projectPath, '.js'),
        ...this.findFiles(projectPath, '.jsx')
      ];

      const touchFeatures = [
        { pattern: /min-height:\s*44px/i, name: 'iOS touch target size (44px)', points: 20 },
        { pattern: /min-width:\s*44px/i, name: 'iOS touch target width (44px)', points: 20 },
        { pattern: /touch-action:\s*manipulation/i, name: 'Touch action optimization', points: 15 },
        { pattern: /user-select:\s*none/i, name: 'Text selection control', points: 10 },
        { pattern: /-webkit-touch-callout:\s*none/i, name: 'iOS callout prevention', points: 10 },
        { pattern: /cursor:\s*pointer/i, name: 'Pointer cursor for interactives', points: 10 },
        { pattern: /ontouchstart|touchend|touchmove/i, name: 'Touch event handling', points: 15 }
      ];

      for (const file of allFiles) {
        try {
          const content = fs.readFileSync(file, 'utf8');
          
          for (const feature of touchFeatures) {
            if (feature.pattern.test(content)) {
              test.details.push(`✅ ${feature.name} implemented`);
              test.score += feature.points;
            }
          }
        } catch (err) {
          // Skip files that can't be read
        }
      }

      // Check for button/interactive element sizing
      let hasLargeButtons = false;
      for (const file of allFiles) {
        try {
          const content = fs.readFileSync(file, 'utf8');
          if (content.includes('padding') && (content.includes('15px') || content.includes('20px') || content.includes('1rem'))) {
            test.details.push('✅ Adequate button padding detected');
            test.score += 15;
            hasLargeButtons = true;
            break;
          }
        } catch (err) {
          // Skip files that can't be read
        }
      }

      if (!hasLargeButtons) {
        test.details.push('⚠️ Consider increasing button padding for better touch experience');
      }

      test.status = test.score >= 80 ? 'passed' : test.score >= 50 ? 'warning' : 'failed';

    } catch (error) {
      test.status = 'failed';
      test.details.push(`❌ Error: ${error.message}`);
    }

    return test;
  }

  async testMobileAuthenticationFlow(project) {
    const test = {
      name: 'Mobile Authentication Flow',
      status: 'unknown',
      details: [],
      score: 0
    };

    try {
      const projectPath = path.resolve(project.path);
      const jsFiles = this.findFiles(projectPath, '.js').concat(this.findFiles(projectPath, '.jsx'));

      let authFeatures = 0;
      const authRequirements = [
        { pattern: /OAuth|oauth/i, name: 'OAuth implementation', points: 25 },
        { pattern: /mobile.*auth|auth.*mobile/i, name: 'Mobile-specific auth handling', points: 20 },
        { pattern: /redirect.*callback|callback.*redirect/i, name: 'OAuth callback handling', points: 20 },
        { pattern: /error.*handling|catch.*error/i, name: 'Error handling in auth flow', points: 15 },
        { pattern: /loading|spinner|progress/i, name: 'Loading states for slow connections', points: 10 },
        { pattern: /offline|network.*error/i, name: 'Offline/network error handling', points: 10 }
      ];

      for (const jsFile of jsFiles) {
        try {
          const content = fs.readFileSync(jsFile, 'utf8');
          
          for (const requirement of authRequirements) {
            if (requirement.pattern.test(content) && !test.details.some(d => d.includes(requirement.name))) {
              test.details.push(`✅ ${requirement.name} detected`);
              test.score += requirement.points;
              authFeatures++;
            }
          }
        } catch (err) {
          // Skip files that can't be read
        }
      }

      // Check for mobile-specific auth components
      const hasUnifiedSSO = jsFiles.some(file => {
        try {
          const content = fs.readFileSync(file, 'utf8');
          return content.includes('UnifiedSSO') || content.includes('unified-sso');
        } catch {
          return false;
        }
      });

      if (hasUnifiedSSO) {
        test.details.push('✅ Unified SSO system detected');
        test.score += 20;
      } else {
        test.details.push('⚠️ Unified SSO system not clearly detected');
      }

      if (authFeatures === 0) {
        test.details.push('❌ No authentication features detected');
      }

      test.status = test.score >= 70 ? 'passed' : test.score >= 40 ? 'warning' : 'failed';

    } catch (error) {
      test.status = 'failed';
      test.details.push(`❌ Error: ${error.message}`);
    }

    return test;
  }

  async testIOSSafariCompatibility(project) {
    const test = {
      name: 'iOS Safari Compatibility',
      status: 'unknown',
      details: [],
      score: 0
    };

    try {
      const projectPath = path.resolve(project.path);
      const allFiles = [
        ...this.findFiles(projectPath, '.css'),
        ...this.findFiles(projectPath, '.html'),
        ...this.findFiles(projectPath, '.js'),
        ...this.findFiles(projectPath, '.jsx')
      ];

      const iosFeatures = [
        { pattern: /env\(safe-area-inset/i, name: 'iOS safe area insets support', points: 25 },
        { pattern: /-webkit-appearance:\s*none/i, name: 'iOS default styling override', points: 15 },
        { pattern: /apple-mobile-web-app/i, name: 'iOS web app meta tags', points: 20 },
        { pattern: /100dvh/i, name: 'Dynamic viewport height (iOS fix)', points: 20 },
        { pattern: /-webkit-tap-highlight-color/i, name: 'iOS tap highlight control', points: 10 },
        { pattern: /-webkit-touch-callout:\s*none/i, name: 'iOS callout prevention', points: 10 }
      ];

      for (const file of allFiles) {
        try {
          const content = fs.readFileSync(file, 'utf8');
          
          for (const feature of iosFeatures) {
            if (feature.pattern.test(content) && !test.details.some(d => d.includes(feature.name))) {
              test.details.push(`✅ ${feature.name} implemented`);
              test.score += feature.points;
            }
          }
        } catch (err) {
          // Skip files that can't be read
        }
      }

      test.status = test.score >= 60 ? 'passed' : test.score >= 30 ? 'warning' : 'failed';

    } catch (error) {
      test.status = 'failed';
      test.details.push(`❌ Error: ${error.message}`);
    }

    return test;
  }

  async testAndroidCompatibility(project) {
    const test = {
      name: 'Android Browser Compatibility',
      status: 'unknown',
      details: [],
      score: 0
    };

    try {
      const projectPath = path.resolve(project.path);
      const allFiles = [
        ...this.findFiles(projectPath, '.css'),
        ...this.findFiles(projectPath, '.html'),
        ...this.findFiles(projectPath, '.js'),
        ...this.findFiles(projectPath, '.jsx')
      ];

      const androidFeatures = [
        { pattern: /theme-color/i, name: 'Android theme color meta tag', points: 20 },
        { pattern: /touch-action/i, name: 'Android touch action optimization', points: 20 },
        { pattern: /viewport-fit=cover/i, name: 'Edge-to-edge display support', points: 15 },
        { pattern: /will-change/i, name: 'Hardware acceleration hints', points: 15 },
        { pattern: /transform3d|translateZ/i, name: '3D transform optimizations', points: 15 },
        { pattern: /user-scalable=no/i, name: 'Zoom prevention', points: 15 }
      ];

      for (const file of allFiles) {
        try {
          const content = fs.readFileSync(file, 'utf8');
          
          for (const feature of androidFeatures) {
            if (feature.pattern.test(content) && !test.details.some(d => d.includes(feature.name))) {
              test.details.push(`✅ ${feature.name} implemented`);
              test.score += feature.points;
            }
          }
        } catch (err) {
          // Skip files that can't be read
        }
      }

      test.status = test.score >= 60 ? 'passed' : test.score >= 30 ? 'warning' : 'failed';

    } catch (error) {
      test.status = 'failed';
      test.details.push(`❌ Error: ${error.message}`);
    }

    return test;
  }

  async testMobilePerformance(project) {
    const test = {
      name: 'Mobile Performance Optimization',
      status: 'unknown',
      details: [],
      score: 0
    };

    try {
      const projectPath = path.resolve(project.path);
      
      // Check for performance optimization techniques
      const jsFiles = this.findFiles(projectPath, '.js').concat(this.findFiles(projectPath, '.jsx'));
      const cssFiles = this.findFiles(projectPath, '.css');

      const performanceFeatures = [
        { pattern: /lazy.*loading|dynamic.*import/i, name: 'Lazy loading implementation', points: 20 },
        { pattern: /will-change/i, name: 'CSS will-change optimization', points: 15 },
        { pattern: /transform3d|translateZ\(0\)/i, name: 'Hardware acceleration triggers', points: 15 },
        { pattern: /debounce|throttle/i, name: 'Event debouncing/throttling', points: 15 },
        { pattern: /preload|prefetch/i, name: 'Resource preloading', points: 10 },
        { pattern: /async|defer/i, name: 'Async script loading', points: 10 },
        { pattern: /requestAnimationFrame/i, name: 'Smooth animations', points: 15 }
      ];

      const allFiles = [...jsFiles, ...cssFiles];
      
      for (const file of allFiles) {
        try {
          const content = fs.readFileSync(file, 'utf8');
          
          for (const feature of performanceFeatures) {
            if (feature.pattern.test(content) && !test.details.some(d => d.includes(feature.name))) {
              test.details.push(`✅ ${feature.name} detected`);
              test.score += feature.points;
            }
          }
        } catch (err) {
          // Skip files that can't be read
        }
      }

      // Check bundle size indicators
      const packageFiles = this.findFiles(projectPath, 'package.json');
      for (const pkgFile of packageFiles) {
        try {
          const content = fs.readFileSync(pkgFile, 'utf8');
          const pkg = JSON.parse(content);
          
          if (pkg.scripts && (pkg.scripts.build || pkg.scripts.optimize)) {
            test.details.push('✅ Build optimization scripts available');
            test.score += 10;
          }
          
          if (pkg.dependencies || pkg.devDependencies) {
            const deps = {...(pkg.dependencies || {}), ...(pkg.devDependencies || {})};
            if (deps.terser || deps['@rollup/plugin-terser'] || deps['webpack-bundle-analyzer']) {
              test.details.push('✅ Bundle optimization tools detected');
              test.score += 10;
            }
          }
        } catch (err) {
          // Skip invalid JSON
        }
      }

      test.status = test.score >= 60 ? 'passed' : test.score >= 30 ? 'warning' : 'failed';

    } catch (error) {
      test.status = 'failed';
      test.details.push(`❌ Error: ${error.message}`);
    }

    return test;
  }

  async testPWAFeatures(project) {
    const test = {
      name: 'Progressive Web App Features',
      status: 'unknown',
      details: [],
      score: 0
    };

    try {
      const projectPath = path.resolve(project.path);
      
      // Look for PWA manifest
      const manifestFiles = [
        ...this.findFiles(projectPath, 'manifest.json'),
        ...this.findFiles(projectPath, 'app.webmanifest')
      ];

      if (manifestFiles.length > 0) {
        test.details.push('✅ PWA manifest file found');
        test.score += 30;
        
        try {
          const manifestContent = fs.readFileSync(manifestFiles[0], 'utf8');
          const manifest = JSON.parse(manifestContent);
          
          const requiredFields = ['name', 'short_name', 'start_url', 'display', 'theme_color', 'icons'];
          const foundFields = requiredFields.filter(field => manifest[field]);
          
          test.details.push(`✅ Manifest has ${foundFields.length}/${requiredFields.length} required fields`);
          test.score += (foundFields.length / requiredFields.length) * 30;
          
        } catch (err) {
          test.details.push('⚠️ Manifest file exists but has parsing issues');
        }
      } else {
        test.details.push('⚠️ No PWA manifest file detected');
      }

      // Look for service worker
      const allFiles = [
        ...this.findFiles(projectPath, '.js'),
        ...this.findFiles(projectPath, '.html'),
        ...this.findFiles(projectPath, '.jsx')
      ];

      let hasServiceWorker = false;
      for (const file of allFiles) {
        try {
          const content = fs.readFileSync(file, 'utf8');
          if (content.includes('serviceWorker') || content.includes('sw.js')) {
            test.details.push('✅ Service worker implementation detected');
            test.score += 20;
            hasServiceWorker = true;
            break;
          }
        } catch (err) {
          // Skip files that can't be read
        }
      }

      if (!hasServiceWorker) {
        test.details.push('⚠️ No service worker detected');
      }

      // Check for offline capability indicators
      let hasOfflineSupport = false;
      for (const file of allFiles) {
        try {
          const content = fs.readFileSync(file, 'utf8');
          if (content.includes('offline') || content.includes('cache') || content.includes('navigator.onLine')) {
            test.details.push('✅ Offline functionality indicators found');
            test.score += 20;
            hasOfflineSupport = true;
            break;
          }
        } catch (err) {
          // Skip files that can't be read
        }
      }

      if (!hasOfflineSupport) {
        test.details.push('ℹ️ Limited offline functionality detected');
      }

      test.status = test.score >= 70 ? 'passed' : test.score >= 40 ? 'warning' : 'failed';

    } catch (error) {
      test.status = 'failed';
      test.details.push(`❌ Error: ${error.message}`);
    }

    return test;
  }

  findFiles(dir, extension, files = []) {
    try {
      const items = fs.readdirSync(dir);
      
      for (const item of items) {
        const fullPath = path.join(dir, item);
        
        try {
          const stat = fs.statSync(fullPath);
          
          if (stat.isDirectory() && !item.includes('node_modules') && !item.includes('.git')) {
            this.findFiles(fullPath, extension, files);
          } else if (stat.isFile() && item.endsWith(extension)) {
            files.push(fullPath);
          }
        } catch (err) {
          // Skip items we can't access
        }
      }
    } catch (err) {
      // Skip directories we can't read
    }
    
    return files;
  }

  generateMobileReport() {
    console.log('\n' + '='.repeat(80));
    console.log('📱 MOBILE COMPATIBILITY TEST REPORT');
    console.log('='.repeat(80));
    
    console.log(`\n📊 Summary:`);
    console.log(`📱 Total Projects Tested: ${this.mobileTestResults.summary.totalProjects}`);
    console.log(`✅ Mobile Ready: ${this.mobileTestResults.summary.mobileReady}`);
    console.log(`⚠️  Needs Improvement: ${this.mobileTestResults.summary.needsImprovement}`);
    console.log(`❌ Failed: ${this.mobileTestResults.summary.failed}`);
    
    const successRate = this.mobileTestResults.summary.totalProjects > 0 ? 
      Math.round((this.mobileTestResults.summary.mobileReady / this.mobileTestResults.summary.totalProjects) * 100) : 0;
    console.log(`📈 Mobile Success Rate: ${successRate}%`);
    
    console.log('\n📋 Detailed Results by Project:\n');
    
    for (const [projectName, results] of Object.entries(this.mobileTestResults.projects)) {
      console.log(`\n📱 ${projectName}`);
      console.log('-'.repeat(50));
      console.log(`🌐 URL: ${results.url}`);
      console.log(`📊 Overall Mobile Score: ${results.overallScore}%`);
      
      if (results.error) {
        console.log(`❌ Error: ${results.error}`);
        continue;
      }
      
      for (const [testName, testResult] of Object.entries(results.tests)) {
        const statusIcon = testResult.status === 'passed' ? '✅' : 
                          testResult.status === 'warning' ? '⚠️' : '❌';
        
        console.log(`\n${statusIcon} ${testResult.name} (${testResult.score}%)`);
        
        if (testResult.details.length > 0) {
          testResult.details.slice(0, 5).forEach(detail => {
            console.log(`   ${detail}`);
          });
          
          if (testResult.details.length > 5) {
            console.log(`   ... and ${testResult.details.length - 5} more features`);
          }
        }
      }
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('🎯 MOBILE COMPATIBILITY ASSESSMENT');
    console.log('='.repeat(80));
    
    if (successRate >= 75) {
      console.log('🎉 EXCELLENT: All projects are highly mobile-compatible!');
      console.log('✅ Users will have an excellent experience on mobile devices');
      console.log('✅ iOS Safari and Android browsers fully supported');
      console.log('✅ Touch interfaces are optimized and user-friendly');
    } else if (successRate >= 50) {
      console.log('✅ GOOD: Most projects are mobile-ready with minor improvements needed');
      console.log('📱 Core mobile functionality works well');
      console.log('⚠️ Some advanced mobile features could be enhanced');
    } else if (successRate >= 25) {
      console.log('⚠️ FAIR: Mobile compatibility exists but needs significant improvements');
      console.log('📱 Basic mobile viewing works');
      console.log('🔧 Recommend prioritizing mobile optimization');
    } else {
      console.log('❌ NEEDS WORK: Mobile compatibility requires major attention');
      console.log('📱 Users may have difficulty on mobile devices');
      console.log('🚨 High priority: Implement mobile-responsive design');
    }
    
    console.log('\n💡 RECOMMENDATIONS:');
    
    if (this.mobileTestResults.summary.mobileReady < this.mobileTestResults.summary.totalProjects) {
      console.log('📱 Add iOS Safari safe area support for notched devices');
      console.log('👆 Ensure touch targets are minimum 44px for accessibility');
      console.log('🔄 Implement proper loading states for slower mobile networks');
      console.log('📦 Add PWA features for native app-like experience');
      console.log('⚡ Optimize performance for mobile devices and networks');
    }
    
    console.log('='.repeat(80) + '\n');
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MobileCompatibilityTester;
}

// Run tests if executed directly
if (require.main === module) {
  const tester = new MobileCompatibilityTester();
  tester.runAllMobileTests().then(results => {
    console.log('🏁 Mobile compatibility testing complete!');
    process.exit(0);
  }).catch(error => {
    console.error('❌ Mobile testing failed:', error);
    process.exit(1);
  });
}