from functools import wraps
from flask import jsonify
from flask_jwt_extended import get_jwt_identity
from ..models import User, Project, project_users

def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user or user.role != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        
        return f(*args, **kwargs)
    return decorated_function

def researcher_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user or user.role not in ['admin', 'researcher']:
            return jsonify({'error': 'Researcher access required'}), 403
        
        return f(*args, **kwargs)
    return decorated_function

def project_member_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        current_user_id = get_jwt_identity()
        project_id = kwargs.get('project_id') or args[0] if args else None
        
        if not project_id:
            return jsonify({'error': 'Project ID required'}), 400
        
        user = User.query.get(current_user_id)
        if user.role == 'admin':
            return f(*args, **kwargs)
        
        # Check if user is project member
        project = Project.query.join(project_users).filter(
            Project.id == project_id,
            project_users.c.user_id == current_user_id
        ).first()
        
        if not project:
            return jsonify({'error': 'Project access required'}), 403
        
        return f(*args, **kwargs)
    return decorated_function