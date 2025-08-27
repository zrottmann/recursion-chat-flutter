#!/usr/bin/env node

/**
 * Claude Code Auto-Approval Tool
 * Automatically approves safe bash commands to speed up development workflow
 */

const fs = require('fs');
const path = require('path');

class ClaudeAutoApprover {
  constructor() {
    this.safeCommands = [
      // File operations
      'ls', 'dir', 'cat', 'head', 'tail', 'find', 'tree', 'pwd', 'cd',
      'mkdir', 'cp', 'copy', 'mv', 'move', 'rm', 'del', 'touch', 'wc',
      'sort', 'uniq', 'diff', 'patch', 'sed', 'awk', 'cut', 'paste', 'tr',
      'test', 'basename', 'dirname', 'realpath', 'readlink',
      
      // Git operations
      'git status', 'git log', 'git diff', 'git branch', 'git checkout',
      'git add', 'git commit', 'git push', 'git pull', 'git fetch',
      'git merge', 'git rebase', 'git stash', 'git clone', 'git init',
      'git remote', 'git tag', 'git show', 'git blame', 'git reset',
      'git clean', 'git config', 'git submodule', 'git worktree',
      'gh', 'github', 'gitlab', 'circleci',
      
      // Node.js/npm/package managers
      'npm install', 'npm run', 'npm start', 'npm test', 'npm run build',
      'npm run lint', 'npm run lint:fix', 'npm run dev', 'npm run format',
      'npm ci', 'npm audit', 'npm outdated', 'npm update', 'npm view',
      'npm list', 'npm search', 'npm info', 'npm pack', 'npm publish',
      'npx', 'yarn', 'pnpm', 'bun',
      'node', 'nvm', 'volta', 'fnm',
      
      // Python & Data Science
      'python', 'python3', 'py', 'pip install', 'pip3 install', 'pip install -U',
      'pip list', 'pip show', 'pip freeze', 'pip check', 'pip search',
      'venv\\Scripts\\python.exe', './venv/Scripts/python.exe',
      'conda', 'mamba', 'pipenv', 'poetry', 'pyenv', 'virtualenv',
      'jupyter', 'mlflow',
      
      // Build tools & frameworks
      'flutter', 'dart', 'pub', 'gradle', 'gradlew', './gradlew',
      'make', 'cmake', 'msbuild', 'dotnet', 'cargo', 'rustc', 'rustup',
      'go', 'gofmt', 'go build', 'go run', 'go test', 'go mod',
      'mvn', 'ant', 'sbt', 'lein',
      
      // Web development
      'vite', 'webpack', 'parcel', 'rollup', 'esbuild', 'swc',
      'tsc', 'babel', 'eslint', 'prettier', 'stylelint',
      'serve', 'live-server', 'http-server',
      
      // Testing
      'jest', 'mocha', 'vitest', 'cypress', 'playwright', 'puppeteer',
      'pytest', 'unittest', 'nose2', 'tox',
      'rspec', 'minitest', 'cucumber',
      'cargo test', 'go test', 'dotnet test',
      
      // Development tools
      'code', 'vim', 'nano', 'emacs', 'subl', 'atom',
      'explorer', 'start', 'open', 'xdg-open',
      'curl', 'wget', 'ping', 'telnet', 'nc', 'netcat',
      'echo', 'printf', 'set', 'export', 'unset', 'env', 'printenv',
      'sleep', 'wait', 'timeout',
      
      // Process management
      'ps', 'top', 'htop', 'tasklist', 'kill', 'taskkill', 'pkill',
      'killall', 'pgrep', 'pidof', 'jobs', 'bg', 'fg', 'nohup',
      
      // System info & monitoring
      'whoami', 'hostname', 'date', 'time', 'uptime', 'uname',
      'which', 'where', 'type', 'command', 'alias',
      'df', 'df -h', 'du', 'free', 'lscpu', 'lsblk', 'lsusb', 'lspci',
      'systemctl', 'service', 'journalctl', 'dmesg', 'htop',
      
      // Network tools
      'nslookup', 'dig', 'host', 'traceroute', 'tracert',
      'netstat', 'ss', 'lsof', 'iftop', 'nmap',
      'ipconfig', 'ifconfig', 'ip', 'route',
      'curl', 'wget', 'ping',
      
      // Archive/compression
      'zip', 'unzip', 'tar', 'gzip', 'gunzip', '7z', 'rar', 'unrar',
      'bzip2', 'bunzip2', 'xz', 'unxz',
      
      // File transfer
      'rsync', 'scp', 'sftp', 'ftp', 'ssh',
      
      // Database tools
      'mysql', 'psql', 'sqlite3', 'mongosh', 'redis-cli',
      'influx', 'elasticsearch',
      
      // Cloud CLI tools
      'appwrite', 'doctl', 'aws', 'gcloud', 'az', 'heroku',
      'vercel', 'netlify', 'firebase', 'cloudflare', 'wrangler',
      
      // Container tools
      'docker', 'docker-compose', 'podman', 'kubectl', 'helm',
      'minikube', 'kind', 'skaffold',
      
      // Infrastructure as Code
      'terraform', 'terragrunt', 'ansible', 'vagrant', 'packer',
      'pulumi', 'cdk',
      
      // Mobile development
      'expo', 'eas', 'react-native', 'ionic', 'cordova', 'capacitor',
      'adb', 'fastlane', 'xcodebuild',
      
      // Package managers (system)
      'brew', 'apt', 'apt-get', 'yum', 'dnf', 'pacman', 'zypper',
      'snap', 'flatpak', 'choco', 'winget', 'scoop',
      
      // Static site generators
      'hugo', 'jekyll', 'gatsby', 'next', 'nuxt', 'astro',
      'eleventy', 'hexo', 'gridsome', 'sapper', 'svelte',
      'remix', 'solid', 'qwik',
      
      // Formatters & linters
      'black', 'flake8', 'pylint', 'mypy', 'isort', 'autopep8',
      'rubocop', 'standardrb', 'solargraph',
      'rustfmt', 'clippy', 'gofmt', 'golint', 'staticcheck',
      'clang-format', 'clang-tidy',
      
      // Unity & Game Development
      'Unity.exe', 'UnityHub.exe', 'unity', 'godot', 'blender',
      
      // Miscellaneous dev tools
      'jq', 'yq', 'xmllint', 'pandoc', 'imagemagick', 'ffmpeg',
      'rg', 'ag', 'fd', 'bat', 'exa', 'zoxide', 'fzf',
      'tmux', 'screen', 'byobu',
      'strace', 'ltrace', 'gdb', 'lldb', 'valgrind'
    ];

    this.dangerousPatterns = [
      'rm -rf /',
      'del /f /s /q c:\\',
      'format c:',
      'shutdown',
      'reboot',
      'sudo rm',
      'chmod 777',
      'chown root',
      '> /dev/null',
      'dd if=',
      'mkfs'
    ];
  }

  /**
   * Check if a command should be auto-approved
   */
  shouldAutoApprove(command) {
    // Remove quotes and normalize
    const normalizedCommand = command.toLowerCase().trim();
    
    // Check for dangerous patterns first
    for (const pattern of this.dangerousPatterns) {
      if (normalizedCommand.includes(pattern.toLowerCase())) {
        return false;
      }
    }

    // Check if command starts with safe commands
    for (const safeCmd of this.safeCommands) {
      if (normalizedCommand.startsWith(safeCmd.toLowerCase())) {
        return true;
      }
    }

    // Auto-approve commands with safe working directories
    if (this.isInSafeDirectory(command)) {
      return true;
    }

    return false;
  }

  /**
   * Check if command is running in a safe directory
   */
  isInSafeDirectory(command) {
    const safeDirectories = [
      'C:\\Users\\Zrott\\OneDrive\\Desktop\\Claude',
      'active-projects',
      'trading-post',
      'recursion-chat',
      'SlumLord'
    ];

    for (const dir of safeDirectories) {
      if (command.includes(dir)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Log approval decisions for debugging
   */
  logDecision(command, approved) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      command: command,
      approved: approved,
      reason: approved ? 'Safe command pattern' : 'Requires manual approval'
    };

    const logPath = path.join(__dirname, 'auto-approve.log');
    fs.appendFileSync(logPath, JSON.stringify(logEntry) + '\n');
  }
}

// Export for use as module
module.exports = ClaudeAutoApprover;

// CLI usage
if (require.main === module) {
  const approver = new ClaudeAutoApprover();
  const command = process.argv[2];
  
  if (!command) {
    console.log('Usage: node auto-approve.js "command to check"');
    process.exit(1);
  }

  const shouldApprove = approver.shouldAutoApprove(command);
  approver.logDecision(command, shouldApprove);
  
  console.log(shouldApprove ? 'APPROVE' : 'MANUAL');
  process.exit(shouldApprove ? 0 : 1);
}