# Trading Post - Appwrite Deployment Guide

## 🚀 Quick Deploy

```bash
cd trading-post
npm run build  # Builds and prepares for Appwrite deployment
```

## ⚙️ Appwrite Sites Configuration

### Required Settings in Appwrite Console

1. **Navigate to your Appwrite Project Console**
   - Project ID: `689bdaf500072795b0f6` 
   - Go to **Sites** section

2. **Build Settings Configuration**
   ```
   Build Command: npm run build
   Output Directory: trading-app-frontend/build
   Install Command: npm install --legacy-peer-deps
   ```

3. **🔧 CRITICAL: SPA Routing Configuration**
   **In Appwrite Sites Settings:**
   - Set **Site Type**: `Static site`
   - Set **Fallback File**: `index.html`
   
   **OR manually configure via API:**
   ```bash
   appwrite sites updateSite \
     --siteId=<your-site-id> \
     --fallback=index.html
   ```

### Why This is Required

The Trading Post is a **Single Page Application (SPA)** built with React Router. All client-side routes like:
- `/auth/callback` 
- `/login`
- `/profile`
- `/listings/123`

Must be served by `index.html` to allow React Router to handle routing. Without the fallback file configuration, Appwrite's server returns 404 for these routes.

## 📁 Build Output Structure

After running `npm run build`, the following structure is created:

```
trading-app-frontend/build/
├── index.html              # Main SPA entry point
├── static/
│   ├── css/
│   │   └── main.*.css     # Compiled CSS (~46kb gzipped)
│   └── js/
│       └── main.*.js      # React bundle (~259kb gzipped)
├── _redirects             # SPA routing rules (for compatibility)
└── manifest.json          # PWA manifest
```

## 🔍 Troubleshooting SPA Routing

### Issue: "Page not found" on direct URL access

**Symptom:** Visiting `https://tradingpost.appwrite.network/auth/callback` directly shows 404

**Solution:**
1. Verify fallback file is set to `index.html` in Appwrite Console
2. Check that React Router has the route defined (✅ confirmed in App.js:114)
3. Ensure build includes the route in the bundle

### Issue: OAuth authentication callback fails

**Common causes:**
- Incorrect OAuth redirect URI in Google/Appwrite console
- Missing or incorrect fallback file configuration
- Route not properly defined in React Router

**Fix OAuth redirect URIs:**
- Add `https://tradingpost.appwrite.network/auth/callback` to Google OAuth console
- Add same URL to Appwrite Auth provider settings

## 📊 Deployment Performance

**Build Metrics:**
- Build time: ~30-60 seconds
- Bundle size (gzipped):
  - JavaScript: 259.35 kB
  - CSS: 46.52 kB
- Total deployment time: 2-5 minutes

**Optimization applied:**
- Code splitting via React.lazy (when implemented)
- CSS optimization via react-scripts build
- Asset minification and compression

## 🔐 Environment Configuration

### Required Environment Variables

Create `.env` in `trading-app-frontend/`:
```env
REACT_APP_APPWRITE_ENDPOINT=https://nyc.cloud.appwrite.io/v1
REACT_APP_APPWRITE_PROJECT_ID=689bdaf500072795b0f6
REACT_APP_APPWRITE_DATABASE_ID=trading_post_db
```

### OAuth Configuration

**Google OAuth Setup:**
1. Google Cloud Console → APIs & Services → Credentials
2. Add authorized JavaScript origins:
   - `https://tradingpost.appwrite.network`
   - `http://localhost:3000` (development)
3. Add authorized redirect URIs:
   - `https://tradingpost.appwrite.network/auth/callback`

## 🚦 Deployment Checklist

**Before Deploy:**
- [ ] Build completes successfully
- [ ] `_redirects` file present in build output
- [ ] Environment variables configured
- [ ] OAuth redirect URIs updated

**Appwrite Console Setup:**
- [ ] Fallback file set to `index.html`
- [ ] Build settings match npm scripts
- [ ] Domain configured and SSL active

**Post-Deploy Verification:**
- [ ] Root URL loads properly
- [ ] Direct navigation to `/auth/callback` serves React app
- [ ] OAuth flow completes successfully
- [ ] User authentication works end-to-end

## 📱 Mobile & PWA Support

The build includes:
- `manifest.json` for PWA capabilities
- Responsive Bootstrap 5 design
- Mobile-optimized authentication flows
- Touch-friendly interface elements

## 🔄 Development Workflow

### Local Development
```bash
cd trading-app-frontend
npm start  # Runs on http://localhost:3000
```

### Production Build
```bash
npm run build:prod  # Uses optimized production settings
```

### Deploy to Appwrite
```bash
# From trading-post root directory
npm run build  # Triggers frontend build and prepares deployment
```

## 📚 Related Documentation

- [React Router SPA Deployment](https://reactrouter.com/en/main/guides/spa-mode)
- [Appwrite Sites Documentation](https://appwrite.io/docs/products/sites)
- [Create React App Deployment](https://create-react-app.dev/docs/deployment/)

---

**Live Application:** https://tradingpost.appwrite.network  
**Status:** ✅ Production Ready  
**Last Updated:** August 2025