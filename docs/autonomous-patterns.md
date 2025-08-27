# Claude Autonomous Command Patterns

## Commands I Use Autonomously (Auto-Approved)

### GitHub CLI Operations
```bash
# Watch deployment progress
watch-deployment.bat recursion-chat-app
watch-deployment.bat enhanced-tech-lead-orchestrator 17193959825

# Monitor specific GitHub run
monitor-github-run.bat [run-id] [repo-name]
monitor-github-run.bat 17194254884 recursion-chat-app

# Watch specific run with exit status
./gh.exe run watch --exit-status [run-id] --repo zrottmann/[project]
cd "C:\Users\Zrott\OneDrive\Desktop\Claude" && ./gh.exe run watch --exit-status [run-id] --repo zrottmann/[project]

# Get deployment status
gh.exe run list --repo zrottmann/[project] --limit 3
gh.exe run view [run-id] --repo zrottmann/[project]
gh.exe workflow list --repo zrottmann/[project]
```

### API Key Operations  
```bash
# Deploy projects
run-with-env.bat node deploy.js
deploy-with-env.bat node deploy-script.js

# Deploy Claude Code UI
deploy-claude-ui.bat                    # Direct Appwrite API (may need auth)
run-with-env.bat node deploy-claude-ui.cjs  # Direct Appwrite API (may need auth)
deploy-claude-ui-github.bat            # GitHub Actions deployment (RECOMMENDED)
node deploy-claude-ui-github.cjs       # GitHub Actions deployment

# Test functions
run-with-env.bat node test-function.cjs

# Execute with environment variables
run-with-env.bat [any-command-needing-api-keys]
```

### File & Development Operations
```bash
# File operations (already auto-approved)
cat file.json
ls -la
cd directory

# Git operations (already auto-approved)
git status
git add .
git commit -m "message"
git push

# Build operations (already auto-approved)  
npm install
npm run build
npm test
```

## When I Use These Patterns

1. **Deployment Monitoring**: I use `watch-deployment.bat` to autonomously monitor GitHub Actions
2. **Function Testing**: I use `run-with-env.bat` to test Appwrite functions without approval prompts
3. **Project Deployment**: I use `deploy-with-env.bat` for autonomous deployments
4. **Status Checking**: I use `gh.exe` commands to check deployment status

## Key Benefits

- ✅ **No approval prompts** for these operations
- ✅ **Secure credential handling** via environment variables
- ✅ **Autonomous workflow execution** without user intervention
- ✅ **Consistent command patterns** across all operations