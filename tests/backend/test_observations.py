import pytest
from datetime import datetime
from app.models import db, Observation, Species, Project, User

def test_create_observation(client, auth_headers, sample_project, sample_species):
    """Test creating a new observation."""
    observation_data = {
        'project_id': sample_project['id'],
        'species_id': sample_species.id,
        'observation_date': '2024-01-15T10:30:00Z',
        'latitude': -1.2921,
        'longitude': 36.8219,
        'count': 2,
        'behavior': 'Feeding',
        'notes': 'Observed near water source'
    }
    
    response = client.post('/api/observations', json=observation_data, headers=auth_headers)
    
    assert response.status_code == 201
    assert 'observation' in response.json
    assert response.json['observation']['count'] == 2
    assert response.json['observation']['behavior'] == 'Feeding'

def test_create_observation_invalid_species(client, auth_headers, sample_project):
    """Test creating observation with invalid species ID."""
    observation_data = {
        'project_id': sample_project['id'],
        'species_id': '00000000-0000-0000-0000-000000000000',
        'observation_date': '2024-01-15T10:30:00Z',
        'latitude': -1.2921,
        'longitude': 36.8219,
        'count': 1
    }
    
    response = client.post('/api/observations', json=observation_data, headers=auth_headers)
    
    assert response.status_code == 404
    assert 'Species not found' in response.json['error']

def test_create_observation_invalid_coordinates(client, auth_headers, sample_project, sample_species):
    """Test creating observation with invalid coordinates."""
    observation_data = {
        'project_id': sample_project['id'],
        'species_id': sample_species.id,
        'observation_date': '2024-01-15T10:30:00Z',
        'latitude': 91.0,  # Invalid latitude
        'longitude': 36.8219,
        'count': 1
    }
    
    response = client.post('/api/observations', json=observation_data, headers=auth_headers)
    
    assert response.status_code == 400
    assert 'errors' in response.json

def test_get_observations(client, auth_headers, sample_project):
    """Test getting list of observations."""
    response = client.get('/api/observations', headers=auth_headers)
    
    assert response.status_code == 200
    assert 'observations' in response.json
    assert 'total' in response.json
    assert 'pages' in response.json

def test_get_observations_with_filters(client, auth_headers, sample_project, sample_species):
    """Test getting observations with filters."""
    # First create an observation
    observation_data = {
        'project_id': sample_project['id'],
        'species_id': sample_species.id,
        'observation_date': '2024-01-15T10:30:00Z',
        'latitude': -1.2921,
        'longitude': 36.8219,
        'count': 1
    }
    
    client.post('/api/observations', json=observation_data, headers=auth_headers)
    
    # Test filtering by project
    response = client.get(f'/api/observations?project_id={sample_project["id"]}', headers=auth_headers)
    
    assert response.status_code == 200
    assert 'observations' in response.json
    
    # Test filtering by species
    response = client.get(f'/api/observations?species_id={sample_species.id}', headers=auth_headers)
    
    assert response.status_code == 200
    assert 'observations' in response.json

def test_get_observation_detail(client, auth_headers, sample_project, sample_species):
    """Test getting observation details."""
    # First create an observation
    observation_data = {
        'project_id': sample_project['id'],
        'species_id': sample_species.id,
        'observation_date': '2024-01-15T10:30:00Z',
        'latitude': -1.2921,
        'longitude': 36.8219,
        'count': 1
    }
    
    create_response = client.post('/api/observations', json=observation_data, headers=auth_headers)
    observation_id = create_response.json['observation']['id']
    
    response = client.get(f'/api/observations/{observation_id}', headers=auth_headers)
    
    assert response.status_code == 200
    assert 'observation' in response.json
    assert response.json['observation']['id'] == observation_id

def test_update_observation(client, auth_headers, sample_project, sample_species):
    """Test updating an observation."""
    # First create an observation
    observation_data = {
        'project_id': sample_project['id'],
        'species_id': sample_species.id,
        'observation_date': '2024-01-15T10:30:00Z',
        'latitude': -1.2921,
        'longitude': 36.8219,
        'count': 1
    }
    
    create_response = client.post('/api/observations', json=observation_data, headers=auth_headers)
    observation_id = create_response.json['observation']['id']
    
    # Update the observation
    update_data = {
        'count': 3,
        'notes': 'Updated observation notes'
    }
    
    response = client.put(f'/api/observations/{observation_id}', json=update_data, headers=auth_headers)
    
    assert response.status_code == 200
    assert response.json['observation']['count'] == 3
    assert response.json['observation']['notes'] == 'Updated observation notes'

def test_delete_observation(client, auth_headers, sample_project, sample_species):
    """Test deleting an observation."""
    # First create an observation
    observation_data = {
        'project_id': sample_project['id'],
        'species_id': sample_species.id,
        'observation_date': '2024-01-15T10:30:00Z',
        'latitude': -1.2921,
        'longitude': 36.8219,
        'count': 1
    }
    
    create_response = client.post('/api/observations', json=observation_data, headers=auth_headers)
    observation_id = create_response.json['observation']['id']
    
    # Delete the observation
    response = client.delete(f'/api/observations/{observation_id}', headers=auth_headers)
    
    assert response.status_code == 200
    assert 'deleted successfully' in response.json['message']
    
    # Verify observation is deleted
    get_response = client.get(f'/api/observations/{observation_id}', headers=auth_headers)
    assert get_response.status_code == 404

def test_observation_unauthorized_access(client):
    """Test accessing observations without authentication."""
    response = client.get('/api/observations')
    
    assert response.status_code == 401

def test_observation_pagination(client, auth_headers, sample_project, sample_species):
    """Test observation pagination."""
    # Create multiple observations
    for i in range(25):
        observation_data = {
            'project_id': sample_project['id'],
            'species_id': sample_species.id,
            'observation_date': '2024-01-15T10:30:00Z',
            'latitude': -1.2921 + (i * 0.001),
            'longitude': 36.8219 + (i * 0.001),
            'count': 1,
            'notes': f'Observation {i}'
        }
        client.post('/api/observations', json=observation_data, headers=auth_headers)
    
    # Test first page
    response = client.get('/api/observations?page=1&per_page=10', headers=auth_headers)
    
    assert response.status_code == 200
    assert len(response.json['observations']) == 10
    assert response.json['current_page'] == 1
    assert response.json['per_page'] == 10
    assert response.json['total'] >= 25
    
    # Test second page
    response = client.get('/api/observations?page=2&per_page=10', headers=auth_headers)
    
    assert response.status_code == 200
    assert len(response.json['observations']) == 10
    assert response.json['current_page'] == 2

def test_observation_date_filtering(client, auth_headers, sample_project, sample_species):
    """Test filtering observations by date range."""
    # Create observations with different dates
    dates = ['2024-01-15T10:30:00Z', '2024-01-20T10:30:00Z', '2024-01-25T10:30:00Z']
    
    for date in dates:
        observation_data = {
            'project_id': sample_project['id'],
            'species_id': sample_species.id,
            'observation_date': date,
            'latitude': -1.2921,
            'longitude': 36.8219,
            'count': 1
        }
        client.post('/api/observations', json=observation_data, headers=auth_headers)
    
    # Test date range filtering
    response = client.get('/api/observations?start_date=2024-01-18&end_date=2024-01-22', headers=auth_headers)
    
    assert response.status_code == 200
    # Should only return the observation from 2024-01-20
    filtered_observations = [
        obs for obs in response.json['observations']
        if '2024-01-20' in obs['observation_date']
    ]
    assert len(filtered_observations) >= 1

def test_observation_with_media(client, auth_headers, sample_project, sample_species):
    """Test creating observation with media URLs."""
    observation_data = {
        'project_id': sample_project['id'],
        'species_id': sample_species.id,
        'observation_date': '2024-01-15T10:30:00Z',
        'latitude': -1.2921,
        'longitude': 36.8219,
        'count': 1,
        'image_urls': ['/api/uploads/images/test1.jpg', '/api/uploads/images/test2.jpg'],
        'audio_urls': ['/api/uploads/audio/test1.mp3']
    }
    
    response = client.post('/api/observations', json=observation_data, headers=auth_headers)
    
    assert response.status_code == 201
    assert len(response.json['observation']['image_urls']) == 2
    assert len(response.json['observation']['audio_urls']) == 1

def test_observation_export(client, auth_headers, sample_project):
    """Test exporting observations."""
    response = client.get(f'/api/observations/export?project_id={sample_project["id"]}&format=csv', headers=auth_headers)
    
    assert response.status_code == 200
    assert 'task_id' in response.json
    assert 'Export started' in response.json['message']