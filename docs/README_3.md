# Environment Configurations

This directory contains complete Appwrite environment configurations for all active projects.

## Configuration Files

| Project | File | Project ID | Live URL |
|---------|------|------------|----------|
| Trading Post | `trading-post.env.complete` | `689bdee000098bd9d55c` | https://tradingpost.appwrite.network |
| Recursion Chat | `recursion-chat.env.complete` | `689bdaf500072795b0f6` | https://chat.recursionsystems.com |
| Chat Network | `chat-appwrite-network.env.complete` | `68a4e3da0022f3e129d0` | https://chat.appwrite.network |
| Slumlord RPG | `slumlord.env.complete` | `689fdf6a00010d7b575f` | https://slumlord.appwrite.network |
| Claude Code Remote | `claude-code-remote.env.complete` | `68a4e3da0022f3e129d0` | https://remote.appwrite.network |
| Archon AI | `archon.env.complete` | `NEEDS_CONFIGURATION` | Not deployed |
| GX Multi-Agent | `gx-multi-agent-platform.env.complete` | `NEEDS_CONFIGURATION` | Not deployed |

## Usage

1. Copy the appropriate `.env.complete` file to your project directory
2. Rename it to `.env`, `.env.production`, or as needed for your framework
3. Replace placeholder values with actual secrets and API keys
4. Never commit actual secrets to version control

## Configuration Status

- ✅ **Configured with API Keys**: Trading Post, Recursion Chat, Chat Network, Slumlord RPG
- ⚠️ **Needs Configuration**: Archon AI, GX Multi-Agent Platform

## Master Template

See `../appwrite-env-template.env` for the complete master template with all possible Appwrite configurations.