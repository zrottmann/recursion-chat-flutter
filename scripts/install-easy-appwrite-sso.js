#!/usr/bin/env node
/**
 * Easy Appwrite SSO Installation Script
 * Automatically installs SSO across all compatible applications
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PROJECTS = [
  {
    name: 'Recursion Chat',
    path: 'active-projects/recursion-chat/client',
    packageManager: 'npm',
    framework: 'React+Vite',
    hasAppwrite: true,
    srcDir: 'src'
  },
  {
    name: 'Trading Post Frontend',
    path: 'active-projects/trading-post/trading-app-frontend',
    packageManager: 'npm',
    framework: 'React+Vite',
    hasAppwrite: true,
    srcDir: 'src'
  },
  {
    name: 'Archon Knowledge Engine',
    path: 'active-projects/archon/frontend',
    packageManager: 'npm',
    framework: 'React+Vite',
    hasAppwrite: true,
    srcDir: 'src'
  },
  {
    name: 'Claude Code Remote',
    path: 'active-projects/Claude-Code-Remote',
    packageManager: 'npm',
    framework: 'Next.js',
    hasAppwrite: true,
    srcDir: 'pages'
  },
  {
    name: 'Slumlord Web',
    path: 'active-projects/slumlord/web/appwrite-deployment',
    packageManager: 'npm',
    framework: 'Vanilla JS',
    hasAppwrite: true,
    srcDir: 'src'
  },
  {
    name: 'Super Console',
    path: 'super-console/src',
    packageManager: 'npm',
    framework: 'Next.js',
    hasAppwrite: false,
    srcDir: 'src'
  }
];

class EasyAppwriteSSOInstaller {
  constructor() {
    this.results = [];
    this.baseDir = process.cwd();
  }

  async install() {
    console.log('🚀 Installing Easy Appwrite SSO across all applications...\n');

    for (const project of PROJECTS) {
      console.log(`📦 Processing ${project.name}...`);
      
      try {
        const result = await this.installInProject(project);
        this.results.push({ project: project.name, success: true, ...result });
        console.log(`✅ ${project.name} - Installation complete\n`);
      } catch (error) {
        console.error(`❌ ${project.name} - Installation failed: ${error.message}\n`);
        this.results.push({ project: project.name, success: false, error: error.message });
      }
    }

    this.generateReport();
  }

  async installInProject(project) {
    const projectPath = path.join(this.baseDir, project.path);
    
    if (!fs.existsSync(projectPath)) {
      throw new Error(`Project directory not found: ${projectPath}`);
    }

    const packageJsonPath = path.join(projectPath, 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
      throw new Error('package.json not found in project directory');
    }

    // Read package.json to check existing dependencies
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const hasAppwrite = packageJson.dependencies?.appwrite || packageJson.devDependencies?.appwrite;

    const actions = [];

    // 1. Install Appwrite if not present
    if (!hasAppwrite) {
      console.log(`  📥 Installing appwrite dependency...`);
      execSync(`cd "${projectPath}" && ${project.packageManager} install appwrite`, { stdio: 'inherit' });
      actions.push('Installed appwrite dependency');
    } else {
      actions.push('Appwrite dependency already present');
    }

    // 2. Copy SSO files to project
    const srcPath = path.join(projectPath, project.srcDir);
    if (!fs.existsSync(srcPath)) {
      fs.mkdirSync(srcPath, { recursive: true });
    }

    // Copy main SSO service
    const ssoServicePath = path.join(srcPath, 'services');
    if (!fs.existsSync(ssoServicePath)) {
      fs.mkdirSync(ssoServicePath, { recursive: true });
    }

    const easySSoFile = path.join(this.baseDir, 'easy-appwrite-sso.js');
    const targetSSOPath = path.join(ssoServicePath, 'easy-appwrite-sso.js');
    fs.copyFileSync(easySSoFile, targetSSOPath);
    actions.push('Copied easy-appwrite-sso.js service');

    // Copy SSO button component (for React projects)
    if (project.framework.includes('React') || project.framework.includes('Next.js')) {
      const componentsPath = path.join(srcPath, 'components');
      if (!fs.existsSync(componentsPath)) {
        fs.mkdirSync(componentsPath, { recursive: true });
      }

      const easySSOButtonFile = path.join(this.baseDir, 'EasySSOButton.jsx');
      const targetButtonPath = path.join(componentsPath, 'EasySSOButton.jsx');
      fs.copyFileSync(easySSOButtonFile, targetButtonPath);
      actions.push('Copied EasySSOButton.jsx component');
    }

    // 3. Create example integration file
    const examplePath = this.createExampleIntegration(project, srcPath);
    actions.push(`Created example integration: ${path.basename(examplePath)}`);

    // 4. Update or create environment file
    this.updateEnvironmentFile(projectPath, project);
    actions.push('Updated/created environment configuration');

    // 5. Create OAuth callback pages if needed
    if (project.framework.includes('React') || project.framework.includes('Next.js')) {
      this.createOAuthCallbacks(project, projectPath);
      actions.push('Created OAuth callback pages');
    }

    return { actions, projectPath };
  }

  createExampleIntegration(project, srcPath) {
    const exampleContent = this.generateExampleContent(project);
    const exampleFileName = project.framework.includes('React') ? 'AuthExample.jsx' : 'auth-example.js';
    const examplePath = path.join(srcPath, 'examples', exampleFileName);
    
    const examplesDir = path.dirname(examplePath);
    if (!fs.existsSync(examplesDir)) {
      fs.mkdirSync(examplesDir, { recursive: true });
    }

    fs.writeFileSync(examplePath, exampleContent);
    return examplePath;
  }

  generateExampleContent(project) {
    if (project.framework.includes('React')) {
      return this.getReactExample(project);
    } else if (project.framework.includes('Next.js')) {
      return this.getNextJsExample(project);
    } else {
      return this.getVanillaJsExample(project);
    }
  }

  getReactExample(project) {
    return `/**
 * Easy Appwrite SSO Example for ${project.name}
 * Drop-in authentication component
 */

import React, { useState, useEffect } from 'react';
import EasyAppwriteSSO from '../services/easy-appwrite-sso';
import EasySSOButton, { EasySSOGroup } from '../components/EasySSOButton';

function AuthExample() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sso, setSSO] = useState(null);

  useEffect(() => {
    // Initialize SSO service
    const ssoInstance = new EasyAppwriteSSO({
      // Config will be auto-detected from environment
      silent: true, // Use popup-based auth
      autoClose: true
    });
    
    setSSO(ssoInstance);

    // Check for existing session
    ssoInstance.getUser()
      .then(user => {
        setUser(user);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });

    // Listen for auth changes
    const unsubscribe = ssoInstance.onAuthChange(setUser);
    return unsubscribe;
  }, []);

  const handleSuccess = (user) => {
    console.log('✅ Authentication successful:', user);
    setUser(user);
    // Redirect to dashboard or update UI
  };

  const handleError = (error) => {
    console.error('❌ Authentication failed:', error);
    alert('Login failed: ' + error.message);
  };

  const handleSignOut = async () => {
    if (sso) {
      await sso.signOut();
      setUser(null);
    }
  };

  if (loading) {
    return <div>Checking authentication...</div>;
  }

  if (user) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>Welcome, {user.name}!</h2>
        <p>Email: {user.email}</p>
        <p>Provider: {user.provider}</p>
        <button 
          onClick={handleSignOut}
          style={{
            padding: '10px 20px',
            backgroundColor: '#ff4444',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Sign Out
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '400px', margin: '0 auto' }}>
      <h2>Sign In to ${project.name}</h2>
      
      {/* Single provider example */}
      <div style={{ marginBottom: '20px' }}>
        <EasySSOButton
          provider="google"
          onSuccess={handleSuccess}
          onError={handleError}
          size="large"
          fullWidth
          style="filled"
        />
      </div>

      {/* Multiple providers example */}
      <div>
        <p style={{ textAlign: 'center', margin: '20px 0' }}>Or choose your preferred provider:</p>
        <EasySSOGroup
          providers={['github', 'microsoft', 'facebook']}
          onSuccess={handleSuccess}
          onError={handleError}
          orientation="vertical"
          style="outline"
        />
      </div>
    </div>
  );
}

export default AuthExample;
`;
  }

  getNextJsExample(project) {
    return `/**
 * Easy Appwrite SSO Example for ${project.name} (Next.js)
 */

import { useState, useEffect } from 'react';
import EasyAppwriteSSO from '../lib/easy-appwrite-sso';
import EasySSOButton from '../components/EasySSOButton';

export default function AuthExample() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sso, setSSO] = useState(null);

  useEffect(() => {
    const ssoInstance = new EasyAppwriteSSO();
    setSSO(ssoInstance);

    ssoInstance.getUser()
      .then(setUser)
      .catch(() => {})
      .finally(() => setLoading(false));

    return ssoInstance.onAuthChange(setUser);
  }, []);

  if (loading) return <div>Loading...</div>;

  if (user) {
    return (
      <div>
        <h1>Welcome, {user.name}!</h1>
        <button onClick={() => sso.signOut().then(() => setUser(null))}>
          Sign Out
        </button>
      </div>
    );
  }

  return (
    <div>
      <h1>Sign In</h1>
      <EasySSOButton
        provider="google"
        onSuccess={setUser}
        onError={console.error}
      />
    </div>
  );
}
`;
  }

  getVanillaJsExample(project) {
    return `/**
 * Easy Appwrite SSO Example for ${project.name} (Vanilla JS)
 */

import EasyAppwriteSSO from './services/easy-appwrite-sso.js';

class AuthManager {
  constructor() {
    this.sso = new EasyAppwriteSSO();
    this.user = null;
    this.init();
  }

  async init() {
    // Check for existing session
    try {
      this.user = await this.sso.getUser();
      this.renderUI();
    } catch (error) {
      this.renderLoginUI();
    }
  }

  async signIn(provider = 'google') {
    try {
      this.user = await this.sso.signIn(provider);
      this.renderUI();
    } catch (error) {
      console.error('Login failed:', error);
      alert('Login failed: ' + error.message);
    }
  }

  async signOut() {
    try {
      await this.sso.signOut();
      this.user = null;
      this.renderLoginUI();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }

  renderUI() {
    const container = document.getElementById('auth-container');
    if (!container) return;

    if (this.user) {
      container.innerHTML = \`
        <div class="user-info">
          <h2>Welcome, \${this.user.name}!</h2>
          <p>Email: \${this.user.email}</p>
          <button onclick="authManager.signOut()" class="sign-out-btn">
            Sign Out
          </button>
        </div>
      \`;
    } else {
      this.renderLoginUI();
    }
  }

  renderLoginUI() {
    const container = document.getElementById('auth-container');
    if (!container) return;

    container.innerHTML = \`
      <div class="login-form">
        <h2>Sign In to ${project.name}</h2>
        <button onclick="authManager.signIn('google')" class="sso-btn google">
          🔍 Continue with Google
        </button>
        <button onclick="authManager.signIn('github')" class="sso-btn github">
          🐙 Continue with GitHub
        </button>
      </div>
    \`;
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.authManager = new AuthManager();
});

export default AuthManager;
`;
  }

  updateEnvironmentFile(projectPath, project) {
    const envFiles = ['.env', '.env.local', '.env.development'];
    let envFile = null;

    // Find existing env file or create .env
    for (const file of envFiles) {
      const filePath = path.join(projectPath, file);
      if (fs.existsSync(filePath)) {
        envFile = filePath;
        break;
      }
    }

    if (!envFile) {
      envFile = path.join(projectPath, '.env');
    }

    let envContent = '';
    if (fs.existsSync(envFile)) {
      envContent = fs.readFileSync(envFile, 'utf8');
    }

    // Add SSO configuration if not present
    const requiredVars = [
      'VITE_APPWRITE_PROJECT_ID=your-project-id-here',
      'VITE_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1'
    ];

    for (const variable of requiredVars) {
      const [key] = variable.split('=');
      if (!envContent.includes(key)) {
        envContent += envContent ? '\n' + variable : variable;
      }
    }

    fs.writeFileSync(envFile, envContent);
  }

  createOAuthCallbacks(project, projectPath) {
    // Create auth callback pages
    const authDir = project.framework.includes('Next.js') 
      ? path.join(projectPath, 'pages', 'auth')
      : path.join(projectPath, 'public', 'auth');

    if (!fs.existsSync(authDir)) {
      fs.mkdirSync(authDir, { recursive: true });
    }

    // Success callback
    const successPath = path.join(authDir, project.framework.includes('Next.js') ? 'callback.js' : 'success.html');
    const successContent = project.framework.includes('Next.js')
      ? this.getNextJsCallbackPage()
      : this.getHTMLCallbackPage('success');

    fs.writeFileSync(successPath, successContent);

    // Error callback
    const errorPath = path.join(authDir, project.framework.includes('Next.js') ? 'error.js' : 'error.html');
    const errorContent = project.framework.includes('Next.js')
      ? this.getNextJsErrorPage()
      : this.getHTMLCallbackPage('error');

    fs.writeFileSync(errorPath, errorContent);
  }

  getNextJsCallbackPage() {
    return `import { useEffect } from 'react';
import EasyAppwriteSSO from '../../lib/easy-appwrite-sso';

export default function AuthCallback() {
  useEffect(() => {
    const sso = new EasyAppwriteSSO();
    sso.handleCallback();
  }, []);

  return (
    <div style={{ textAlign: 'center', padding: '50px' }}>
      <h2>Completing sign in...</h2>
      <p>Please wait while we redirect you.</p>
    </div>
  );
}
`;
  }

  getNextJsErrorPage() {
    return `import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

export default function AuthError() {
  const router = useRouter();
  const [error, setError] = useState('Authentication failed');

  useEffect(() => {
    const { error: errorParam } = router.query;
    if (errorParam) {
      setError(decodeURIComponent(errorParam));
    }
  }, [router.query]);

  return (
    <div style={{ textAlign: 'center', padding: '50px' }}>
      <h2>Authentication Error</h2>
      <p>{error}</p>
      <button onClick={() => router.push('/login')}>
        Try Again
      </button>
    </div>
  );
}
`;
  }

  getHTMLCallbackPage(type) {
    if (type === 'success') {
      return `<!DOCTYPE html>
<html>
<head>
    <title>Authentication Successful</title>
    <script>
        // For popup-based auth, notify parent window
        if (window.opener && window.opener.postMessage) {
            window.opener.postMessage({ 
                type: 'APPWRITE_OAUTH_SUCCESS',
                timestamp: Date.now()
            }, '*');
        }
        
        // For redirect-based auth, redirect to app
        setTimeout(() => {
            window.close() || (window.location.href = '/');
        }, 1000);
    </script>
</head>
<body>
    <div style="text-align: center; padding: 50px; font-family: Arial, sans-serif;">
        <h2>✅ Authentication Successful</h2>
        <p>Redirecting you back to the application...</p>
    </div>
</body>
</html>`;
    } else {
      return `<!DOCTYPE html>
<html>
<head>
    <title>Authentication Error</title>
    <script>
        // Extract error from URL
        const params = new URLSearchParams(window.location.search);
        const error = params.get('error') || 'Authentication failed';
        
        // For popup-based auth, notify parent window
        if (window.opener && window.opener.postMessage) {
            window.opener.postMessage({ 
                type: 'APPWRITE_OAUTH_ERROR',
                error: error,
                timestamp: Date.now()
            }, '*');
        }
        
        // Update error message
        document.addEventListener('DOMContentLoaded', () => {
            document.getElementById('error-message').textContent = error;
        });
    </script>
</head>
<body>
    <div style="text-align: center; padding: 50px; font-family: Arial, sans-serif;">
        <h2>❌ Authentication Error</h2>
        <p id="error-message">Authentication failed</p>
        <button onclick="window.close() || (window.location.href = '/login')">
            Try Again
        </button>
    </div>
</body>
</html>`;
    }
  }

  generateReport() {
    console.log('\n📊 Installation Report\n');
    console.log('='.repeat(50));

    const successful = this.results.filter(r => r.success);
    const failed = this.results.filter(r => !r.success);

    console.log(`✅ Successfully installed: ${successful.length} applications`);
    console.log(`❌ Failed installations: ${failed.length} applications\n`);

    if (successful.length > 0) {
      console.log('✅ Successful Installations:');
      successful.forEach(result => {
        console.log(`  • ${result.project}`);
        if (result.actions) {
          result.actions.forEach(action => {
            console.log(`    - ${action}`);
          });
        }
        console.log('');
      });
    }

    if (failed.length > 0) {
      console.log('❌ Failed Installations:');
      failed.forEach(result => {
        console.log(`  • ${result.project}: ${result.error}\n`);
      });
    }

    console.log('\n🚀 Next Steps:');
    console.log('1. Update environment variables with your Appwrite project details');
    console.log('2. Enable OAuth providers in Appwrite Console');
    console.log('3. Add platform domains to your Appwrite project');
    console.log('4. Test authentication in each application');
    console.log('5. Integrate the example components into your existing UI');

    // Generate summary file
    const reportPath = path.join(this.baseDir, 'easy-sso-installation-report.json');
    fs.writeFileSync(reportPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      summary: {
        total: this.results.length,
        successful: successful.length,
        failed: failed.length
      },
      results: this.results
    }, null, 2));

    console.log(`\n📄 Detailed report saved to: ${reportPath}`);
  }
}

// Run installation if called directly
if (require.main === module) {
  const installer = new EasyAppwriteSSOInstaller();
  installer.install().catch(console.error);
}

module.exports = EasyAppwriteSSOInstaller;