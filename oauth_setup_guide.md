# OAuth Provider Setup Guide

This guide provides step-by-step instructions for obtaining OAuth credentials from each provider for the Trading Post application.

## Table of Contents
- [Google OAuth 2.0](#google-oauth-20)
- [GitHub OAuth](#github-oauth)
- [Facebook OAuth](#facebook-oauth)
- [Microsoft OAuth](#microsoft-oauth)
- [Discord OAuth](#discord-oauth)
- [Configuration Steps](#configuration-steps)

---

## Google OAuth 2.0

### Prerequisites
- Google account
- Google Cloud Console access

### Steps to Get Credentials

1. **Go to Google Cloud Console**
   - Navigate to: https://console.cloud.google.com/

2. **Create or Select a Project**
   - Click on the project dropdown at the top
   - Select existing project or create a new one
   - Name it something like "Trading Post App"

3. **Enable OAuth 2.0**
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"

4. **Configure OAuth Consent Screen** (if first time)
   - Choose "External" for user type
   - Fill in application details:
     - App name: Trading Post
     - User support email: Your email
     - Developer contact: Your email
   - Add scopes: email, profile, openid
   - Add test users if in development

5. **Create OAuth 2.0 Client ID**
   - Application type: "Web application"
   - Name: "Trading Post Web Client"
   - Authorized JavaScript origins:
     - Development: `http://localhost:3000`
     - Production: `https://tradingpost-2tq2f.ondigitalocean.app`
   - Authorized redirect URIs:
     - Development: `http://localhost:3000/auth/callback/google`
     - Production: `https://tradingpost-2tq2f.ondigitalocean.app/auth/callback/google`

6. **Save Credentials**
   - Copy the Client ID
   - Copy the Client Secret
   - Store securely

---

## GitHub OAuth

### Prerequisites
- GitHub account

### Steps to Get Credentials

1. **Go to GitHub Settings**
   - Navigate to: https://github.com/settings/apps
   - Or go to Settings > Developer settings > OAuth Apps

2. **Create New OAuth App**
   - Click "New OAuth App"

3. **Fill in Application Details**
   - Application name: Trading Post
   - Homepage URL: 
     - Development: `http://localhost:3000`
     - Production: `https://tradingpost-2tq2f.ondigitalocean.app`
   - Authorization callback URL:
     - Development: `http://localhost:3000/auth/callback/github`
     - Production: `https://tradingpost-2tq2f.ondigitalocean.app/auth/callback/github`

4. **Register Application**
   - Click "Register application"

5. **Save Credentials**
   - Copy the Client ID
   - Generate and copy Client Secret
   - Store securely

---

## Facebook OAuth

### Prerequisites
- Facebook account
- Facebook Developer account

### Steps to Get Credentials

1. **Go to Facebook Developers**
   - Navigate to: https://developers.facebook.com/

2. **Create App**
   - Click "My Apps" > "Create App"
   - Choose "Consumer" as the app type
   - Provide app details:
     - App name: Trading Post
     - App contact email: Your email

3. **Set Up Facebook Login**
   - In the dashboard, add "Facebook Login" product
   - Choose "Web" platform

4. **Configure OAuth Settings**
   - Go to Facebook Login > Settings
   - Valid OAuth Redirect URIs:
     - Development: `http://localhost:3000/auth/callback/facebook`
     - Production: `https://tradingpost-2tq2f.ondigitalocean.app/auth/callback/facebook`
   - Enable "Client OAuth Login"
   - Enable "Web OAuth Login"

5. **Get App Credentials**
   - Go to Settings > Basic
   - Copy App ID
   - Copy App Secret
   - Store securely

6. **Set App to Live Mode** (for production)
   - Toggle the app from Development to Live mode when ready

---

## Microsoft OAuth

### Prerequisites
- Microsoft account
- Azure account (free tier available)

### Steps to Get Credentials

1. **Go to Azure Portal**
   - Navigate to: https://portal.azure.com/

2. **Register Application**
   - Go to "Azure Active Directory" > "App registrations"
   - Click "New registration"

3. **Configure Application**
   - Name: Trading Post
   - Supported account types: "Accounts in any organizational directory and personal Microsoft accounts"
   - Redirect URI:
     - Platform: Web
     - Development: `http://localhost:3000/auth/callback/microsoft`
     - Production: `https://tradingpost-2tq2f.ondigitalocean.app/auth/callback/microsoft`

4. **Get Application ID**
   - Copy the "Application (client) ID"

5. **Create Client Secret**
   - Go to "Certificates & secrets"
   - Click "New client secret"
   - Description: Trading Post Secret
   - Expiry: Choose appropriate duration
   - Copy the Value (shown only once!)

6. **Configure API Permissions**
   - Go to "API permissions"
   - Add permissions:
     - Microsoft Graph > Delegated permissions
     - Select: User.Read, email, profile, openid

---

## Discord OAuth

### Prerequisites
- Discord account

### Steps to Get Credentials

1. **Go to Discord Developer Portal**
   - Navigate to: https://discord.com/developers/applications

2. **Create New Application**
   - Click "New Application"
   - Name: Trading Post

3. **Get Client Credentials**
   - In "General Information" tab:
     - Copy "Application ID" (this is your Client ID)

4. **Get Client Secret**
   - Go to "OAuth2" tab
   - Copy "Client Secret" (regenerate if needed)

5. **Configure OAuth2**
   - Add Redirects:
     - Development: `http://localhost:3000/auth/callback/discord`
     - Production: `https://tradingpost-2tq2f.ondigitalocean.app/auth/callback/discord`

6. **Set Scopes**
   - In OAuth2 URL Generator:
     - Select scopes: identify, email
     - Save configuration

---

## Configuration Steps

After obtaining credentials from the providers:

### 1. Create Configuration File

Create `oauth_providers.json` in your project root:

```json
{
  "google": {
    "name": "Google OAuth 2.0",
    "app_id": "YOUR_ACTUAL_GOOGLE_CLIENT_ID",
    "secret": "YOUR_ACTUAL_GOOGLE_CLIENT_SECRET",
    "enabled": true,
    "scopes": ["openid", "email", "profile"]
  },
  "github": {
    "name": "GitHub OAuth",
    "app_id": "YOUR_ACTUAL_GITHUB_CLIENT_ID",
    "secret": "YOUR_ACTUAL_GITHUB_CLIENT_SECRET",
    "enabled": true,
    "scopes": ["user:email"]
  },
  "facebook": {
    "name": "Facebook OAuth",
    "app_id": "YOUR_ACTUAL_FACEBOOK_APP_ID",
    "secret": "YOUR_ACTUAL_FACEBOOK_APP_SECRET",
    "enabled": true,
    "scopes": ["email", "public_profile"]
  },
  "microsoft": {
    "name": "Microsoft OAuth",
    "app_id": "YOUR_ACTUAL_MICROSOFT_CLIENT_ID",
    "secret": "YOUR_ACTUAL_MICROSOFT_CLIENT_SECRET",
    "enabled": false,
    "scopes": ["openid", "email", "profile", "offline_access"]
  },
  "discord": {
    "name": "Discord OAuth",
    "app_id": "YOUR_ACTUAL_DISCORD_CLIENT_ID",
    "secret": "YOUR_ACTUAL_DISCORD_CLIENT_SECRET",
    "enabled": false,
    "scopes": ["identify", "email"]
  }
}
```

### 2. Set Environment Variables

Create or update `.env` file:

```bash
# Appwrite Configuration
APPWRITE_ENDPOINT=https://cloud.appwrite.io
APPWRITE_PROJECT_ID=your_project_id_here
APPWRITE_API_KEY=your_api_key_here

# Environment
ENVIRONMENT=development  # or production
```

### 3. Run Configuration Script

For development:
```bash
python configure_oauth_providers.py --config-file oauth_providers.json --environment development
```

For production:
```bash
python configure_oauth_providers.py --config-file oauth_providers.json --environment production
```

### 4. Verify Configuration

List current providers:
```bash
python configure_oauth_providers.py --list-providers
```

---

## Security Best Practices

1. **Never commit credentials to version control**
   - Add `oauth_providers.json` to `.gitignore`
   - Use environment variables for production

2. **Use separate apps for development and production**
   - Create separate OAuth apps for each environment
   - Use different credentials for each

3. **Rotate secrets regularly**
   - Update client secrets periodically
   - Keep track of secret expiration dates

4. **Limit scopes to minimum required**
   - Only request necessary permissions
   - Review scope requirements periodically

5. **Secure storage**
   - Use secret management services in production
   - Encrypt sensitive configuration files

---

## Troubleshooting

### Common Issues

1. **Redirect URI Mismatch**
   - Ensure redirect URIs match exactly (including trailing slashes)
   - Check both development and production URLs

2. **Invalid Client Secret**
   - Secrets may expire or be regenerated
   - Update configuration with new secret

3. **Scope Errors**
   - Verify requested scopes are available for the provider
   - Check provider documentation for scope names

4. **Rate Limiting**
   - Some providers limit OAuth requests
   - Implement proper error handling and retry logic

### Testing OAuth Flow

1. Start your application in development mode
2. Navigate to login page
3. Click on provider login button
4. Verify redirect to provider's consent page
5. Authorize the application
6. Verify successful callback and user creation

---

## Additional Resources

- [Appwrite OAuth Documentation](https://appwrite.io/docs/client/account#accountCreateOAuth2Session)
- [OAuth 2.0 Specification](https://oauth.net/2/)
- [OpenID Connect](https://openid.net/connect/)

---

## Support

For issues or questions:
1. Check Appwrite console logs
2. Review provider-specific documentation
3. Verify network connectivity and firewall rules
4. Check application logs for detailed error messages