# Trading Post Frontend Deployment Guide

## Pre-deployment Checklist

✅ Production build completed successfully  
✅ AppWrite environment variables configured  
✅ Deployment configurations created  

## Deployment Options

### Option 1: Netlify (Recommended)

#### Quick Deploy
1. **Install Netlify CLI** (if not already installed):
   ```bash
   npm install -g netlify-cli
   ```

2. **Login to Netlify**:
   ```bash
   netlify login
   ```

3. **Deploy from the frontend directory**:
   ```bash
   cd trading-app-frontend
   netlify deploy --prod --dir=build
   ```

#### Alternative: Git-based Deployment
1. Push your code to a GitHub repository
2. Connect the repository to Netlify
3. Set build command: `npm run build`
4. Set publish directory: `build`
5. Configure environment variables in Netlify dashboard

#### Post-deployment:
- Update `.env.production` with your actual Netlify URL
- Update OAuth callback URLs in AppWrite console

### Option 2: Vercel

#### Quick Deploy
1. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **Deploy**:
   ```bash
   cd trading-app-frontend
   vercel --prod
   ```

3. **Configure environment variables**:
   ```bash
   vercel env add REACT_APP_APPWRITE_ENDPOINT
   vercel env add REACT_APP_APPWRITE_PROJECT_ID
   # ... add other environment variables
   ```

### Option 3: AppWrite Sites (Recommended for integrated experience)

1. **Login to AppWrite Console** and navigate to your project
2. **Create a new Static Site**:
   - Go to "Sites" in the left menu
   - Click "Create Site"
   - Connect your GitHub repository
   - Configure build settings:
     - Build command: `npm run build:prod`
     - Output directory: `build`
     - Install command: `npm install --legacy-peer-deps`

3. **Configure environment variables** in AppWrite console:
   ```bash
   REACT_APP_APPWRITE_ENDPOINT=https://nyc.cloud.appwrite.io/v1
   REACT_APP_APPWRITE_PROJECT_ID=689bdaf500072795b0f6
   # ... add other required variables
   ```

## Post-Deployment Configuration

### 1. Update OAuth Callback URLs
In your AppWrite console, update OAuth provider callback URLs:
- Success URL: `https://your-domain.com/auth/callback`
- Failure URL: `https://your-domain.com/auth/error`

### 2. Update CORS Settings
In AppWrite console, add your production domain to allowed origins:
- `https://your-domain.com`

### 3. Update Environment Variables
Update `.env.production` with your actual deployment URL:
```bash
REACT_APP_OAUTH_CALLBACK_URL=https://your-actual-domain.com/auth/callback
REACT_APP_OAUTH_ERROR_URL=https://your-actual-domain.com/auth/error
```

## Testing Deployment

1. **Basic functionality**:
   - Navigate to your deployed URL
   - Check if the app loads without errors
   - Test authentication flows

2. **AppWrite connectivity**:
   - Test user registration/login
   - Test data fetching
   - Test file uploads

3. **OAuth providers**:
   - Test Google login
   - Test other enabled OAuth providers

## Troubleshooting

### Common Issues:

1. **Environment variables not working**:
   - Ensure all variables start with `REACT_APP_`
   - Rebuild after adding new variables

2. **OAuth redirect errors**:
   - Check callback URLs in AppWrite console
   - Ensure URLs match exactly (including https/http)

3. **CORS errors**:
   - Add production domain to AppWrite allowed origins
   - Check network tab for failed requests

4. **Build errors**:
   - Check console for specific error messages
   - Ensure all dependencies are installed
   - Run `npm run build` locally first

## Security Considerations

- ✅ HTTPS enabled by default on all platforms
- ✅ Security headers configured
- ✅ CSP headers for XSS protection
- ✅ Environment variables properly scoped

## Monitoring

- Set up monitoring in your hosting platform dashboard
- Configure alerts for downtime
- Monitor build logs for errors
- Check AppWrite console for API usage and errors