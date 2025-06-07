#!/usr/bin/env python3
"""
Celery Worker Entry Point for Species Monitoring Application

This module initializes and starts the Celery worker process for handling
background tasks such as data export, report generation, and email notifications.

Usage:
    python celery_worker.py
    
Or via celery command:
    celery -A celery_worker worker --loglevel=info
"""

import os
import sys
import logging
from celery import Celery
from celery.signals import worker_ready, worker_shutdown

# Add the backend directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import create_app
from app.celery_app import make_celery

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('logs/celery.log'),
        logging.StreamHandler(sys.stdout)
    ]
)

logger = logging.getLogger(__name__)

# Create Flask app and Celery instance
flask_app = create_app(os.getenv('FLASK_ENV', 'production'))
celery_app = make_celery(flask_app.import_name)

# Update Celery configuration
celery_app.conf.update(
    # Task routing
    task_routes={
        'app.tasks.export_observations_task': {'queue': 'exports'},
        'app.tasks.generate_project_report_task': {'queue': 'reports'},
        'app.tasks.send_notification_email': {'queue': 'notifications'},
        'app.tasks.cleanup_old_files': {'queue': 'maintenance'},
    },
    
    # Task execution
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='UTC',
    enable_utc=True,
    
    # Worker configuration
    worker_prefetch_multiplier=4,
    task_acks_late=True,
    worker_max_tasks_per_child=1000,
    
    # Result backend
    result_expires=3600,  # Results expire after 1 hour
    result_compression='gzip',
    
    # Task timeouts
    task_soft_time_limit=300,  # 5 minutes soft timeout
    task_time_limit=600,       # 10 minutes hard timeout
    
    # Retry configuration
    task_default_retry_delay=60,
    task_max_retries=3,
    
    # Monitoring
    worker_send_task_events=True,
    task_send_sent_event=True,
    
    # Beat schedule for periodic tasks
    beat_schedule={
        'cleanup-old-files': {
            'task': 'app.tasks.cleanup_old_files',
            'schedule': 86400.0,  # Run daily
        },
        'generate-daily-reports': {
            'task': 'app.tasks.generate_daily_reports',
            'schedule': 86400.0,  # Run daily at midnight
            'options': {'queue': 'reports'}
        },
        'check-system-health': {
            'task': 'app.tasks.check_system_health',
            'schedule': 300.0,  # Run every 5 minutes
            'options': {'queue': 'monitoring'}
        },
    },
)

# Error handling
@celery_app.task(bind=True)
def debug_task(self):
    """Debug task for testing Celery setup."""
    logger.info(f'Request: {self.request!r}')
    return f'Debug task executed successfully'

# Worker event handlers
@worker_ready.connect
def worker_ready_handler(sender=None, **kwargs):
    """Handler called when worker is ready."""
    logger.info(f"Celery worker '{sender}' is ready")
    
    # Perform any initialization tasks here
    with flask_app.app_context():
        # Check database connection
        try:
            from app.models import db
            db.engine.execute('SELECT 1')
            logger.info("Database connection verified")
        except Exception as e:
            logger.error(f"Database connection failed: {e}")
        
        # Verify file directories exist
        upload_dir = flask_app.config.get('UPLOAD_FOLDER', 'uploads')
        os.makedirs(f"{upload_dir}/exports", exist_ok=True)
        os.makedirs(f"{upload_dir}/reports", exist_ok=True)
        os.makedirs(f"{upload_dir}/images", exist_ok=True)
        os.makedirs(f"{upload_dir}/audio", exist_ok=True)
        logger.info("Upload directories verified")

@worker_shutdown.connect
def worker_shutdown_handler(sender=None, **kwargs):
    """Handler called when worker is shutting down."""
    logger.info(f"Celery worker '{sender}' is shutting down")

# Custom task base class with error handling
class CallbackTask(celery_app.Task):
    """Custom task class with enhanced error handling and callbacks."""
    
    def on_success(self, retval, task_id, args, kwargs):
        """Called on task success."""
        logger.info(f"Task {task_id} completed successfully")
    
    def on_failure(self, exc, task_id, args, kwargs, einfo):
        """Called on task failure."""
        logger.error(f"Task {task_id} failed: {exc}")
        
        # Send notification for critical task failures
        if hasattr(self, 'critical') and self.critical:
            try:
                from app.tasks import send_notification_email
                send_notification_email.delay(
                    user_id='admin',
                    subject=f'Critical Task Failure: {self.name}',
                    message=f'Task {task_id} failed with error: {exc}'
                )
            except Exception as e:
                logger.error(f"Failed to send failure notification: {e}")
    
    def on_retry(self, exc, task_id, args, kwargs, einfo):
        """Called on task retry."""
        logger.warning(f"Task {task_id} retrying due to: {exc}")

# Set custom task base
celery_app.Task = CallbackTask

# Health check task
@celery_app.task(bind=True)
def health_check(self):
    """Health check task for monitoring."""
    try:
        with flask_app.app_context():
            from app.models import db
            
            # Check database
            db.engine.execute('SELECT 1')
            
            # Check Redis
            from app import cache
            cache.set('health_check', 'ok', timeout=60)
            
            return {
                'status': 'healthy',
                'timestamp': '2024-01-15T10:30:00Z',
                'worker': self.request.hostname,
                'checks': {
                    'database': 'ok',
                    'redis': 'ok'
                }
            }
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return {
            'status': 'unhealthy',
            'error': str(e),
            'timestamp': '2024-01-15T10:30:00Z',
            'worker': self.request.hostname
        }

if __name__ == '__main__':
    # Start worker programmatically
    logger.info("Starting Celery worker...")
    
    # Configure worker options
    worker_options = {
        'loglevel': 'INFO',
        'queues': ['default', 'exports', 'reports', 'notifications', 'maintenance'],
        'concurrency': int(os.getenv('CELERY_CONCURRENCY', '4')),
        'max_tasks_per_child': 1000,
    }
    
    try:
        celery_app.worker_main([
            'worker',
            f'--loglevel={worker_options["loglevel"]}',
            f'--queues={",".join(worker_options["queues"])}',
            f'--concurrency={worker_options["concurrency"]}',
            f'--max-tasks-per-child={worker_options["max_tasks_per_child"]}',
            '--without-gossip',
            '--without-mingle',
            '--without-heartbeat',
        ])
    except KeyboardInterrupt:
        logger.info("Worker stopped by user")
    except Exception as e:
        logger.error(f"Worker failed to start: {e}")
        sys.exit(1)