from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import create_access_token, create_refresh_token, jwt_required, get_jwt_identity
from marshmallow import ValidationError
from datetime import datetime

from ..models import db, User
from ..schemas import UserSchema, LoginSchema
from ..utils.auth_utils import admin_required

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

user_schema = UserSchema()
users_schema = UserSchema(many=True)
login_schema = LoginSchema()

@auth_bp.route('/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        
        # Validate input data
        result = user_schema.load(data)
        
        # Check if user already exists
        if User.query.filter_by(username=result['username']).first():
            return jsonify({'error': 'Username already exists'}), 400
        
        if User.query.filter_by(email=result['email']).first():
            return jsonify({'error': 'Email already exists'}), 400
        
        # Create new user
        user = User(
            username=result['username'],
            email=result['email'],
            first_name=result['first_name'],
            last_name=result['last_name'],
            role=result.get('role', 'observer')
        )
        user.set_password(result['password'])
        
        db.session.add(user)
        db.session.commit()
        
        # Create tokens
        access_token = create_access_token(identity=str(user.id))
        refresh_token = create_refresh_token(identity=str(user.id))
        
        return jsonify({
            'message': 'User created successfully',
            'user': user_schema.dump(user),
            'access_token': access_token,
            'refresh_token': refresh_token
        }), 201
        
    except ValidationError as err:
        return jsonify({'errors': err.messages}), 400
    except Exception as e:
        current_app.logger.error(f"Registration error: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        result = login_schema.load(data)
        
        user = User.query.filter_by(username=result['username']).first()
        
        if user and user.check_password(result['password']) and user.is_active:
            # Update last login
            user.last_login = datetime.utcnow()
            db.session.commit()
            
            # Create tokens
            access_token = create_access_token(identity=str(user.id))
            refresh_token = create_refresh_token(identity=str(user.id))
            
            return jsonify({
                'message': 'Login successful',
                'user': user_schema.dump(user),
                'access_token': access_token,
                'refresh_token': refresh_token
            })
        else:
            return jsonify({'error': 'Invalid credentials'}), 401
            
    except ValidationError as err:
        return jsonify({'errors': err.messages}), 400
    except Exception as e:
        current_app.logger.error(f"Login error: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@auth_bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user or not user.is_active:
            return jsonify({'error': 'User not found or inactive'}), 404
        
        access_token = create_access_token(identity=str(user.id))
        
        return jsonify({
            'access_token': access_token,
            'user': user_schema.dump(user)
        })
        
    except Exception as e:
        current_app.logger.error(f"Token refresh error: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@auth_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_profile():
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        return jsonify({'user': user_schema.dump(user)})
        
    except Exception as e:
        current_app.logger.error(f"Profile fetch error: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@auth_bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        data = request.get_json()
        
        # Remove fields that shouldn't be updated via this endpoint
        data.pop('id', None)
        data.pop('username', None)  # Username changes require admin
        data.pop('role', None)      # Role changes require admin
        data.pop('password', None)  # Password changes have separate endpoint
        
        result = user_schema.load(data, partial=True)
        
        for key, value in result.items():
            setattr(user, key, value)
        
        db.session.commit()
        
        return jsonify({
            'message': 'Profile updated successfully',
            'user': user_schema.dump(user)
        })
        
    except ValidationError as err:
        return jsonify({'errors': err.messages}), 400
    except Exception as e:
        current_app.logger.error(f"Profile update error: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@auth_bp.route('/change-password', methods=['POST'])
@jwt_required()
def change_password():
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        data = request.get_json()
        current_password = data.get('current_password')
        new_password = data.get('new_password')
        
        if not current_password or not new_password:
            return jsonify({'error': 'Current and new password required'}), 400
        
        if not user.check_password(current_password):
            return jsonify({'error': 'Current password is incorrect'}), 400
        
        if len(new_password) < 6:
            return jsonify({'error': 'New password must be at least 6 characters'}), 400
        
        user.set_password(new_password)
        db.session.commit()
        
        return jsonify({'message': 'Password changed successfully'})
        
    except Exception as e:
        current_app.logger.error(f"Password change error: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@auth_bp.route('/users', methods=['GET'])
@jwt_required()
@admin_required
def get_users():
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        search = request.args.get('search', '')
        
        query = User.query
        
        if search:
            query = query.filter(
                db.or_(
                    User.username.ilike(f'%{search}%'),
                    User.email.ilike(f'%{search}%'),
                    User.first_name.ilike(f'%{search}%'),
                    User.last_name.ilike(f'%{search}%')
                )
            )
        
        users = query.paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        return jsonify({
            'users': users_schema.dump(users.items),
            'total': users.total,
            'pages': users.pages,
            'current_page': page,
            'per_page': per_page
        })
        
    except Exception as e:
        current_app.logger.error(f"Users fetch error: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500