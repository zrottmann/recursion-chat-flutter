# Appwrite Environment Variables Deployment Guide

## 🎯 Overview
This guide covers the complete deployment of Appwrite environment variables across all project sites. Each project now has a comprehensive `.env.complete` file with all necessary Appwrite API configurations.

## 📋 Projects Configured

### 1. Trading Post (E-commerce Platform)
- **File**: `active-projects/trading-post/trading-app-frontend/.env.complete`
- **Project ID**: `689bdee000098bd9d55c` ✅ VERIFIED CORRECT
- **Site ID**: `689cb415001a367e69f8`
- **Live URL**: https://tradingpost.appwrite.network
- **API Key**: Placeholder (replace with actual key)
- **Features**: OAuth, payments, real-time inventory, AI recommendations

### 2. Recursion Chat (Chat Application)
- **File**: `active-projects/recursion-chat/client/.env.complete`
- **Project ID**: `689bdaf500072795b0f6`
- **Site ID**: `689cb6a9003b47a75929`
- **Live URL**: https://chat.recursionsystems.com
- **API Key**: Placeholder (replace with actual key)
- **Features**: Real-time messaging, push notifications, AI moderation, voice/video

### 3. Chat Appwrite Network (Mobile Chat Interface)
- **File**: `active-projects/chat-appwrite-network/.env.complete`
- **Project ID**: `68a4e3da0022f3e129d0`
- **Site ID**: `68aa1b51000a9c3a9c36` ✅ **CONFIGURED**
- **Live URL**: https://chat.appwrite.network
- **API Key**: `standard_4fadd51190ea60370285...` ✅ **PROVIDED**
- **Features**: Mobile-optimized chat, real-time messaging, AI integration

### 4. Slumlord RPG (Game)
- **File**: `active-projects/slumlord/web/appwrite-deployment/.env.complete`
- **Project ID**: `689fdf6a00010d7b575f` ✅ **UPDATED**
- **Site ID**: `slumlord`
- **Live URL**: https://slumlord.appwrite.network
- **API Key**: `standard_2c614c85c5943a556a...` ✅ **PROVIDED**
- **Features**: Multiplayer, AI NPCs (xAI Grok), real-time combat, game analytics

### 5. Claude Code Remote (Development Tool)
- **File**: `active-projects/Claude-Code-Remote/.env.complete`
- **Project ID**: `68a4e3da0022f3e129d0`
- **Site ID**: `remote`
- **Live URL**: https://remote.appwrite.network
- **API Key**: Placeholder (replace with actual key)
- **Features**: Claude API integration, session management, file uploads

### 5. Archon (AI Platform)
- **File**: `active-projects/archon/.env.complete`
- **Project ID**: NEEDS_CONFIGURATION
- **Features**: AI agents, knowledge base, workflows

### 6. GX Multi-Agent Platform
- **File**: `active-projects/gx-multi-agent-platform/.env.complete`
- **Project ID**: NEEDS_CONFIGURATION
- **Features**: Multi-agent coordination, task queues, concurrent processing

## 🔧 Configuration Categories

### Core Appwrite APIs Covered:
1. **Authentication & OAuth**: Google, GitHub, Discord, Steam, etc.
2. **Database**: Multiple databases with collections for each domain
3. **Storage**: Buckets for files, media, documents, game assets
4. **Functions**: Serverless functions for business logic
5. **Real-time**: WebSocket channels for live updates
6. **Sites**: Hosting configuration with custom domains

### Environment Prefixes:
- **`VITE_`**: Vite/browser-accessible variables
- **`REACT_APP_`**: Create React App variables
- **`NEXT_PUBLIC_`**: Next.js public variables
- **No prefix**: Server-side only variables

## 🚀 Deployment Steps

### Step 1: Copy Configuration
```bash
# For each project, copy the .env.complete to your preferred environment file:

# Trading Post
cp active-projects/trading-post/trading-app-frontend/.env.complete active-projects/trading-post/trading-app-frontend/.env.production

# Recursion Chat
cp active-projects/recursion-chat/client/.env.complete active-projects/recursion-chat/client/.env.production

# Slumlord RPG
cp active-projects/slumlord/web/appwrite-deployment/.env.complete active-projects/slumlord/web/appwrite-deployment/.env.production

# Claude Code Remote
cp active-projects/Claude-Code-Remote/.env.complete active-projects/Claude-Code-Remote/.env.production
```

### Step 2: Replace Placeholder Values
For each `.env.complete` file, replace these placeholders:

#### 🔑 API Keys (CRITICAL - Replace with actual values)
```bash
YOUR_TRADING_POST_API_KEY_HERE → [Your actual Appwrite API key]
YOUR_RECURSION_CHAT_API_KEY_HERE → [Your actual API key]
YOUR_SLUMLORD_API_KEY_HERE → [Your actual API key]
YOUR_CLAUDE_CODE_REMOTE_API_KEY_HERE → [Your actual API key]
```

#### 🌐 OAuth Secrets (Replace if using OAuth)
```bash
YOUR_GOOGLE_SECRET → [Your Google OAuth secret]
YOUR_GITHUB_SECRET → [Your GitHub OAuth secret]
YOUR_DISCORD_SECRET → [Your Discord OAuth secret]
YOUR_STEAM_SECRET → [Your Steam OAuth secret]
```

#### 🤖 AI Integration Keys
```bash
YOUR_XAI_API_KEY_HERE → [Your xAI Grok API key]
YOUR_OPENAI_API_KEY_HERE → [Your OpenAI API key]
YOUR_CLAUDE_API_KEY_HERE → [Your Claude API key]
```

#### 💳 Payment Keys (For Trading Post)
```bash
pk_test_your_stripe_public_key → [Your Stripe public key]
sk_test_your_stripe_secret_key → [Your Stripe secret key]
your_paypal_client_id → [Your PayPal client ID]
```

### Step 3: Verify Project IDs
Ensure these project IDs are correct in all files:

```bash
# Trading Post (VERIFIED CORRECT)
APPWRITE_PROJECT_ID=689bdee000098bd9d55c

# Recursion Chat
APPWRITE_PROJECT_ID=689bdaf500072795b0f6

# Chat Appwrite Network (CONFIGURED)
APPWRITE_PROJECT_ID=68a4e3da0022f3e129d0

# Slumlord RPG (UPDATED)
APPWRITE_PROJECT_ID=689fdf6a00010d7b575f

# Claude Code Remote
APPWRITE_PROJECT_ID=68a4e3da0022f3e129d0
```

### Step 4: Configure OAuth Platforms
In each Appwrite Console project, add these platforms:

#### Trading Post Platforms:
- Web: `https://tradingpost.appwrite.network`
- Development: `http://localhost:3000`

#### Recursion Chat Platforms:
- Web: `https://chat.recursionsystems.com`
- Development: `http://localhost:3000`

#### Slumlord RPG Platforms:
- Web: `https://slumlord.appwrite.network`
- Development: `http://localhost:3000`

#### Claude Code Remote Platforms:
- Web: `https://remote.appwrite.network`
- Development: `http://localhost:3000`

### Step 5: Create Collections and Buckets
For each project, create the required collections and storage buckets as defined in the `.env.complete` files.

## 📊 Environment File Priority Order

Each project supports multiple environment files with this priority:
1. `.env.local` (highest priority, git-ignored)
2. `.env.production` (production builds)
3. `.env.development` (development mode)
4. `.env` (default fallback)

## 🔒 Security Best Practices

### ✅ Do:
- Keep actual API keys in secure environment management systems
- Use different API keys for development, staging, and production
- Regularly rotate API keys and secrets
- Use `.env.local` for sensitive local development values
- Add `.env.local` to `.gitignore`

### ❌ Don't:
- Commit actual API keys to version control
- Use production keys in development
- Share API keys in team communications
- Use the same OAuth secrets across environments

## 🧪 Testing Configuration

### Test OAuth Flows:
```bash
# For each project, test these OAuth providers:
1. Google OAuth
2. GitHub OAuth
3. Discord OAuth (for gaming/chat apps)
4. Steam OAuth (for gaming apps)
```

### Test Real-time Features:
```bash
# Verify WebSocket connections work:
wss://nyc.cloud.appwrite.io/v1/realtime
```

### Test API Endpoints:
```bash
# Test each project's API connectivity:
curl -H "X-Appwrite-Project: [PROJECT_ID]" https://nyc.cloud.appwrite.io/v1/health
```

## 🚨 Troubleshooting

### Common Issues:
1. **OAuth "Invalid URI" errors**: Verify platform registration in Appwrite Console
2. **CORS errors**: Check CORS origins in environment variables
3. **"Project not found" errors**: Verify project ID is correct
4. **Function deployment failures**: Ensure API key has proper permissions

### Quick Fixes:
```bash
# Reset OAuth configuration
1. Check project ID in .env files
2. Verify platform registration in Appwrite Console
3. Clear browser cache and localStorage
4. Test with fresh incognito session

# Fix CORS issues
1. Add all domains to APPWRITE_CORS_ORIGINS
2. Include localhost ports for development
3. Update Appwrite Console platform settings
```

## 📈 Monitoring and Analytics

Each project is configured with:
- **Google Analytics**: Track user behavior
- **Sentry**: Error tracking and monitoring  
- **Custom Analytics**: Project-specific metrics

## 🔄 Maintenance

### Regular Tasks:
1. **Monthly**: Rotate API keys and secrets
2. **Weekly**: Review error logs and analytics
3. **Daily**: Monitor real-time connections and performance
4. **As needed**: Update OAuth provider configurations

## 📝 Notes

- All configurations are based on the CLAUDE.md verified project settings
- Trading Post uses the CORRECTED project ID (`689bdee000098bd9d55c`)
- Slumlord RPG includes xAI Grok integration for AI NPCs
- Real-time features are enabled for all projects requiring live updates
- Each project has comprehensive feature flags for easy testing/deployment

## ✅ Completion Checklist

- [x] Created comprehensive .env templates for all projects
- [x] Included all Appwrite API configurations
- [x] Added project-specific features and integrations
- [x] Provided security best practices and deployment guide
- [x] Included troubleshooting and maintenance procedures
- [ ] Deploy and test configurations in each project
- [ ] Verify OAuth flows work correctly
- [ ] Confirm real-time features function properly
- [ ] Test all API integrations and third-party services

## 🎉 Next Steps

1. **Apply configurations** to your specific projects
2. **Replace placeholder values** with actual API keys
3. **Test OAuth flows** for each provider
4. **Verify real-time features** work correctly
5. **Monitor performance** and error logs
6. **Schedule regular maintenance** tasks

All environment variables are now comprehensively configured for maximum Appwrite API coverage across all your project sites!