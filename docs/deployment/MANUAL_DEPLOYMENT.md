# 📖 Manual Deployment Guide

Since the API key is not working, here's how to deploy manually:

## 🎯 Quick Steps:

### 1. Open Appwrite Console
- Go to: https://cloud.appwrite.io/console
- Login to your account

### 2. Navigate to Your Project
- Find project: `68a4e3da0022f3e129d0`
- Or the correct project if different

### 3. Deploy to Sites (Option A)
```
1. Click "Sites" in sidebar
2. Find site ID: 68aa1b51000a9c3a9c36
3. Click the site name
4. Click "Deploy" or "Upload"
5. Upload file: claude-site.tar.gz
6. Set entrypoint: index.html
7. Click "Deploy"
```

### 4. Deploy as Function (Option B)
```
1. Click "Functions" in sidebar
2. Click "Create Function"
3. Name: "Claude Code UI"
4. Runtime: Node.js 18
5. Upload code: claude-site.tar.gz
6. Set entrypoint: index.html
7. Enable "Execute" permissions for "Any"
8. Click "Deploy"
```

## 📁 Files Ready for Upload:
- **Main file:** `claude-deployment/claude-site.tar.gz`
- **Size:** 2.4 KB
- **Contains:** index.html + package.json
- **Entrypoint:** index.html

## 🌐 Expected URLs:
- **Sites:** https://68aa1b51000a9c3a9c36.appwrite.global
- **Function:** https://claude-code-ui-[project].appwrite.global

## ✅ Success Indicators:
- Upload completes without errors
- Deployment status shows "Active" or "Ready"
- URL returns the Claude Code interface
- No 404 or deployment errors

## 🔧 If Site ID Doesn't Exist:
1. Create new site in Sites section
2. Note the new site ID
3. Upload claude-site.tar.gz there
4. Update any references to use new site ID

## 📞 Support:
If manual upload fails:
1. Check if you have Sites permissions in project
2. Verify project ID: 68a4e3da0022f3e129d0
3. Try creating new site if existing one not found
4. Use Functions deployment as alternative