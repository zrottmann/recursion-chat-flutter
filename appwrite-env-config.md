# Appwrite Environment Variables Configuration for Trading Post

## Build Settings

### Install Command:
```bash
npm ci --no-workspaces --include=dev && cd trading-app-frontend && npm ci --include=dev --legacy-peer-deps
```

### Build Command:
```bash
cd trading-app-frontend && CI=false TSC_COMPILE_ON_ERROR=true DISABLE_ESLINT_PLUGIN=true npm run build
```

### Output Directory:
```
trading-app-frontend/build
```

### Build Runtime:
```
Node.js 18
```

## Environment Variables to Add in Appwrite Console

### Core Appwrite Configuration
```
APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
APPWRITE_PROJECT_ID=689bdee000098bd9d55c
APPWRITE_API_KEY=27c3d18d6223495324df041ad6ae01c0b3b3e5e53ca130fbc9ff74925ec5b7f066959fdd87c4622c35df40b70061bd4d7133f3c367f67a23cf23796b341b94dc6816ba23b767886602ca5537265378da21a6d42bcb1413c7a6a0ec3c71e37ee80233483ce23c2f9307a30848bccacbb8c8c8d97dc4d159bc9beb249fa45993ec
```

### Database Configuration
```
APPWRITE_DATABASE_ID=trading_post_db
APPWRITE_USERS_COLLECTION_ID=users
APPWRITE_ITEMS_COLLECTION_ID=items
APPWRITE_WANTS_COLLECTION_ID=wants
APPWRITE_TRADES_COLLECTION_ID=trades
APPWRITE_MESSAGES_COLLECTION_ID=messages
APPWRITE_REVIEWS_COLLECTION_ID=reviews
APPWRITE_NOTIFICATIONS_COLLECTION_ID=notifications
```

### Storage Configuration
```
APPWRITE_ITEM_IMAGES_BUCKET_ID=item_images
APPWRITE_PROFILE_IMAGES_BUCKET_ID=profile_images
APPWRITE_CHAT_ATTACHMENTS_BUCKET_ID=chat_attachments
```

### React App Environment Variables
```
REACT_APP_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
REACT_APP_APPWRITE_PROJECT_ID=689bdee000098bd9d55c
REACT_APP_APPWRITE_DATABASE_ID=trading_post_db
REACT_APP_API_URL=https://689cb415001a367e69f8.appwrite.global
```

### OAuth Configuration (Optional - if using SSO)
```
REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id_here
REACT_APP_GITHUB_CLIENT_ID=your_github_client_id_here
REACT_APP_FACEBOOK_APP_ID=your_facebook_app_id_here
```

### Build Environment Variables
```
NODE_ENV=production
CI=false
TSC_COMPILE_ON_ERROR=true
DISABLE_ESLINT_PLUGIN=true
SKIP_PREFLIGHT_CHECK=true
```

### Security Keys
```
SECRET_KEY=your-super-secure-secret-key-change-in-production-minimum-32-chars
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
```

### Feature Flags
```
ENABLE_SSO=true
ENABLE_EMAIL_AUTH=true
ENABLE_MAGIC_LINK=false
ENABLE_PHONE_AUTH=false
ENABLE_ANONYMOUS_AUTH=false
ENABLE_MFA=false
```

## How to Add These in Appwrite Console

1. Go to your Appwrite project console
2. Navigate to **Settings** → **Functions** → **Your Function**
3. Click on **Environment Variables**
4. Add each variable as a key-value pair
5. Mark sensitive values (API keys, secrets) as **Secret**

## Important Notes

- The `APPWRITE_API_KEY` is your development key - keep it secure
- Update `REACT_APP_API_URL` with your actual Appwrite Sites URL after deployment
- OAuth client IDs are optional unless you're implementing social login
- All `REACT_APP_*` variables are exposed to the frontend, so don't put secrets there
- Non-`REACT_APP_*` variables are server-side only

## Verification

After adding these variables, you can verify they're working by:
1. Triggering a new build in Appwrite
2. Checking the build logs for successful environment variable loading
3. Testing the deployed application's Appwrite connectivity