#!/bin/bash
# Environment Management System
# Based on Agent Swarm Infrastructure findings

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
ENV_DIR="$PROJECT_ROOT/.env"
BACKUP_DIR="$PROJECT_ROOT/.env-backups"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
    exit 1
}

info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] INFO: $1${NC}"
}

# Environment Templates
create_environment_templates() {
    mkdir -p "$ENV_DIR/templates"
    
    # Development template
    cat > "$ENV_DIR/templates/.env.development" << 'EOF'
# Development Environment Configuration
NODE_ENV=development
DEBUG=true

# Appwrite Configuration
APPWRITE_ENDPOINT=https://nyc.cloud.appwrite.io/v1
APPWRITE_API_KEY=your_development_api_key_here

# Recursion Chat
RECURSION_CHAT_PROJECT_ID=689bdaf500072795b0f6
RECURSION_CHAT_DATABASE_ID=recursion_chat_db

# Trading Post  
TRADING_POST_PROJECT_ID=689bdee000098bd9d55c
TRADING_POST_DATABASE_ID=trading_post_db

# Slumlord Game
SLUMLORD_PROJECT_ID=68a0db634634a6d0392f
SLUMLORD_DATABASE_ID=slumlord_db

# Archon
ARCHON_PROJECT_ID=68a4e3da0022f3e129d0
ARCHON_DATABASE_ID=archon_db

# Email Service
EMAIL_WORKER_URL=https://email-service.your-subdomain.workers.dev
EMAIL_API_KEY=your_email_api_key_here
DEFAULT_FROM_EMAIL=dev@recursionsystems.com
DEFAULT_FROM_NAME=RecursionSystems Dev

# Security
JWT_SECRET=your_development_jwt_secret_here
ENCRYPTION_KEY=your_development_encryption_key_here

# External Services
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_test_key
STRIPE_SECRET_KEY=sk_test_your_stripe_test_secret
CLOUDFLARE_API_TOKEN=your_cloudflare_token_here
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/your/dev/webhook

# Database URLs (for local development)
DATABASE_URL=sqlite:./dev.db
REDIS_URL=redis://localhost:6379

# CORS Origins
CORS_ORIGINS=http://localhost:3000,http://localhost:3001,http://localhost:8080
EOF

    # Staging template
    cat > "$ENV_DIR/templates/.env.staging" << 'EOF'
# Staging Environment Configuration
NODE_ENV=staging
DEBUG=false

# Appwrite Configuration
APPWRITE_ENDPOINT=https://nyc.cloud.appwrite.io/v1
APPWRITE_API_KEY=your_staging_api_key_here

# Project IDs (same as production)
RECURSION_CHAT_PROJECT_ID=689bdaf500072795b0f6
TRADING_POST_PROJECT_ID=689bdee000098bd9d55c
SLUMLORD_PROJECT_ID=68a0db634634a6d0392f
ARCHON_PROJECT_ID=68a4e3da0022f3e129d0

# Database IDs
RECURSION_CHAT_DATABASE_ID=recursion_chat_staging_db
TRADING_POST_DATABASE_ID=trading_post_staging_db
SLUMLORD_DATABASE_ID=slumlord_staging_db
ARCHON_DATABASE_ID=archon_staging_db

# Email Service
EMAIL_WORKER_URL=https://email-service-staging.your-subdomain.workers.dev
EMAIL_API_KEY=your_staging_email_api_key_here
DEFAULT_FROM_EMAIL=staging@recursionsystems.com
DEFAULT_FROM_NAME=RecursionSystems Staging

# Security
JWT_SECRET=your_staging_jwt_secret_here
ENCRYPTION_KEY=your_staging_encryption_key_here

# External Services
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_test_key
STRIPE_SECRET_KEY=sk_test_your_stripe_test_secret
CLOUDFLARE_API_TOKEN=your_cloudflare_token_here
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/your/staging/webhook

# CORS Origins
CORS_ORIGINS=https://staging-chat.recursionsystems.com,https://staging-tradingpost.appwrite.network
EOF

    # Production template
    cat > "$ENV_DIR/templates/.env.production" << 'EOF'
# Production Environment Configuration
NODE_ENV=production
DEBUG=false

# Appwrite Configuration
APPWRITE_ENDPOINT=https://nyc.cloud.appwrite.io/v1
APPWRITE_API_KEY=your_production_api_key_here

# Project IDs
RECURSION_CHAT_PROJECT_ID=689bdaf500072795b0f6
TRADING_POST_PROJECT_ID=689bdee000098bd9d55c
SLUMLORD_PROJECT_ID=68a0db634634a6d0392f
ARCHON_PROJECT_ID=68a4e3da0022f3e129d0

# Database IDs
RECURSION_CHAT_DATABASE_ID=recursion_chat_db
TRADING_POST_DATABASE_ID=trading_post_db
SLUMLORD_DATABASE_ID=slumlord_db
ARCHON_DATABASE_ID=archon_db

# Email Service
EMAIL_WORKER_URL=https://email-service.your-subdomain.workers.dev
EMAIL_API_KEY=your_production_email_api_key_here
DEFAULT_FROM_EMAIL=noreply@recursionsystems.com
DEFAULT_FROM_NAME=RecursionSystems

# Security (Use strong, unique values in production!)
JWT_SECRET=your_production_jwt_secret_here
ENCRYPTION_KEY=your_production_encryption_key_here

# External Services
STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_live_key
STRIPE_SECRET_KEY=sk_live_your_stripe_live_secret
CLOUDFLARE_API_TOKEN=your_cloudflare_token_here
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/your/production/webhook

# CORS Origins
CORS_ORIGINS=https://chat.recursionsystems.com,https://tradingpost.appwrite.network,https://slumlord.appwrite.network,https://archon.appwrite.network

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Security Headers
SECURITY_HEADERS_ENABLED=true
HSTS_MAX_AGE=31536000
CSP_POLICY=default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net

# Monitoring
MONITORING_ENABLED=true
LOG_LEVEL=info
METRICS_ENABLED=true
HEALTH_CHECK_ENABLED=true
EOF

    log "Environment templates created"
}

# Backup current environment
backup_environment() {
    local env_name="$1"
    local timestamp=$(date +"%Y%m%d_%H%M%S")
    
    mkdir -p "$BACKUP_DIR"
    
    if [ -f "$PROJECT_ROOT/.env.$env_name" ]; then
        cp "$PROJECT_ROOT/.env.$env_name" "$BACKUP_DIR/.env.$env_name.$timestamp"
        log "Backed up .env.$env_name to .env.$env_name.$timestamp"
    fi
    
    if [ -f "$PROJECT_ROOT/.env" ]; then
        cp "$PROJECT_ROOT/.env" "$BACKUP_DIR/.env.$timestamp"
        log "Backed up .env to .env.$timestamp"
    fi
}

# Set environment
set_environment() {
    local env_name="$1"
    local template_file="$ENV_DIR/templates/.env.$env_name"
    
    if [ ! -f "$template_file" ]; then
        error "Template for environment '$env_name' not found at $template_file"
    fi
    
    # Backup current environment
    backup_environment "$env_name"
    
    # Copy template to active environment file
    cp "$template_file" "$PROJECT_ROOT/.env.$env_name"
    
    # Create symlink for .env
    if [ -f "$PROJECT_ROOT/.env" ] || [ -L "$PROJECT_ROOT/.env" ]; then
        rm "$PROJECT_ROOT/.env"
    fi
    
    ln -s ".env.$env_name" "$PROJECT_ROOT/.env"
    
    log "Environment set to '$env_name'"
    info "Active environment file: $PROJECT_ROOT/.env.$env_name"
    info "Symlink created: $PROJECT_ROOT/.env -> .env.$env_name"
}

# Validate environment
validate_environment() {
    local env_file="$1"
    local errors=0
    
    if [ ! -f "$env_file" ]; then
        error "Environment file not found: $env_file"
    fi
    
    log "Validating environment file: $env_file"
    
    # Required variables
    local required_vars=(
        "NODE_ENV"
        "APPWRITE_ENDPOINT"
        "APPWRITE_API_KEY"
        "JWT_SECRET"
        "ENCRYPTION_KEY"
    )
    
    for var in "${required_vars[@]}"; do
        if ! grep -q "^$var=" "$env_file"; then
            error "Missing required variable: $var"
            errors=$((errors + 1))
        elif grep -q "^$var=your_.*_here" "$env_file"; then
            warn "Variable $var still has template value"
            errors=$((errors + 1))
        fi
    done
    
    # Check for sensitive data patterns
    if grep -q "password" "$env_file"; then
        warn "Found 'password' in environment file - ensure it's not in plain text"
    fi
    
    if grep -q "secret.*=" "$env_file" | grep -v "your_.*_here"; then
        info "Found secret variables (this is expected)"
    fi
    
    if [ $errors -eq 0 ]; then
        log "Environment validation passed"
        return 0
    else
        error "Environment validation failed with $errors errors"
        return 1
    fi
}

# Generate secure values
generate_secrets() {
    local env_name="$1"
    local env_file="$PROJECT_ROOT/.env.$env_name"
    
    if [ ! -f "$env_file" ]; then
        error "Environment file not found: $env_file"
    fi
    
    log "Generating secure values for $env_name environment..."
    
    # Generate JWT secret (256-bit)
    local jwt_secret=$(openssl rand -hex 32)
    sed -i "s/your_${env_name}_jwt_secret_here/$jwt_secret/" "$env_file"
    
    # Generate encryption key (256-bit)
    local encryption_key=$(openssl rand -hex 32)
    sed -i "s/your_${env_name}_encryption_key_here/$encryption_key/" "$env_file"
    
    # Generate email API key
    local email_api_key=$(openssl rand -hex 16)
    sed -i "s/your_${env_name}_email_api_key_here/$email_api_key/" "$env_file"
    
    log "Secure values generated and inserted into $env_file"
    warn "Remember to update external service credentials manually!"
}

# Sync environment variables to GitHub Secrets
sync_to_github() {
    local env_name="$1"
    local env_file="$PROJECT_ROOT/.env.$env_name"
    local repo_name="$2"
    
    if [ ! -f "$env_file" ]; then
        error "Environment file not found: $env_file"
    fi
    
    if [ -z "$repo_name" ]; then
        error "Repository name required for GitHub sync"
    fi
    
    log "Syncing $env_name environment to GitHub Secrets..."
    
    # Check if gh CLI is available
    if ! command -v gh &> /dev/null; then
        error "GitHub CLI (gh) is required but not installed"
    fi
    
    # Read and sync each variable
    while IFS='=' read -r key value; do
        # Skip comments and empty lines
        if [[ "$key" =~ ^#.*$ ]] || [[ -z "$key" ]]; then
            continue
        fi
        
        # Remove quotes from value
        value=$(echo "$value" | sed 's/^"//;s/"$//')
        
        # Skip template values
        if [[ "$value" == "your_"*"_here" ]]; then
            warn "Skipping template value for $key"
            continue
        fi
        
        # Set GitHub secret
        echo "$value" | gh secret set "$key" --repo "$repo_name"
        log "Synced $key to GitHub Secrets"
        
    done < <(grep -v '^#' "$env_file" | grep '=')
    
    log "GitHub Secrets sync completed"
}

# List available environments
list_environments() {
    log "Available environments:"
    
    if [ -d "$ENV_DIR/templates" ]; then
        for template in "$ENV_DIR/templates"/.env.*; do
            if [ -f "$template" ]; then
                local env_name=$(basename "$template" | sed 's/^\.env\.//')
                echo "  - $env_name"
                
                # Check if this environment is active
                if [ -L "$PROJECT_ROOT/.env" ]; then
                    local active_env=$(readlink "$PROJECT_ROOT/.env" | sed 's/^\.env\.//')
                    if [ "$active_env" = "$env_name" ]; then
                        echo "    (active)"
                    fi
                fi
            fi
        done
    else
        warn "No environment templates found"
    fi
    
    log "Current active environment:"
    if [ -L "$PROJECT_ROOT/.env" ]; then
        local active_env=$(readlink "$PROJECT_ROOT/.env")
        echo "  Active: $active_env"
    else
        echo "  No active environment set"
    fi
}

# Clean up old backups
cleanup_backups() {
    local days_to_keep="${1:-30}"
    
    log "Cleaning up backups older than $days_to_keep days..."
    
    if [ -d "$BACKUP_DIR" ]; then
        find "$BACKUP_DIR" -name ".env*" -type f -mtime +$days_to_keep -delete
        log "Backup cleanup completed"
    else
        info "No backup directory found"
    fi
}

# Display help
show_help() {
    cat << EOF
Environment Management System

Usage: $0 <command> [arguments]

Commands:
    init                    Create environment templates
    set <environment>       Set active environment (development, staging, production)
    validate [env_file]     Validate environment file (defaults to current .env)
    generate <environment>  Generate secure values for environment
    sync <environment> <repo> Sync environment variables to GitHub Secrets
    list                    List available environments
    backup [environment]    Backup environment files
    cleanup [days]          Clean up old backups (default: 30 days)
    help                    Show this help message

Examples:
    $0 init                                 # Create environment templates
    $0 set development                      # Switch to development environment  
    $0 validate                             # Validate current environment
    $0 generate production                  # Generate secrets for production
    $0 sync production owner/repo           # Sync production vars to GitHub
    $0 list                                 # List all environments
    $0 cleanup 7                            # Clean backups older than 7 days

Environment Files:
    Templates: $ENV_DIR/templates/.env.*
    Active: $PROJECT_ROOT/.env -> .env.*
    Backups: $BACKUP_DIR/

EOF
}

# Main command dispatcher
main() {
    case "${1:-help}" in
        init)
            create_environment_templates
            ;;
        set)
            if [ -z "$2" ]; then
                error "Environment name required"
            fi
            set_environment "$2"
            ;;
        validate)
            local env_file="${2:-$PROJECT_ROOT/.env}"
            validate_environment "$env_file"
            ;;
        generate)
            if [ -z "$2" ]; then
                error "Environment name required"
            fi
            generate_secrets "$2"
            ;;
        sync)
            if [ -z "$2" ] || [ -z "$3" ]; then
                error "Environment name and repository required"
            fi
            sync_to_github "$2" "$3"
            ;;
        list)
            list_environments
            ;;
        backup)
            backup_environment "${2:-current}"
            ;;
        cleanup)
            cleanup_backups "${2:-30}"
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            error "Unknown command: $1. Use 'help' for usage information."
            ;;
    esac
}

# Run main function
main "$@"