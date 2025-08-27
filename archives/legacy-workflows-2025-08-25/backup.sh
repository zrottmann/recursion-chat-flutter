#!/bin/bash

# Database backup script
DB_HOST="db"
DB_PORT="5432"
DB_NAME="tradingpost"
DB_USER="tradingpost"
BACKUP_DIR="/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/tradingpost_backup_$TIMESTAMP.sql.gz"

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

# Perform backup
echo "Starting backup at $(date)"
pg_dump -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME | gzip > $BACKUP_FILE

if [ $? -eq 0 ]; then
    echo "Backup completed successfully: $BACKUP_FILE"
    
    # Keep only last 7 days of backups
    find $BACKUP_DIR -name "tradingpost_backup_*.sql.gz" -mtime +7 -delete
    echo "Old backups cleaned up"
else
    echo "Backup failed at $(date)"
    exit 1
fi

# Optional: Upload to S3 or other cloud storage
# aws s3 cp $BACKUP_FILE s3://your-backup-bucket/