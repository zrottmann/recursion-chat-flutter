# Ultimate UserPromptSubmit Hook for Claude Code

A powerful, self-documenting prompt enhancement system for Claude Code that automatically applies engineering standards and provides 18 different development modes through simple flags.

> 🎩 **Hat tip to McKay** on X/Twitter for inspiring this project with his excellent ultrathink hook. This implementation builds on that foundation to create a comprehensive development assistant.

## What This Does

This hook transforms your Claude Code experience by:

- **Automatically applying engineering standards** for substantial work (no shortcuts, production-ready code)
- **Adding context** like current date and git branch to every prompt
- **Providing 18 different flags** for specialized development modes
- **Self-documenting** with the `-hh` flag - never forget what's available
- **Logging all interactions** for analysis and improvement

## Why I Built This

After seeing McKay's ultrathink hook, I wanted to create something that would:

1. Enforce my personal coding standards automatically
2. Provide quick access to different thinking modes
3. Help Claude understand when to search for recent information (by including current date)
4. Be completely self-documenting so I never have to look up flags

## Quick Start

### 1. Clone this repository

```bash
git clone https://github.com/veteranbv/claude-UserPromptSubmit-hook.git
cd claude-UserPromptSubmit-hook
```

### 2. Install the hook

```bash
# Create the hooks directory
mkdir -p ~/.claude/hooks/UserPromptSubmit

# Copy the hook file
cp hooks/UserPromptSubmit/ultimate-prompt-hook.py ~/.claude/hooks/UserPromptSubmit/

# Make it executable
chmod +x ~/.claude/hooks/UserPromptSubmit/ultimate-prompt-hook.py
```

### 3. Configure Claude Code

If you don't have an existing `settings.json`:

```bash
cp settings.json ~/.claude/settings.json
```

If you already have a `~/.claude/settings.json`, you'll need to merge the hooks configuration. Add this to your existing file:

```json
{
  "hooks": {
    "UserPromptSubmit": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "python3 ~/.claude/hooks/UserPromptSubmit/ultimate-prompt-hook.py"
          }
        ]
      }
    ]
  }
}
```

**Note:** If you already have other hooks configured, you'll need to add this to your existing `UserPromptSubmit` array.

### 4. Test it

```bash
# See all available flags
claude -p "-hh"

# Use ultrathink for a complex problem
claude -p "design a distributed system -u"
```

## Available Flags

### 🧠 Thinking Modes

- `-u`, `-ultrathink` - Maximum thinking budget (31,999 tokens) - McKay's famous flag
- `-th`, `-think_hard` - Enhanced thinking for challenging tasks
- `-t`, `-think` - Standard step-by-step thinking

### 🏗️ Quality & Standards

- `-e`, `-eng`, `-standards` - Explicitly apply engineering standards
- `-clean` - Follow clean code principles (SOLID, DRY, meaningful names)

### 💻 Development Modes

- `-p`, `-plan` - Create detailed plan before implementation
- `-v`, `-verbose` - Include verbose explanations and detailed comments
- `-s`, `-sec`, `-security` - Focus on security best practices
- `-test` - Include comprehensive unit tests
- `-doc` - Provide detailed documentation with examples
- `-perf` - Optimize for performance with benchmarks
- `-review` - Critical code review mode
- `-refactor` - Refactor for clarity and maintainability
- `-debug` - Systematic debugging approach
- `-api` - API design best practices

### 🔧 Other Options

- `-ng`, `-no_guess` - Never guess; ask for clarification instead
- `-ctx`, `-context` - Include detailed project context (package managers, tools)
- `-hh`, `-hhelp` - Show comprehensive help message

## Key Features

### 1. Automatic Engineering Standards

The hook automatically applies engineering standards for any substantial work. This means:

- No shortcuts, stubs, or hardcoded values
- Production-ready code from the start
- Clean, robust implementations
- Simplicity through understanding, not guesswork

Standards are NOT applied for:

- Simple queries (ls, show, list, etc.)
- Questions or greetings
- When you explicitly use the `-e` flag

### 2. Context Injection

Every prompt automatically includes:

- **Current date** - Helps Claude recognize when to search for recent information
- **Git branch** (if in a git repo) - Provides feature context
- **Project context** (with `-ctx` flag) - Detects package managers and tools

### 3. Self-Documenting

Run `claude -p "-hh"` anytime to see a beautifully formatted guide with:

- All available flags organized by category
- Common flag combinations
- Usage examples
- No need to reference external documentation

### 4. Comprehensive Logging

All prompts and applied flags are logged to `~/.claude/logs/prompt_hooks.jsonl` for:

- Analyzing your usage patterns
- Debugging issues
- Understanding which flags work best for different tasks

## Usage Examples

### Basic Usage

```bash
# Simple queries work normally
claude -p "list files in this directory"

# Get help anytime
claude -p "-hh"

# Or ask a question with help
claude -p "what's the best way to structure a React app? -hh"
```

### Thinking Modes

```bash
# Maximum thinking for complex problems (McKay's ultrathink)
claude -p "design a distributed caching system -u"

# Standard thinking for moderate problems
claude -p "implement binary search -t"

# Planning complex features
claude -p "build a real-time chat system -p -u"
```

### Development Tasks

```bash
# Full feature implementation
claude -p "implement user authentication -test -doc"

# Security-focused review
claude -p "review this payment processing code -review -s -u"

# Performance optimization
claude -p "optimize this data processing pipeline -perf -u"

# Clean refactoring
claude -p "refactor this legacy module -refactor -clean"
```

### Advanced Combinations

```bash
# Maximum analysis with security focus
claude -p "analyze authentication system -u -s -review"

# Debug with context and verbose output
claude -p "why are dependencies failing? -debug -ctx -v"

# API design with documentation
claude -p "design REST API for inventory -api -doc -p"

# Production-ready feature with everything
claude -p "implement payment processing -u -test -doc -s"
```

## How It Works

1. **Intercepts your prompt** before it reaches Claude
2. **Parses flags** from the end of your prompt
3. **Injects appropriate context** based on flags and prompt content
4. **Logs the interaction** for analysis
5. **Passes enhanced prompt** to Claude

## Configuration

### Environment Variables

- `USER` - Used in logging to identify the engineer (defaults to "Engineer")

### Customization

Edit the hook file to:

- Add your own custom flags
- Modify engineering standards
- Change logging behavior
- Add project-specific context

## Troubleshooting

### Hook not working?

1. Check the hook is executable:

   ```bash
   chmod +x ~/.claude/hooks/UserPromptSubmit/ultimate-prompt-hook.py
   ```

2. Verify Python 3 is available:

   ```bash
   python3 --version
   ```

3. Check Claude Code loads the settings:

   ```bash
   claude --debug
   ```

### Logs not appearing?

1. Ensure the logs directory exists:

   ```bash
   mkdir -p ~/.claude/logs
   ```

2. Check permissions:

   ```bash
   ls -la ~/.claude/logs
   ```

## Contributing

Feel free to fork and customize! Some ideas:

- Add your own custom flags
- Modify the engineering standards
- Add team-specific context
- Create specialized handlers for your workflow

## Credits

- **McKay** - For the original ultrathink hook that inspired this project
- **Claude Code Community** - For sharing ideas and best practices

## License

MIT - Use freely and customize to your needs!

---

*Built with ❤️ for the Claude Code community. May your code be clean and your thinking be ultra.*
