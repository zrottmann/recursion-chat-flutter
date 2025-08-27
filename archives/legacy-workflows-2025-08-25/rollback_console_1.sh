#!/bin/bash
# Console Functionality Rollback
# CRITICAL: Emergency rollback for console issues

set -e

echo "🚨 EXECUTING CONSOLE ROLLBACK"
echo "🛡️ Restoring console functionality..."

# Find most recent backup
BACKUP_DIR=$(ls -dt super-console-backup-* | head -n1)

if [ -z "$BACKUP_DIR" ]; then
  echo "❌ No backup found - CRITICAL ERROR"
  exit 1
fi

echo "🔄 Rolling back to: $BACKUP_DIR"

# Stop current processes
pkill -f "next" || true

# Restore from backup
rm -rf super-console
mv "$BACKUP_DIR" super-console

# Start console
cd super-console
npm start &

echo "⏰ Waiting for console to start..."
sleep 10

# Validate rollback
echo "🔍 Validating console after rollback..."
node ../console-functionality-validator.js

echo "✅ Console rollback completed"
echo "🛡️ Console functionality restored"
