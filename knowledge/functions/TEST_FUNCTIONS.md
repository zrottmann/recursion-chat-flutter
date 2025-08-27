# Testing Functions Cheat Sheet

## Mobile Testing
```bash
# Comprehensive mobile test
node scripts/test/comprehensive-mobile-sso-test.js

# Quick mobile check
node scripts/test/test-mobile-compatibility.js
```

## SSO Testing  
```bash
# Full SSO test suite
node scripts/test/test-unified-sso.js

# Appwrite SSO specific
node scripts/test/test-appwrite-sso.js
```

## Common Test Fixes

### Mobile Safari Issues
- Test with actual devices, not just browser dev tools
- Check viewport meta tag: `<meta name="viewport" content="width=device-width, initial-scale=1">`
- Verify touch event handlers work on iOS

### OAuth Test Failures
- Confirm test environment matches production OAuth settings
- Check if test domains are registered in Appwrite platforms
- Verify API keys are current and have correct permissions

---
*Testing functions updated: 2025-08-25*
