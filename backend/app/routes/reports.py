from flask import Blueprint, request, jsonify, current_app, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity
from marshmallow import ValidationError
from datetime import datetime
import os
import tempfile
from io import BytesIO

from ..models import db, Project, Observation, Species, User, project_users
from ..utils.auth_utils import project_member_required
from ..utils.pdf_generator import generate_report_pdf
from ..tasks import generate_project_report_task

reports_bp = Blueprint('reports', __name__, url_prefix='/api/reports')

@reports_bp.route('/health')
def health():
    return {'status': 'ok'}

@reports_bp.route('/generate', methods=['POST'])
@jwt_required()
def generate_report():
    """Generate a project report."""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        project_id = data.get('project_id')
        report_type = data.get('report_type', 'pdf')
        format_type = data.get('format', 'pdf')
        
        if not project_id:
            return jsonify({'error': 'Project ID is required'}), 400
        
        # Verify project access
        project = db.session.query(Project).join(project_users).filter(
            Project.id == project_id,
            project_users.c.user_id == current_user_id
        ).first()
        
        if not project:
            return jsonify({'error': 'Project not found or access denied'}), 404
        
        # Generate report asynchronously
        task = generate_project_report_task.delay(project_id, current_user_id)
        
        return jsonify({
            'message': 'Report generation started',
            'task_id': task.id,
            'status': 'pending'
        })
        
    except Exception as e:
        current_app.logger.error(f"Report generation error: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@reports_bp.route('/status/<task_id>', methods=['GET'])
@jwt_required()
def get_report_status(task_id):
    """Get the status of a report generation task."""
    try:
        from ..celery_app import celery
        
        task = celery.AsyncResult(task_id)
        
        if task.state == 'PENDING':
            response = {
                'status': 'pending',
                'current': 0,
                'total': 100,
                'message': 'Report generation is starting...'
            }
        elif task.state == 'PROGRESS':
            response = {
                'status': 'in_progress',
                'current': task.info.get('current', 0),
                'total': task.info.get('total', 100),
                'message': task.info.get('message', 'Generating report...')
            }
        elif task.state == 'SUCCESS':
            response = {
                'status': 'completed',
                'current': 100,
                'total': 100,
                'result': task.info,
                'download_url': task.info.get('download_url')
            }
        else:
            # Error occurred
            response = {
                'status': 'failed',
                'current': 100,
                'total': 100,
                'error': str(task.info)
            }
        
        return jsonify(response)
        
    except Exception as e:
        current_app.logger.error(f"Report status error: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@reports_bp.route('/download/<filename>', methods=['GET'])
@jwt_required()
def download_report(filename):
    """Download a generated report."""
    try:
        current_user_id = get_jwt_identity()
        
        # Security check - ensure filename is safe
        if not filename.replace('.', '').replace('_', '').replace('-', '').isalnum():
            return jsonify({'error': 'Invalid filename'}), 400
        
        reports_dir = os.path.join(current_app.config['UPLOAD_FOLDER'], 'reports')
        file_path = os.path.join(reports_dir, filename)
        
        if not os.path.exists(file_path):
            return jsonify({'error': 'Report not found'}), 404
        
        # Check if file is too old (cleanup old reports)
        file_age = datetime.now().timestamp() - os.path.getmtime(file_path)
        if file_age > 7 * 24 * 60 * 60:  # 7 days
            os.remove(file_path)
            return jsonify({'error': 'Report has expired'}), 404
        
        return send_file(
            file_path,
            as_attachment=True,
            download_name=filename,
            mimetype='application/pdf' if filename.endswith('.pdf') else 'application/octet-stream'
        )
        
    except Exception as e:
        current_app.logger.error(f"Report download error: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@reports_bp.route('/quick-pdf', methods=['POST'])
@jwt_required()
def generate_quick_pdf():
    """Generate a quick PDF report synchronously for small projects."""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        project_id = data.get('project_id')
        
        if not project_id:
            return jsonify({'error': 'Project ID is required'}), 400
        
        # Verify project access
        project = db.session.query(Project).join(project_users).filter(
            Project.id == project_id,
            project_users.c.user_id == current_user_id
        ).first()
        
        if not project:
            return jsonify({'error': 'Project not found or access denied'}), 404
        
        # Check if project is small enough for quick generation
        observation_count = Observation.query.filter_by(project_id=project_id).count()
        if observation_count > 1000:
            return jsonify({
                'error': 'Project too large for quick generation. Use async generation instead.',
                'observation_count': observation_count
            }), 400
        
        # Generate PDF in memory
        pdf_buffer = BytesIO()
        generate_report_pdf(project, pdf_buffer)
        pdf_buffer.seek(0)
        
        # Create temporary file
        with tempfile.NamedTemporaryFile(
            suffix='.pdf',
            prefix=f'report_{project_id}_',
            delete=False
        ) as tmp_file:
            tmp_file.write(pdf_buffer.getvalue())
            tmp_filename = os.path.basename(tmp_file.name)
        
        # Move to reports directory
        reports_dir = os.path.join(current_app.config['UPLOAD_FOLDER'], 'reports')
        os.makedirs(reports_dir, exist_ok=True)
        
        final_path = os.path.join(reports_dir, tmp_filename)
        os.rename(tmp_file.name, final_path)
        
        return jsonify({
            'message': 'Report generated successfully',
            'filename': tmp_filename,
            'download_url': f'/api/reports/download/{tmp_filename}',
            'size': len(pdf_buffer.getvalue())
        })
        
    except Exception as e:
        current_app.logger.error(f"Quick PDF generation error: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@reports_bp.route('/summary', methods=['GET'])
@jwt_required()
def get_project_summary():
    """Get project summary data for reports."""
    try:
        current_user_id = get_jwt_identity()
        project_id = request.args.get('project_id')
        
        if not project_id:
            return jsonify({'error': 'Project ID is required'}), 400
        
        # Verify project access
        project = db.session.query(Project).join(project_users).filter(
            Project.id == project_id,
            project_users.c.user_id == current_user_id
        ).first()
        
        if not project:
            return jsonify({'error': 'Project not found or access denied'}), 404
        
        # Get project data
        observations = Observation.query.filter_by(project_id=project_id).all()
        
        # Calculate summary statistics
        total_observations = len(observations)
        unique_species = len(set(obs.species_id for obs in observations))
        total_individuals = sum(obs.count for obs in observations)
        unique_observers = len(set(obs.observer_id for obs in observations))
        
        # Date range
        date_range = None
        if observations:
            dates = [obs.observation_date for obs in observations]
            date_range = {
                'start': min(dates).isoformat(),
                'end': max(dates).isoformat()
            }
        
        # Species breakdown
        species_counts = {}
        species_observations = {}
        for obs in observations:
            species_name = obs.species.common_name if obs.species else 'Unknown'
            species_counts[species_name] = species_counts.get(species_name, 0) + obs.count
            species_observations[species_name] = species_observations.get(species_name, 0) + 1
        
        # Top species
        top_species = sorted(species_counts.items(), key=lambda x: x[1], reverse=True)[:10]
        
        # Observer contributions
        observer_counts = {}
        for obs in observations:
            observer_name = f"{obs.observer.first_name} {obs.observer.last_name}" if obs.observer else 'Unknown'
            observer_counts[observer_name] = observer_counts.get(observer_name, 0) + 1
        
        # Monthly distribution
        monthly_counts = {}
        for obs in observations:
            month = obs.observation_date.strftime('%Y-%m')
            monthly_counts[month] = monthly_counts.get(month, 0) + 1
        
        # Location distribution
        location_counts = {}
        for obs in observations:
            location = obs.location_name or f"{obs.latitude:.2f}, {obs.longitude:.2f}"
            location_counts[location] = location_counts.get(location, 0) + 1
        
        summary = {
            'project': {
                'id': project.id,
                'name': project.name,
                'description': project.description,
                'location': project.location,
                'status': project.status,
                'start_date': project.start_date.isoformat() if project.start_date else None,
                'end_date': project.end_date.isoformat() if project.end_date else None,
                'created_by': f"{project.created_by.first_name} {project.created_by.last_name}",
                'members_count': len(project.members)
            },
            'statistics': {
                'total_observations': total_observations,
                'unique_species': unique_species,
                'total_individuals': total_individuals,
                'unique_observers': unique_observers,
                'date_range': date_range
            },
            'species_breakdown': {
                'counts': species_counts,
                'observations': species_observations,
                'top_species': top_species
            },
            'observer_contributions': observer_counts,
            'temporal_distribution': monthly_counts,
            'location_distribution': location_counts
        }
        
        return jsonify(summary)
        
    except Exception as e:
        current_app.logger.error(f"Project summary error: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@reports_bp.route('/export-data', methods=['POST'])
@jwt_required()
def export_project_data():
    """Export project data in various formats."""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        project_id = data.get('project_id')
        format_type = data.get('format', 'csv')  # csv, json, excel
        include_media = data.get('include_media', False)
        
        if not project_id:
            return jsonify({'error': 'Project ID is required'}), 400
        
        # Verify project access
        project = db.session.query(Project).join(project_users).filter(
            Project.id == project_id,
            project_users.c.user_id == current_user_id
        ).first()
        
        if not project:
            return jsonify({'error': 'Project not found or access denied'}), 404
        
        # Export data using existing task
        from ..tasks import export_observations_task
        task = export_observations_task.delay(project_id, format_type, current_user_id)
        
        return jsonify({
            'message': 'Data export started',
            'task_id': task.id,
            'format': format_type
        })
        
    except Exception as e:
        current_app.logger.error(f"Data export error: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@reports_bp.route('/templates', methods=['GET'])
@jwt_required()
def get_report_templates():
    """Get available report templates."""
    try:
        templates = [
            {
                'id': 'standard',
                'name': 'Standard Project Report',
                'description': 'Comprehensive project overview with statistics and charts',
                'format': 'pdf',
                'pages_estimate': '5-10'
            },
            {
                'id': 'summary',
                'name': 'Executive Summary',
                'description': 'Brief overview for stakeholders',
                'format': 'pdf',
                'pages_estimate': '2-3'
            },
            {
                'id': 'scientific',
                'name': 'Scientific Report',
                'description': 'Detailed scientific analysis with methodology',
                'format': 'pdf',
                'pages_estimate': '10-20'
            },
            {
                'id': 'conservation',
                'name': 'Conservation Status Report',
                'description': 'Focus on conservation status and threats',
                'format': 'pdf',
                'pages_estimate': '5-8'
            }
        ]
        
        return jsonify({'templates': templates})
        
    except Exception as e:
        current_app.logger.error(f"Templates fetch error: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@reports_bp.route('/custom', methods=['POST'])
@jwt_required()
def generate_custom_report():
    """Generate a custom report with specific sections."""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        project_id = data.get('project_id')
        template_id = data.get('template_id', 'standard')
        sections = data.get('sections', [])
        date_range = data.get('date_range')
        species_filter = data.get('species_filter')
        
        if not project_id:
            return jsonify({'error': 'Project ID is required'}), 400
        
        # Verify project access
        project = db.session.query(Project).join(project_users).filter(
            Project.id == project_id,
            project_users.c.user_id == current_user_id
        ).first()
        
        if not project:
            return jsonify({'error': 'Project not found or access denied'}), 404
        
        # Generate custom report
        # This would be implemented with more sophisticated report generation
        return jsonify({
            'message': 'Custom report generation not yet implemented',
            'requested_template': template_id,
            'requested_sections': sections
        }), 501
        
    except Exception as e:
        current_app.logger.error(f"Custom report error: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@reports_bp.route('/cleanup', methods=['POST'])
@jwt_required()
def cleanup_old_reports():
    """Clean up old report files."""
    try:
        current_user_id = get_jwt_identity()
        
        # Only admins can trigger cleanup
        user = User.query.get(current_user_id)
        if user.role != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        
        reports_dir = os.path.join(current_app.config['UPLOAD_FOLDER'], 'reports')
        
        if not os.path.exists(reports_dir):
            return jsonify({'message': 'No reports directory found'})
        
        # Remove files older than 7 days
        current_time = datetime.now().timestamp()
        removed_count = 0
        total_size = 0
        
        for filename in os.listdir(reports_dir):
            file_path = os.path.join(reports_dir, filename)
            if os.path.isfile(file_path):
                file_age = current_time - os.path.getmtime(file_path)
                if file_age > 7 * 24 * 60 * 60:  # 7 days
                    file_size = os.path.getsize(file_path)
                    os.remove(file_path)
                    removed_count += 1
                    total_size += file_size
        
        return jsonify({
            'message': f'Cleaned up {removed_count} old report files',
            'files_removed': removed_count,
            'space_freed': f"{total_size / 1024 / 1024:.2f} MB"
        })
        
    except Exception as e:
        current_app.logger.error(f"Report cleanup error: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500