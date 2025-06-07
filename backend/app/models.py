from datetime import datetime
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from sqlalchemy.dialects.postgresql import UUID
import uuid

db = SQLAlchemy()

# Association tables for many-to-many relationships
project_users = db.Table('project_users',
    db.Column('project_id', UUID(as_uuid=True), db.ForeignKey('projects.id'), primary_key=True),
    db.Column('user_id', UUID(as_uuid=True), db.ForeignKey('users.id'), primary_key=True)
)

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    first_name = db.Column(db.String(50), nullable=False)
    last_name = db.Column(db.String(50), nullable=False)
    role = db.Column(db.String(20), default='observer')
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_login = db.Column(db.DateTime)
    
    # Relationships
    observations = db.relationship('Observation', backref='observer', lazy=True)
    projects = db.relationship('Project', secondary=project_users, back_populates='members')
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)
    
    def to_dict(self):
        return {
            'id': str(self.id),
            'username': self.username,
            'email': self.email,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'role': self.role,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'last_login': self.last_login.isoformat() if self.last_login else None
        }

class Species(db.Model):
    __tablename__ = 'species'
    
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    scientific_name = db.Column(db.String(100), unique=True, nullable=False)
    common_name = db.Column(db.String(100), nullable=False)
    family = db.Column(db.String(50))
    genus = db.Column(db.String(50))
    species_code = db.Column(db.String(10), unique=True)
    conservation_status = db.Column(db.String(20))
    description = db.Column(db.Text)
    habitat = db.Column(db.String(200))
    image_url = db.Column(db.String(255))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    observations = db.relationship('Observation', backref='species', lazy=True)
    
    def to_dict(self):
        return {
            'id': str(self.id),
            'scientific_name': self.scientific_name,
            'common_name': self.common_name,
            'family': self.family,
            'genus': self.genus,
            'species_code': self.species_code,
            'conservation_status': self.conservation_status,
            'description': self.description,
            'habitat': self.habitat,
            'image_url': self.image_url,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class Project(db.Model):
    __tablename__ = 'projects'
    
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    location = db.Column(db.String(200))
    start_date = db.Column(db.Date)
    end_date = db.Column(db.Date)
    status = db.Column(db.String(20), default='active')
    created_by_id = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    created_by = db.relationship('User', foreign_keys=[created_by_id])
    members = db.relationship('User', secondary=project_users, back_populates='projects')
    observations = db.relationship('Observation', backref='project', lazy=True)
    
    def to_dict(self):
        return {
            'id': str(self.id),
            'name': self.name,
            'description': self.description,
            'location': self.location,
            'start_date': self.start_date.isoformat() if self.start_date else None,
            'end_date': self.end_date.isoformat() if self.end_date else None,
            'status': self.status,
            'created_by': self.created_by.to_dict() if self.created_by else None,
            'members_count': len(self.members),
            'observations_count': len(self.observations),
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

class Observation(db.Model):
    __tablename__ = 'observations'
    
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = db.Column(UUID(as_uuid=True), db.ForeignKey('projects.id'), nullable=False)
    species_id = db.Column(UUID(as_uuid=True), db.ForeignKey('species.id'), nullable=False)
    observer_id = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id'), nullable=False)
    
    # Observation details
    observation_date = db.Column(db.DateTime, nullable=False)
    latitude = db.Column(db.Float, nullable=False)
    longitude = db.Column(db.Float, nullable=False)
    location_name = db.Column(db.String(200))
    count = db.Column(db.Integer, default=1)
    behavior = db.Column(db.String(100))
    habitat_description = db.Column(db.Text)
    weather_conditions = db.Column(db.String(100))
    notes = db.Column(db.Text)
    
    # Media
    image_urls = db.Column(db.JSON)
    audio_urls = db.Column(db.JSON)
    
    # Metadata
    accuracy = db.Column(db.Float)  # GPS accuracy in meters
    altitude = db.Column(db.Float)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': str(self.id),
            'project_id': str(self.project_id),
            'species': self.species.to_dict() if self.species else None,
            'observer': self.observer.to_dict() if self.observer else None,
            'observation_date': self.observation_date.isoformat() if self.observation_date else None,
            'latitude': self.latitude,
            'longitude': self.longitude,
            'location_name': self.location_name,
            'count': self.count,
            'behavior': self.behavior,
            'habitat_description': self.habitat_description,
            'weather_conditions': self.weather_conditions,
            'notes': self.notes,
            'image_urls': self.image_urls or [],
            'audio_urls': self.audio_urls or [],
            'accuracy': self.accuracy,
            'altitude': self.altitude,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

class Indicator(db.Model):
    __tablename__ = 'indicators'
    
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = db.Column(UUID(as_uuid=True), db.ForeignKey('projects.id'), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    metric_type = db.Column(db.String(50), nullable=False)  # count, density, diversity, etc.
    value = db.Column(db.Float)
    unit = db.Column(db.String(20))
    calculation_date = db.Column(db.DateTime, default=datetime.utcnow)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': str(self.id),
            'project_id': str(self.project_id),
            'name': self.name,
            'description': self.description,
            'metric_type': self.metric_type,
            'value': self.value,
            'unit': self.unit,
            'calculation_date': self.calculation_date.isoformat() if self.calculation_date else None,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class Resource(db.Model):
    __tablename__ = 'resources'
    
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    resource_type = db.Column(db.String(50), nullable=False)  # guide, template, manual, etc.
    category = db.Column(db.String(50))
    file_url = db.Column(db.String(255))
    external_url = db.Column(db.String(255))
    is_public = db.Column(db.Boolean, default=True)
    created_by_id = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    created_by = db.relationship('User', foreign_keys=[created_by_id])
    
    def to_dict(self):
        return {
            'id': str(self.id),
            'title': self.title,
            'description': self.description,
            'resource_type': self.resource_type,
            'category': self.category,
            'file_url': self.file_url,
            'external_url': self.external_url,
            'is_public': self.is_public,
            'created_by': self.created_by.to_dict() if self.created_by else None,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }