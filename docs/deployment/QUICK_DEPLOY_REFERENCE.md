# 🚀 QUICK DEPLOY REFERENCE

## ONE-COMMAND DEPLOYMENTS

### For ANY Appwrite Sites Project:

```bash
# 1. Build your project
npm run build

# 2. Deploy directly 
curl -X POST "https://nyc.cloud.appwrite.io/v1/sites/YOUR_SITE_ID/deployments" \
  -H "X-Appwrite-Project: YOUR_PROJECT_ID" \
  -H "X-Appwrite-Key: YOUR_API_KEY" \
  -F "activate=true" \
  -F "code=@deployment.tar.gz"
```

## REQUIRED PACKAGE.JSON FIX

**Add this to ANY project for Appwrite compatibility:**
```json
{
  "scripts": {
    "postinstall": "npm run build"
  }
}
```

## CURRENT PROJECT STATUS

### ✅ WORKING DEPLOYMENTS:
- **Slumlord**: https://slumlord.appwrite.network
- **Trading Post**: https://tradingpost.appwrite.network  

### ❌ INFRASTRUCTURE ISSUES:
- **Recursion Chat**: Code fixed, but Appwrite Sites processing broken

## EMERGENCY DEPLOYMENT

If automated deployment fails:
1. Build project locally: `npm run build`  
2. Create archive: `cd dist && tar -czf ../deployment.tar.gz .`
3. Upload manually via Appwrite Console
4. Or use curl command above

## SUCCESS PATTERN FROM SLUMLORD

**What makes slumlord deployments work:**
1. `postinstall: "npm run build"` in package.json
2. Proper Vite build configuration  
3. GitHub Actions with direct curl deployment
4. No server-side build conflicts

**Copy this exact pattern for future projects!**