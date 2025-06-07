from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from flask_mail import Mail
from flask_caching import Cache

from .config import config
from .models import db

migrate = Migrate()
jwt = JWTManager()
mail = Mail()
cache = Cache()

def create_app(config_name='default'):
    app = Flask(__name__)
    app.config.from_object(config[config_name])
    
    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    CORS(app)
    mail.init_app(app)
    cache.init_app(app)
    
    # Register CLI commands
    from . import cli
    cli.init_app(app)
    
    # Register blueprints
    from .routes.auth import auth_bp
    from .routes.projects import projects_bp
    from .routes.observations import observations_bp
    from .routes.species import species_bp
    from .routes.indicators import indicators_bp
    from .routes.resources import resources_bp
    from .routes.uploads import uploads_bp
    from .routes.reports import reports_bp
    
    app.register_blueprint(auth_bp)
    app.register_blueprint(projects_bp)
    app.register_blueprint(observations_bp)
    app.register_blueprint(species_bp)
    app.register_blueprint(indicators_bp)
    app.register_blueprint(resources_bp)
    app.register_blueprint(uploads_bp)
    app.register_blueprint(reports_bp)
    
    # Error handlers
    @app.errorhandler(404)
    def not_found(error):
        return {'error': 'Resource not found'}, 404
    
    @app.errorhandler(500)
    def internal_error(error):
        return {'error': 'Internal server error'}, 500
    
    # Health check endpoint
    @app.route('/health')
    def health_check():
        return {'status': 'healthy', 'message': 'Species Monitoring API is running'}
    
    return app