import os
from datetime import timedelta

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-secret-key'
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY') or 'jwt-secret-key'
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=1)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)
    
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or \
        'postgresql://species_user:password@localhost/species_monitoring'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    REDIS_URL = os.environ.get('REDIS_URL') or 'redis://localhost:6379/0'
    
    # Correction du cache - utiliser 'simple' au lieu de null
    CACHE_TYPE = 'SimpleCache'
    CACHE_DEFAULT_TIMEOUT = 300
    
    CELERY_BROKER_URL = os.environ.get('REDIS_URL') or 'redis://localhost:6379/0'
    CELERY_RESULT_BACKEND = os.environ.get('REDIS_URL') or 'redis://localhost:6379/0'
    
    UPLOAD_FOLDER = os.environ.get('UPLOAD_FOLDER') or 'uploads'
    MAX_CONTENT_LENGTH = int(os.environ.get('MAX_CONTENT_LENGTH', 16 * 1024 * 1024))
    
    MAIL_SERVER = os.environ.get('MAIL_SERVER')
    MAIL_PORT = int(os.environ.get('MAIL_PORT') or 587)
    MAIL_USE_TLS = os.environ.get('MAIL_USE_TLS', 'true').lower() in ['true', 'on', '1']
    MAIL_USERNAME = os.environ.get('MAIL_USERNAME')
    MAIL_PASSWORD = os.environ.get('MAIL_PASSWORD')
    
    GEOCODING_API_KEY = os.environ.get('GEOCODING_API_KEY')
    WEATHER_API_KEY = os.environ.get('WEATHER_API_KEY')

class DevelopmentConfig(Config):
    DEBUG = True
    CACHE_TYPE = 'SimpleCache'

class ProductionConfig(Config):
    DEBUG = False
    CACHE_TYPE = 'RedisCache'
    CACHE_REDIS_URL = os.environ.get('REDIS_URL')

class TestingConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
    CACHE_TYPE = 'NullCache'

config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'default': DevelopmentConfig
}