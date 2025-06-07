#!/bin/bash
set -e

# Configuration
BACKUP_FILE=$1
BACKUP_DIR="./backups"

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

# Check if backup file is provided
if [ -z "$BACKUP_FILE" ]; then
    print_error "Usage: $0 "
    print_status "Available backups:"
    ls -la "$BACKUP_DIR"/*.tar.gz 2>/dev/null || echo "No backups found"
    exit 1
fi

# Check if backup file exists
if [ ! -f "$BACKUP_FILE" ]; then
    print_error "Backup file $BACKUP_FILE not found!"
    exit 1
fi

print_warning "This will restore the database and files from backup."
print_warning "All current data will be replaced!"
read -p "Are you sure you want to continue? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_status "Restore cancelled."
    exit 0
fi

# Create temporary directory for extraction
TEMP_DIR=$(mktemp -d)
print_status "Extracting backup to temporary directory: $TEMP_DIR"

tar -xzf "$BACKUP_FILE" -C "$TEMP_DIR"

# Find SQL backup file
SQL_FILE=$(find "$TEMP_DIR" -name "*.sql" | head -1)
if [ -z "$SQL_FILE" ]; then
    print_error "No SQL backup file found in archive!"
    rm -rf "$TEMP_DIR"
    exit 1
fi

# Stop application services
print_status "Stopping application services..."
docker-compose down || true

# Restore database
print_status "Restoring database..."
PGPASSWORD="$DB_PASSWORD" psql \
    -h "$DB_HOST" \
    -p "$DB_PORT" \
    -U "$DB_USER" \
    -d "$DB_NAME" \
    -f "$SQL_FILE"

if [ $? -eq 0 ]; then
    print_status "Database restored successfully!"
else
    print_error "Database restore failed!"
    rm -rf "$TEMP_DIR"
    exit 1
fi

# Restore uploads directory if exists
if [ -d "$TEMP_DIR/uploads" ]; then
    print_status "Restoring uploads directory..."
    cp -r "$TEMP_DIR/uploads" ./
fi

# Restore logs directory if exists
if [ -d "$TEMP_DIR/logs" ]; then
    print_status "Restoring logs directory..."
    cp -r "$TEMP_DIR/logs" ./
fi

# Restore environment file if exists
if [ -f "$TEMP_DIR/.env" ]; then
    print_warning "Environment file found in backup. Review and update as needed."
    cp "$TEMP_DIR/.env" "./.env.backup"
fi

# Cleanup
rm -rf "$TEMP_DIR"

# Restart services
print_status "Starting application services..."
docker-compose up -d

print_status "Restore completed successfully! 🎉"
print_warning "Please review your environment configuration and restart services if needed."