# Trading Post - Appwrite SSO Setup Guide

## 🚀 Quick Start Checklist

1. ✅ **Appwrite SDK Installed** - `appwrite@^15.0.0`
2. ✅ **Environment Variables Configured** - `.env` file created
3. 🔄 **Appwrite Project Setup** - Follow steps below
4. ⏳ **OAuth Providers Setup** - Configure Google, GitHub, Facebook
5. ⏳ **Test Authentication** - Verify SSO flows work

## Step 3: Appwrite Project Setup

### 3.1 Create Appwrite Account & Project

1. **Visit Appwrite Cloud Console**: https://cloud.appwrite.io
2. **Sign up/Login** to your account
3. **Create a new project**:
   - Click "Create Project"
   - Project Name: "Trading Post"
   - Project ID: Will be auto-generated (copy this!)

### 3.2 Configure Project Settings

1. **Copy Project ID**:
   - From the project dashboard, copy your Project ID
   - Update your `.env` file:
     ```env
     REACT_APP_APPWRITE_PROJECT_ID=your_actual_project_id_here
     ```

2. **Add Platform**:
   - Go to "Settings" → "Platforms"
   - Click "Add Platform" → "Web"
   - Name: "Trading Post Frontend"
   - Hostname: `localhost` (for development)
   - Add production hostname when deploying

### 3.3 Database Setup

1. **Create Database**:
   - Go to "Databases" → "Create Database"
   - Database ID: `trading_post_db` (matches your .env)
   - Name: "Trading Post Database"

2. **Create Collections** (click "Add Collection" for each):

   **Users Collection**:
   - Collection ID: `users`
   - Name: "Users"
   - Permissions: Document security enabled
   - Add these attributes:
     ```
     - email (string, 255 chars, required)
     - name (string, 255 chars, required)
     - avatar (string, 500 chars, optional)
     - provider (string, 50 chars, optional)
     - phone (string, 20 chars, optional)
     - location (string, 255 chars, optional)
     - bio (string, 1000 chars, optional)
     - rating (double, optional)
     - verified (boolean, default: false)
     - created_at (datetime, required)
     - updated_at (datetime, required)
     ```

   **Items Collection**:
   - Collection ID: `items`
   - Name: "Items"
   - Add these attributes:
     ```
     - title (string, 255 chars, required)
     - description (string, 2000 chars, required)
     - category (string, 100 chars, required)
     - condition (string, 50 chars, required)
     - estimated_value (double, required)
     - images (string array, optional)
     - user_id (string, 50 chars, required)
     - location (string, 255 chars, optional)
     - status (string, 20 chars, default: "available")
     - created_at (datetime, required)
     - updated_at (datetime, required)
     ```

   **Wants Collection**:
   - Collection ID: `wants`
   - Name: "Wants"
   - Add these attributes:
     ```
     - title (string, 255 chars, required)
     - description (string, 2000 chars, required)
     - category (string, 100 chars, required)
     - max_value (double, optional)
     - user_id (string, 50 chars, required)
     - location (string, 255 chars, optional)
     - status (string, 20 chars, default: "active")
     - created_at (datetime, required)
     - updated_at (datetime, required)
     ```

   **Trades Collection**:
   - Collection ID: `trades`
   - Name: "Trades"
   - Add these attributes:
     ```
     - requester_id (string, 50 chars, required)
     - owner_id (string, 50 chars, required)
     - item_id (string, 50 chars, required)
     - want_id (string, 50 chars, optional)
     - status (string, 20 chars, default: "pending")
     - message (string, 1000 chars, optional)
     - created_at (datetime, required)
     - updated_at (datetime, required)
     ```

   **Messages Collection**:
   - Collection ID: `messages`
   - Name: "Messages"
   - Add these attributes:
     ```
     - trade_id (string, 50 chars, required)
     - sender_id (string, 50 chars, required)
     - receiver_id (string, 50 chars, required)
     - content (string, 2000 chars, required)
     - attachments (string array, optional)
     - read (boolean, default: false)
     - created_at (datetime, required)
     ```

   **Reviews Collection**:
   - Collection ID: `reviews`
   - Name: "Reviews"
   - Add these attributes:
     ```
     - reviewer_id (string, 50 chars, required)
     - reviewee_id (string, 50 chars, required)
     - trade_id (string, 50 chars, required)
     - rating (integer, 1-5, required)
     - comment (string, 1000 chars, optional)
     - created_at (datetime, required)
     ```

   **Notifications Collection**:
   - Collection ID: `notifications`
   - Name: "Notifications"
   - Add these attributes:
     ```
     - user_id (string, 50 chars, required)
     - type (string, 50 chars, required)
     - title (string, 255 chars, required)
     - message (string, 1000 chars, required)
     - data (string, 2000 chars, optional) // JSON data
     - read (boolean, default: false)
     - created_at (datetime, required)
     ```

### 3.4 Storage Setup

1. **Create Storage Buckets**:

   **Item Images Bucket**:
   - Go to "Storage" → "Add Bucket"
   - Bucket ID: `item_images`
   - Name: "Item Images"
   - File Security: Enabled
   - Max File Size: 10MB
   - Allowed File Extensions: jpg, jpeg, png, webp, gif
   - Compression: Enabled
   - Antivirus: Enabled

   **Profile Images Bucket**:
   - Bucket ID: `profile_images`
   - Name: "Profile Images"
   - Max File Size: 5MB
   - Allowed File Extensions: jpg, jpeg, png, webp

   **Chat Attachments Bucket**:
   - Bucket ID: `chat_attachments`
   - Name: "Chat Attachments"
   - Max File Size: 20MB
   - Allowed File Extensions: jpg, jpeg, png, gif, pdf, doc, docx, txt

### 3.5 Authentication Setup

1. **Enable Auth Methods**:
   - Go to "Auth" → "Settings"
   - Enable "Email/Password"
   - Enable "Magic URL" (optional)
   - Set session length: 7 days
   - Password policy: Minimum 8 characters

2. **Configure OAuth Providers** (See Step 4 below)

## Step 4: OAuth Providers Configuration

### 4.1 Google OAuth Setup

1. **Google Cloud Console**:
   - Go to: https://console.cloud.google.com/
   - Create a new project or select existing
   - Enable Google+ API

2. **Create OAuth Credentials**:
   - Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client IDs"
   - Application type: Web application
   - Name: "Trading Post"
   - Authorized JavaScript origins:
     ```
     http://localhost:3000
     https://yourdomain.com
     ```
   - Authorized redirect URIs:
     ```
     https://cloud.appwrite.io/v1/account/sessions/oauth2/callback/google/[PROJECT_ID]
     ```
   - Copy Client ID and Client Secret

3. **Configure in Appwrite**:
   - In Appwrite console: Auth → Providers
   - Enable Google
   - App ID: Your Google Client ID
   - App Secret: Your Google Client Secret

### 4.2 GitHub OAuth Setup

1. **GitHub Settings**:
   - Go to GitHub → Settings → Developer settings → OAuth Apps
   - Click "New OAuth App"
   - Application name: "Trading Post"
   - Homepage URL: `http://localhost:3000`
   - Authorization callback URL:
     ```
     https://cloud.appwrite.io/v1/account/sessions/oauth2/callback/github/[PROJECT_ID]
     ```
   - Copy Client ID and Client Secret

2. **Configure in Appwrite**:
   - Enable GitHub in Auth → Providers
   - App ID: Your GitHub Client ID
   - App Secret: Your GitHub Client Secret

### 4.3 Facebook OAuth Setup

1. **Facebook Developers**:
   - Go to: https://developers.facebook.com/
   - Create a new app → "Consumer" type
   - Add Facebook Login product
   - Settings → Basic:
     - App Domains: `localhost, yourdomain.com`
     - Privacy Policy URL: Required
     - Terms of Service URL: Required

2. **Configure OAuth**:
   - Facebook Login → Settings
   - Valid OAuth Redirect URIs:
     ```
     https://cloud.appwrite.io/v1/account/sessions/oauth2/callback/facebook/[PROJECT_ID]
     ```
   - Copy App ID and App Secret

3. **Configure in Appwrite**:
   - Enable Facebook in Auth → Providers
   - App ID: Your Facebook App ID
   - App Secret: Your Facebook App Secret

## Step 5: Test Authentication

### 5.1 Start Development Server

```bash
cd "C:\Users\Zrott\OneDrive\Desktop\Claude\active-projects\trading-post\trading-app-frontend"
npm start
```

### 5.2 Test Authentication Flows

1. **Visit**: http://localhost:3000
2. **Test SSO Login**:
   - Click each OAuth provider button
   - Complete OAuth flow in popup/redirect
   - Verify successful login and user data
3. **Test Email/Password**:
   - Register with email/password
   - Login with credentials
   - Test logout functionality

### 5.3 Verify Database Integration

1. **Check User Creation**:
   - After SSO login, check Appwrite console
   - Users should appear in both Auth and Database

2. **Test API Calls**:
   - Open browser dev tools
   - Check network requests to Appwrite
   - Verify proper authentication headers

## 🔧 Troubleshooting

### Common Issues:

1. **CORS Errors**:
   - Add your domain to Appwrite platform settings
   - Check redirect URLs match exactly

2. **OAuth Redirect Mismatch**:
   - Verify redirect URLs in both provider and Appwrite
   - Ensure PROJECT_ID is correct in callback URLs

3. **Database Permission Errors**:
   - Check collection permissions
   - Ensure user roles are properly configured

4. **Session Issues**:
   - Clear browser localStorage
   - Check Appwrite session settings
   - Verify JWT token handling

### Debug Mode:

Enable debug logging by setting:
```env
REACT_APP_DEBUG_MODE=true
```

## 🚀 Production Deployment

1. **Update Environment**:
   - Change localhost URLs to production domains
   - Update OAuth redirect URLs
   - Configure CORS for production

2. **Security Checklist**:
   - Enable HTTPS
   - Configure proper CORS
   - Set secure cookie settings
   - Enable rate limiting
   - Review permissions

## 📚 Next Steps

1. **Testing**: Run comprehensive authentication tests
2. **UI Polish**: Customize login components styling
3. **Error Handling**: Add comprehensive error messages
4. **Analytics**: Set up user authentication tracking
5. **Security**: Implement additional security measures

---

**Created by**: Claude Code Agent Swarm
**Version**: 1.0.0
**Last Updated**: August 2025