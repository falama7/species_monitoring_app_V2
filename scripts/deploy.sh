#!/bin/bash
set -e

echo "🚀 Starting deployment..."

# Configuration
ENVIRONMENT=${1:-production}
BACKUP_DIR="./backups"
COMPOSE_FILE="deployment/docker/docker-compose.${ENVIRONMENT}.yml"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if environment file exists
if [ ! -f "$COMPOSE_FILE" ]; then
    print_error "Compose file $COMPOSE_FILE not found!"
    exit 1
fi

# Check if environment variables are set
if [ ! -f ".env" ]; then
    print_warning ".env file not found. Make sure to configure environment variables."
fi

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Backup database if in production
if [ "$ENVIRONMENT" = "production" ]; then
    print_status "Creating database backup..."
    ./scripts/backup.sh
fi

# Pull latest images
print_status "Pulling latest Docker images..."
docker-compose -f "$COMPOSE_FILE" pull

# Build custom images
print_status "Building application images..."
docker-compose -f "$COMPOSE_FILE" build

# Stop existing services
print_status "Stopping existing services..."
docker-compose -f "$COMPOSE_FILE" down

# Start services
print_status "Starting services..."
docker-compose -f "$COMPOSE_FILE" up -d

# Wait for services to be healthy
print_status "Waiting for services to be ready..."
sleep 30

# Check service health
print_status "Checking service health..."
if docker-compose -f "$COMPOSE_FILE" ps | grep -q "unhealthy"; then
    print_error "Some services are unhealthy!"
    docker-compose -f "$COMPOSE_FILE" ps
    exit 1
fi

# Run database migrations
print_status "Running database migrations..."
docker-compose -f "$COMPOSE_FILE" exec -T backend flask db upgrade

# Clean up old images
print_status "Cleaning up old Docker images..."
docker image prune -f

print_status "Deployment completed successfully! 🎉"

# Show service status
docker-compose -f "$COMPOSE_FILE" ps