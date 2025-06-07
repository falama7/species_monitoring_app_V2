from celery import Celery
from flask import current_app
import pandas as pd
import os
import csv
from datetime import datetime
from io import StringIO

from .models import db, Observation, Species, User, Project
from .utils.pdf_generator import generate_report_pdf

def make_celery(app):
    celery = Celery(
        app.import_name,
        backend=app.config['CELERY_RESULT_BACKEND'],
        broker=app.config['CELERY_BROKER_URL']
    )
    
    class ContextTask(celery.Task):
        """Make celery tasks work with Flask app context."""
        def __call__(self, *args, **kwargs):
            with app.app_context():
                return self.run(*args, **kwargs)
    
    celery.Task = ContextTask
    return celery

celery = make_celery(current_app)

@celery.task(bind=True)
def export_observations_task(self, project_id, format_type, user_id):
    """Export observations for a project"""
    try:
        self.update_state(state='PROGRESS', meta={'current': 10, 'total': 100})
        
        # Get observations
        observations = db.session.query(Observation).filter(
            Observation.project_id == project_id
        ).join(Species).join(User).all()
        
        self.update_state(state='PROGRESS', meta={'current': 30, 'total': 100})
        
        if format_type == 'csv':
            # Create CSV
            output = StringIO()
            writer = csv.writer(output)
            
            # Headers
            headers = [
                'ID', 'Species Scientific Name', 'Species Common Name',
                'Observer', 'Date', 'Latitude', 'Longitude', 'Location',
                'Count', 'Behavior', 'Habitat', 'Weather', 'Notes'
            ]
            writer.writerow(headers)
            
            # Data rows
            for obs in observations:
                writer.writerow([
                    str(obs.id),
                    obs.species.scientific_name,
                    obs.species.common_name,
                    f"{obs.observer.first_name} {obs.observer.last_name}",
                    obs.observation_date.isoformat(),
                    obs.latitude,
                    obs.longitude,
                    obs.location_name or '',
                    obs.count,
                    obs.behavior or '',
                    obs.habitat_description or '',
                    obs.weather_conditions or '',
                    obs.notes or ''
                ])
            
            self.update_state(state='PROGRESS', meta={'current': 80, 'total': 100})
            
            # Save file
            filename = f"observations_{project_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
            file_path = os.path.join(current_app.config['UPLOAD_FOLDER'], 'exports', filename)
            os.makedirs(os.path.dirname(file_path), exist_ok=True)
            
            with open(file_path, 'w', newline='', encoding='utf-8') as f:
                f.write(output.getvalue())
        
        elif format_type == 'excel':
            # Create Excel file
            data = []
            for obs in observations:
                data.append({
                    'ID': str(obs.id),
                    'Species Scientific Name': obs.species.scientific_name,
                    'Species Common Name': obs.species.common_name,
                    'Observer': f"{obs.observer.first_name} {obs.observer.last_name}",
                    'Date': obs.observation_date,
                    'Latitude': obs.latitude,
                    'Longitude': obs.longitude,
                    'Location': obs.location_name or '',
                    'Count': obs.count,
                    'Behavior': obs.behavior or '',
                    'Habitat': obs.habitat_description or '',
                    'Weather': obs.weather_conditions or '',
                    'Notes': obs.notes or ''
                })
            
            df = pd.DataFrame(data)
            filename = f"observations_{project_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
            file_path = os.path.join(current_app.config['UPLOAD_FOLDER'], 'exports', filename)
            os.makedirs(os.path.dirname(file_path), exist_ok=True)
            
            df.to_excel(file_path, index=False)
        
        self.update_state(state='PROGRESS', meta={'current': 100, 'total': 100})
        
        return {
            'status': 'completed',
            'filename': filename,
            'file_path': file_path,
            'download_url': f"/api/uploads/exports/{filename}"
        }
        
    except Exception as e:
        self.update_state(
            state='FAILURE',
            meta={'error': str(e)}
        )
        raise

@celery.task(bind=True)
def generate_project_report_task(self, project_id, user_id):
    """Generate comprehensive project report"""
    try:
        self.update_state(state='PROGRESS', meta={'current': 10, 'total': 100})
        
        project = Project.query.get(project_id)
        if not project:
            raise ValueError("Project not found")
        
        self.update_state(state='PROGRESS', meta={'current': 30, 'total': 100})
        
        # Generate PDF report
        filename = f"report_{project_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
        file_path = os.path.join(current_app.config['UPLOAD_FOLDER'], 'reports', filename)
        os.makedirs(os.path.dirname(file_path), exist_ok=True)
        
        self.update_state(state='PROGRESS', meta={'current': 70, 'total': 100})
        
        generate_report_pdf(project, file_path)
        
        self.update_state(state='PROGRESS', meta={'current': 100, 'total': 100})
        
        return {
            'status': 'completed',
            'filename': filename,
            'file_path': file_path,
            'download_url': f"/api/uploads/reports/{filename}"
        }
        
    except Exception as e:
        self.update_state(
            state='FAILURE',
            meta={'error': str(e)}
        )
        raise

@celery.task
def send_notification_email(user_id, subject, message):
    """Send notification email to user"""
    try:
        from flask_mail import Message
        from . import mail
        
        user = User.query.get(user_id)
        if not user:
            return {'status': 'error', 'message': 'User not found'}
        
        msg = Message(
            subject=subject,
            sender=current_app.config['MAIL_USERNAME'],
            recipients=[user.email],
            body=message
        )
        
        mail.send(msg)
        
        return {'status': 'sent', 'recipient': user.email}
        
    except Exception as e:
        return {'status': 'error', 'message': str(e)}

@celery.task
def cleanup_old_files():
    """Clean up old temporary files"""
    try:
        import time
        from pathlib import Path
        
        # Clean up files older than 7 days
        cutoff_time = time.time() - (7 * 24 * 60 * 60)
        
        export_dir = Path(current_app.config['UPLOAD_FOLDER']) / 'exports'
        report_dir = Path(current_app.config['UPLOAD_FOLDER']) / 'reports'
        
        for directory in [export_dir, report_dir]:
            if directory.exists():
                for file_path in directory.iterdir():
                    if file_path.is_file() and file_path.stat().st_mtime < cutoff_time:
                        file_path.unlink()
        
        return {'status': 'completed', 'message': 'Old files cleaned up'}
        
    except Exception as e:
        return {'status': 'error', 'message': str(e)}