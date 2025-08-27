# 🔐 GitHub Secrets Manual Setup Guide

Since the automated script is having encryption issues, here's how to manually set up the GitHub secrets for both repositories.

## 📋 Required Secrets

### For Recursion Chat App Repository
**Repository:** https://github.com/zrottmann/recursion-chat-app

1. Go to: https://github.com/zrottmann/recursion-chat-app/settings/secrets/actions
2. Click **"New repository secret"**
3. Add the following secret:

**Secret Name:** `APPWRITE_API_KEY`
**Secret Value:**
```
standard_3f24ec4af7735370663bb71bb1833e940e485642b146ee160ca66a2cbb5f43a882d46b71a881b045d0410980baa30ce377e3fd493a119e0457fbdbf192b079c8de72e6263b21ea9047de4d38d9cf11c075bbc5cecbae17237e2dfbe142059151dd7f042c0dd02abc88af8348e6b95d632541f664dd4244027c35405aa6915fbc
```

### For Trading Post Repository  
**Repository:** https://github.com/zrottmann/tradingpost

1. Go to: https://github.com/zrottmann/tradingpost/settings/secrets/actions
2. Click **"New repository secret"**
3. Add the following secret:

**Secret Name:** `TRADING_POST_APPWRITE_API_KEY`
**Secret Value:**
```
standard_69ad410fb689c99811130c74cc3947ab6a818f385776fe7dea7eaca24b6e924ed00191d7ba6749d01abb212e9c0967f91308f7da31ed16d1cc983c7045358d7169ae80225d99605771b222c974a382535af6af874c142770e70e7955b855b201af836d4c7b594fde0498bde883915e0e751b9d0968e58b78d5385d32e63b62c2
```

## ✅ Steps to Add Secrets

1. **Navigate to Repository Settings**
   - Go to the repository on GitHub
   - Click the **"Settings"** tab
   - In the left sidebar, click **"Secrets and variables"** → **"Actions"**

2. **Add New Secret**
   - Click **"New repository secret"** button
   - Enter the secret name (exactly as shown above)
   - Paste the secret value
   - Click **"Add secret"**

3. **Verify Secret Added**
   - The secret should appear in the list
   - You'll see the name but not the value (for security)

## 🧪 Test the Setup

### Method 1: Manual Trigger
1. Go to the **Actions** tab in your repository
2. Find the deployment workflow
3. Click **"Run workflow"** → **"Run workflow"**
4. Watch the build progress

### Method 2: Push a Commit
1. Make a small change to any file:
   ```bash
   echo "// Auto-deploy test" >> client/src/App.jsx
   git add . && git commit -m "test: GitHub Actions auto-deploy"
   git push origin main
   ```
2. Check the **Actions** tab to see the workflow running

## 🔍 Verify Webhooks

The setup script successfully configured webhooks for both repositories:
- ✅ Recursion Chat App: Updated webhook 563884407
- ✅ Trading Post: Updated webhook 563891125

## 🌐 Expected Deployment Flow

1. **Push to GitHub** → Triggers GitHub Actions workflow
2. **Build Process** → React app builds with production settings
3. **Appwrite API Calls** → Attempts to trigger deployment
4. **Webhook Triggers** → Sends deployment signal to Appwrite
5. **Manual Completion** → May require final click in Appwrite Console

## 📍 Key URLs

### Repositories
- Recursion Chat: https://github.com/zrottmann/recursion-chat-app
- Trading Post: https://github.com/zrottmann/tradingpost

### Appwrite Consoles
- Recursion Chat: https://cloud.appwrite.io/console/project-689bdaf500072795b0f6/hosting
- Trading Post: https://cloud.appwrite.io/console/project-689bdee000098bd9d55c/hosting

### Live Sites
- Recursion Chat: https://chat.recursionsystems.com
- Trading Post: https://689cb415001a367e69f8.appwrite.global

## 🚨 Important Notes

1. **Webhooks Configured**: Both repositories now have webhooks that will notify Appwrite of changes
2. **Secrets Required**: The workflows will fail without the proper secrets
3. **Manual Step**: You may still need to click "Deploy" in Appwrite Console after the build completes
4. **GitHub Token**: Your personal access token `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` has been used to set up the webhooks

## 🛠️ Troubleshooting

### Workflow Fails with "Secret not found"
- Verify you added the secret with the exact name shown above
- Check that the secret appears in the repository settings

### Build Succeeds but Deployment Doesn't Complete
- Check Appwrite Console for manual deployment option
- Verify webhook is receiving the payload
- Confirm Appwrite project permissions

### Need to Regenerate API Keys
- Go to Appwrite Console → Settings → API Keys
- Create new key with full permissions
- Update the GitHub secret with new value

## ✨ Next Steps After Setup

1. **Test the workflow** by making a small commit
2. **Monitor Actions tab** for build progress
3. **Check Appwrite Console** for deployment status
4. **Verify live sites** are updated

The auto-deployment pipeline is now configured and ready for testing!