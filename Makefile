.PHONY: help build dev test clean deploy backup restore migrate seed logs shell install-deps quick-start status

help: ## Show this help message
	@echo "Available commands:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

# Development
quick-start: ## Quick start for development
	@echo "🚀 Starting Species Monitoring App..."
	@if [ ! -f ".env" ]; then \
		cp .env.example .env; \
		echo "📝 Created .env file from template"; \
	fi
	@docker-compose up -d db redis
	@echo "⏳ Waiting for services..."
	@sleep 10
	@echo "✅ Development environment ready!"
	@echo "Frontend: http://localhost:3000"
	@echo "Backend: http://localhost:5000"

build: ## Build Docker images
	@echo "🔨 Building Docker images..."
	docker-compose build

dev: ## Start development environment
	@echo "🔧 Starting development environment..."
	docker-compose -f docker-compose.yml up

test: ## Run all tests
	@echo "🧪 Running all tests..."
	@$(MAKE) test-backend
	@$(MAKE) test-frontend
	@$(MAKE) test-e2e

test-backend: ## Run backend tests
	@echo "🐍 Running backend tests..."
	cd backend && python -m pytest tests/ -v --cov=app --cov-report=html

test-frontend: ## Run frontend tests
	@echo "⚛️ Running frontend tests..."
	cd frontend && npm test -- --coverage --watchAll=false

test-e2e: ## Run end-to-end tests
	@echo "🌐 Running E2E tests..."
	cd tests/e2e && npx cypress run

lint: ## Run linters
	@echo "🔍 Running linters..."
	cd backend && flake8 app/ tests/
	cd frontend && npm run lint

format: ## Format code
	@echo "✨ Formatting code..."
	cd backend && black app/ tests/
	cd frontend && npm run format

clean: ## Clean up containers and volumes
	@echo "🧹 Cleaning up..."
	docker-compose down -v
	docker system prune -f
	docker volume prune -f

deploy: ## Deploy to production
	@echo "🚀 Deploying to production..."
	./scripts/deploy.sh production

backup: ## Create database backup
	@echo "💾 Creating backup..."
	./scripts/backup.sh

restore: ## Restore database backup
	@echo "♻️ Restoring backup..."
	@read -p "Enter backup file path: " BACKUP_FILE; \
	./scripts/restore.sh $$BACKUP_FILE

migrate: ## Run database migrations
	@echo "📊 Running migrations..."
	docker-compose exec backend flask db upgrade

seed: ## Seed database with sample data
	@echo "🌱 Seeding database..."
	docker-compose exec backend flask seed-data

logs: ## Show application logs
	docker-compose logs -f

logs-backend: ## Show backend logs only
	docker-compose logs -f backend

logs-frontend: ## Show frontend logs only
	docker-compose logs -f frontend

shell: ## Open backend shell
	docker-compose exec backend flask shell

db-shell: ## Open database shell
	docker-compose exec db psql -U species_user -d species_monitoring

install-deps: ## Install dependencies
	@echo "📦 Installing dependencies..."
	cd backend && pip install -r requirements.txt
	cd frontend && npm install

install-dev-deps: ## Install development dependencies
	@echo "📦 Installing development dependencies..."
	cd backend && pip install -r requirements.txt -r requirements-dev.txt
	cd frontend && npm install
	npm install -g cypress

status: ## Show service status
	@echo "📊 Service Status:"
	@docker-compose ps
	@echo ""
	@echo "🌐 Application URLs:"
	@echo "Frontend: http://localhost:3000"
	@echo "Backend API: http://localhost:5000"
	@echo "API Docs: http://localhost:5000/docs"

security-scan: ## Run security scans
	@echo "🔒 Running security scans..."
	cd backend && bandit -r app/
	cd frontend && npm audit

performance-test: ## Run performance tests
	@echo "⚡ Running performance tests..."
	cd tests/performance && artillery run load-test.yml

update: ## Update dependencies
	@echo "🔄 Updating dependencies..."
	cd backend && pip-review --local --interactive
	cd frontend && npm update

reset: ## Reset development environment
	@echo "🔄 Resetting environment..."
	@$(MAKE) clean
	@$(MAKE) quick-start

# Docker shortcuts
up: ## Start all services
	docker-compose up -d

down: ## Stop all services
	docker-compose down

restart: ## Restart all services
	docker-compose restart

# Production deployment
deploy-staging: ## Deploy to staging
	./scripts/deploy.sh staging

deploy-production: ## Deploy to production
	./scripts/deploy.sh production

# Monitoring
monitor: ## Start monitoring stack
	docker-compose -f monitoring/docker-compose.monitoring.yml up -d

# Documentation
docs: ## Generate documentation
	@echo "📚 Generating documentation..."
	cd backend && sphinx-build -b html docs/ docs/_build/
	cd frontend && npm run docs

# CI/CD helpers
ci-test: ## Run tests in CI environment
	@echo "🤖 Running CI tests..."
	docker-compose -f deployment/docker/docker-compose.test.yml up --abort-on-container-exit

ci-build: ## Build for CI
	docker build -t species-monitoring/backend:${CI_COMMIT_SHA:-latest} ./backend
	docker build -t species-monitoring/frontend:${CI_COMMIT_SHA:-latest} ./frontend

# Database utilities
db-dump: ## Dump database
	docker-compose exec db pg_dump -U species_user species_monitoring > backup_$(shell date +%Y%m%d_%H%M%S).sql

db-restore: ## Restore database from dump
	@read -p "Enter SQL dump file: " DUMP_FILE; \
	docker-compose exec -T db psql -U species_user -d species_monitoring < $$DUMP_FILE

# SSL certificates (for production)
ssl-cert: ## Generate SSL certificates
	certbot --nginx -d your-domain.com

ssl-renew: ## Renew SSL certificates
	certbot renew --quiet

# Load testing
load-test: ## Run load tests
	cd tests/load && artillery run scenarios/api-load-test.yml

# Code quality
quality-check: ## Run code quality checks
	@$(MAKE) lint
	@$(MAKE) security-scan
	@echo "✅ Code quality checks completed"

# Environment setup
env-check: ## Check environment setup
	@echo "🔍 Checking environment..."
	@command -v docker >/dev/null 2>&1 || { echo "❌ Docker is required but not installed"; exit 1; }
	@command -v docker-compose >/dev/null 2>&1 || { echo "❌ Docker Compose is required but not installed"; exit 1; }
	@[ -f ".env" ] || { echo "❌ .env file not found. Run 'make quick-start' first"; exit 1; }
	@echo "✅ Environment check passed"