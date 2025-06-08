from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename
import os
from datetime import datetime
from uuid import uuid4

from ..models import db, Resource, User
from ..schemas import ResourceSchema
from ..utils.decorators import admin_required, role_required
from ..utils.validation import validate_json

resources_bp = Blueprint('resources', __name__, url_prefix='/api/resources')
resource_schema = ResourceSchema()
resources_schema = ResourceSchema(many=True)

ALLOWED_EXTENSIONS = {'pdf', 'doc', 'docx', 'txt', 'md', 'png', 'jpg', 'jpeg', 'gif', 'mp4', 'mp3', 'wav'}

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@resources_bp.route('', methods=['GET'])
@jwt_required()
def get_resources():
    """Get all resources with optional filtering"""
    try:
        # Get query parameters
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        category = request.args.get('category')
        resource_type = request.args.get('type')
        search = request.args.get('search')
        is_public = request.args.get('public', type=bool)
        
        # Build query
        query = Resource.query
        
        # Apply filters
        if category:
            query = query.filter(Resource.category.ilike(f'%{category}%'))
        if resource_type:
            query = query.filter(Resource.resource_type.ilike(f'%{resource_type}%'))
        if search:
            query = query.filter(
                db.or_(
                    Resource.title.ilike(f'%{search}%'),
                    Resource.description.ilike(f'%{search}%')
                )
            )
        if is_public is not None:
            query = query.filter(Resource.is_public == is_public)
        
        # Order by creation date (newest first)
        query = query.order_by(Resource.created_at.desc())
        
        # Paginate
        pagination = query.paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        resources = pagination.items
        
        return jsonify({
            'resources': resources_schema.dump(resources),
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': pagination.total,
                'pages': pagination.pages,
                'has_next': pagination.has_next,
                'has_prev': pagination.has_prev
            }
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Error getting resources: {str(e)}")
        return jsonify({'error': 'Failed to retrieve resources'}), 500

@resources_bp.route('/<resource_id>', methods=['GET'])
@jwt_required()
def get_resource(resource_id):
    """Get a specific resource by ID"""
    try:
        resource = Resource.query.filter_by(id=resource_id).first()
        if not resource:
            return jsonify({'error': 'Resource not found'}), 404
        
        # Check if user can access this resource
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)
        
        if not resource.is_public and resource.created_by_id != current_user_id and current_user.role != 'admin':
            return jsonify({'error': 'Access denied'}), 403
        
        return jsonify({'resource': resource_schema.dump(resource)}), 200
        
    except Exception as e:
        current_app.logger.error(f"Error getting resource {resource_id}: {str(e)}")
        return jsonify({'error': 'Failed to retrieve resource'}), 500

@resources_bp.route('', methods=['POST'])
@jwt_required()
@role_required(['admin', 'coordinator'])
def create_resource():
    """Create a new resource"""
    try:
        current_user_id = get_jwt_identity()
        
        # Handle file upload if present
        file_url = None
        if 'file' in request.files:
            file = request.files['file']
            if file and file.filename and allowed_file(file.filename):
                filename = secure_filename(file.filename)
                # Add timestamp to avoid conflicts
                timestamp = datetime.now().strftime('%Y%m%d_%H%M%S_')
                filename = f"{timestamp}{filename}"
                
                upload_dir = os.path.join(current_app.config['UPLOAD_FOLDER'], 'resources')
                os.makedirs(upload_dir, exist_ok=True)
                file_path = os.path.join(upload_dir, filename)
                file.save(file_path)
                file_url = f"/uploads/resources/{filename}"
        
        # Get form data
        data = request.form.to_dict()
        if request.is_json:
            data = request.get_json()
        
        # Validate required fields
        required_fields = ['title', 'description', 'resource_type']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        # Create resource
        resource = Resource(
            title=data['title'],
            description=data['description'],
            resource_type=data['resource_type'],
            category=data.get('category', ''),
            file_url=file_url,
            external_url=data.get('external_url'),
            is_public=data.get('is_public', True),
            created_by_id=current_user_id
        )
        
        db.session.add(resource)
        db.session.commit()
        
        return jsonify({
            'message': 'Resource created successfully',
            'resource': resource_schema.dump(resource)
        }), 201
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error creating resource: {str(e)}")
        return jsonify({'error': 'Failed to create resource'}), 500

@resources_bp.route('/<resource_id>', methods=['PUT'])
@jwt_required()
def update_resource(resource_id):
    """Update a specific resource"""
    try:
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)
        
        resource = Resource.query.filter_by(id=resource_id).first()
        if not resource:
            return jsonify({'error': 'Resource not found'}), 404
        
        # Check permissions
        if resource.created_by_id != current_user_id and current_user.role != 'admin':
            return jsonify({'error': 'Access denied'}), 403
        
        # Handle file upload if present
        if 'file' in request.files:
            file = request.files['file']
            if file and file.filename and allowed_file(file.filename):
                filename = secure_filename(file.filename)
                timestamp = datetime.now().strftime('%Y%m%d_%H%M%S_')
                filename = f"{timestamp}{filename}"
                
                upload_dir = os.path.join(current_app.config['UPLOAD_FOLDER'], 'resources')
                os.makedirs(upload_dir, exist_ok=True)
                file_path = os.path.join(upload_dir, filename)
                file.save(file_path)
                resource.file_url = f"/uploads/resources/{filename}"
        
        # Get form data
        data = request.form.to_dict()
        if request.is_json:
            data = request.get_json()
        
        # Update fields
        if 'title' in data:
            resource.title = data['title']
        if 'description' in data:
            resource.description = data['description']
        if 'resource_type' in data:
            resource.resource_type = data['resource_type']
        if 'category' in data:
            resource.category = data['category']
        if 'external_url' in data:
            resource.external_url = data['external_url']
        if 'is_public' in data:
            resource.is_public = bool(data['is_public'])
        
        db.session.commit()
        
        return jsonify({
            'message': 'Resource updated successfully',
            'resource': resource_schema.dump(resource)
        }), 200
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error updating resource {resource_id}: {str(e)}")
        return jsonify({'error': 'Failed to update resource'}), 500

@resources_bp.route('/<resource_id>', methods=['DELETE'])
@jwt_required()
def delete_resource(resource_id):
    """Delete a specific resource"""
    try:
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)
        
        resource = Resource.query.filter_by(id=resource_id).first()
        if not resource:
            return jsonify({'error': 'Resource not found'}), 404
        
        # Check permissions
        if resource.created_by_id != current_user_id and current_user.role != 'admin':
            return jsonify({'error': 'Access denied'}), 403
        
        # Delete associated file if exists
        if resource.file_url:
            try:
                file_path = os.path.join(current_app.config['UPLOAD_FOLDER'], resource.file_url.lstrip('/uploads/'))
                if os.path.exists(file_path):
                    os.remove(file_path)
            except Exception as e:
                current_app.logger.warning(f"Failed to delete file {resource.file_url}: {str(e)}")
        
        db.session.delete(resource)
        db.session.commit()
        
        return jsonify({'message': 'Resource deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error deleting resource {resource_id}: {str(e)}")
        return jsonify({'error': 'Failed to delete resource'}), 500

@resources_bp.route('/categories', methods=['GET'])
@jwt_required()
def get_categories():
    """Get all resource categories"""
    try:
        categories = db.session.query(Resource.category).distinct().filter(
            Resource.category.isnot(None),
            Resource.category != ''
        ).all()
        
        category_list = [cat[0] for cat in categories if cat[0]]
        
        return jsonify({'categories': category_list}), 200
        
    except Exception as e:
        current_app.logger.error(f"Error getting categories: {str(e)}")
        return jsonify({'error': 'Failed to retrieve categories'}), 500

@resources_bp.route('/types', methods=['GET'])
@jwt_required()
def get_resource_types():
    """Get all resource types"""
    try:
        types = db.session.query(Resource.resource_type).distinct().filter(
            Resource.resource_type.isnot(None),
            Resource.resource_type != ''
        ).all()
        
        type_list = [type_[0] for type_ in types if type_[0]]
        
        return jsonify({'types': type_list}), 200
        
    except Exception as e:
        current_app.logger.error(f"Error getting resource types: {str(e)}")
        return jsonify({'error': 'Failed to retrieve resource types'}), 500

@resources_bp.route('/download/<resource_id>', methods=['GET'])
@jwt_required()
def download_resource(resource_id):
    """Download a resource file"""
    try:
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)
        
        resource = Resource.query.filter_by(id=resource_id).first()
        if not resource:
            return jsonify({'error': 'Resource not found'}), 404
        
        # Check permissions
        if not resource.is_public and resource.created_by_id != current_user_id and current_user.role != 'admin':
            return jsonify({'error': 'Access denied'}), 403
        
        if not resource.file_url:
            return jsonify({'error': 'No file associated with this resource'}), 400
        
        file_path = os.path.join(current_app.config['UPLOAD_FOLDER'], resource.file_url.lstrip('/uploads/'))
        
        if not os.path.exists(file_path):
            return jsonify({'error': 'File not found on server'}), 404
        
        from flask import send_file
        return send_file(file_path, as_attachment=True)
        
    except Exception as e:
        current_app.logger.error(f"Error downloading resource {resource_id}: {str(e)}")
        return jsonify({'error': 'Failed to download resource'}), 500

@resources_bp.route('/health')
def health():
    return {'status': 'ok'}
