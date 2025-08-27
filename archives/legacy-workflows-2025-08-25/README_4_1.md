# Claude Auto-Approval System

Automatically approves safe bash commands in Claude Code to speed up your development workflow.

## 🚀 Features

- **Smart Command Recognition**: Automatically approves common development commands
- **Safety First**: Blocks dangerous commands that could harm your system
- **Comprehensive Logging**: Tracks all approval decisions for debugging
- **Easy Configuration**: Simple JSON configuration with pattern matching
- **Cross-Platform**: Works on Windows, macOS, and Linux

## ✅ Auto-Approved Commands

The system automatically approves these types of commands:

### File Operations
- `ls`, `dir`, `cat`, `head`, `tail`, `find`, `tree`, `pwd`, `cd`
- `mkdir`, `cp`, `mv`, `rm` (safe patterns only)

### Development Tools
- **Git**: `git status`, `git commit`, `git push`, `git pull`, etc.
- **Node.js**: `npm install`, `npm run *`, `npm start`, `npx *`
- **Python**: `python *.py`, `pip install`, virtual env commands
- **Flutter**: `flutter run`, `flutter build`, `dart *`
- **Build Tools**: `gradle`, `make`, `cmake`, `dotnet`

### Deployment Tools  
- **DigitalOcean**: `doctl apps *`, `doctl auth *`
- **Appwrite**: `appwrite *`
- **System**: `curl`, `wget`, `ping`, `echo`

## 🚫 Blocked Commands

These dangerous patterns are **never** auto-approved:
- `rm -rf /`
- `del /f /s /q c:\`
- `format c:`
- `shutdown`, `reboot`
- `chmod 777`
- `dd if=`

## 📋 Installation

The system is already installed and configured in your Claude setup:

```bash
# Test the auto-approval system
node .claude/auto-approve.js "npm run build"

# Check if a command would be approved
claude-auto-approve "git status"
```

## ⚙️ Configuration

Settings are stored in `.claude/settings.json`:

```json
{
  "permissions": {
    "bash": {
      "auto_approve": true,
      "auto_approve_script": "C:\\Users\\...\\auto-approve.js"
    }
  }
}
```

## 📊 Monitoring

Check the approval log to see what commands are being processed:

```bash
# View recent approvals
type .claude\auto-approve.log
```

Log entries include:
- Timestamp
- Command executed
- Approval decision (true/false)
- Reason for decision

## 🔧 Testing

Run the test suite to verify everything works:

```bash
# Run all tests
node .claude/setup.js

# Test specific command
node .claude/auto-approve.js "your-command-here"
```

## 🛡️ Security

The auto-approval system includes multiple safety layers:

1. **Whitelist Approach**: Only known-safe commands are approved
2. **Blacklist Protection**: Dangerous patterns are explicitly blocked  
3. **Directory Checking**: Commands in safe directories get preference
4. **Comprehensive Logging**: All decisions are logged for audit
5. **Manual Override**: Dangerous commands require manual approval

## 📁 File Structure

```
.claude/
├── auto-approve.js          # Main approval logic (Node.js)
├── auto-approve.ps1         # PowerShell version
├── setup.js                 # Installation script
├── settings.json           # Claude configuration
├── auto-approve.log        # Decision log
├── package.json            # npm package config
└── README.md               # This file
```

## 🎯 Usage Tips

1. **Development Commands**: Most `npm`, `git`, `python` commands auto-approve
2. **Deployment**: `doctl`, `appwrite` commands work automatically  
3. **File Operations**: Basic file/directory operations are safe
4. **System Commands**: Dangerous operations require manual confirmation
5. **Custom Commands**: Add patterns to `auto-approve.js` for your workflow

## 🔍 Troubleshooting

**Commands not auto-approving?**
- Check `.claude/auto-approve.log` for decision reasons
- Verify command matches safe patterns in `auto-approve.js`
- Ensure Claude settings.json has `auto_approve: true`

**Need to add new safe commands?**
- Edit `.claude/auto-approve.js`
- Add patterns to `safeCommands` array
- Test with `node auto-approve.js "your-command"`

## 🚀 Benefits

- **Faster Development**: No manual approval for routine commands
- **Maintained Security**: Dangerous operations still require confirmation
- **Better Workflow**: Focus on coding, not clicking "approve"
- **Audit Trail**: Complete log of all command approvals
- **Customizable**: Easy to extend for your specific needs

---

*This system is designed to speed up your development workflow while maintaining security. All dangerous operations still require manual approval to keep your system safe.*