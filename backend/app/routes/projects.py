from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from marshmallow import ValidationError
from sqlalchemy.exc import IntegrityError

from ..models import db, Project, User, project_users
from ..schemas import ProjectSchema
from ..utils.auth_utils import project_member_required

projects_bp = Blueprint('projects', __name__, url_prefix='/api/projects')

project_schema = ProjectSchema()
projects_schema = ProjectSchema(many=True)

@projects_bp.route('', methods=['POST'])
@jwt_required()
def create_project():
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        result = project_schema.load(data)
        
        project = Project(
            name=result['name'],
            description=result.get('description'),
            location=result.get('location'),
            start_date=result.get('start_date'),
            end_date=result.get('end_date'),
            status=result.get('status', 'active'),
            created_by_id=current_user_id
        )
        
        db.session.add(project)
        db.session.flush()  # Get the project ID
        
        # Add creator as project member
        creator = User.query.get(current_user_id)
        project.members.append(creator)
        
        db.session.commit()
        
        return jsonify({
            'message': 'Project created successfully',
            'project': project_schema.dump(project)
        }), 201
        
    except ValidationError as err:
        return jsonify({'errors': err.messages}), 400
    except Exception as e:
        current_app.logger.error(f"Project creation error: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@projects_bp.route('', methods=['GET'])
@jwt_required()
def get_projects():
    try:
        current_user_id = get_jwt_identity()
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        status = request.args.get('status')
        search = request.args.get('search', '')
        
        # Get projects where user is a member
        query = Project.query.join(project_users).filter(
            project_users.c.user_id == current_user_id
        )
        
        if status:
            query = query.filter(Project.status == status)
        
        if search:
            query = query.filter(
                db.or_(
                    Project.name.ilike(f'%{search}%'),
                    Project.description.ilike(f'%{search}%'),
                    Project.location.ilike(f'%{search}%')
                )
            )
        
        projects = query.order_by(Project.created_at.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        return jsonify({
            'projects': projects_schema.dump(projects.items),
            'total': projects.total,
            'pages': projects.pages,
            'current_page': page,
            'per_page': per_page
        })
        
    except Exception as e:
        current_app.logger.error(f"Projects fetch error: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@projects_bp.route('/', methods=['GET'])
@jwt_required()
@project_member_required
def get_project(project_id):
    try:
        project = Project.query.get_or_404(project_id)
        return jsonify({'project': project_schema.dump(project)})
        
    except Exception as e:
        current_app.logger.error(f"Project fetch error: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@projects_bp.route('/', methods=['PUT'])
@jwt_required()
@project_member_required
def update_project(project_id):
    try:
        project = Project.query.get_or_404(project_id)
        current_user_id = get_jwt_identity()
        
        # Only creator or admin can edit project
        user = User.query.get(current_user_id)
        if str(project.created_by_id) != current_user_id and user.role != 'admin':
            return jsonify({'error': 'Permission denied'}), 403
        
        data = request.get_json()
        result = project_schema.load(data, partial=True)
        
        for key, value in result.items():
            if key not in ['id', 'created_by', 'created_at']:
                setattr(project, key, value)
        
        db.session.commit()
        
        return jsonify({
            'message': 'Project updated successfully',
            'project': project_schema.dump(project)
        })
        
    except ValidationError as err:
        return jsonify({'errors': err.messages}), 400
    except Exception as e:
        current_app.logger.error(f"Project update error: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@projects_bp.route('//members', methods=['GET'])
@jwt_required()
@project_member_required
def get_project_members(project_id):
    try:
        project = Project.query.get_or_404(project_id)
        
        from ..schemas import UserSchema
        users_schema = UserSchema(many=True)
        
        return jsonify({
            'members': users_schema.dump(project.members)
        })
        
    except Exception as e:
        current_app.logger.error(f"Project members fetch error: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@projects_bp.route('//members', methods=['POST'])
@jwt_required()
@project_member_required
def add_project_member(project_id):
    try:
        project = Project.query.get_or_404(project_id)
        current_user_id = get_jwt_identity()
        
        # Only creator or admin can add members
        user = User.query.get(current_user_id)
        if str(project.created_by_id) != current_user_id and user.role != 'admin':
            return jsonify({'error': 'Permission denied'}), 403
        
        data = request.get_json()
        user_id = data.get('user_id')
        
        if not user_id:
            return jsonify({'error': 'User ID required'}), 400
        
        member = User.query.get(user_id)
        if not member:
            return jsonify({'error': 'User not found'}), 404
        
        if member in project.members:
            return jsonify({'error': 'User is already a member'}), 400
        
        project.members.append(member)
        db.session.commit()
        
        return jsonify({
            'message': 'Member added successfully'
        })
        
    except Exception as e:
        current_app.logger.error(f"Add member error: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@projects_bp.route('//members/', methods=['DELETE'])
@jwt_required()
@project_member_required
def remove_project_member(project_id, user_id):
    try:
        project = Project.query.get_or_404(project_id)
        current_user_id = get_jwt_identity()
        
        # Only creator or admin can remove members
        user = User.query.get(current_user_id)
        if str(project.created_by_id) != current_user_id and user.role != 'admin':
            return jsonify({'error': 'Permission denied'}), 403
        
        # Cannot remove project creator
        if str(project.created_by_id) == user_id:
            return jsonify({'error': 'Cannot remove project creator'}), 400
        
        member = User.query.get(user_id)
        if not member:
            return jsonify({'error': 'User not found'}), 404
        
        if member not in project.members:
            return jsonify({'error': 'User is not a member'}), 400
        
        project.members.remove(member)
        db.session.commit()
        
        return jsonify({
            'message': 'Member removed successfully'
        })
        
    except Exception as e:
        current_app.logger.error(f"Remove member error: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500