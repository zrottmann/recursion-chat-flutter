# Deployment Functions Cheat Sheet

## Quick Deploy Commands

### Appwrite Sites (Preferred)
```bash
# Standard deployment
npm run sites:build
git push origin main  # Auto-deploys via GitHub Actions

# Environment-specific
npm run build:staging
npm run build:production
```

### Manual Deployment (Emergency Only)
```bash
# Emergency deployment
node scripts/deploy/emergency-deploy.js

# Specific environment
node scripts/deploy/unified-deploy.js --env=production --type=sites
```

## Common Fixes

### "Build archive not created"
1. Check if PostCSS/Tailwind are in dependencies (not devDependencies)
2. Verify build script runs without errors locally
3. Check GitHub Actions workflow path filters

### "OAuth Invalid URI"
1. Verify project ID in .env.production matches Appwrite console  
2. Check platform registration includes correct domain
3. Test OAuth redirect URLs are properly configured

### "GitHub Actions not triggering"
1. Check workflow file is in .github/workflows/
2. Verify path filters match changed files
3. Ensure repository has proper permissions

---
*Functions updated: 2025-08-25*
