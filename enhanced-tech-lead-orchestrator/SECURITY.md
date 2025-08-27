# Security Guidelines for Agent Swarm Orchestrator

## 🔒 Environment Variables & Secrets

### Never commit secrets to the repository:
- Use `.env` files for local development (already added to `.gitignore`)
- Use environment variables for production deployment
- Copy `.env.example` to `.env` and fill in your actual values

### Supported Environment Variables:

```bash
# Server Configuration
PORT=8080                    # Server port (default: 8080)
NODE_ENV=production          # Environment mode
LOG_LEVEL=info              # Logging level (debug, info, warn, error)

# Optional External Integrations
OPENAI_API_KEY=sk-...       # OpenAI API key (if using AI features)
GITHUB_TOKEN=ghp_...        # GitHub token (if using GitHub integration)
DATABASE_URL=postgres://... # Database connection (if using database)
```

## 🛡️ Security Best Practices

### 1. Environment Configuration
- Always use environment variables for sensitive data
- Never hardcode API keys, tokens, or credentials in source code
- Use different configurations for development/staging/production

### 2. Network Security
- Default port `8080` with automatic fallback to `8081`, `8083`, `8085`, `8087`
- WebSocket connections should be secured with WSS in production
- Consider using reverse proxy (nginx, cloudflare) for additional security

### 3. Logging Security
- Logs are written to `server.log` - ensure this file has proper permissions
- LOG_LEVEL environment variable controls verbosity
- Never log sensitive information (tokens, passwords, API keys)

### 4. Deployment Security
- Use `.gitignore` to prevent committing sensitive files
- Review all environment variables before deployment
- Use secure secret management in production (AWS Secrets Manager, Azure Key Vault, etc.)

## 🔍 Security Checklist

Before deploying:
- [ ] No hardcoded secrets in source code
- [ ] All sensitive data in environment variables
- [ ] `.env` file not committed to repository
- [ ] Production environment variables configured
- [ ] Logs don't contain sensitive information
- [ ] Network access properly configured
- [ ] Dependencies regularly updated for security patches

## 🚨 If Secrets Are Exposed

If you accidentally commit secrets:
1. **Immediately revoke/rotate** the exposed credentials
2. Remove secrets from git history: `git filter-branch --force --index-filter 'git rm --cached --ignore-unmatch path/to/file' --prune-empty --tag-name-filter cat -- --all`
3. Force push the cleaned history: `git push origin --force --all`
4. Generate new credentials and update environment variables
5. Notify team members to pull the updated repository

## 📞 Reporting Security Issues

If you discover a security vulnerability, please:
1. **Do not** create a public GitHub issue
2. Email security concerns privately to the maintainers
3. Provide detailed information about the vulnerability
4. Allow time for the issue to be addressed before public disclosure