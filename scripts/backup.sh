#!/bin/bash
set -e

# Configuration
BACKUP_DIR="./backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DB_BACKUP_FILE="species_monitoring_backup_${TIMESTAMP}.sql"
COMPLETE_BACKUP_FILE="species_monitoring_backup_${TIMESTAMP}_complete.tar.gz"

# Database connection info
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_NAME=${DB_NAME:-species_monitoring}
DB_USER=${DB_USER:-species_user}
DB_PASSWORD=${DB_PASSWORD:-secure_password}

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Create backup directory
mkdir -p "$BACKUP_DIR"

print_status "Starting backup process..."

# Database backup
print_status "Backing up database..."
PGPASSWORD="$DB_PASSWORD" pg_dump \
    -h "$DB_HOST" \
    -p "$DB_PORT" \
    -U "$DB_USER" \
    -d "$DB_NAME" \
    --no-password \
    --verbose \
    --clean \
    --if-exists \
    > "$BACKUP_DIR/$DB_BACKUP_FILE"

if [ $? -eq 0 ]; then
    print_status "Database backup completed: $DB_BACKUP_FILE"
else
    print_error "Database backup failed!"
    exit 1
fi

# Complete system backup (database + uploads + logs)
print_status "Creating complete system backup..."
tar -czf "$BACKUP_DIR/$COMPLETE_BACKUP_FILE" \
    --exclude="backups" \
    --exclude="node_modules" \
    --exclude="venv" \
    --exclude=".git" \
    --exclude="__pycache__" \
    "$BACKUP_DIR/$DB_BACKUP_FILE" \
    uploads/ \
    logs/ \
    .env 2>/dev/null || true

if [ $? -eq 0 ]; then
    print_status "Complete backup created: $COMPLETE_BACKUP_FILE"
    
    # Remove individual database backup as it's included in complete backup
    rm "$BACKUP_DIR/$DB_BACKUP_FILE"
else
    print_error "Complete backup failed!"
    exit 1
fi

# Cleanup old backups (keep last 7 days)
print_status "Cleaning up old backups..."
find "$BACKUP_DIR" -name "species_monitoring_backup_*.tar.gz" -mtime +7 -delete

print_status "Backup process completed successfully! 🎉"
print_status "Backup file: $COMPLETE_BACKUP_FILE"

# Show backup size
BACKUP_SIZE=$(du -h "$BACKUP_DIR/$COMPLETE_BACKUP_FILE" | cut -f1)
print_status "Backup size: $BACKUP_SIZE"