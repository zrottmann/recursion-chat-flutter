# SuperClaude Knowledge Base

*Centralized knowledge repository for all development workflows, fixes, and procedures.*

## Quick Reference

### Common Error Fixes

#### Authentication Issues
- **OAuth Token Errors**: Check project ID in .env.production vs .env files
- **"Invalid URI" Error**: Verify platform registration in Appwrite console  
- **White Screen After OAuth**: Check for JavaScript module loading errors
- **"Powered by Appwrite" Redirect**: Wrong project ID in production build

#### Deployment Issues
- **Build Archive Not Created**: Move PostCSS/Tailwind from devDependencies to dependencies
- **GitHub Actions Not Triggering**: Check workflow path filters
- **ES Module/CommonJS Conflicts**: Use .cjs extension for CommonJS scripts

#### Mobile Issues  
- **Safari Authentication Loop**: Check session verification logic
- **Responsive Design Breaks**: Test with mobile-safe CSS and viewport meta tags
- **Touch Events Not Working**: Implement proper touch event handlers

### How-To Functions

#### Deploy Applications
1. **Appwrite Sites**: `npm run sites:build` → Auto-deploy via GitHub Actions
2. **Manual Deploy**: Use unified-deploy.js with environment flags
3. **Emergency Deploy**: Run emergency-deploy.js for critical fixes

#### Secrets Management
- **Environment Variables**: Use .env files, never commit secrets
- **API Keys**: Store in Appwrite environment variables  
- **Rotation**: Rotate keys via Appwrite console when leaked

#### Testing Procedures
1. **Mobile Testing**: Run comprehensive-mobile-sso-test.js
2. **SSO Testing**: Execute test-unified-sso.js
3. **Performance**: Use browser dev tools, check loading times

### Modern Technology Stack Priority

1. **Appwrite** (Preferred)
   - Authentication, database, hosting
   - Modern OAuth implementations
   - Built-in security features

2. **GitHub Actions** (CI/CD)
   - Automated deployments
   - Environment-specific builds
   - Secure secret management

3. **Legacy Approaches** (Deprecated)
   - ~~DigitalOcean manual deployments~~
   - ~~Localhost-only development~~  
   - ~~Supabase integration~~

## Critical Reminders

### Never Do This
- Don't use localhost URLs in production builds
- Don't mix project IDs between environments
- Don't commit API keys or secrets to git
- Don't skip platform registration in Appwrite

### Always Do This  
- Verify environment variables match target deployment
- Test OAuth flows on actual devices
- Check console for JavaScript errors
- Use version control for all configuration changes

### Emergency Procedures
1. **OAuth Broken**: Check project IDs, verify platform URLs
2. **Build Failing**: Move build dependencies from devDependencies
3. **Mobile Broken**: Test responsive breakpoints, check touch events
4. **Secrets Leaked**: Rotate keys immediately, update .gitignore

---

*This knowledge base is automatically maintained and updated from project documentation.*
*Last updated: 2025-08-25*
