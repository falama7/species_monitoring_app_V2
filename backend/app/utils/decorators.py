from functools import wraps
from flask import jsonify, current_app
from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request
from ..models import User

def admin_required(f):
    """Decorator to require admin role"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        try:
            verify_jwt_in_request()
            current_user_id = get_jwt_identity()
            user = User.query.get(current_user_id)
            
            if not user or user.role != 'admin':
                return jsonify({'error': 'Admin access required'}), 403
                
            return f(*args, **kwargs)
        except Exception as e:
            current_app.logger.error(f"Admin check error: {str(e)}")
            return jsonify({'error': 'Authentication failed'}), 401
    
    return decorated_function

def role_required(allowed_roles):
    """Decorator to require specific roles"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            try:
                verify_jwt_in_request()
                current_user_id = get_jwt_identity()
                user = User.query.get(current_user_id)
                
                if not user or user.role not in allowed_roles:
                    return jsonify({
                        'error': f'Access denied. Required roles: {", ".join(allowed_roles)}'
                    }), 403
                    
                return f(*args, **kwargs)
            except Exception as e:
                current_app.logger.error(f"Role check error: {str(e)}")
                return jsonify({'error': 'Authentication failed'}), 401
        
        return decorated_function
    return decorator

def project_member_required(f):
    """Decorator to require project membership"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        try:
            verify_jwt_in_request()
            current_user_id = get_jwt_identity()
            user = User.query.get(current_user_id)
            
            if not user:
                return jsonify({'error': 'User not found'}), 404
            
            # Admin can access all projects
            if user.role == 'admin':
                return f(*args, **kwargs)
            
            # Get project_id from URL parameters
            project_id = kwargs.get('project_id')
            if not project_id:
                return jsonify({'error': 'Project ID required'}), 400
            
            from ..models import Project
            project = Project.query.get(project_id)
            if not project:
                return jsonify({'error': 'Project not found'}), 404
            
            # Check if user is project creator or member
            if project.created_by_id == current_user_id or user in project.members:
                return f(*args, **kwargs)
            else:
                return jsonify({'error': 'Project access required'}), 403
                
        except Exception as e:
            current_app.logger.error(f"Project member check error: {str(e)}")
            return jsonify({'error': 'Authentication failed'}), 401
    
    return decorated_function

def active_user_required(f):
    """Decorator to require active user status"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        try:
            verify_jwt_in_request()
            current_user_id = get_jwt_identity()
            user = User.query.get(current_user_id)
            
            if not user or not user.is_active:
                return jsonify({'error': 'Account is inactive'}), 403
                
            return f(*args, **kwargs)
        except Exception as e:
            current_app.logger.error(f"Active user check error: {str(e)}")
            return jsonify({'error': 'Authentication failed'}), 401
    
    return decorated_function

def rate_limit(max_requests=100, per_seconds=3600):
    """Simple rate limiting decorator"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            # This is a simple implementation
            # In production, you'd want to use Redis or similar
            try:
                verify_jwt_in_request()
                current_user_id = get_jwt_identity()
                
                # For now, just log the request
                current_app.logger.info(f"Rate limit check for user {current_user_id}")
                
                return f(*args, **kwargs)
            except Exception as e:
                current_app.logger.error(f"Rate limit error: {str(e)}")
                return jsonify({'error': 'Rate limit exceeded'}), 429
        
        return decorated_function
    return decorator 