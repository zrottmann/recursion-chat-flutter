# Claude Auto-Approval Permission System

## Location
All permission files are now in: `C:\Users\Zrott\OneDrive\Desktop\Claude\`

## Files

### 1. `auto_approve_commands.sh`
Bash script with extensive auto-approval patterns for safe commands.

### 2. `claude_auto_approve.json`  
JSON configuration with 150+ auto-approved command patterns including:
- File operations (cp, mv, mkdir, ls, cat, etc.)
- Text processing (grep, sed, awk, etc.)
- Development tools (git, npm, docker, etc.)
- Build tools (webpack, vite, make, etc.)
- File editing (vim, nano, code, edit *.cs, etc.)

### 3. `claude_command_filter.py`
Python implementation that reads the JSON config and auto-approves commands.

### 4. `secure_permissions.sh`
Interactive permission manager with logging.

### 5. `secure_wrapper.py`
Python wrapper for controlled command execution.

## Usage

From Claude folder:
```bash
cd /mnt/c/Users/Zrott/OneDrive/Desktop/Claude

# Run bash auto-approver
./auto_approve_commands.sh

# Run Python filter
python3 claude_command_filter.py

# Run secure permission manager
./secure_permissions.sh
```

## Auto-Approved Commands

The system automatically approves:
- ✅ All `cp` commands (copy files)
- ✅ File editing: `edit *.cs`, `vim`, `nano`, `code`
- ✅ Unity paths: `Assets/Scripts/*.cs`
- ✅ Git operations
- ✅ NPM/Yarn/PNPM commands
- ✅ Docker operations
- ✅ Build tools (make, cmake, gradle, etc.)
- ✅ Testing frameworks
- ✅ File browsing (ls, cat, grep, find)

## Still Requires Confirmation

- ❌ `rm -rf` (recursive deletion)
- ❌ `sudo` commands
- ❌ System file modifications
- ❌ Service management (systemctl)
- ❌ Firewall changes
- ❌ Disk formatting

## Logs

Commands are logged to:
- `~/command_approval.log` (bash script)
- `~/claude_commands.log` (Python script)
- `~/.security_logs/` (secure wrapper)