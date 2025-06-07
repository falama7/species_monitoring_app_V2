from flask import Blueprint
resources_bp = Blueprint('resources', __name__, url_prefix='/api/resources')

@resources_bp.route('/health')
def health():
    return {'status': 'ok'}
