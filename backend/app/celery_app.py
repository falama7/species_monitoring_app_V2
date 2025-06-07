"""Celery application factory."""
import os
from celery import Celery
from app import create_app

def make_celery(app_name=__name__):
    """Create and configure Celery application."""
    app = create_app(os.getenv('FLASK_ENV', 'development'))
    
    celery = Celery(
        app.import_name,
        backend=app.config['CELERY_RESULT_BACKEND'],
        broker=app.config['CELERY_BROKER_URL'],
        include=['app.tasks']
    )
    
    class ContextTask(celery.Task):
        """Make celery tasks work with Flask app context."""
        def __call__(self, *args, **kwargs):
            with app.app_context():
                return self.run(*args, **kwargs)
    
    celery.Task = ContextTask
    return celery

# Create the Celery application
celery = make_celery()

if __name__ == '__main__':
    celery.start()