import pytest
import tempfile
import os
from app import create_app
from app.models import db, User, Species, Project, Observation

@pytest.fixture
def app():
    """Create application for the tests."""
    # Create a temporary file to use as the database
    db_fd, db_path = tempfile.mkstemp()
    
    app = create_app('testing')
    app.config['DATABASE_URL'] = f'sqlite:///{db_path}'
    app.config['TESTING'] = True
    app.config['WTF_CSRF_ENABLED'] = False
    
    with app.app_context():
        db.create_all()
        yield app
        db.drop_all()
    
    os.close(db_fd)
    os.unlink(db_path)

@pytest.fixture
def client(app):
    """A test client for the app."""
    return app.test_client()

@pytest.fixture
def runner(app):
    """A test runner for the app's Click commands."""
    return app.test_cli_runner()

@pytest.fixture
def auth_headers(client):
    """Get authorization headers for authenticated requests."""
    # Create a test user
    user_data = {
        'username': 'testuser',
        'email': 'test@example.com',
        'password': 'testpass123',
        'first_name': 'Test',
        'last_name': 'User',
        'role': 'observer'
    }
    
    # Register user
    client.post('/api/auth/register', json=user_data)
    
    # Login to get token
    login_data = {
        'username': 'testuser',
        'password': 'testpass123'
    }
    
    response = client.post('/api/auth/login', json=login_data)
    token = response.json['access_token']
    
    return {'Authorization': f'Bearer {token}'}

@pytest.fixture
def admin_headers(client):
    """Get authorization headers for admin user."""
    user_data = {
        'username': 'admin',
        'email': 'admin@example.com',
        'password': 'admin123',
        'first_name': 'Admin',
        'last_name': 'User',
        'role': 'admin'
    }
    
    client.post('/api/auth/register', json=user_data)
    
    login_data = {
        'username': 'admin',
        'password': 'admin123'
    }
    
    response = client.post('/api/auth/login', json=login_data)
    token = response.json['access_token']
    
    return {'Authorization': f'Bearer {token}'}

@pytest.fixture
def sample_species(app):
    """Create sample species for testing."""
    with app.app_context():
        species = Species(
            scientific_name='Panthera leo',
            common_name='African Lion',
            family='Felidae',
            genus='Panthera',
            species_code='PLEO',
            conservation_status='VU'
        )
        db.session.add(species)
        db.session.commit()
        return species

@pytest.fixture
def sample_project(app, auth_headers, client):
    """Create sample project for testing."""
    project_data = {
        'name': 'Test Project',
        'description': 'A test project',
        'location': 'Test Location',
        'status': 'active'
    }
    
    response = client.post('/api/projects', json=project_data, headers=auth_headers)
    return response.json['project']