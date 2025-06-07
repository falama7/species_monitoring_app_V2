from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from marshmallow import ValidationError

from ..models import db, Species, User
from ..schemas import SpeciesSchema
from ..utils.auth_utils import researcher_required

species_bp = Blueprint('species', __name__, url_prefix='/api/species')

species_schema = SpeciesSchema()
species_list_schema = SpeciesSchema(many=True)

@species_bp.route('', methods=['POST'])
@jwt_required()
@researcher_required
def create_species():
    try:
        data = request.get_json()
        result = species_schema.load(data)
        
        species = Species(**result)
        db.session.add(species)
        db.session.commit()
        
        return jsonify({
            'message': 'Species created successfully',
            'species': species_schema.dump(species)
        }), 201
        
    except ValidationError as err:
        return jsonify({'errors': err.messages}), 400
    except Exception as e:
        current_app.logger.error(f"Species creation error: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@species_bp.route('', methods=['GET'])
@jwt_required()
def get_species():
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 50, type=int)
        search = request.args.get('search', '')
        family = request.args.get('family')
        conservation_status = request.args.get('conservation_status')
        
        query = Species.query
        
        if search:
            query = query.filter(
                db.or_(
                    Species.scientific_name.ilike(f'%{search}%'),
                    Species.common_name.ilike(f'%{search}%'),
                    Species.species_code.ilike(f'%{search}%')
                )
            )
        
        if family:
            query = query.filter(Species.family.ilike(f'%{family}%'))
        
        if conservation_status:
            query = query.filter(Species.conservation_status == conservation_status)
        
        species = query.order_by(Species.common_name).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        return jsonify({
            'species': species_list_schema.dump(species.items),
            'total': species.total,
            'pages': species.pages,
            'current_page': page,
            'per_page': per_page
        })
        
    except Exception as e:
        current_app.logger.error(f"Species fetch error: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@species_bp.route('/', methods=['GET'])
@jwt_required()
def get_species_by_id(species_id):
    try:
        species = Species.query.get_or_404(species_id)
        return jsonify({'species': species_schema.dump(species)})
        
    except Exception as e:
        current_app.logger.error(f"Species fetch error: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@species_bp.route('/', methods=['PUT'])
@jwt_required()
@researcher_required
def update_species(species_id):
    try:
        species = Species.query.get_or_404(species_id)
        data = request.get_json()
        result = species_schema.load(data, partial=True)
        
        for key, value in result.items():
            if key not in ['id', 'created_at']:
                setattr(species, key, value)
        
        db.session.commit()
        
        return jsonify({
            'message': 'Species updated successfully',
            'species': species_schema.dump(species)
        })
        
    except ValidationError as err:
        return jsonify({'errors': err.messages}), 400
    except Exception as e:
        current_app.logger.error(f"Species update error: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@species_bp.route('/families', methods=['GET'])
@jwt_required()
def get_families():
    try:
        families = db.session.query(Species.family).distinct().filter(
            Species.family.isnot(None)
        ).order_by(Species.family).all()
        
        return jsonify({
            'families': [family[0] for family in families if family[0]]
        })
        
    except Exception as e:
        current_app.logger.error(f"Families fetch error: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@species_bp.route('/conservation-statuses', methods=['GET'])
@jwt_required()
def get_conservation_statuses():
    try:
        statuses = [
            {'code': 'LC', 'name': 'Least Concern'},
            {'code': 'NT', 'name': 'Near Threatened'},
            {'code': 'VU', 'name': 'Vulnerable'},
            {'code': 'EN', 'name': 'Endangered'},
            {'code': 'CR', 'name': 'Critically Endangered'},
            {'code': 'EW', 'name': 'Extinct in the Wild'},
            {'code': 'EX', 'name': 'Extinct'}
        ]
        
        return jsonify({'conservation_statuses': statuses})
        
    except Exception as e:
        current_app.logger.error(f"Conservation statuses fetch error: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500