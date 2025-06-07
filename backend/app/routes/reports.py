from flask import Blueprint
reports_bp = Blueprint('reports', __name__, url_prefix='/api/reports')

@reports_bp.route('/health')
def health():
    return {'status': 'ok'}
