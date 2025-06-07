# Species Monitoring Application - Deployment Guide

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Development Deployment](#development-deployment)
4. [Production Deployment](#production-deployment)
5. [Docker Deployment](#docker-deployment)
6. [Kubernetes Deployment](#kubernetes-deployment)
7. [Configuration](#configuration)
8. [Monitoring](#monitoring)
9. [Backup and Recovery](#backup-and-recovery)
10. [Troubleshooting](#troubleshooting)

## Prerequisites

### System Requirements

#### Minimum Requirements
- **CPU**: 2 cores
- **RAM**: 4GB
- **Storage**: 20GB free space
- **Network**: Stable internet connection

#### Recommended Requirements
- **CPU**: 4+ cores
- **RAM**: 8GB+
- **Storage**: 50GB+ SSD
- **Network**: High-speed internet

### Software Dependencies

#### Required Software
- **Docker**: 20.10+
- **Docker Compose**: 2.0+
- **Git**: 2.30+

#### For Development
- **Python**: 3.9+
- **Node.js**: 16+
- **PostgreSQL**: 13+
- **Redis**: 6+

#### For Production
- **nginx**: 1.20+ (reverse proxy)
- **Let's Encrypt**: SSL certificates
- **Monitoring tools**: Prometheus, Grafana

## Environment Setup

### Clone Repository
```bash
git clone https://github.com/your-org/species-monitoring.git
cd species-monitoring
```

### Environment Variables
Create environment configuration:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```bash
# Database Configuration
DATABASE_URL=postgresql://species_user:secure_password@localhost:5432/species_monitoring
POSTGRES_USER=species_user
POSTGRES_PASSWORD=secure_password
POSTGRES_DB=species_monitoring

# Redis Configuration
REDIS_URL=redis://localhost:6379/0

# Security
SECRET_KEY=your-very-secure-secret-key-here
JWT_SECRET_KEY=your-jwt-secret-key-here

# File Upload
UPLOAD_FOLDER=uploads
MAX_CONTENT_LENGTH=16777216

# Email Configuration (Optional)
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password
MAIL_USE_TLS=true

# Environment
FLASK_ENV=production
DEBUG=false
```

## Development Deployment

### Quick Start Script
Use the development startup script:

```bash
chmod +x start-dev.sh
./start-dev.sh
```

This script will:
1. Create `.env` file if it doesn't exist
2. Start PostgreSQL and Redis with Docker
3. Install backend dependencies
4. Start Flask development server
5. Install frontend dependencies
6. Start React development server

### Manual Development Setup

#### Backend Setup
```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Initialize database
flask db upgrade
flask seed-data

# Start development server
flask run --host=0.0.0.0 --port=5000
```

#### Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm start
```

#### Database Setup
```bash
# Start PostgreSQL with Docker
docker run --name species-postgres \
  -e POSTGRES_USER=species_user \
  -e POSTGRES_PASSWORD=secure_password \
  -e POSTGRES_DB=species_monitoring \
  -p 5432:5432 \
  -d postgres:15-alpine

# Start Redis
docker run --name species-redis \
  -p 6379:6379 \
  -d redis:7-alpine
```

## Production Deployment

### SSL Certificate Setup
```bash
# Install Certbot
sudo apt update
sudo apt install certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

### Nginx Configuration
Create `/etc/nginx/sites-available/species-monitoring`:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # SSL Configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    ssl_prefer_server_ciphers off;

    # Static files
    location /static/ {
        alias /var/www/species-monitoring/static/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Frontend
    location / {
        root /var/www/species-monitoring/frontend/build;
        try_files $uri $uri/ /index.html;
    }

    # API
    location /api/ {
        proxy_pass http://localhost:5000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Uploads
    location /uploads/ {
        alias /var/www/species-monitoring/uploads/;
        expires 1y;
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/species-monitoring /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Systemd Services

#### Backend Service
Create `/etc/systemd/system/species-monitoring-backend.service`:

```ini
[Unit]
Description=Species Monitoring Backend
After=network.target postgresql.service redis.service

[Service]
Type=exec
User=www-data
Group=www-data
WorkingDirectory=/var/www/species-monitoring/backend
Environment=PATH=/var/www/species-monitoring/backend/venv/bin
ExecStart=/var/www/species-monitoring/backend/venv/bin/gunicorn --bind 127.0.0.1:5000 --workers 4 --timeout 300 wsgi:app
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

#### Celery Worker Service
Create `/etc/systemd/system/species-monitoring-celery.service`:

```ini
[Unit]
Description=Species Monitoring Celery Worker
After=network.target postgresql.service redis.service

[Service]
Type=exec
User=www-data
Group=www-data
WorkingDirectory=/var/www/species-monitoring/backend
Environment=PATH=/var/www/species-monitoring/backend/venv/bin
ExecStart=/var/www/species-monitoring/backend/venv/bin/celery -A app.celery_app worker --loglevel=info
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable and start services:
```bash
sudo systemctl enable species-monitoring-backend
sudo systemctl enable species-monitoring-celery
sudo systemctl start species-monitoring-backend
sudo systemctl start species-monitoring-celery
```

## Docker Deployment

### Using Docker Compose

#### Development
```bash
docker-compose up -d
```

#### Production
```bash
# Use production compose file
docker-compose -f deployment/docker/docker-compose.prod.yml up -d
```

### Custom Docker Commands

#### Build Images
```bash
# Build backend image
docker build -t species-monitoring/backend:latest ./backend

# Build frontend image
docker build -t species-monitoring/frontend:latest ./frontend
```

#### Run Containers
```bash
# Database
docker run -d --name species-db \
  -e POSTGRES_USER=species_user \
  -e POSTGRES_PASSWORD=secure_password \
  -e POSTGRES_DB=species_monitoring \
  -v species_db_data:/var/lib/postgresql/data \
  -p 5432:5432 \
  postgres:15-alpine

# Redis
docker run -d --name species-redis \
  -v species_redis_data:/data \
  -p 6379:6379 \
  redis:7-alpine

# Backend
docker run -d --name species-backend \
  --link species-db:db \
  --link species-redis:redis \
  -e DATABASE_URL=postgresql://species_user:secure_password@db:5432/species_monitoring \
  -e REDIS_URL=redis://redis:6379/0 \
  -v species_uploads:/app/uploads \
  -p 5000:5000 \
  species-monitoring/backend:latest

# Frontend
docker run -d --name species-frontend \
  --link species-backend:backend \
  -p 3000:80 \
  species-monitoring/frontend:latest
```

## Kubernetes Deployment

### Prerequisites
- Kubernetes cluster (1.20+)
- kubectl configured
- Helm 3+ (optional)

### Create Namespace
```bash
kubectl apply -f deployment/kubernetes/namespace.yaml
```

### Deploy Configuration
```bash
kubectl apply -f deployment/kubernetes/configmap.yaml
```

### Deploy Database
```bash
# Create persistent volume
kubectl apply -f - <<EOF
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: postgres-pvc
  namespace: species-monitoring
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 10Gi
EOF

# Deploy PostgreSQL
kubectl apply -f deployment/kubernetes/deployment.yaml
```

### Deploy Services
```bash
kubectl apply -f - <<EOF
apiVersion: v1
kind: Service
metadata:
  name: postgres-service
  namespace: species-monitoring
spec:
  selector:
    app: postgres
  ports:
    - port: 5432
      targetPort: 5432
---
apiVersion: v1
kind: Service
metadata:
  name: redis-service
  namespace: species-monitoring
spec:
  selector:
    app: redis
  ports:
    - port: 6379
      targetPort: 6379
---
apiVersion: v1
kind: Service
metadata:
  name: backend-service
  namespace: species-monitoring
spec:
  selector:
    app: backend
  ports:
    - port: 5000
      targetPort: 5000
---
apiVersion: v1
kind: Service
metadata:
  name: frontend-service
  namespace: species-monitoring
spec:
  type: LoadBalancer
  selector:
    app: frontend
  ports:
    - port: 80
      targetPort: 80
EOF
```

### Ingress Configuration
```bash
kubectl apply -f - <<EOF
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: species-monitoring-ingress
  namespace: species-monitoring
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
spec:
  tls:
  - hosts:
    - yourdomain.com
    secretName: species-monitoring-tls
  rules:
  - host: yourdomain.com
    http:
      paths:
      - path: /api
        pathType: Prefix
        backend:
          service:
            name: backend-service
            port:
              number: 5000
      - path: /
        pathType: Prefix
        backend:
          service:
            name: frontend-service
            port:
              number: 80
EOF
```

## Configuration

### Environment-Specific Settings

#### Development
```bash
FLASK_ENV=development
DEBUG=true
DATABASE_URL=postgresql://species_user:password@localhost:5432/species_monitoring_dev
```

#### Staging
```bash
FLASK_ENV=staging
DEBUG=false
DATABASE_URL=postgresql://species_user:password@staging-db:5432/species_monitoring_staging
```

#### Production
```bash
FLASK_ENV=production
DEBUG=false
DATABASE_URL=postgresql://species_user:secure_password@prod-db:5432/species_monitoring
```

### Security Configuration

#### SSL/TLS
- Use HTTPS in production
- Strong cipher suites
- HSTS headers
- Certificate pinning

#### Database Security
- Strong passwords
- Connection encryption
- Regular backups
- Access restrictions

#### API Security
- Rate limiting
- JWT token expiration
- CORS configuration
- Input validation

## Monitoring

### Health Checks
```bash
# Application health
curl http://localhost:5000/health

# Database connectivity
curl http://localhost:5000/api/health/db

# Redis connectivity
curl http://localhost:5000/api/health/redis
```

### Logging

#### Application Logs
```bash
# Backend logs
tail -f logs/app.log

# Access logs
tail -f logs/access.log

# Error logs
tail -f logs/error.log
```

#### Docker Logs
```bash
# View container logs
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f db
```

### Metrics and Monitoring

#### Prometheus Configuration
```yaml
# prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'species-monitoring'
    static_configs:
      - targets: ['localhost:5000']
    metrics_path: '/metrics'
```

#### Grafana Dashboards
- Application performance metrics
- Database query performance
- User activity metrics
- System resource usage

## Backup and Recovery

### Database Backup
```bash
# Create backup
./scripts/backup.sh

# Automated daily backups
0 2 * * * /path/to/species-monitoring/scripts/backup.sh
```

### File Backup
```bash
# Backup uploaded files
rsync -av uploads/ backup/uploads/

# Backup configuration
cp .env backup/env-$(date +%Y%m%d)
```

### Recovery Procedures
```bash
# Restore database
./scripts/restore.sh /path/to/backup.tar.gz

# Restore files
rsync -av backup/uploads/ uploads/
```

## Troubleshooting

### Common Issues

#### Application Won't Start
```bash
# Check logs
docker-compose logs backend

# Verify environment variables
docker-compose exec backend env | grep -E 'DATABASE_URL|SECRET_KEY'

# Test database connection
docker-compose exec backend python -c "from app.models import db; print(db.engine.url)"
```

#### Database Connection Issues
```bash
# Check database status
docker-compose exec db pg_isready

# Verify credentials
docker-compose exec db psql -U species_user -d species_monitoring -c '\l'

# Check network connectivity
docker-compose exec backend nc -zv db 5432
```

#### File Upload Problems
```bash
# Check upload directory permissions
ls -la uploads/

# Verify disk space
df -h

# Check file size limits
grep MAX_CONTENT_LENGTH .env
```

#### Performance Issues
```bash
# Monitor resource usage
docker stats

# Check database performance
docker-compose exec db psql -U species_user -d species_monitoring -c 'SELECT * FROM pg_stat_activity;'

# Analyze slow queries
docker-compose exec db psql -U species_user -d species_monitoring -c 'SELECT query, mean_exec_time FROM pg_stat_statements ORDER BY mean_exec_time DESC LIMIT 10;'
```

### Debugging Commands

#### Backend Debugging
```bash
# Enter backend container
docker-compose exec backend bash

# Run Flask shell
docker-compose exec backend flask shell

# Check database migrations
docker-compose exec backend flask db current
```

#### Frontend Debugging
```bash
# Enter frontend container
docker-compose exec frontend sh

# Check build logs
docker-compose logs frontend

# Verify API connectivity
curl http://backend:5000/health
```

### Getting Help

#### Log Analysis
- Check application logs first
- Verify database connectivity
- Monitor system resources
- Review error messages

#### Community Support
- GitHub Issues
- Stack Overflow
- Discord/Slack channels
- Documentation wiki

#### Professional Support
- Deployment consulting
- Performance optimization
- Security audits
- Custom development

For additional support, contact: support@species-monitoring.com