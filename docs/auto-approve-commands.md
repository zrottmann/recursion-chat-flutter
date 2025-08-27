# Auto-Approval Command Patterns

## Commands That Need Auto-Approval Configuration

### 1. GitHub CLI (gh.exe) Commands
These patterns should be added to auto-approval:
```
./gh.exe run watch:*
./gh.exe run list:*
./gh.exe run view:*
./gh.exe workflow:*
./gh.exe repo:*
./gh.exe issue:*
./gh.exe pr:*
```

### 2. Solution for API Key Commands

Instead of:
```bash
APPWRITE_API_KEY="standard_..." node -e "script"
```

Use environment variables (already set via set-env.bat):
```bash
node -e "script that uses process.env.APPWRITE_API_KEY"
```

### 3. Solution for Complex Scripts

Instead of inline scripts:
```bash
node -e "long multi-line script"
```

Create script files:
```bash
node deploy-script.js
```

## Immediate Workarounds

### For gh.exe commands:
When prompted, select option 2: "Yes, and don't ask again for similar commands"
This will add the pattern to your local auto-approval list.

### For API key commands:
Use the environment variables we set up:
```bash
# Already set via set-env.bat:
# APPWRITE_API_KEY=standard_...
# XAI_API_KEY=xai-...

# Then use without inline keys:
cd "path" && node deploy.js
```

### For complex scripts:
Save them as .js files instead of inline execution.