from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from marshmallow import ValidationError
from datetime import datetime

from ..models import db, Observation, Project, Species, User, project_users
from ..schemas import ObservationSchema
from ..utils.geo_utils import get_location_name

observations_bp = Blueprint('observations', __name__, url_prefix='/api/observations')

observation_schema = ObservationSchema()
observations_schema = ObservationSchema(many=True)

@observations_bp.route('', methods=['POST'])
@jwt_required()
def create_observation():
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        result = observation_schema.load(data)
        
        # Verify user is member of the project
        project = Project.query.get(result['project_id'])
        if not project:
            return jsonify({'error': 'Project not found'}), 404
        
        user = User.query.get(current_user_id)
        if user not in project.members and user.role != 'admin':
            return jsonify({'error': 'Access denied to this project'}), 403
        
        # Verify species exists
        species = Species.query.get(result['species_id'])
        if not species:
            return jsonify({'error': 'Species not found'}), 404
        
        # Get location name if not provided
        location_name = result.get('location_name')
        if not location_name:
            try:
                location_name = get_location_name(result['latitude'], result['longitude'])
            except:
                location_name = f"Location ({result['latitude']:.4f}, {result['longitude']:.4f})"
        
        observation = Observation(
            project_id=result['project_id'],
            species_id=result['species_id'],
            observer_id=current_user_id,
            observation_date=result['observation_date'],
            latitude=result['latitude'],
            longitude=result['longitude'],
            location_name=location_name,
            count=result.get('count', 1),
            behavior=result.get('behavior'),
            habitat_description=result.get('habitat_description'),
            weather_conditions=result.get('weather_conditions'),
            notes=result.get('notes'),
            image_urls=result.get('image_urls', []),
            audio_urls=result.get('audio_urls', []),
            accuracy=result.get('accuracy'),
            altitude=result.get('altitude')
        )
        
        db.session.add(observation)
        db.session.commit()
        
        return jsonify({
            'message': 'Observation created successfully',
            'observation': observation_schema.dump(observation)
        }), 201
        
    except ValidationError as err:
        return jsonify({'errors': err.messages}), 400
    except Exception as e:
        current_app.logger.error(f"Observation creation error: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@observations_bp.route('', methods=['GET'])
@jwt_required()
def get_observations():
    try:
        current_user_id = get_jwt_identity()
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        project_id = request.args.get('project_id')
        species_id = request.args.get('species_id')
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        
        # Base query - only observations from projects user is member of
        query = db.session.query(Observation).join(Project).join(project_users).filter(
            project_users.c.user_id == current_user_id
        )
        
        if project_id:
            query = query.filter(Observation.project_id == project_id)
        
        if species_id:
            query = query.filter(Observation.species_id == species_id)
        
        if start_date:
            start_dt = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
            query = query.filter(Observation.observation_date >= start_dt)
        
        if end_date:
            end_dt = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
            query = query.filter(Observation.observation_date <= end_dt)
        
        observations = query.order_by(Observation.observation_date.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        return jsonify({
            'observations': observations_schema.dump(observations.items),
            'total': observations.total,
            'pages': observations.pages,
            'current_page': page,
            'per_page': per_page
        })
        
    except Exception as e:
        current_app.logger.error(f"Observations fetch error: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@observations_bp.route('/', methods=['GET'])
@jwt_required()
def get_observation(observation_id):
    try:
        current_user_id = get_jwt_identity()
        
        # Verify user has access to this observation
        observation = db.session.query(Observation).join(Project).join(project_users).filter(
            Observation.id == observation_id,
            project_users.c.user_id == current_user_id
        ).first()
        
        if not observation:
            return jsonify({'error': 'Observation not found'}), 404
        
        return jsonify({'observation': observation_schema.dump(observation)})
        
    except Exception as e:
        current_app.logger.error(f"Observation fetch error: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@observations_bp.route('/', methods=['PUT'])
@jwt_required()
def update_observation(observation_id):
    try:
        current_user_id = get_jwt_identity()
        
        observation = Observation.query.get_or_404(observation_id)
        
        # Only observer or admin can edit
        user = User.query.get(current_user_id)
        if str(observation.observer_id) != current_user_id and user.role != 'admin':
            return jsonify({'error': 'Permission denied'}), 403
        
        data = request.get_json()
        result = observation_schema.load(data, partial=True)
        
        for key, value in result.items():
            if key not in ['id', 'observer', 'created_at']:
                setattr(observation, key, value)
        
        db.session.commit()
        
        return jsonify({
            'message': 'Observation updated successfully',
            'observation': observation_schema.dump(observation)
        })
        
    except ValidationError as err:
        return jsonify({'errors': err.messages}), 400
    except Exception as e:
        current_app.logger.error(f"Observation update error: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@observations_bp.route('/', methods=['DELETE'])
@jwt_required()
def delete_observation(observation_id):
    try:
        current_user_id = get_jwt_identity()
        
        observation = Observation.query.get_or_404(observation_id)
        
        # Only observer or admin can delete
        user = User.query.get(current_user_id)
        if str(observation.observer_id) != current_user_id and user.role != 'admin':
            return jsonify({'error': 'Permission denied'}), 403
        
        db.session.delete(observation)
        db.session.commit()
        
        return jsonify({'message': 'Observation deleted successfully'})
        
    except Exception as e:
        current_app.logger.error(f"Observation deletion error: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@observations_bp.route('/export', methods=['GET'])
@jwt_required()
def export_observations():
    try:
        current_user_id = get_jwt_identity()
        project_id = request.args.get('project_id')
        format_type = request.args.get('format', 'csv')
        
        if not project_id:
            return jsonify({'error': 'Project ID required'}), 400
        
        # Verify user has access to project
        project = Project.query.join(project_users).filter(
            Project.id == project_id,
            project_users.c.user_id == current_user_id
        ).first()
        
        if not project:
            return jsonify({'error': 'Project not found or access denied'}), 404
        
        # Queue export task
        from ..tasks import export_observations_task
        task = export_observations_task.delay(project_id, format_type, current_user_id)
        
        return jsonify({
            'message': 'Export started',
            'task_id': task.id
        })
        
    except Exception as e:
        current_app.logger.error(f"Export error: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500