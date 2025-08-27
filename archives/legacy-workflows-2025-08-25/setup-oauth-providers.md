# OAuth Providers Quick Setup

## Google OAuth Setup

1. **Go to Google Cloud Console**: https://console.cloud.google.com/
2. **Enable Google+ API** in your project
3. **Create OAuth 2.0 credentials**:
   - Authorized origins: `http://localhost:3000`, `https://yourdomain.com`
   - Redirect URIs: `https://cloud.appwrite.io/v1/account/sessions/oauth2/callback/google/YOUR_PROJECT_ID`
4. **Copy Client ID and Secret** to Appwrite Auth → Providers → Google

## GitHub OAuth Setup

1. **Go to GitHub Settings**: https://github.com/settings/developers
2. **New OAuth App**:
   - Homepage URL: `http://localhost:3000`
   - Callback URL: `https://cloud.appwrite.io/v1/account/sessions/oauth2/callback/github/YOUR_PROJECT_ID`
3. **Copy Client ID and Secret** to Appwrite Auth → Providers → GitHub

## Facebook OAuth Setup

1. **Go to Facebook Developers**: https://developers.facebook.com/
2. **Create Consumer App** with Facebook Login
3. **Valid OAuth Redirect URIs**: `https://cloud.appwrite.io/v1/account/sessions/oauth2/callback/facebook/YOUR_PROJECT_ID`
4. **Copy App ID and Secret** to Appwrite Auth → Providers → Facebook

## Testing URLs

- **Development**: http://localhost:3000/auth/callback
- **Production**: https://yourdomain.com/auth/callback

Replace `YOUR_PROJECT_ID` with your actual Appwrite project ID from your .env file.