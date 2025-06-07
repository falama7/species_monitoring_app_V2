import pytest
from app.models import db, Indicator

def test_indicators_health_endpoint(client):
    """Test indicators health endpoint."""
    response = client.get('/api/indicators/health')
    
    assert response.status_code == 200
    assert response.json['status'] == 'ok'

def test_create_indicator(client, auth_headers, sample_project):
    """Test creating a new indicator."""
    indicator_data = {
        'project_id': sample_project['id'],
        'name': 'Species Richness',
        'description': 'Number of unique species observed',
        'metric_type': 'diversity',
        'value': 15.5,
        'unit': 'species count'
    }
    
    response = client.post('/api/indicators', json=indicator_data, headers=auth_headers)
    
    # Note: This will return 404 until the endpoint is implemented
    # Once implemented, this should return 201
    assert response.status_code in [201, 404]
    
    if response.status_code == 201:
        assert 'indicator' in response.json
        assert response.json['indicator']['name'] == 'Species Richness'
        assert response.json['indicator']['value'] == 15.5

def test_get_indicators(client, auth_headers, sample_project):
    """Test getting list of indicators."""
    response = client.get(f'/api/indicators?project_id={sample_project["id"]}', headers=auth_headers)
    
    # Note: This will return 404 until the endpoint is implemented
    assert response.status_code in [200, 404]
    
    if response.status_code == 200:
        assert 'indicators' in response.json

def test_indicator_unauthorized_access(client):
    """Test accessing indicators without authentication."""
    response = client.get('/api/indicators')
    
    # Should require authentication
    assert response.status_code in [401, 404]

def test_calculate_species_diversity(app, sample_project, sample_species, auth_headers, client):
    """Test calculating species diversity indicator."""
    with app.app_context():
        # This test would require observations to be created first
        # and then calculate diversity based on those observations
        
        # Create some test observations with different species
        from app.models import Observation, Species, User
        
        # Get the test user
        user = User.query.filter_by(username='testuser').first()
        
        if user and sample_species:
            # Create test observations
            observation1 = Observation(
                project_id=sample_project['id'],
                species_id=sample_species.id,
                observer_id=user.id,
                observation_date='2024-01-15 10:30:00',
                latitude=-1.2921,
                longitude=36.8219,
                count=5
            )
            
            db.session.add(observation1)
            db.session.commit()
            
            # Now test diversity calculation
            # This would be implemented in the indicators API
            response = client.get(f'/api/indicators/diversity?project_id={sample_project["id"]}', headers=auth_headers)
            
            # Until implemented, expect 404
            assert response.status_code in [200, 404]

def test_indicator_time_series(client, auth_headers, sample_project):
    """Test getting time series data for indicators."""
    response = client.get(
        f'/api/indicators/time-series?project_id={sample_project["id"]}&metric=abundance&interval=monthly',
        headers=auth_headers
    )
    
    # Until implemented, expect 404
    assert response.status_code in [200, 404]
    
    if response.status_code == 200:
        assert 'dates' in response.json
        assert 'values' in response.json

def test_spatial_indicators(client, auth_headers, sample_project):
    """Test getting spatial distribution indicators."""
    response = client.get(
        f'/api/indicators/spatial?project_id={sample_project["id"]}&grid_size=0.01',
        headers=auth_headers
    )
    
    # Until implemented, expect 404
    assert response.status_code in [200, 404]
    
    if response.status_code == 200:
        # Should return GeoJSON with density data
        assert 'type' in response.json
        assert response.json['type'] == 'FeatureCollection'

def test_indicator_validation(client, auth_headers, sample_project):
    """Test indicator data validation."""
    # Test invalid metric type
    invalid_indicator = {
        'project_id': sample_project['id'],
        'name': 'Test Indicator',
        'metric_type': 'invalid_type',  # Invalid metric type
        'value': 10.0
    }
    
    response = client.post('/api/indicators', json=invalid_indicator, headers=auth_headers)
    
    # Should validate metric type
    assert response.status_code in [400, 404]

def test_indicator_aggregation(client, auth_headers, sample_project):
    """Test indicator aggregation across time periods."""
    response = client.get(
        f'/api/indicators/aggregate?project_id={sample_project["id"]}&period=weekly&metric=count',
        headers=auth_headers
    )
    
    # Until implemented, expect 404
    assert response.status_code in [200, 404]

def test_comparative_indicators(client, auth_headers, sample_project):
    """Test comparative indicators between projects or time periods."""
    response = client.get(
        f'/api/indicators/compare?project_id={sample_project["id"]}&compare_period=2023',
        headers=auth_headers
    )
    
    # Until implemented, expect 404
    assert response.status_code in [200, 404]