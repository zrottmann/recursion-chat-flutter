# Trading Post Deployment Troubleshooting Guide

This comprehensive guide helps diagnose and resolve common issues with the GitHub Actions CI/CD deployment pipeline for the Trading Post application.

## 🚨 Quick Diagnosis

### Check Deployment Status
```bash
# Check GitHub Actions workflow status
gh run list --repo [owner/repo] --limit 5

# View specific workflow run details  
gh run view [run-id] --log

# Check Appwrite Sites deployment status
curl -X GET \
  "https://nyc.cloud.appwrite.io/v1/sites/689cb415001a367e69f8/deployments" \
  -H "X-Appwrite-Project: 689bdee000098bd9d55c" \
  -H "X-Appwrite-Key: [API_KEY]"
```

### Validate Configuration
```bash
# Run secrets validation
node .github/scripts/validate-secrets.js

# Run pre-deployment checks
node .github/scripts/pre-deploy-check.js

# Verify environment variables
gh secret list
```

## 🔧 Common Issues & Solutions

### 1. GitHub Secrets Configuration Issues

#### ❌ Missing Required Secrets
**Error:** Workflow fails with "secret not found" or undefined environment variables
```
Error: Required secrets are missing: APPWRITE_API_KEY, GOOGLE_CLIENT_ID
```

**Solution:**
```bash
# Validate all required secrets
node .github/scripts/validate-secrets.js

# Add missing secrets (interactive)
gh secret set APPWRITE_API_KEY
gh secret set GOOGLE_CLIENT_ID

# Batch setup from .env file
bash .github/scripts/setup-secrets.sh
```

#### ❌ Incorrect Secret Values
**Error:** OAuth fails, API calls return 401, or services don't connect

**Diagnostic Steps:**
1. Check if values contain quotes or extra whitespace:
```bash
# Recreate secret with clean value
gh secret set APPWRITE_API_KEY --body "clean_api_key_value"
```

2. Verify OAuth provider configurations match:
   - Google: Authorized redirect URIs in Google Cloud Console
   - GitHub: Callback URL in GitHub App settings
   - Appwrite: Platform registration matches domain

**Solution:**
```bash
# Remove and recreate problematic secrets
gh secret remove GOOGLE_CLIENT_SECRET
gh secret set GOOGLE_CLIENT_SECRET --body "[NEW_CLEAN_VALUE]"
```

### 2. Build Process Failures

#### ❌ Node.js/npm Installation Issues
**Error:** 
```
npm ERR! peer dep missing: react@^18.0.0, required by @testing-library/react@13.4.0
```

**Solution:**
```yaml
# In workflow file, use legacy peer deps
- name: 📦 Install frontend dependencies
  run: |
    cd trading-app-frontend
    npm install --legacy-peer-deps
```

#### ❌ Vite Build Failures
**Error:**
```
[vite:css] PostCSS plugin error: Cannot find module 'tailwindcss'
```

**Solution:** Ensure build dependencies are in `dependencies`, not `devDependencies`
```json
{
  "dependencies": {
    "tailwindcss": "^3.3.0",
    "postcss": "^8.4.0",
    "@vitejs/plugin-react": "^4.0.0"
  }
}
```

#### ❌ Environment Variables Not Available During Build
**Error:** React app shows `undefined` for environment variables

**Root Cause:** Missing `VITE_` prefix for React environment variables

**Solution:**
```yaml
# In deploy-enhanced.yml, ensure all variables have VITE_ prefix
env:
  VITE_APPWRITE_ENDPOINT: ${{ env.APPWRITE_ENDPOINT }}
  VITE_GOOGLE_CLIENT_ID: ${{ secrets.GOOGLE_CLIENT_ID }}
  # NOT: GOOGLE_CLIENT_ID: ${{ secrets.GOOGLE_CLIENT_ID }}
```

### 3. Appwrite Deployment Issues

#### ❌ API Authentication Failures
**Error:**
```
HTTP 401: User (role: guests) missing scope (sites.write)
```

**Solution:**
1. Verify API key has correct permissions in Appwrite Console
2. Check API key scope includes `sites.write`
3. Regenerate API key if necessary:
```bash
# Update GitHub secret with new API key
gh secret set APPWRITE_API_KEY --body "[NEW_API_KEY]"
```

#### ❌ Site Deployment Upload Failures
**Error:**
```
HTTP 413: Request entity too large
```

**Solution:**
```bash
# Reduce build size by optimizing assets
cd trading-app-frontend
npm run build -- --analyze

# Remove unused dependencies
npm prune --production

# Enable gzip compression in vite.config.js
export default {
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom']
        }
      }
    }
  }
}
```

#### ❌ Wrong Project/Site ID Configuration
**Error:**
```
HTTP 404: Site not found
```

**Solution:** Verify configuration matches Appwrite Console:
```yaml
env:
  APPWRITE_PROJECT_ID: '689bdee000098bd9d55c'  # Verify this matches
  APPWRITE_SITE_ID: '689cb415001a367e69f8'    # Verify this matches
```

### 4. OAuth Configuration Problems

#### ❌ OAuth Redirect URI Mismatches
**Error:**
```
Error 400: Invalid 'success' param: Invalid URI
```

**Solution:**
1. **Google OAuth:** Add authorized redirect URIs:
   - `https://tradingpost.appwrite.network/auth/callback`
   - `https://689cb415001a367e69f8.appwrite.global/auth/callback`

2. **GitHub OAuth:** Add callback URL:
   - `https://tradingpost.appwrite.network/auth/github/callback`

3. **Appwrite Platform:** Register web platform:
   - Domain: `tradingpost.appwrite.network`
   - Additional domains: `689cb415001a367e69f8.appwrite.global`

#### ❌ OAuth Provider Configuration
**Error:** OAuth buttons don't work or redirect to blank pages

**Diagnostic Steps:**
```javascript
// Add to OAuth service for debugging
console.log('OAuth Config:', {
  clientId: process.env.VITE_GOOGLE_CLIENT_ID,
  redirectUrl: window.location.origin + '/auth/callback'
});
```

**Solution:**
1. Verify all OAuth provider secrets are set correctly
2. Check Appwrite Console → Authentication → Settings → OAuth providers are enabled
3. Test OAuth URLs directly:
```bash
# Test Google OAuth URL
curl "https://nyc.cloud.appwrite.io/v1/account/sessions/oauth2/google?project=689bdee000098bd9d55c&success=https://tradingpost.appwrite.network/auth/callback"
```

### 5. Workflow Execution Problems

#### ❌ Workflow Not Triggering
**Error:** Push to main branch doesn't trigger deployment

**Solution:**
1. Check workflow file syntax:
```bash
# Validate workflow syntax
gh workflow list
gh workflow view deploy-enhanced.yml
```

2. Verify trigger configuration:
```yaml
on:
  push:
    branches: [main, master]  # Ensure correct branch name
  workflow_dispatch: # Allow manual trigger
```

3. Manual trigger for testing:
```bash
gh workflow run deploy-enhanced.yml
```

#### ❌ Permissions Issues
**Error:**
```
Error: Resource not accessible by integration
```

**Solution:** Update repository workflow permissions:
1. Go to Settings → Actions → General
2. Set "Workflow permissions" to "Read and write permissions"
3. Enable "Allow GitHub Actions to create and approve pull requests"

### 6. Environment-Specific Issues

#### ❌ Production vs Development Configuration
**Error:** App works locally but fails in production

**Root Cause:** Environment variable differences

**Solution:**
1. Compare local `.env` with GitHub Secrets:
```bash
# Check local environment
cat .env | grep -v '^#' | sort

# Check GitHub secrets
gh secret list | sort
```

2. Ensure production-specific values:
```bash
# Production should use HTTPS and production domains
VITE_APPWRITE_ENDPOINT=https://nyc.cloud.appwrite.io/v1
VITE_APP_URL=https://tradingpost.appwrite.network
VITE_ENABLE_HTTPS=true
```

#### ❌ CORS Issues in Production
**Error:**
```
Access to fetch at 'https://nyc.cloud.appwrite.io/v1/...' blocked by CORS
```

**Solution:**
1. Verify Appwrite platform registration includes correct domains
2. Check CORS origins configuration:
```yaml
env:
  VITE_CORS_ORIGINS: 'https://tradingpost.appwrite.network,https://689cb415001a367e69f8.appwrite.global'
```

### 7. Database & External Service Issues

#### ❌ Database Connection Failures
**Error:** App loads but data operations fail

**Solution:**
1. Test database connectivity:
```javascript
// Add to app initialization
console.log('Database Config:', {
  url: process.env.VITE_DATABASE_URL,
  redis: process.env.VITE_REDIS_URL
});
```

2. Verify database secrets format:
```bash
# SQLite URL format
DATABASE_URL=sqlite:///trading_post.db

# Redis URL format  
REDIS_URL=redis://localhost:6379/0
```

#### ❌ Email Service Configuration
**Error:** Email notifications not sending

**Solution:**
```bash
# Test SMTP configuration
node -e "
const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransporter({
  host: process.env.VITE_EMAIL_HOST,
  port: process.env.VITE_EMAIL_PORT,
  secure: process.env.VITE_EMAIL_USE_TLS === 'true',
  auth: {
    user: process.env.VITE_EMAIL_USERNAME,
    pass: process.env.VITE_EMAIL_PASSWORD
  }
});
console.log('SMTP Config valid');
"
```

#### ❌ xAI/Grok API Issues
**Error:** AI chat features not working

**Solution:**
1. Verify API key format and permissions:
```javascript
// Test xAI API connectivity
fetch('https://api.x.ai/v1/models', {
  headers: {
    'Authorization': `Bearer ${process.env.VITE_XAI_API_KEY}`
  }
}).then(r => console.log('xAI API Status:', r.status));
```

2. Check rate limiting and quota:
```yaml
env:
  VITE_XAI_BASE_URL: 'https://api.x.ai/v1'
  VITE_XAI_MODEL: 'grok-beta'
  VITE_RATE_LIMIT_PER_MINUTE: '60'
```

## 🔍 Diagnostic Tools & Scripts

### Automated Diagnostics
```bash
# Run complete diagnostic suite
node .github/scripts/validate-secrets.js
node .github/scripts/pre-deploy-check.js

# After deployment
node .github/scripts/post-deploy-verify.js
```

### Manual Testing Commands
```bash
# Test API connectivity
curl -X GET \
  "https://nyc.cloud.appwrite.io/v1/health" \
  -H "X-Appwrite-Project: 689bdee000098bd9d55c"

# Test site availability
curl -I https://tradingpost.appwrite.network

# Check deployment status
curl -X GET \
  "https://nyc.cloud.appwrite.io/v1/sites/689cb415001a367e69f8" \
  -H "X-Appwrite-Project: 689bdee000098bd9d55c" \
  -H "X-Appwrite-Key: [API_KEY]"
```

### Debug Environment Setup
```javascript
// Add to App.jsx for production debugging
if (process.env.NODE_ENV === 'production') {
  console.log('Production Environment Check:', {
    appwriteEndpoint: process.env.VITE_APPWRITE_ENDPOINT,
    projectId: process.env.VITE_APPWRITE_PROJECT_ID,
    hasGoogleOAuth: !!process.env.VITE_GOOGLE_CLIENT_ID,
    hasGitHubOAuth: !!process.env.VITE_GITHUB_CLIENT_ID,
    corsOrigins: process.env.VITE_CORS_ORIGINS
  });
}
```

## 🚨 Emergency Recovery

### Rollback Deployment
```bash
# List recent deployments
curl -X GET \
  "https://nyc.cloud.appwrite.io/v1/sites/689cb415001a367e69f8/deployments" \
  -H "X-Appwrite-Project: 689bdee000098bd9d55c" \
  -H "X-Appwrite-Key: [API_KEY]"

# Activate previous deployment
curl -X PATCH \
  "https://nyc.cloud.appwrite.io/v1/sites/689cb415001a367e69f8/deployments/[DEPLOYMENT_ID]" \
  -H "X-Appwrite-Project: 689bdee000098bd9d55c" \
  -H "X-Appwrite-Key: [API_KEY]" \
  -d '{"activate": true}'
```

### Reset GitHub Secrets
```bash
# Backup current secrets (requires gh CLI with admin access)
gh secret list > secrets-backup.txt

# Remove all secrets (emergency reset)
gh secret list | grep -v "NAME" | awk '{print $1}' | xargs -I {} gh secret remove {}

# Restore from .env file
bash .github/scripts/setup-secrets.sh
```

### Contact & Support

**Documentation References:**
- [SECRETS_SETUP.md](.github/SECRETS_SETUP.md) - Complete secrets configuration
- [validate-secrets.js](.github/scripts/validate-secrets.js) - Secrets validation
- [deploy-enhanced.yml](.github/workflows/deploy-enhanced.yml) - Complete workflow
- [Appwrite Documentation](https://appwrite.io/docs)
- [GitHub Actions Documentation](https://docs.github.com/actions)

**Quick Recovery Checklist:**
1. ✅ Run `node .github/scripts/validate-secrets.js`
2. ✅ Check workflow logs: `gh run list --limit 5`
3. ✅ Verify Appwrite Console platform registration
4. ✅ Test OAuth provider configurations
5. ✅ Check environment variable VITE_ prefixes
6. ✅ Validate build dependencies in `dependencies` not `devDependencies`
7. ✅ Confirm API key permissions include `sites.write`
8. ✅ Test manual deployment: `gh workflow run deploy-enhanced.yml`

---

**Last Updated:** January 2025  
**Status:** ✅ Comprehensive troubleshooting guide for GitHub Actions deployment pipeline  
**Coverage:** 7 major problem categories with detailed diagnostic and resolution steps