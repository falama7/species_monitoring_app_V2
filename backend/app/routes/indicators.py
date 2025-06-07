from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from marshmallow import ValidationError
from datetime import datetime, timedelta
from sqlalchemy import func, distinct, and_, or_
from collections import defaultdict

from ..models import db, Observation, Species, Project, User, Indicator, project_users
from ..schemas import IndicatorSchema
from ..utils.auth_utils import researcher_required, project_member_required

indicators_bp = Blueprint('indicators', __name__, url_prefix='/api/indicators')

indicator_schema = IndicatorSchema()
indicators_schema = IndicatorSchema(many=True)

@indicators_bp.route('/health')
def health():
    return {'status': 'ok'}

@indicators_bp.route('', methods=['POST'])
@jwt_required()
@researcher_required
def create_indicator():
    """Create a new indicator."""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        result = indicator_schema.load(data)
        
        # Verify project access
        project = Project.query.get(result['project_id'])
        if not project:
            return jsonify({'error': 'Project not found'}), 404
        
        # Check if user is project member or admin
        user = User.query.get(current_user_id)
        if user not in project.members and user.role != 'admin':
            return jsonify({'error': 'Access denied to this project'}), 403
        
        indicator = Indicator(**result)
        db.session.add(indicator)
        db.session.commit()
        
        return jsonify({
            'message': 'Indicator created successfully',
            'indicator': indicator_schema.dump(indicator)
        }), 201
        
    except ValidationError as err:
        return jsonify({'errors': err.messages}), 400
    except Exception as e:
        current_app.logger.error(f"Indicator creation error: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@indicators_bp.route('', methods=['GET'])
@jwt_required()
def get_indicators():
    """Get list of indicators with filters."""
    try:
        current_user_id = get_jwt_identity()
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        project_id = request.args.get('project_id')
        metric_type = request.args.get('metric_type')
        
        # Base query - only indicators from projects user is member of
        query = db.session.query(Indicator).join(Project).join(project_users).filter(
            project_users.c.user_id == current_user_id
        )
        
        if project_id:
            query = query.filter(Indicator.project_id == project_id)
        
        if metric_type:
            query = query.filter(Indicator.metric_type == metric_type)
        
        indicators = query.order_by(Indicator.calculation_date.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        return jsonify({
            'indicators': indicators_schema.dump(indicators.items),
            'total': indicators.total,
            'pages': indicators.pages,
            'current_page': page,
            'per_page': per_page
        })
        
    except Exception as e:
        current_app.logger.error(f"Indicators fetch error: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@indicators_bp.route('/<indicator_id>', methods=['GET'])
@jwt_required()
def get_indicator(indicator_id):
    """Get specific indicator details."""
    try:
        current_user_id = get_jwt_identity()
        
        # Verify user has access to this indicator
        indicator = db.session.query(Indicator).join(Project).join(project_users).filter(
            Indicator.id == indicator_id,
            project_users.c.user_id == current_user_id
        ).first()
        
        if not indicator:
            return jsonify({'error': 'Indicator not found'}), 404
        
        return jsonify({'indicator': indicator_schema.dump(indicator)})
        
    except Exception as e:
        current_app.logger.error(f"Indicator fetch error: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@indicators_bp.route('/calculate', methods=['POST'])
@jwt_required()
@researcher_required
def calculate_indicators():
    """Calculate indicators for a project."""
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
        
        # Calculate various indicators
        indicators = calculate_project_indicators(project_id)
        
        return jsonify({
            'message': 'Indicators calculated successfully',
            'indicators': indicators
        })
        
    except Exception as e:
        current_app.logger.error(f"Indicator calculation error: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@indicators_bp.route('/summary', methods=['GET'])
@jwt_required()
def get_indicators_summary():
    """Get summary of indicators for a project."""
    try:
        current_user_id = get_jwt_identity()
        project_id = request.args.get('project_id')
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        
        if not project_id:
            return jsonify({'error': 'Project ID is required'}), 400
        
        # Verify project access
        project = db.session.query(Project).join(project_users).filter(
            Project.id == project_id,
            project_users.c.user_id == current_user_id
        ).first()
        
        if not project:
            return jsonify({'error': 'Project not found or access denied'}), 404
        
        # Get observations for the project
        query = Observation.query.filter_by(project_id=project_id)
        
        if start_date:
            start_dt = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
            query = query.filter(Observation.observation_date >= start_dt)
        
        if end_date:
            end_dt = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
            query = query.filter(Observation.observation_date <= end_dt)
        
        observations = query.all()
        
        # Calculate summary statistics
        summary = calculate_summary_statistics(observations)
        
        return jsonify(summary)
        
    except Exception as e:
        current_app.logger.error(f"Indicators summary error: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@indicators_bp.route('/time-series', methods=['GET'])
@jwt_required()
def get_time_series():
    """Get time series data for indicators."""
    try:
        current_user_id = get_jwt_identity()
        project_id = request.args.get('project_id')
        metric_type = request.args.get('metric_type', 'count')
        interval = request.args.get('interval', 'monthly')
        species_id = request.args.get('species_id')
        
        if not project_id:
            return jsonify({'error': 'Project ID is required'}), 400
        
        # Verify project access
        project = db.session.query(Project).join(project_users).filter(
            Project.id == project_id,
            project_users.c.user_id == current_user_id
        ).first()
        
        if not project:
            return jsonify({'error': 'Project not found or access denied'}), 404
        
        # Generate time series data
        time_series = generate_time_series_data(project_id, metric_type, interval, species_id)
        
        return jsonify(time_series)
        
    except Exception as e:
        current_app.logger.error(f"Time series error: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@indicators_bp.route('/spatial', methods=['GET'])
@jwt_required()
def get_spatial_indicators():
    """Get spatial distribution indicators."""
    try:
        current_user_id = get_jwt_identity()
        project_id = request.args.get('project_id')
        grid_size = request.args.get('grid_size', 0.01, type=float)
        species_id = request.args.get('species_id')
        
        if not project_id:
            return jsonify({'error': 'Project ID is required'}), 400
        
        # Verify project access
        project = db.session.query(Project).join(project_users).filter(
            Project.id == project_id,
            project_users.c.user_id == current_user_id
        ).first()
        
        if not project:
            return jsonify({'error': 'Project not found or access denied'}), 404
        
        # Generate spatial distribution data
        spatial_data = generate_spatial_distribution(project_id, grid_size, species_id)
        
        return jsonify(spatial_data)
        
    except Exception as e:
        current_app.logger.error(f"Spatial indicators error: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@indicators_bp.route('/diversity', methods=['GET'])
@jwt_required()
def get_diversity_indicators():
    """Get species diversity indicators."""
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
        
        # Calculate diversity indicators
        diversity = calculate_diversity_indicators(project_id)
        
        return jsonify(diversity)
        
    except Exception as e:
        current_app.logger.error(f"Diversity indicators error: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

def calculate_project_indicators(project_id):
    """Calculate all indicators for a project."""
    observations = Observation.query.filter_by(project_id=project_id).all()
    
    indicators = []
    
    # Total observations
    total_obs = len(observations)
    indicators.append({
        'name': 'Total Observations',
        'metric_type': 'count',
        'value': total_obs,
        'unit': 'observations'
    })
    
    # Species richness
    unique_species = len(set(obs.species_id for obs in observations))
    indicators.append({
        'name': 'Species Richness',
        'metric_type': 'diversity',
        'value': unique_species,
        'unit': 'species'
    })
    
    # Total individuals
    total_individuals = sum(obs.count for obs in observations)
    indicators.append({
        'name': 'Total Individuals',
        'metric_type': 'abundance',
        'value': total_individuals,
        'unit': 'individuals'
    })
    
    # Shannon diversity index
    if observations:
        shannon_index = calculate_shannon_diversity(observations)
        indicators.append({
            'name': 'Shannon Diversity Index',
            'metric_type': 'diversity',
            'value': shannon_index,
            'unit': 'index'
        })
    
    return indicators

def calculate_summary_statistics(observations):
    """Calculate summary statistics from observations."""
    total_observations = len(observations)
    unique_species = len(set(obs.species_id for obs in observations))
    total_individuals = sum(obs.count for obs in observations)
    
    # Species frequency
    species_counts = defaultdict(int)
    for obs in observations:
        species_counts[obs.species_id] += obs.count
    
    # Temporal distribution
    temporal_dist = defaultdict(int)
    for obs in observations:
        month = obs.observation_date.strftime('%Y-%m')
        temporal_dist[month] += 1
    
    # Most common species
    most_common = []
    if species_counts:
        sorted_species = sorted(species_counts.items(), key=lambda x: x[1], reverse=True)
        for species_id, count in sorted_species[:5]:
            species = Species.query.get(species_id)
            if species:
                most_common.append({
                    'species': species.common_name,
                    'count': count
                })
    
    return {
        'total_observations': total_observations,
        'unique_species': unique_species,
        'total_individuals': total_individuals,
        'species_frequency': dict(species_counts),
        'temporal_distribution': dict(temporal_dist),
        'most_common_species': most_common
    }

def generate_time_series_data(project_id, metric_type, interval, species_id=None):
    """Generate time series data for observations."""
    query = Observation.query.filter_by(project_id=project_id)
    
    if species_id:
        query = query.filter_by(species_id=species_id)
    
    observations = query.order_by(Observation.observation_date).all()
    
    # Group by time interval
    time_groups = defaultdict(int)
    
    for obs in observations:
        if interval == 'daily':
            key = obs.observation_date.strftime('%Y-%m-%d')
        elif interval == 'weekly':
            # Get start of week
            start = obs.observation_date - timedelta(days=obs.observation_date.weekday())
            key = start.strftime('%Y-%m-%d')
        elif interval == 'monthly':
            key = obs.observation_date.strftime('%Y-%m')
        elif interval == 'yearly':
            key = obs.observation_date.strftime('%Y')
        else:
            key = obs.observation_date.strftime('%Y-%m')
        
        if metric_type == 'count':
            time_groups[key] += 1
        elif metric_type == 'abundance':
            time_groups[key] += obs.count
    
    # Convert to lists for charting
    dates = sorted(time_groups.keys())
    values = [time_groups[date] for date in dates]
    
    return {
        'dates': dates,
        'values': values,
        'metric_type': metric_type,
        'interval': interval
    }

def generate_spatial_distribution(project_id, grid_size, species_id=None):
    """Generate spatial distribution data."""
    query = Observation.query.filter_by(project_id=project_id)
    
    if species_id:
        query = query.filter_by(species_id=species_id)
    
    observations = query.all()
    
    # Create spatial grid
    if not observations:
        return {
            'type': 'FeatureCollection',
            'features': []
        }
    
    # Find bounds
    lats = [obs.latitude for obs in observations]
    lons = [obs.longitude for obs in observations]
    
    min_lat, max_lat = min(lats), max(lats)
    min_lon, max_lon = min(lons), max(lons)
    
    # Create grid
    grid_features = []
    lat = min_lat
    while lat <= max_lat:
        lon = min_lon
        while lon <= max_lon:
            # Count observations in this grid cell
            count = sum(1 for obs in observations 
                       if lat <= obs.latitude < lat + grid_size 
                       and lon <= obs.longitude < lon + grid_size)
            
            if count > 0:
                feature = {
                    'type': 'Feature',
                    'geometry': {
                        'type': 'Polygon',
                        'coordinates': [[
                            [lon, lat],
                            [lon + grid_size, lat],
                            [lon + grid_size, lat + grid_size],
                            [lon, lat + grid_size],
                            [lon, lat]
                        ]]
                    },
                    'properties': {
                        'density': count,
                        'lat': lat,
                        'lon': lon
                    }
                }
                grid_features.append(feature)
            
            lon += grid_size
        lat += grid_size
    
    return {
        'type': 'FeatureCollection',
        'features': grid_features
    }

def calculate_diversity_indicators(project_id):
    """Calculate species diversity indicators."""
    observations = Observation.query.filter_by(project_id=project_id).all()
    
    if not observations:
        return {
            'species_richness': 0,
            'shannon_index': 0,
            'simpson_index': 0,
            'evenness': 0
        }
    
    # Count species abundances
    species_counts = defaultdict(int)
    for obs in observations:
        species_counts[obs.species_id] += obs.count
    
    # Species richness
    richness = len(species_counts)
    
    # Shannon diversity index
    shannon = calculate_shannon_diversity(observations)
    
    # Simpson diversity index
    simpson = calculate_simpson_diversity(list(species_counts.values()))
    
    # Evenness (Shannon evenness)
    max_shannon = math.log(richness) if richness > 1 else 0
    evenness = shannon / max_shannon if max_shannon > 0 else 0
    
    return {
        'species_richness': richness,
        'shannon_index': shannon,
        'simpson_index': simpson,
        'evenness': evenness,
        'total_individuals': sum(species_counts.values())
    }

def calculate_shannon_diversity(observations):
    """Calculate Shannon diversity index."""
    import math
    
    # Count species abundances
    species_counts = defaultdict(int)
    for obs in observations:
        species_counts[obs.species_id] += obs.count
    
    total_individuals = sum(species_counts.values())
    
    if total_individuals <= 1:
        return 0
    
    shannon = 0
    for count in species_counts.values():
        if count > 0:
            proportion = count / total_individuals
            shannon -= proportion * math.log(proportion)
    
    return shannon

def calculate_simpson_diversity(species_counts):
    """Calculate Simpson diversity index."""
    total = sum(species_counts)
    
    if total <= 1:
        return 0
    
    simpson = 0
    for count in species_counts:
        proportion = count / total
        simpson += proportion ** 2
    
    return 1 - simpson