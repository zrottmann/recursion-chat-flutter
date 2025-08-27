#!/usr/bin/env python3
"""
Ultimate UserPromptSubmit Hook for Claude Code
Combines the best practices from the Claude Code community

Features:
- McKay's ultrathink flag (-u) for maximum thinking
- Engineering standards auto-applied for substantial work
- 18 different flags for various development modes
- Self-documenting with -h flag
- Comprehensive logging to ~/.claude/logs/
- Type hints for better IDE support

Note: Pylance may show false positives for static method references in flag_mapping
"""

import json
import os
import re
import subprocess
import sys
from datetime import datetime
from pathlib import Path
from typing import Any, Callable, Dict, List, Optional, Tuple

# Configuration
ENABLE_LOGGING = True
LOG_DIR = Path.home() / ".claude" / "logs"
ENGINEER_NAME = os.environ.get("USER", "Engineer")


class PromptEnhancer:
    def __init__(self) -> None:
        self.contexts: List[str] = []
        self.log_data: Dict[str, Any] = {
            "timestamp": datetime.now().isoformat(),
            "formatted_date": datetime.now()
            .strftime("%B {}, %Y")
            .format(datetime.now().day),
        }

    def add_context(self, context: str) -> None:
        """Add context that will be injected into the prompt"""
        if context and context.strip():
            self.contexts.append(context.strip())

    def log_event(self, key: str, value: Any) -> None:
        """Add data to be logged"""
        self.log_data[key] = value


class FlagHandlers:
    """All available flag handlers with their context injections"""

    @staticmethod
    def ultrathink() -> str:
        """McKay's ultrathink flag - maximum thinking budget"""
        return "\n\nUse the maximum amount of ultrathink. Take all the time you need. It's much better if you do too much research and thinking than not enough."

    @staticmethod
    def engineering_standards() -> str:
        """Your excellent engineering standards"""
        return """

Follow the project's principal engineering standards. No shortcuts, stubs, or hardcoded values. We build it right the first time: clean, robust, and production ready. No halfway measures.

Keep it tight. Use the simplest solution that meets the need with high quality. Do not overengineer. Do not create new files, layers, or abstractions unless they are clearly necessary. Every line of code should earn its place. Simplicity is earned through understanding, not guesswork.

Make it clean. Make it count.

If you encounter uncertainty, lack context, or are not confident in the solution, stop. Do not guess or make things up. It is not only okay, it is expected, to ask for clarification or help. Excellence includes knowing when to pause."""

    @staticmethod
    def think_hard() -> str:
        """Enhanced thinking mode"""
        return "\n\nThink hard about this problem. Consider multiple approaches and evaluate trade-offs before implementing."

    @staticmethod
    def think() -> str:
        """Standard thinking mode"""
        return "\n\nThink step by step through this problem before implementing."

    @staticmethod
    def plan() -> str:
        """Planning mode"""
        return "\n\nCreate a detailed plan before starting implementation. Break down the task into clear steps and identify potential challenges."

    @staticmethod
    def verbose() -> str:
        """Verbose explanations"""
        return "\n\nBe verbose in your explanations. Include detailed comments explaining the why behind decisions, not just the what."

    @staticmethod
    def security() -> str:
        """Security focus"""
        return "\n\nFocus on security best practices. Consider potential vulnerabilities, input validation, authentication, and data protection."

    @staticmethod
    def test() -> str:
        """Testing focus"""
        return "\n\nInclude comprehensive unit tests for all functionality. Follow TDD principles where appropriate. Tests should be clear, focused, and cover edge cases."

    @staticmethod
    def doc() -> str:
        """Documentation focus"""
        return "\n\nProvide detailed documentation with examples. Include docstrings, type hints, and usage examples. Documentation should be clear to someone unfamiliar with the codebase."

    @staticmethod
    def perf() -> str:
        """Performance focus"""
        return "\n\nOptimize for performance. Consider algorithmic complexity, memory usage, and potential bottlenecks. Include benchmarks where relevant."

    @staticmethod
    def review() -> str:
        """Code review mode"""
        return "\n\nReview this code critically. Look for bugs, code smells, performance issues, security vulnerabilities, and suggest improvements. Be thorough but constructive."

    @staticmethod
    def refactor() -> str:
        """Refactoring mode"""
        return "\n\nRefactor for clarity and maintainability. Improve naming, reduce complexity, eliminate duplication, and enhance readability without changing functionality."

    @staticmethod
    def debug() -> str:
        """Debug mode"""
        return "\n\nDebug systematically. Add logging, check assumptions, trace execution flow, and identify the root cause before proposing fixes."

    @staticmethod
    def api() -> str:
        """API design focus"""
        return "\n\nFollow REST/GraphQL best practices. Design clear, consistent, and well-documented APIs. Consider versioning, error handling, and client developer experience."

    @staticmethod
    def clean() -> str:
        """Clean code principles"""
        return "\n\nApply clean code principles: meaningful names, small functions, single responsibility, DRY, and SOLID principles. Code should be self-documenting."

    @staticmethod
    def no_guess() -> str:
        """No guessing mode"""
        return "\n\nDo not guess or make assumptions. If something is unclear or you lack necessary context, stop and ask for clarification. It's better to ask than to implement incorrectly."

    @staticmethod
    def context() -> str:
        """Add detailed project context"""
        contexts = []

        # Python ecosystem
        python_files = [
            "pyproject.toml",
            "setup.py",
            "requirements.txt",
            "environment.yml",
        ]
        python_tools = {
            "uv.lock": "uv",
            "poetry.lock": "Poetry",
            "Pipfile.lock": "Pipenv",
            ".venv": "venv",
            "conda-meta": "Conda",
        }

        found_python = any(Path(f).exists() for f in python_files)
        if found_python:
            tools = [tool for file, tool in python_tools.items() if Path(file).exists()]
            if tools:
                contexts.append(f"Python ({', '.join(tools)})")
            else:
                contexts.append("Python")

        # Node.js ecosystem
        if Path("package.json").exists():
            if Path("yarn.lock").exists():
                contexts.append("Node.js (Yarn)")
            elif Path("pnpm-lock.yaml").exists():
                contexts.append("Node.js (pnpm)")
            elif Path("bun.lockb").exists():
                contexts.append("Node.js (Bun)")
            else:
                contexts.append("Node.js (npm)")

        # Other ecosystems
        ecosystems = {
            "Cargo.toml": "Rust",
            "go.mod": "Go",
            "pom.xml": "Java (Maven)",
            "build.gradle": "Java (Gradle)",
            "Gemfile": "Ruby",
            "composer.json": "PHP",
            "mix.exs": "Elixir",
            "project.clj": "Clojure",
        }

        for file, ecosystem in ecosystems.items():
            if Path(file).exists():
                contexts.append(ecosystem)

        if contexts:
            return f"\n\n[Project Context: {', '.join(contexts)}]"
        return ""

    @staticmethod
    def compression() -> str:
        """Enable token compression mode"""
        return "\n\nUse compressed communication to reduce token usage. Apply technical abbreviations (cfg->configuration, impl->implementation, perf->performance) and symbols (-> leads to, checkmark completed, warning triangle warning, shield security, lightning performance). Compress redundant phrases while maintaining information quality."

    @staticmethod
    def ultra_compressed() -> str:
        """Maximum compression mode"""
        return "\n\nActivate maximum token compression. Use symbol-enhanced communication: -> (leads to), => (transforms), & (and), | (or), checkmark (done), X (failed), circle (progress), lightning (perf), shield (sec), box (deploy). Abbreviate: cfg, impl, arch, perf, env, req, deps, val, docs, auth. Remove redundancy, compress whitespace, maintain meaning."

    @staticmethod
    def help() -> str:
        """Request help documentation"""
        return """

The user has just asked for help understanding the UserPromptSubmit hooks. Please display the following help message:
Here are all available UserPromptSubmit hook flags:

🧠 THINKING MODES
- -u, -ultrathink    Maximum thinking budget (31,999 tokens) for complex problems
- -th, -think_hard   Enhanced thinking for challenging tasks
- -t, -think         Step-by-step thinking for standard problems

🏗️ QUALITY & STANDARDS
- -e, -eng, -standards    Apply engineering standards (no shortcuts, production-ready)
- -clean                  Follow clean code principles (SOLID, DRY, meaningful names)

💻 DEVELOPMENT MODES
- -p, -plan          Create detailed plan before implementation
- -v, -verbose       Include verbose explanations and detailed comments
- -s, -sec, -security    Focus on security best practices
- -test              Include comprehensive unit tests
- -doc               Provide detailed documentation with examples
- -perf              Optimize for performance with benchmarks
- -review            Critical code review mode
- -refactor          Refactor for clarity and maintainability
- -debug             Systematic debugging approach
- -api               API design best practices

🗜️ COMPRESSION MODES
- -c, -compress      Enable token compression with abbreviations and symbols
- -uc, -ultracompressed  Maximum compression mode (30-50% token reduction)

🔧 OTHER OPTIONS
- -ng, -no_guess     Never guess; ask for clarification instead
- -ctx, -context     Include project context (package managers, tools)
- -hh, -hhelp        Show this help message

💡 COMMON COMBINATIONS
Complex problem:     -u -p        (ultrathink + plan)
Production feature:  -e -test -doc (standards + tests + docs)
Code review:        -review -u    (review + deep thinking)
Quick fix:          (no flags - skips engineering standards)
Debug issue:        -debug -v -u  (debug + verbose + ultrathink)
Token optimization: -uc -p        (ultra compressed + plan)
Efficient analysis: -c -th        (compressed + think hard)

Note: Engineering standards (-e) are auto-applied for substantial work unless you're asking simple questions."""


class ContextInjectors:
    """Context injectors that add project information"""

    @staticmethod
    def get_git_info() -> str:
        """Get current git branch and status"""
        try:
            branch = (
                subprocess.check_output(
                    ["git", "branch", "--show-current"], stderr=subprocess.DEVNULL
                )
                .decode()
                .strip()
            )
            if branch:
                return f"\n[Git Branch: {branch}]"
        except (subprocess.CalledProcessError, FileNotFoundError, OSError):
            pass
        return ""

    @staticmethod
    def get_current_date() -> str:
        """Add current date context to help Claude recognize when to search for updates"""
        # Format: "August 4, 2025" - helps Claude recognize time gap from Jan 2025 cutoff
        return f"\n[Current Date: {datetime.now().strftime('%B {}, %Y').format(datetime.now().day)}]"


def parse_flags(prompt: str) -> Tuple[str, List[str]]:
    """Parse flags from the end of the prompt"""
    # Pattern matches flags at the end: -flag1 -flag2
    # Made more flexible to handle flags at start or with no preceding space
    flags_pattern = r"((?:^|\s+)-[a-zA-Z_]+)+$"
    match = re.search(flags_pattern, prompt)

    if match:
        flags_str = match.group(0)
        clean_prompt = prompt[: match.start()].rstrip()
        flags = re.findall(r"-([a-zA-Z_]+)", flags_str)
        return clean_prompt, flags

    return prompt, []


def get_flag_handler(flag: str) -> Optional[Callable[[], str]]:
    """Get the appropriate handler for a flag"""
    flag_mapping = {
        # Thinking modes
        "u": FlagHandlers.ultrathink,
        "ultrathink": FlagHandlers.ultrathink,
        "th": FlagHandlers.think_hard,
        "think_hard": FlagHandlers.think_hard,
        "t": FlagHandlers.think,
        "think": FlagHandlers.think,
        # Quality modes
        "e": FlagHandlers.engineering_standards,
        "eng": FlagHandlers.engineering_standards,
        "standards": FlagHandlers.engineering_standards,
        "clean": FlagHandlers.clean,
        # Development modes
        "p": FlagHandlers.plan,
        "plan": FlagHandlers.plan,
        "v": FlagHandlers.verbose,
        "verbose": FlagHandlers.verbose,
        "s": FlagHandlers.security,
        "sec": FlagHandlers.security,
        "test": FlagHandlers.test,
        "doc": FlagHandlers.doc,
        "perf": FlagHandlers.perf,
        "review": FlagHandlers.review,
        "refactor": FlagHandlers.refactor,
        "debug": FlagHandlers.debug,
        "api": FlagHandlers.api,
        "no_guess": FlagHandlers.no_guess,
        "ng": FlagHandlers.no_guess,
        # Context
        "ctx": FlagHandlers.context,
        "context": FlagHandlers.context,
        # Compression
        "c": FlagHandlers.compression,
        "compress": FlagHandlers.compression,
        "uc": FlagHandlers.ultra_compressed,
        "ultracompressed": FlagHandlers.ultra_compressed,
        # Help
        "hh": FlagHandlers.help,
        "hhelp": FlagHandlers.help,
    }

    return flag_mapping.get(flag.lower())


def should_apply_defaults(prompt: str, flags: List[str]) -> bool:
    """Determine if default contexts should be applied"""
    # Skip defaults for simple queries
    skip_patterns = [
        r"^(ls|dir|pwd|cd|cat|grep|find|which|what|where|who|when|how much|how many)\b",
        r"^(show|list|display|get|fetch)\s+(me\s+)?(the\s+)?",
        r"^\?",  # Questions starting with ?
        r"^(hi|hello|hey|thanks|thank you|bye)",  # Greetings
    ]

    prompt_lower = prompt.lower()
    for pattern in skip_patterns:
        if re.match(pattern, prompt_lower):
            return False

    # Apply defaults for substantial work
    return True


def write_log(enhancer: PromptEnhancer) -> None:
    """Write log entry if logging is enabled"""
    if not ENABLE_LOGGING:
        return

    try:
        LOG_DIR.mkdir(parents=True, exist_ok=True)
        log_file = LOG_DIR / "prompt_hooks.jsonl"

        with open(log_file, "a") as f:
            json.dump(enhancer.log_data, f)
            f.write("\n")
    except (IOError, OSError, PermissionError):
        pass  # Silently fail logging


def main() -> None:
    try:
        # Read input
        input_data = json.load(sys.stdin)
        prompt: str = input_data.get("prompt", "")
        session_id: str = input_data.get("session_id", "unknown")

        # Initialize enhancer
        enhancer = PromptEnhancer()
        enhancer.log_event("original_prompt", prompt)
        enhancer.log_event("session_id", session_id)

        # Parse flags
        clean_prompt, flags = parse_flags(prompt)
        enhancer.log_event("flags", flags)
        enhancer.log_event("clean_prompt", clean_prompt)

        # Special handling for help flag alone
        if clean_prompt.strip() == "" and ("hh" in flags or "hhelp" in flags):
            # If only -h flag, make it clear this is a help request
            clean_prompt = "Show available hook flags"
            enhancer.log_event("help_request", True)

        # Add minimal but useful context injections
        enhancer.add_context(ContextInjectors.get_current_date())
        git_info: str = ContextInjectors.get_git_info()
        if git_info:
            enhancer.add_context(git_info)

        # Apply default engineering standards if appropriate
        # Skip defaults if asking for help or for simple queries
        if "hh" not in flags and "hhelp" not in flags:
            if (
                should_apply_defaults(clean_prompt, flags)
                and "e" not in flags
                and "eng" not in flags
            ):
                # Auto-apply engineering standards for substantial work
                enhancer.add_context(FlagHandlers.engineering_standards())
                enhancer.log_event("auto_applied_standards", True)

        # Process explicit flags
        applied_flags: List[str] = []
        for flag in flags:
            handler = get_flag_handler(flag)
            if handler:
                enhancer.add_context(handler())
                applied_flags.append(flag)

        enhancer.log_event("applied_flags", applied_flags)

        # Output combined context
        if enhancer.contexts:
            output: str = "\n".join(enhancer.contexts)
            print(output)
            enhancer.log_event("injected_context", output)

        # Write log
        write_log(enhancer)

        # Exit successfully
        sys.exit(0)

    except Exception as e:
        # Log error but don't block execution
        print(f"[Hook Error: {str(e)}]", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
