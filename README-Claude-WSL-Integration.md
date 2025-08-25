# Claude WSL Integration

A comprehensive solution that enables seamless integration between Windows Claude CLI and WSL bash environment, allowing Windows Claude to execute bash commands directly through WSL while maintaining full compatibility.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [Troubleshooting](#troubleshooting)
- [Advanced Features](#advanced-features)
- [Security Considerations](#security-considerations)
- [Uninstallation](#uninstallation)
- [Contributing](#contributing)

## Overview

This solution bridges the gap between Windows and WSL environments for Claude CLI usage, providing:

- **Seamless bash execution**: Windows Claude CLI automatically detects bash commands and executes them in WSL
- **Path conversion**: Automatic conversion between Windows and WSL file paths
- **Environment preservation**: Maintains environment variables and working directory context
- **Fallback support**: Graceful fallback to Windows execution when WSL is unavailable
- **Debug capabilities**: Comprehensive logging and debugging features

### Key Benefits

- Use a single Claude CLI command that works optimally in both environments
- Execute complex bash scripts and pipelines from Windows Claude
- Access Linux-specific tools and utilities seamlessly
- Maintain consistent development workflow across Windows and WSL
- No need to manually switch between environments

## Architecture

```
Windows Claude CLI Command
         ↓
  claude-wsl-wrapper.js (Detection & Routing)
         ↓
    ┌─────────────────┐
    ↓                 ↓
WSL Environment    Windows Environment
(bash commands)    (Windows commands)
    ↓                 ↓
  Results merged and returned
```

### Components

1. **claude-wsl-wrapper.js**: Main Node.js wrapper that intercepts Claude CLI calls
2. **claude-wsl.cmd**: Windows batch file that replaces the original Claude CLI command
3. **Configuration system**: JSON-based configuration for customization
4. **Installation scripts**: Automated setup and management tools

## Prerequisites

### Required Software

- **Windows 10/11** with WSL2 enabled
- **WSL Distribution** (Ubuntu, Debian, etc.) installed and configured
- **Node.js** (version 14 or higher) installed on Windows
- **Claude CLI** installed on both Windows and WSL

### Verification Commands

```powershell
# Check WSL status
wsl --status

# Check Node.js
node --version

# Check Claude CLI (Windows)
claude --version

# Check Claude CLI (WSL)
wsl -e claude --version
```

### Installing Prerequisites

#### Install WSL2

```powershell
# Enable WSL feature
dism.exe /online /enable-feature /featurename:Microsoft-Windows-Subsystem-for-Linux /all /norestart

# Enable Virtual Machine Platform
dism.exe /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart

# Restart and install WSL2
wsl --install
```

#### Install Claude CLI in WSL

```bash
# In your WSL terminal
npm install -g @anthropic-ai/claude-code
```

## Installation

### Automatic Installation (Recommended)

1. **Download the integration files** to a directory (e.g., `C:\Claude-WSL-Integration\`)

2. **Run the PowerShell installer as Administrator**:

```powershell
# Open PowerShell as Administrator
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
.\install-claude-wsl-integration.ps1
```

3. **Optional parameters**:

```powershell
# Install with debug mode enabled
.\install-claude-wsl-integration.ps1 -Debug

# Specify WSL distribution
.\install-claude-wsl-integration.ps1 -WSLDistribution "Ubuntu-20.04"

# Force overwrite existing backups
.\install-claude-wsl-integration.ps1 -Force
```

### Manual Installation

If you prefer manual installation:

1. **Create wrapper directory**:
```powershell
mkdir "$env:USERPROFILE\.claude-wsl"
```

2. **Copy wrapper files**:
```powershell
copy claude-wsl-wrapper.js "$env:USERPROFILE\.claude-wsl\"
copy claude-wsl.cmd "$env:USERPROFILE\.claude-wsl\"
copy claude-wsl-config.json "$env:USERPROFILE\.claude-wsl\"
```

3. **Backup original Claude CLI**:
```powershell
copy "$env:APPDATA\npm\claude.cmd" "$env:APPDATA\npm\claude.cmd.original-backup"
```

4. **Replace with wrapper**:
```powershell
copy "$env:USERPROFILE\.claude-wsl\claude-wsl.cmd" "$env:APPDATA\npm\claude.cmd"
```

### Verification

Test the installation:

```cmd
# This should work and show version
claude --version

# Test bash detection (should use WSL)
claude -p "List files using ls command"

# Enable debug mode to see routing decisions
set CLAUDE_WSL_DEBUG=1
claude --version
```

## Configuration

The integration uses `claude-wsl-config.json` for customization:

### WSL Configuration

```json
{
  "wsl": {
    "distribution": "Ubuntu",
    "claudePath": "/usr/local/bin/claude",
    "shellPath": "/bin/bash",
    "timeout": 300000
  }
}
```

### Detection Patterns

Customize when WSL is used:

```json
{
  "detection": {
    "bashIndicators": [
      "^bash\\b",
      "^sh\\b", 
      "&&",
      "\\|\\|"
    ],
    "forceWSLTools": ["Bash", "bash", "shell"],
    "forceWindowsTools": ["powershell", "cmd"]
  }
}
```

### Path Mapping

Configure automatic path conversion:

```json
{
  "pathMapping": {
    "enabled": true,
    "windowsToWSL": {
      "C:\\\\": "/mnt/c/",
      "D:\\\\": "/mnt/d/"
    }
  }
}
```

## Usage

Once installed, use Claude CLI normally. The wrapper automatically detects and routes commands:

### Basic Usage

```cmd
# Regular Claude CLI commands (uses Windows)
claude --help
claude config list

# Bash-related commands (automatically uses WSL)
claude -p "Use bash to find all Python files"
claude -p "Run a shell script to deploy my app"
```

### Explicit Control

You can force specific behavior:

```cmd
# Force WSL usage
claude --allowedTools Bash -p "Your prompt"

# Debug mode to see routing decisions
set CLAUDE_WSL_DEBUG=1
claude -p "Your prompt"
```

### Advanced Examples

```cmd
# Complex bash operations (automatically uses WSL)
claude -p "Use grep and awk to analyze log files, then create a summary report"

# File operations across both environments
claude -p "List Windows files and then run a bash script to process them"

# Development workflows
claude -p "Run git commands to check status, then use bash to run tests"
```

## Troubleshooting

### Common Issues

#### 1. WSL Not Detected

**Symptoms**: All commands run in Windows even when bash is expected

**Solutions**:
- Verify WSL is installed: `wsl --status`
- Check WSL distribution name in config
- Ensure Claude CLI is installed in WSL

#### 2. Path Conversion Issues

**Symptoms**: File paths not found when switching between environments

**Solutions**:
- Enable path mapping in configuration
- Use absolute paths when possible
- Check path mapping rules in config

#### 3. Permission Errors

**Symptoms**: Commands fail with permission errors

**Solutions**:
- Run PowerShell as Administrator for installation
- Check file permissions in WSL
- Verify Claude CLI permissions in both environments

#### 4. Performance Issues

**Symptoms**: Slow command execution

**Solutions**:
- Disable unnecessary detection patterns
- Enable caching in configuration
- Use WSL2 instead of WSL1

### Debug Mode

Enable comprehensive debugging:

```cmd
set CLAUDE_WSL_DEBUG=1
claude -p "Your command"
```

This shows:
- Routing decisions
- Path conversions
- Command execution details
- Error messages

### Log Files

Check log files for detailed information:

- Windows: `%USERPROFILE%\.claude-wsl\claude-wsl.log`
- WSL: Check WSL terminal output

## Advanced Features

### Smart Detection

The wrapper includes intelligent detection for:

- Bash command patterns
- Shell operators (`&&`, `||`, `;`)
- Command substitution (`` `command` ``, `$(command)`)
- Environment variables usage

### Environment Variable Handling

```cmd
# Set variables for both environments
set CLAUDE_WSL_DEBUG=1
set CUSTOM_VAR=value

# Variables are automatically passed to WSL
claude -p "Use environment variables in bash"
```

### Cross-Platform Piping

The wrapper supports piping between Windows and WSL commands:

```cmd
# This works seamlessly
claude -p "Use Windows dir command, then pipe to WSL grep"
```

### Configuration Profiles

Create different configurations for different scenarios:

```powershell
# Development profile
.\install-claude-wsl-integration.ps1 -Config dev-config.json

# Production profile  
.\install-claude-wsl-integration.ps1 -Config prod-config.json
```

## Security Considerations

### Command Filtering

The wrapper includes security features:

- **Allowed commands**: Whitelist of safe commands
- **Blocked commands**: Blacklist of dangerous operations
- **Confirmation prompts**: For potentially destructive commands

### Path Restrictions

- Automatic path validation
- Prevention of directory traversal attacks
- Sandbox mode for testing

### Audit Logging

All command executions are logged for security auditing:

```json
{
  "logging": {
    "level": "info",
    "file": "%USERPROFILE%\\.claude-wsl\\audit.log",
    "includeCommands": true,
    "includePaths": true
  }
}
```

## Uninstallation

### Automatic Uninstallation

```powershell
.\install-claude-wsl-integration.ps1 -Uninstall
```

### Manual Uninstallation

1. **Restore original Claude CLI**:
```powershell
copy "$env:APPDATA\npm\claude.cmd.original-backup" "$env:APPDATA\npm\claude.cmd"
```

2. **Remove wrapper files**:
```powershell
rmdir /s "$env:USERPROFILE\.claude-wsl"
```

3. **Clean environment variables**:
```powershell
[Environment]::SetEnvironmentVariable("CLAUDE_WSL_DEBUG", $null, "User")
```

### Verification

Confirm uninstallation:

```cmd
claude --version
# Should show original Claude CLI behavior
```

## Contributing

### Development Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Run tests: `npm test`
4. Build: `npm run build`

### Testing

The project includes comprehensive tests:

```powershell
# Unit tests
npm run test:unit

# Integration tests
npm run test:integration

# End-to-end tests
npm run test:e2e
```

### Code Style

Follow the established patterns:
- Use JSDoc comments for functions
- Include error handling for all operations
- Add debug logging for troubleshooting
- Write comprehensive tests

### Reporting Issues

When reporting issues, include:

- Operating system version
- WSL distribution and version
- Node.js version
- Claude CLI versions (Windows and WSL)
- Debug output if available
- Steps to reproduce

## License

This project is provided as-is for educational and development purposes. Please ensure compliance with Anthropic's terms of service when using Claude CLI.

## Support

For support and questions:

1. Check this README for common issues
2. Enable debug mode for detailed logging
3. Review configuration settings
4. Check log files for errors

## Changelog

### Version 1.0.0

- Initial release
- Basic WSL integration
- Automatic path conversion  
- Configuration system
- Installation scripts
- Debug capabilities
- Security features

---

**Note**: This integration enhances Claude CLI functionality but does not modify Claude's core behavior or capabilities. All Claude API interactions remain unchanged.