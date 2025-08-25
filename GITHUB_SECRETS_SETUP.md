# 🔐 GitHub Secrets Setup for Trading Post

## Required Secrets

You need to add this secret to your GitHub repository for the workflow to work.

### 1. Navigate to GitHub Secrets
1. Go to your repository: https://github.com/[your-username]/trading-post
2. Click **Settings** tab
3. Click **Secrets and variables** → **Actions** in the left sidebar
4. Click **New repository secret**

### 2. Add the Required Secret

#### `TRADING_POST_APPWRITE_API_KEY`
```
standard_69ad410fb689c99811130c74cc3947ab6a818f385776fe7dea7eaca24b6e924ed00191d7ba6749d01abb212e9c0967f91308f7da31ed16d1cc983c7045358d7169ae80225d99605771b222c974a382535af6af874c142770e70e7955b855b201af836d4c7b594fde0498bde883915e0e751b9d0968e58b78d5385d32e63b62c2
```

## How to Add the Secret

1. Click **New repository secret**
2. Name: `TRADING_POST_APPWRITE_API_KEY`
3. Value: Paste the key above
4. Click **Add secret**

### Complete List:
- [x] `TRADING_POST_APPWRITE_API_KEY` - Appwrite API key (REQUIRED)

## Optional: Generate New Appwrite API Key

If you want a fresh API key for Trading Post:

1. Go to [Appwrite Console](https://cloud.appwrite.io/console)
2. Select your Trading Post project (689bdee000098bd9d55c)
3. Navigate to **Settings** → **API Keys**
4. Click **Create API Key**
5. Configure:
   - Name: `GitHub Actions Deploy`
   - Expiration: Never (or set a date)
   - Scopes: Select all storage, database, and hosting scopes
6. Click **Create**
7. Copy the key and update the secret

## Testing the Workflow

### Manual Test
1. Go to **Actions** tab in your repository
2. Click on **Deploy Trading Post to Appwrite Sites** workflow
3. Click **Run workflow** → **Run workflow**
4. Select branch (main or master)
5. Watch the progress

### Automatic Test
1. Make a small change:
   ```bash
   echo "// GitHub Actions test" >> trading-app-frontend/src/App.js
   git add . && git commit -m "test: GitHub Actions deployment"
   git push origin main
   ```
2. Check **Actions** tab to monitor

## Workflow Features

The workflow performs:
1. **Frontend Build** - React application for Appwrite Sites
2. **Build Verification** - Ensures all files are ready for deployment
3. **Appwrite Sites Preparation** - Prepares build for deployment
4. **Architecture** - React SPA using Appwrite for all backend services
5. **Services** - Auth, Database, Storage, and Hosting all via Appwrite

## Workflow Status Badge

Add to your README.md:

```markdown
[![Deploy Trading Post](https://github.com/[your-username]/trading-post/actions/workflows/deploy.yml/badge.svg)](https://github.com/[your-username]/trading-post/actions/workflows/deploy.yml)
```

## Environment Variables in Workflow

The workflow sets these automatically:
- `REACT_APP_APPWRITE_ENDPOINT`: https://cloud.appwrite.io/v1
- `REACT_APP_APPWRITE_PROJECT_ID`: 689bdee000098bd9d55c
- `REACT_APP_APPWRITE_DATABASE_ID`: recursion_chat_db
- `REACT_APP_APPWRITE_USERS_COLLECTION_ID`: Trading Post Users
- `REACT_APP_APPWRITE_ITEMS_COLLECTION_ID`: Trading Post Items
- `REACT_APP_APPWRITE_TRADES_COLLECTION_ID`: Trading Post Trades

## Troubleshooting

### Secret not found error
- Verify secret name matches exactly: `TRADING_POST_APPWRITE_API_KEY`
- Check that the secret is added to the repository

### Build failures
- Check logs in Actions tab
- Run build locally first: `cd trading-app-frontend && npm run build`
- Fix any TypeScript/ESLint errors

### Appwrite deployment preparation fails
- Verify API key has correct permissions
- Check project ID is correct (689bdee000098bd9d55c)
- Ensure Appwrite project exists

## Architecture Overview

**Trading Post Architecture:**
- **Frontend**: React SPA built with Create React App
- **Backend**: Appwrite Cloud (all services)
- **Authentication**: Appwrite Auth with OAuth providers
- **Database**: Appwrite Database with collections
- **Storage**: Appwrite Storage for file uploads
- **Hosting**: Appwrite Sites for static hosting
- **Deployment**: GitHub Actions → Appwrite Sites

## Production URLs

- **Application**: https://689cb415001a367e69f8.appwrite.global
- **Appwrite Console**: https://cloud.appwrite.io/console/project-689bdee000098bd9d55c
- **Site Management**: https://cloud.appwrite.io/console/project-689bdee000098bd9d55c/hosting

## Advanced Configuration

### Branch Protection
1. Go to Settings → Branches
2. Add rule for `main`
3. Require status checks to pass
4. Select the workflow

### Deployment Environments
1. Go to Settings → Environments
2. Create `production` environment
3. Add protection rules
4. Add environment secrets

### Notifications
Add deployment notifications:
- Slack: Use `slack-github-action`
- Discord: Use `discord-webhook-action`
- Email: Use GitHub's built-in notifications

## Cost Considerations

- **GitHub Actions**: 2,000 minutes/month free
- **Appwrite Cloud**: Check your plan limits
- **All services included**: Auth, Database, Storage, Hosting

## Final Deployment Step

**Important**: The workflow prepares the build but you still need to:

1. Go to [Appwrite Console](https://cloud.appwrite.io/console/project-689bdee000098bd9d55c/hosting)
2. Navigate to **Hosting** → **Sites**
3. Find site `689cb415001a367e69f8`
4. Click **"Deploy"** or **"Rebuild"**
5. Wait for deployment to complete

**Or enable Git integration** in Appwrite Console for fully automatic deployments.

## Support

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Appwrite Sites Documentation](https://appwrite.io/docs/products/sites)
- [Appwrite Console](https://cloud.appwrite.io/console)