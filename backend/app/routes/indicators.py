from flask import Blueprint
indicators_bp = Blueprint('indicators', __name__, url_prefix='/api/indicators')

@indicators_bp.route('/health')
def health():
    return {'status': 'ok'}
