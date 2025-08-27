# Super Console GitHub Actions Deployment Setup

## 🚀 Automated Deployment to Fix Runtime Timeout Issue

This setup deploys the Super Console to Appwrite Sites via GitHub Actions, resolving the runtime timeout issue that affected `super.appwrite.network`.

## Required GitHub Repository Secrets

Configure these secrets in your GitHub repository settings:

### 1. SUPER_CONSOLE_APPWRITE_API_KEY
- **Value**: Your Appwrite API key with Sites deployment permissions
- **Example**: `standard_xxx...xxx` (full API key)

### 2. SUPER_CONSOLE_PROJECT_ID  
- **Value**: Your Appwrite project ID
- **Example**: `68a4e3da0022f3e129d0`

### 3. SUPER_CONSOLE_SITE_ID
- **Value**: Your Appwrite Sites ID where Super Console should be deployed
- **Example**: `68a4ed30000cba9224d2`

## How to Set Up Repository Secrets

1. Go to your GitHub repository: `https://github.com/zrottmann/enhanced-tech-lead-orchestrator`
2. Click on **Settings** tab
3. In the left sidebar, click **Secrets and variables** → **Actions**
4. Click **New repository secret**
5. Add each secret with the name and value listed above

## Deployment Triggers

The GitHub Actions workflow will automatically deploy when:

- **Push to main branch** with changes in `super-console/` directory
- **Manual trigger** via GitHub Actions "Run workflow" button

## Deployment Process

1. **Checkout code** from repository
2. **Install dependencies** in super-console directory  
3. **Build Super Console** (copies HTML to dist/)
4. **Create deployment archive** (tar.gz with built files)
5. **Deploy to Appwrite Sites** using API
6. **Verify deployment** with health check

## Expected Results

✅ **Super Console loads instantly** without runtime timeouts  
✅ **Interactive terminal interface** with full functionality  
✅ **Automated CI/CD pipeline** for future updates  
✅ **High availability** via Appwrite Sites hosting

## Testing the Deployment

After setting up secrets and pushing changes:

1. Check GitHub Actions tab for workflow execution
2. Wait for deployment to complete (usually 2-3 minutes)
3. Visit `https://super.appwrite.network` to confirm it loads
4. Test the interactive terminal features

## Troubleshooting

**If deployment fails:**
- Check GitHub Actions logs for error details
- Verify all three secrets are correctly set
- Ensure API key has Sites deployment permissions
- Confirm project and site IDs are correct

**If Super Console doesn't load:**
- Allow 2-3 minutes for CDN propagation
- Check Appwrite Console for deployment status
- Try clearing browser cache

## Architecture

**Previous Setup**: Appwrite Functions → Runtime timeout issues  
**New Setup**: GitHub Actions → Appwrite Sites → Fast loading

This resolves the platform-level routing issues that caused the runtime timeouts.