/**
 * Comprehensive Unified SSO Testing Script
 * Tests authentication and mobile compatibility across all projects
 */

const fs = require('fs');
const path = require('path');

class UnifiedSSOTester {
  constructor() {
    this.testResults = {
      projects: {},
      overall: {
        passed: 0,
        failed: 0,
        warnings: 0
      }
    };
    
    this.projects = [
      {
        name: 'GX Multi-Agent Platform',
        path: 'active-projects/gx-multi-agent-platform',
        type: 'react',
        ssoPath: 'apps/web-app/src/components/UnifiedSSO',
        mainFile: 'apps/web-app/src/App.jsx'
      },
      {
        name: 'Trading Post',
        path: 'active-projects/trading-post',
        type: 'react',
        ssoPath: 'trading-app-frontend/src/components/UnifiedSSO',
        mainFile: 'trading-app-frontend/src/App.jsx'
      },
      {
        name: 'Recursion Chat',
        path: 'active-projects/recursion-chat',
        type: 'react',
        ssoPath: 'client/src/components',
        mainFile: 'client/src/main.jsx'
      },
      {
        name: 'Slumlord RPG',
        path: 'active-projects/slumlord',
        type: 'vanilla',
        ssoPath: 'web/appwrite-deployment/src/services',
        mainFile: 'web/appwrite-deployment/index.html'
      }
    ];
  }

  async runAllTests() {
    console.log('🧪 Starting Unified SSO Comprehensive Testing...\n');
    
    for (const project of this.projects) {
      console.log(`\n📋 Testing ${project.name}...`);
      await this.testProject(project);
    }
    
    this.generateReport();
    return this.testResults;
  }

  async testProject(project) {
    const results = {
      name: project.name,
      type: project.type,
      tests: {}
    };

    try {
      // Test 1: File Structure Verification
      results.tests.fileStructure = await this.testFileStructure(project);
      
      // Test 2: SSO Component Integration
      results.tests.ssoIntegration = await this.testSSOIntegration(project);
      
      // Test 3: Mobile Responsiveness
      results.tests.mobileResponsive = await this.testMobileResponsiveness(project);
      
      // Test 4: OAuth Configuration
      results.tests.oauthConfig = await this.testOAuthConfiguration(project);
      
      // Test 5: Code Quality & Consistency
      results.tests.codeQuality = await this.testCodeQuality(project);
      
    } catch (error) {
      results.error = error.message;
      this.testResults.overall.failed++;
    }

    this.testResults.projects[project.name] = results;
  }

  async testFileStructure(project) {
    const test = {
      name: 'File Structure Verification',
      status: 'unknown',
      details: [],
      score: 0
    };

    try {
      const projectPath = path.resolve(project.path);
      
      // Check if project directory exists
      if (!fs.existsSync(projectPath)) {
        test.status = 'failed';
        test.details.push('❌ Project directory does not exist');
        return test;
      }

      test.details.push('✅ Project directory exists');
      test.score += 25;

      // Check SSO component path
      const ssoPath = path.join(projectPath, project.ssoPath);
      if (fs.existsSync(ssoPath)) {
        test.details.push('✅ SSO components directory exists');
        test.score += 25;
        
        // Check for unified SSO files
        const requiredFiles = project.type === 'react' 
          ? ['index.js', 'config.js', 'UnifiedSSO.css']
          : ['unified-sso.js'];
          
        for (const file of requiredFiles) {
          const filePath = path.join(ssoPath, file);
          if (fs.existsSync(filePath)) {
            test.details.push(`✅ ${file} exists`);
            test.score += 10;
          } else {
            test.details.push(`❌ ${file} missing`);
          }
        }
      } else {
        test.details.push('❌ SSO components directory missing');
      }

      // Check main application file
      const mainFile = path.join(projectPath, project.mainFile);
      if (fs.existsSync(mainFile)) {
        test.details.push('✅ Main application file exists');
        test.score += 15;
      } else {
        test.details.push('❌ Main application file missing');
      }

      // Check mobile responsive components
      const mobileFiles = ['mobile-base.css', 'mobile-utils.js'];
      let mobileScore = 0;
      
      // Look for mobile files in various possible locations
      const mobilePaths = [
        path.join(ssoPath, '..', 'MobileResponsive'),
        path.join(ssoPath, '..', '..', 'styles', 'MobileResponsive'),
        path.join(projectPath, 'src', 'styles', 'MobileResponsive')
      ];
      
      for (const mobilePath of mobilePaths) {
        if (fs.existsSync(mobilePath)) {
          for (const file of mobileFiles) {
            const filePath = path.join(mobilePath, file);
            if (fs.existsSync(filePath)) {
              test.details.push(`✅ Mobile: ${file} found`);
              mobileScore += 5;
            }
          }
          break;
        }
      }
      
      test.score += mobileScore;

      if (test.score >= 80) {
        test.status = 'passed';
        this.testResults.overall.passed++;
      } else if (test.score >= 60) {
        test.status = 'warning';
        this.testResults.overall.warnings++;
      } else {
        test.status = 'failed';
        this.testResults.overall.failed++;
      }

    } catch (error) {
      test.status = 'failed';
      test.details.push(`❌ Error: ${error.message}`);
      this.testResults.overall.failed++;
    }

    return test;
  }

  async testSSOIntegration(project) {
    const test = {
      name: 'SSO Integration Analysis',
      status: 'unknown',
      details: [],
      score: 0
    };

    try {
      const mainFile = path.join(project.path, project.mainFile);
      
      if (!fs.existsSync(mainFile)) {
        test.status = 'failed';
        test.details.push('❌ Cannot read main application file');
        return test;
      }

      const content = fs.readFileSync(mainFile, 'utf8');
      
      // Check for SSO imports
      if (project.type === 'react') {
        const ssoImportPatterns = [
          /import.*UnifiedSSO/,
          /import.*UnifiedAuth/,
          /from.*UnifiedSSO/
        ];
        
        let importFound = false;
        for (const pattern of ssoImportPatterns) {
          if (pattern.test(content)) {
            test.details.push('✅ SSO component import found');
            test.score += 30;
            importFound = true;
            break;
          }
        }
        
        if (!importFound) {
          test.details.push('⚠️ SSO component import not detected in main file');
        }
        
        // Check for authentication context usage
        if (content.includes('useAuth') || content.includes('AuthContext')) {
          test.details.push('✅ Authentication context usage detected');
          test.score += 20;
        }
        
        // Check for OAuth providers
        const oauthProviders = ['google', 'github', 'microsoft'];
        oauthProviders.forEach(provider => {
          if (content.toLowerCase().includes(provider)) {
            test.details.push(`✅ ${provider} OAuth provider configured`);
            test.score += 10;
          }
        });
        
      } else {
        // Vanilla JS checks
        if (content.includes('unified-sso.js')) {
          test.details.push('✅ Unified SSO script import found');
          test.score += 30;
        }
        
        if (content.includes('UnifiedSSOAuth') || content.includes('UnifiedSSOUI')) {
          test.details.push('✅ SSO class usage detected');
          test.score += 20;
        }
        
        if (content.includes('checkAuthStatus') || content.includes('signIn')) {
          test.details.push('✅ Authentication methods detected');
          test.score += 20;
        }
      }

      if (test.score >= 70) {
        test.status = 'passed';
        this.testResults.overall.passed++;
      } else if (test.score >= 40) {
        test.status = 'warning';  
        this.testResults.overall.warnings++;
      } else {
        test.status = 'failed';
        this.testResults.overall.failed++;
      }

    } catch (error) {
      test.status = 'failed';
      test.details.push(`❌ Error: ${error.message}`);
      this.testResults.overall.failed++;
    }

    return test;
  }

  async testMobileResponsiveness(project) {
    const test = {
      name: 'Mobile Responsiveness Check',
      status: 'unknown',
      details: [],
      score: 0
    };

    try {
      const projectPath = path.resolve(project.path);
      
      // Look for mobile-responsive CSS files
      const cssFiles = this.findFiles(projectPath, '.css');
      let mobileOptimizations = 0;
      
      for (const cssFile of cssFiles) {
        const content = fs.readFileSync(cssFile, 'utf8');
        
        // Check for mobile-specific optimizations
        const mobileFeatures = [
          { pattern: /@media.*max-width.*768px/i, name: 'Mobile breakpoints' },
          { pattern: /viewport-fit.*cover/i, name: 'Safe area support' },
          { pattern: /env\(safe-area-inset/i, name: 'iOS notch handling' },
          { pattern: /100dvh/i, name: 'Dynamic viewport height' },
          { pattern: /touch-action/i, name: 'Touch optimization' },
          { pattern: /-webkit-tap-highlight-color/i, name: 'Tap highlight control' },
          { pattern: /user-select.*none/i, name: 'Selection control' }
        ];
        
        mobileFeatures.forEach(feature => {
          if (feature.pattern.test(content)) {
            test.details.push(`✅ ${feature.name} found`);
            mobileOptimizations++;
            test.score += 10;
          }
        });
      }
      
      // Check main file for mobile optimizations
      const mainFile = path.join(projectPath, project.mainFile);
      if (fs.existsSync(mainFile)) {
        const content = fs.readFileSync(mainFile, 'utf8');
        
        // Check for viewport meta tag
        if (content.includes('viewport') && content.includes('user-scalable=no')) {
          test.details.push('✅ Mobile viewport meta tag configured');
          test.score += 15;
        }
        
        // Check for PWA manifest
        if (content.includes('manifest.json') || content.includes('apple-mobile-web-app')) {
          test.details.push('✅ PWA mobile app features detected');
          test.score += 15;
        }
      }

      if (mobileOptimizations === 0) {
        test.details.push('⚠️ No mobile-specific optimizations detected');
      }

      if (test.score >= 50) {
        test.status = 'passed';
        this.testResults.overall.passed++;
      } else if (test.score >= 25) {
        test.status = 'warning';
        this.testResults.overall.warnings++;
      } else {
        test.status = 'failed';
        this.testResults.overall.failed++;
      }

    } catch (error) {
      test.status = 'failed';
      test.details.push(`❌ Error: ${error.message}`);
      this.testResults.overall.failed++;
    }

    return test;
  }

  async testOAuthConfiguration(project) {
    const test = {
      name: 'OAuth Provider Configuration',
      status: 'unknown',
      details: [],
      score: 0
    };

    try {
      const projectPath = path.resolve(project.path);
      
      // Look for configuration files
      const configFiles = [
        ...this.findFiles(projectPath, '.js').filter(f => 
          f.includes('config') || f.includes('auth') || f.includes('sso')
        ),
        ...this.findFiles(projectPath, '.env'),
        ...this.findFiles(projectPath, '.json')
      ];

      let providersFound = [];
      
      for (const configFile of configFiles) {
        try {
          const content = fs.readFileSync(configFile, 'utf8');
          
          // Check for OAuth providers
          const providers = ['google', 'github', 'microsoft', 'facebook', 'apple', 'discord'];
          providers.forEach(provider => {
            if (content.toLowerCase().includes(provider) && !providersFound.includes(provider)) {
              providersFound.push(provider);
              test.details.push(`✅ ${provider} OAuth provider configured`);
              test.score += 15;
            }
          });
          
          // Check for Appwrite configuration
          if (content.includes('appwrite') || content.includes('Appwrite')) {
            test.details.push('✅ Appwrite backend configuration found');
            test.score += 10;
          }
          
          // Check for proper project IDs
          if (content.includes('projectId') || content.includes('PROJECT_ID')) {
            test.details.push('✅ Project ID configuration detected');
            test.score += 10;
          }
          
        } catch (err) {
          // Skip files that can't be read
        }
      }

      if (providersFound.length === 0) {
        test.details.push('⚠️ No OAuth providers detected in configuration');
      } else {
        test.details.push(`📊 Total OAuth providers configured: ${providersFound.length}`);
      }

      if (test.score >= 40) {
        test.status = 'passed';
        this.testResults.overall.passed++;
      } else if (test.score >= 20) {
        test.status = 'warning';
        this.testResults.overall.warnings++;
      } else {
        test.status = 'failed';
        this.testResults.overall.failed++;
      }

    } catch (error) {
      test.status = 'failed';
      test.details.push(`❌ Error: ${error.message}`);
      this.testResults.overall.failed++;
    }

    return test;
  }

  async testCodeQuality(project) {
    const test = {
      name: 'Code Quality & Consistency',
      status: 'unknown',
      details: [],
      score: 0
    };

    try {
      const projectPath = path.resolve(project.path);
      const jsFiles = this.findFiles(projectPath, '.js').concat(this.findFiles(projectPath, '.jsx'));
      
      let totalFiles = 0;
      let qualityScore = 0;
      
      for (const jsFile of jsFiles.slice(0, 10)) { // Limit to 10 files for performance
        try {
          const content = fs.readFileSync(jsFile, 'utf8');
          totalFiles++;
          
          // Check for error handling
          if (content.includes('try') && content.includes('catch')) {
            qualityScore++;
          }
          
          // Check for console logging (good for debugging)
          if (content.includes('console.log') && content.includes('AUTH')) {
            qualityScore++;
          }
          
          // Check for proper imports/exports
          if (content.includes('export') || content.includes('import')) {
            qualityScore++;
          }
          
        } catch (err) {
          // Skip files that can't be read
        }
      }
      
      if (totalFiles > 0) {
        const percentage = (qualityScore / (totalFiles * 3)) * 100;
        test.score = Math.round(percentage);
        test.details.push(`✅ Analyzed ${totalFiles} JavaScript files`);
        test.details.push(`📊 Code quality score: ${test.score}%`);
        
        if (test.score >= 60) {
          test.details.push('✅ Good error handling and code structure');
        } else {
          test.details.push('⚠️ Consider adding more error handling');
        }
      } else {
        test.details.push('⚠️ No JavaScript files found for analysis');
        test.score = 50; // Neutral score
      }

      if (test.score >= 70) {
        test.status = 'passed';
        this.testResults.overall.passed++;
      } else if (test.score >= 50) {
        test.status = 'warning';
        this.testResults.overall.warnings++;
      } else {
        test.status = 'failed';
        this.testResults.overall.failed++;
      }

    } catch (error) {
      test.status = 'failed';
      test.details.push(`❌ Error: ${error.message}`);
      this.testResults.overall.failed++;
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

  generateReport() {
    console.log('\n' + '='.repeat(80));
    console.log('📊 UNIFIED SSO TESTING REPORT');
    console.log('='.repeat(80));
    
    console.log(`\n📈 Overall Results:`);
    console.log(`✅ Tests Passed: ${this.testResults.overall.passed}`);
    console.log(`⚠️  Tests with Warnings: ${this.testResults.overall.warnings}`);
    console.log(`❌ Tests Failed: ${this.testResults.overall.failed}`);
    
    const totalTests = this.testResults.overall.passed + this.testResults.overall.warnings + this.testResults.overall.failed;
    const successRate = totalTests > 0 ? Math.round((this.testResults.overall.passed / totalTests) * 100) : 0;
    console.log(`📊 Success Rate: ${successRate}%`);
    
    console.log('\n📋 Detailed Results by Project:\n');
    
    for (const [projectName, results] of Object.entries(this.testResults.projects)) {
      console.log(`\n🔍 ${projectName} (${results.type.toUpperCase()})`);
      console.log('-'.repeat(50));
      
      if (results.error) {
        console.log(`❌ Error: ${results.error}`);
        continue;
      }
      
      for (const [testName, testResult] of Object.entries(results.tests)) {
        const statusIcon = testResult.status === 'passed' ? '✅' : 
                          testResult.status === 'warning' ? '⚠️' : '❌';
        
        console.log(`${statusIcon} ${testResult.name} (Score: ${testResult.score}%)`);
        
        if (testResult.details.length > 0) {
          testResult.details.forEach(detail => {
            console.log(`   ${detail}`);
          });
        }
        console.log('');
      }
    }
    
    console.log('\n' + '='.repeat(80));
    
    if (successRate >= 80) {
      console.log('🎉 EXCELLENT: Unified SSO implementation is highly successful!');
    } else if (successRate >= 60) {
      console.log('✅ GOOD: Unified SSO implementation is mostly successful with minor issues.');
    } else if (successRate >= 40) {
      console.log('⚠️ FAIR: Unified SSO implementation needs some improvements.');
    } else {
      console.log('❌ NEEDS WORK: Unified SSO implementation requires significant fixes.');
    }
    
    console.log('='.repeat(80) + '\n');
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = UnifiedSSOTester;
}

// Run tests if executed directly
if (require.main === module) {
  const tester = new UnifiedSSOTester();
  tester.runAllTests().then(results => {
    console.log('🏁 Testing complete!');
    process.exit(0);
  }).catch(error => {
    console.error('❌ Testing failed:', error);
    process.exit(1);
  });
}