import pytest
from datetime import date

def test_create_project(client, auth_headers):
    """Test creating a new project."""
    project_data = {
        'name': 'Wildlife Survey',
        'description': 'Survey of local wildlife',
        'location': 'National Park',
        'start_date': '2024-01-01',
        'end_date': '2024-12-31',
        'status': 'active'
    }
    
    response = client.post('/api/projects', json=project_data, headers=auth_headers)
    
    assert response.status_code == 201
    assert 'project' in response.json
    assert response.json['project']['name'] == 'Wildlife Survey'

def test_get_projects(client, auth_headers, sample_project):
    """Test getting user's projects."""
    response = client.get('/api/projects', headers=auth_headers)
    
    assert response.status_code == 200
    assert 'projects' in response.json
    assert len(response.json['projects']) >= 1

def test_get_project_detail(client, auth_headers, sample_project):
    """Test getting project details."""
    project_id = sample_project['id']
    
    response = client.get(f'/api/projects/{project_id}', headers=auth_headers)
    
    assert response.status_code == 200
    assert 'project' in response.json
    assert response.json['project']['id'] == project_id

def test_update_project(client, auth_headers, sample_project):
    """Test updating a project."""
    project_id = sample_project['id']
    update_data = {
        'name': 'Updated Project Name',
        'description': 'Updated description'
    }
    
    response = client.put(f'/api/projects/{project_id}', json=update_data, headers=auth_headers)
    
    assert response.status_code == 200
    assert response.json['project']['name'] == 'Updated Project Name'

def test_project_not_found(client, auth_headers):
    """Test accessing non-existent project."""
    fake_id = '00000000-0000-0000-0000-000000000000'
    
    response = client.get(f'/api/projects/{fake_id}', headers=auth_headers)
    
    assert response.status_code == 404

def test_unauthorized_project_access(client):
    """Test accessing project without authentication."""
    fake_id = '00000000-0000-0000-0000-000000000000'
    
    response = client.get(f'/api/projects/{fake_id}')
    
    assert response.status_code == 401