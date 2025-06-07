# Species Monitoring Application

A comprehensive web application for tracking and monitoring wildlife species observations.

## Features

- 🔐 User authentication and authorization
- 📊 Project management for monitoring campaigns
- 🐾 Species observation recording
- 📈 Data visualization and reporting
- 🗺️ Interactive maps for observation locations
- 📱 Responsive design for mobile use
- 📄 PDF report generation
- 🔄 Real-time notifications

## Tech Stack

**Backend:**
- Python/Flask
- PostgreSQL
- Redis
- Celery
- SQLAlchemy

**Frontend:**
- React
- Material-UI
- Leaflet Maps
- Chart.js

**Deployment:**
- Docker
- Kubernetes
- Terraform
- Ansible

## Quick Start

1. Clone the repository:
```bash
git clone 
cd species-monitoring
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. Run with Docker Compose:
```bash
docker-compose up -d
```

4. Access the application:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- Admin Panel: http://localhost:5000/admin

## Development

See [CONTRIBUTING.md](docs/CONTRIBUTING.md) for development guidelines.

## Documentation

- [API Documentation](docs/API.md)
- [User Guide](docs/USER_GUIDE.md)
- [Deployment Guide](docs/DEPLOYMENT.md)
- [Changelog](docs/CHANGELOG.md)

## License

MIT License - see [LICENSE](LICENSE) file for details.
```

### Makefile
```makefile
.PHONY: help build dev test clean deploy backup restore

help:
	@echo "Available commands:"
	@echo "  build     Build Docker images"
	@echo "  dev       Start development environment"
	@echo "  test      Run all tests"
	@echo "  clean     Clean up containers and volumes"
	@echo "  deploy    Deploy to production"
	@echo "  backup    Create database backup"
	@echo "  restore   Restore database backup"

build:
	docker-compose build

dev:
	docker-compose -f docker-compose.yml up

test:
	docker-compose -f deployment/docker/docker-compose.test.yml up --abort-on-container-exit

clean:
	docker-compose down -v
	docker system prune -f

deploy:
	./scripts/deploy.sh

backup:
	./scripts/backup.sh

restore:
	./scripts/restore.sh

migrate:
	docker-compose exec backend flask db upgrade

seed:
	docker-compose exec backend flask seed-data

logs:
	docker-compose logs -f

shell:
	docker-compose exec backend flask shell

install-deps:
	pip install -r backend/requirements.txt
	cd frontend && npm install