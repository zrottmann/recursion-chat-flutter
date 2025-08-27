#!/bin/bash
# Deployment Automation Script
# Based on Agent Swarm Infrastructure & Deployment findings

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
DEPLOY_DIR="$PROJECT_ROOT/.deployments"
LOG_DIR="$PROJECT_ROOT/logs"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Logging
log() {
    local message="$1"
    local timestamp=$(date +'%Y-%m-%d %H:%M:%S')
    echo -e "${GREEN}[$timestamp] $message${NC}"
    echo "[$timestamp] $message" >> "$LOG_DIR/deployment.log"
}

warn() {
    local message="$1"
    local timestamp=$(date +'%Y-%m-%d %H:%M:%S')
    echo -e "${YELLOW}[$timestamp] WARNING: $message${NC}"
    echo "[$timestamp] WARNING: $message" >> "$LOG_DIR/deployment.log"
}

error() {
    local message="$1"
    local timestamp=$(date +'%Y-%m-%d %H:%M:%S')
    echo -e "${RED}[$timestamp] ERROR: $message${NC}"
    echo "[$timestamp] ERROR: $message" >> "$LOG_DIR/deployment.log"
    exit 1
}

info() {
    local message="$1"
    local timestamp=$(date +'%Y-%m-%d %H:%M:%S')
    echo -e "${BLUE}[$timestamp] INFO: $message${NC}"
    echo "[$timestamp] INFO: $message" >> "$LOG_DIR/deployment.log"
}

success() {
    local message="$1"
    local timestamp=$(date +'%Y-%m-%d %H:%M:%S')
    echo -e "${CYAN}[$timestamp] ✅ $message${NC}"
    echo "[$timestamp] SUCCESS: $message" >> "$LOG_DIR/deployment.log"
}

# Project configurations
declare -A PROJECTS
PROJECTS[recursion-chat]="recursion-chat|689cb6a9003b47a75929|689bdaf500072795b0f6|client"
PROJECTS[trading-post]="trading-post|689cb415001a367e69f8|689bdee000098bd9d55c|trading-app-frontend"  
PROJECTS[slumlord]="slumlord|slumlord|68a0db634634a6d0392f|web"
PROJECTS[archon]="archon|archon|68a4e3da0022f3e129d0|frontend"

# Initialize deployment environment
init_deployment() {
    mkdir -p "$DEPLOY_DIR" "$LOG_DIR"
    
    # Create deployment config
    cat > "$DEPLOY_DIR/config.json" << 'EOF'
{
  "deployment": {
    "timeout": 600,
    "retry_attempts": 3,
    "retry_delay": 30,
    "health_check_timeout": 120,
    "rollback_on_failure": true
  },
  "notification": {
    "slack_enabled": true,
    "email_enabled": true
  },
  "monitoring": {
    "enabled": true,
    "post_deploy_checks": true
  }
}
EOF

    success "Deployment environment initialized"
}

# Pre-deployment checks
pre_deployment_checks() {
    local project="$1"
    
    log "Running pre-deployment checks for $project..."
    
    # Check if project directory exists
    local project_dir="$PROJECT_ROOT/active-projects/$project"
    if [ ! -d "$project_dir" ]; then
        error "Project directory not found: $project_dir"
    fi
    
    # Check environment variables
    if [ -z "$APPWRITE_API_KEY" ]; then
        error "APPWRITE_API_KEY environment variable is required"
    fi
    
    # Check if project has package.json
    local build_dir=""
    IFS='|' read -r proj_name site_id project_id build_dir <<< "${PROJECTS[$project]}"
    
    local package_json="$project_dir/$build_dir/package.json"
    if [ -f "$package_json" ]; then
        info "Found package.json in $build_dir/"
        
        # Check if build script exists
        if ! grep -q '"build"' "$package_json"; then
            warn "No build script found in package.json"
        fi
    fi
    
    # Check git status
    cd "$PROJECT_ROOT"
    if ! git diff --quiet; then
        warn "Working directory has uncommitted changes"
    fi
    
    # Check disk space
    local disk_usage=$(df "$PROJECT_ROOT" | awk 'NR==2 {print $5}' | sed 's/%//')
    if [ "$disk_usage" -gt 90 ]; then
        error "Disk usage is above 90% ($disk_usage%)"
    fi
    
    success "Pre-deployment checks passed for $project"
}

# Build project
build_project() {
    local project="$1"
    local project_dir="$PROJECT_ROOT/active-projects/$project"
    
    IFS='|' read -r proj_name site_id project_id build_dir <<< "${PROJECTS[$project]}"
    local build_path="$project_dir/$build_dir"
    
    log "Building project: $project"
    
    cd "$build_path"
    
    # Check if node_modules exists
    if [ ! -d "node_modules" ]; then
        info "Installing dependencies..."
        npm install --legacy-peer-deps
    fi
    
    # Run build
    if grep -q '"build"' package.json; then
        info "Running build script..."
        npm run build
        
        # Verify build output exists
        if [ -d "dist" ]; then
            info "Build output found in dist/"
        elif [ -d "build" ]; then
            info "Build output found in build/"
        elif [ -d ".next" ]; then
            info "Build output found in .next/"
        else
            error "Build output directory not found"
        fi
    else
        warn "No build script found, skipping build"
    fi
    
    success "Project built successfully: $project"
}

# Create deployment archive
create_deployment_archive() {
    local project="$1"
    local project_dir="$PROJECT_ROOT/active-projects/$project"
    
    IFS='|' read -r proj_name site_id project_id build_dir <<< "${PROJECTS[$project]}"
    local build_path="$project_dir/$build_dir"
    
    log "Creating deployment archive for $project..."
    
    cd "$build_path"
    
    local timestamp=$(date +"%Y%m%d_%H%M%S")
    local archive_name="${project}_${timestamp}.tar.gz"
    local archive_path="$DEPLOY_DIR/$archive_name"
    
    # Determine what to archive
    local archive_source=""
    if [ -d "dist" ]; then
        archive_source="dist"
    elif [ -d "build" ]; then
        archive_source="build"
    elif [ -d ".next" ]; then
        archive_source=".next"
    else
        # Archive entire project if no specific build directory
        archive_source="."
    fi
    
    # Create archive
    tar -czf "$archive_path" -C "$archive_source" .
    
    local archive_size=$(du -sh "$archive_path" | cut -f1)
    info "Archive created: $archive_name ($archive_size)"
    
    # Store archive path for deployment
    echo "$archive_path" > "$DEPLOY_DIR/${project}_latest_archive.txt"
    
    success "Deployment archive created: $archive_path"
}

# Deploy to Appwrite Sites
deploy_to_appwrite() {
    local project="$1"
    
    IFS='|' read -r proj_name site_id project_id build_dir <<< "${PROJECTS[$project]}"
    
    log "Deploying $project to Appwrite Sites..."
    
    local archive_path=$(cat "$DEPLOY_DIR/${project}_latest_archive.txt")
    
    if [ ! -f "$archive_path" ]; then
        error "Archive not found: $archive_path"
    fi
    
    # Deploy using Node.js script
    cat > "$DEPLOY_DIR/deploy_${project}.cjs" << EOF
const https = require('https');
const fs = require('fs');
const FormData = require('form-data');

const projectId = '${project_id}';
const siteId = '${site_id}';
const apiKey = process.env.APPWRITE_API_KEY;
const archivePath = '${archive_path}';

console.log('Starting deployment...');
console.log('Project ID:', projectId);
console.log('Site ID:', siteId);
console.log('Archive:', archivePath);

const form = new FormData();
form.append('entrypoint', 'index.html');
form.append('code', fs.createReadStream(archivePath));
form.append('activate', 'true');

const options = {
  hostname: 'nyc.cloud.appwrite.io',
  path: \`/v1/functions/\${siteId}/deployments\`,
  method: 'POST',
  headers: {
    'X-Appwrite-Project': projectId,
    'X-Appwrite-Key': apiKey,
    ...form.getHeaders()
  }
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    if (res.statusCode === 201 || res.statusCode === 200) {
      console.log('✅ Deployment successful!');
      const response = JSON.parse(data);
      console.log('Deployment ID:', response.\$id);
      console.log('Status:', response.status);
      process.exit(0);
    } else {
      console.error('❌ Deployment failed:', res.statusCode);
      console.error('Response:', data);
      process.exit(1);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Request failed:', error.message);
  process.exit(1);
});

form.pipe(req);

// Timeout handling
setTimeout(() => {
  console.error('❌ Deployment timed out after 10 minutes');
  process.exit(1);
}, 600000);
EOF
    
    # Execute deployment
    cd "$DEPLOY_DIR"
    if command -v node &> /dev/null; then
        node "deploy_${project}.cjs"
    else
        error "Node.js is required for deployment"
    fi
    
    success "Successfully deployed $project to Appwrite Sites"
}

# Health check
health_check() {
    local project="$1"
    local url=""
    
    case "$project" in
        "recursion-chat")
            url="https://chat.recursionsystems.com"
            ;;
        "trading-post")
            url="https://tradingpost.appwrite.network"
            ;;
        "slumlord")
            url="https://slumlord.appwrite.network"
            ;;
        "archon")
            url="https://archon.appwrite.network"
            ;;
        *)
            warn "No health check URL defined for $project"
            return 0
            ;;
    esac
    
    log "Performing health check for $project..."
    info "Checking URL: $url"
    
    local max_attempts=12
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        info "Health check attempt $attempt/$max_attempts"
        
        if curl -s -f -o /dev/null -w "%{http_code}" "$url" | grep -q "200"; then
            success "Health check passed for $project"
            return 0
        fi
        
        info "Health check failed, waiting 10 seconds..."
        sleep 10
        attempt=$((attempt + 1))
    done
    
    error "Health check failed for $project after $max_attempts attempts"
}

# Send notification
send_notification() {
    local project="$1"
    local status="$2"
    local message="$3"
    
    local emoji="🚀"
    local color="good"
    
    if [ "$status" = "failed" ]; then
        emoji="❌"
        color="danger"
    elif [ "$status" = "warning" ]; then
        emoji="⚠️"
        color="warning"
    fi
    
    # Slack notification
    if [ -n "$SLACK_WEBHOOK_URL" ]; then
        local payload="{
            \"text\": \"$emoji Deployment $status: $project\",
            \"attachments\": [{
                \"color\": \"$color\",
                \"text\": \"$message\",
                \"footer\": \"Deployment Automation\",
                \"ts\": $(date +%s)
            }]
        }"
        
        curl -s -X POST -H 'Content-type: application/json' \
            --data "$payload" "$SLACK_WEBHOOK_URL" > /dev/null
    fi
    
    info "Notification sent: $project - $status"
}

# Rollback deployment
rollback_deployment() {
    local project="$1"
    
    warn "Rollback functionality not yet implemented"
    warn "Manual intervention required for project: $project"
    
    # TODO: Implement rollback logic
    # - Get previous deployment ID from Appwrite
    # - Activate previous deployment
    # - Verify rollback success
}

# Full deployment pipeline
deploy_project() {
    local project="$1"
    local start_time=$(date +%s)
    
    log "🚀 Starting deployment pipeline for $project"
    
    # Validate project
    if [ -z "${PROJECTS[$project]}" ]; then
        error "Unknown project: $project"
    fi
    
    local deploy_success=true
    
    {
        # Run deployment steps
        pre_deployment_checks "$project"
        build_project "$project"
        create_deployment_archive "$project"
        deploy_to_appwrite "$project"
        sleep 30  # Wait for deployment to propagate
        health_check "$project"
        
    } || {
        deploy_success=false
        error "Deployment failed for $project"
    }
    
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    local duration_formatted=$(date -u -d @"$duration" +'%M:%S')
    
    if [ "$deploy_success" = true ]; then
        success "✅ Deployment completed successfully for $project (Duration: $duration_formatted)"
        send_notification "$project" "success" "Deployment completed in $duration_formatted"
    else
        error "❌ Deployment failed for $project (Duration: $duration_formatted)"
        send_notification "$project" "failed" "Deployment failed after $duration_formatted"
        
        # Attempt rollback if configured
        if grep -q '"rollback_on_failure": true' "$DEPLOY_DIR/config.json"; then
            rollback_deployment "$project"
        fi
        
        exit 1
    fi
}

# Deploy all projects
deploy_all() {
    log "🚀 Starting deployment for all projects"
    
    local failed_projects=()
    
    for project in "${!PROJECTS[@]}"; do
        log "📦 Deploying project: $project"
        
        if deploy_project "$project"; then
            success "✅ $project deployed successfully"
        else
            error "❌ $project deployment failed"
            failed_projects+=("$project")
        fi
        
        # Wait between deployments to avoid rate limiting
        if [ ${#failed_projects[@]} -eq 0 ]; then
            sleep 60
        fi
    done
    
    # Summary
    local total_projects=${#PROJECTS[@]}
    local failed_count=${#failed_projects[@]}
    local success_count=$((total_projects - failed_count))
    
    log "📊 Deployment Summary:"
    log "  Total projects: $total_projects"
    log "  Successful: $success_count"
    log "  Failed: $failed_count"
    
    if [ $failed_count -gt 0 ]; then
        log "❌ Failed projects:"
        for project in "${failed_projects[@]}"; do
            log "    - $project"
        done
        exit 1
    else
        success "🎉 All projects deployed successfully!"
    fi
}

# Show deployment status
show_status() {
    log "📊 Deployment Status"
    
    for project in "${!PROJECTS[@]}"; do
        IFS='|' read -r proj_name site_id project_id build_dir <<< "${PROJECTS[$project]}"
        
        local url=""
        case "$project" in
            "recursion-chat") url="https://chat.recursionsystems.com" ;;
            "trading-post") url="https://tradingpost.appwrite.network" ;;
            "slumlord") url="https://slumlord.appwrite.network" ;;
            "archon") url="https://archon.appwrite.network" ;;
        esac
        
        echo "  $project:"
        echo "    Project ID: $project_id"
        echo "    Site ID: $site_id"
        echo "    URL: $url"
        
        if [ -n "$url" ]; then
            local status_code=$(curl -s -o /dev/null -w "%{http_code}" "$url" || echo "000")
            if [ "$status_code" = "200" ]; then
                echo -e "    Status: ${GREEN}✅ Online${NC}"
            else
                echo -e "    Status: ${RED}❌ Offline (HTTP $status_code)${NC}"
            fi
        fi
        echo ""
    done
}

# Display help
show_help() {
    cat << EOF
Deployment Automation Script

Usage: $0 <command> [arguments]

Commands:
    init                    Initialize deployment environment
    deploy <project>        Deploy a specific project
    deploy-all             Deploy all projects
    status                 Show deployment status
    build <project>        Build a project without deploying
    health-check <project> Perform health check on deployed project
    help                   Show this help message

Available Projects:
EOF
    for project in "${!PROJECTS[@]}"; do
        echo "    - $project"
    done
    cat << EOF

Examples:
    $0 init                    # Initialize deployment environment
    $0 deploy recursion-chat   # Deploy recursion-chat project
    $0 deploy-all             # Deploy all projects
    $0 status                 # Check status of all deployments
    $0 build trading-post     # Build trading-post without deploying

Environment Variables:
    APPWRITE_API_KEY         # Required: Appwrite API key
    SLACK_WEBHOOK_URL        # Optional: Slack notifications

Log Files:
    $LOG_DIR/deployment.log

EOF
}

# Main command dispatcher
main() {
    # Ensure log directory exists
    mkdir -p "$LOG_DIR"
    
    case "${1:-help}" in
        init)
            init_deployment
            ;;
        deploy)
            if [ -z "$2" ]; then
                error "Project name required"
            fi
            deploy_project "$2"
            ;;
        deploy-all)
            deploy_all
            ;;
        build)
            if [ -z "$2" ]; then
                error "Project name required"
            fi
            pre_deployment_checks "$2"
            build_project "$2"
            ;;
        health-check)
            if [ -z "$2" ]; then
                error "Project name required"
            fi
            health_check "$2"
            ;;
        status)
            show_status
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