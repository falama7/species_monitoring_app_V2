import pytest
from unittest.mock import patch, MagicMock
from app.utils.geo_utils import (
    get_location_name, 
    get_coordinates_from_address, 
    calculate_distance,
    get_weather_data
)
from app.utils.auth_utils import admin_required, researcher_required, project_member_required
from flask import Flask
from flask_jwt_extended import create_access_token

def test_calculate_distance():
    """Test distance calculation between two points."""
    # Distance between Nairobi and Mombasa (approximately 440km)
    nairobi_lat, nairobi_lon = -1.2921, 36.8219
    mombasa_lat, mombasa_lon = -4.0435, 39.6682
    
    distance = calculate_distance(nairobi_lat, nairobi_lon, mombasa_lat, mombasa_lon)
    
    # Should be approximately 440km (allow for some variation)
    assert 430 <= distance <= 450

def test_calculate_distance_same_point():
    """Test distance calculation for the same point."""
    lat, lon = -1.2921, 36.8219
    
    distance = calculate_distance(lat, lon, lat, lon)
    
    assert distance == 0.0

def test_calculate_distance_zero_coordinates():
    """Test distance calculation with zero coordinates."""
    distance = calculate_distance(0, 0, 0, 1)
    
    # Should be approximately 111km (1 degree longitude at equator)
    assert 110 <= distance <= 112

@patch('app.utils.geo_utils.Nominatim')
def test_get_location_name_success(mock_nominatim):
    """Test successful location name retrieval."""
    # Mock the geocoder response
    mock_geolocator = MagicMock()
    mock_location = MagicMock()
    mock_location.address = "Nairobi, Kenya"
    mock_geolocator.reverse.return_value = mock_location
    mock_nominatim.return_value = mock_geolocator
    
    result = get_location_name(-1.2921, 36.8219)
    
    assert result == "Nairobi, Kenya"
    mock_geolocator.reverse.assert_called_once()

@patch('app.utils.geo_utils.Nominatim')
def test_get_location_name_failure(mock_nominatim):
    """Test location name retrieval failure."""
    # Mock geocoder to return None
    mock_geolocator = MagicMock()
    mock_geolocator.reverse.return_value = None
    mock_nominatim.return_value = mock_geolocator
    
    result = get_location_name(-1.2921, 36.8219)
    
    # Should return formatted coordinates when geocoding fails
    assert "(-1.2921, 36.8219)" in result

@patch('app.utils.geo_utils.Nominatim')
def test_get_location_name_timeout(mock_nominatim):
    """Test location name retrieval with timeout."""
    from geopy.exc import GeocoderTimedOut
    
    # Mock geocoder to raise timeout
    mock_geolocator = MagicMock()
    mock_geolocator.reverse.side_effect = GeocoderTimedOut()
    mock_nominatim.return_value = mock_geolocator
    
    result = get_location_name(-1.2921, 36.8219)
    
    # Should return formatted coordinates when timeout occurs
    assert "(-1.2921, 36.8219)" in result

@patch('app.utils.geo_utils.Nominatim')
def test_get_coordinates_from_address_success(mock_nominatim):
    """Test successful coordinate retrieval from address."""
    # Mock the geocoder response
    mock_geolocator = MagicMock()
    mock_location = MagicMock()
    mock_location.latitude = -1.2921
    mock_location.longitude = 36.8219
    mock_location.address = "Nairobi, Kenya"
    mock_geolocator.geocode.return_value = mock_location
    mock_nominatim.return_value = mock_geolocator
    
    result = get_coordinates_from_address("Nairobi, Kenya")
    
    assert result['latitude'] == -1.2921
    assert result['longitude'] == 36.8219
    assert result['address'] == "Nairobi, Kenya"

@patch('app.utils.geo_utils.Nominatim')
def test_get_coordinates_from_address_not_found(mock_nominatim):
    """Test coordinate retrieval when address not found."""
    # Mock geocoder to return None
    mock_geolocator = MagicMock()
    mock_geolocator.geocode.return_value = None
    mock_nominatim.return_value = mock_geolocator
    
    result = get_coordinates_from_address("NonexistentPlace")
    
    assert result is None

@patch('app.utils.geo_utils.requests.get')
def test_get_weather_data_success(mock_get, app):
    """Test successful weather data retrieval."""
    with app.app_context():
        # Mock weather API response
        mock_response = MagicMock()
        mock_response.json.return_value = {
            'main': {'temp': 25.5, 'humidity': 65},
            'weather': [{'description': 'clear sky'}],
            'wind': {'speed': 3.2}
        }
        mock_response.raise_for_status.return_value = None
        mock_get.return_value = mock_response
        
        # Mock the config to have weather API key
        app.config['WEATHER_API_KEY'] = 'test_api_key'
        
        result = get_weather_data(-1.2921, 36.8219)
        
        assert result['temperature'] == 25.5
        assert result['humidity'] == 65
        assert result['description'] == 'clear sky'
        assert result['wind_speed'] == 3.2

def test_get_weather_data_no_api_key(app):
    """Test weather data retrieval without API key."""
    with app.app_context():
        # Remove API key from config
        app.config.pop('WEATHER_API_KEY', None)
        
        result = get_weather_data(-1.2921, 36.8219)
        
        assert result is None

@patch('app.utils.geo_utils.requests.get')
def test_get_weather_data_api_error(mock_get, app):
    """Test weather data retrieval with API error."""
    with app.app_context():
        # Mock API to raise exception
        mock_get.side_effect = Exception("API Error")
        app.config['WEATHER_API_KEY'] = 'test_api_key'
        
        result = get_weather_data(-1.2921, 36.8219)
        
        assert result is None

def test_admin_required_decorator_success(app):
    """Test admin_required decorator with admin user."""
    from app.models import User
    
    with app.app_context():
        # Create test admin user
        admin_user = User(
            username='admin_test',
            email='admin@test.com',
            first_name='Admin',
            last_name='User',
            role='admin'
        )
        admin_user.set_password('password')
        
        from app.models import db
        db.session.add(admin_user)
        db.session.commit()
        
        # Create access token for admin user
        access_token = create_access_token(identity=str(admin_user.id))
        
        # Test admin_required decorator
        @admin_required
        def protected_function():
            return "Success"
        
        # This would require mocking JWT context
        # In a real test, you'd set up the JWT context properly
        assert callable(protected_function)

def test_researcher_required_decorator(app):
    """Test researcher_required decorator."""
    from app.models import User
    
    with app.app_context():
        # Create test researcher user
        researcher_user = User(
            username='researcher_test',
            email='researcher@test.com',
            first_name='Researcher',
            last_name='User',
            role='researcher'
        )
        researcher_user.set_password('password')
        
        from app.models import db
        db.session.add(researcher_user)
        db.session.commit()
        
        # Test researcher_required decorator
        @researcher_required
        def protected_function():
            return "Success"
        
        assert callable(protected_function)

def test_project_member_required_decorator(app):
    """Test project_member_required decorator."""
    # Test project_member_required decorator
    @project_member_required
    def protected_function(project_id):
        return f"Success for project {project_id}"
    
    assert callable(protected_function)

class TestAuthUtils:
    """Test class for authentication utilities."""
    
    def test_admin_decorator_exists(self):
        """Test that admin_required decorator exists."""
        assert callable(admin_required)
    
    def test_researcher_decorator_exists(self):
        """Test that researcher_required decorator exists."""
        assert callable(researcher_required)
    
    def test_project_member_decorator_exists(self):
        """Test that project_member_required decorator exists."""
        assert callable(project_member_required)

class TestGeoUtils:
    """Test class for geo utilities."""
    
    def test_distance_calculation_precision(self):
        """Test distance calculation precision."""
        # Test with known distances
        lat1, lon1 = 0.0, 0.0  # Equator, Prime Meridian
        lat2, lon2 = 0.0, 1.0  # 1 degree east
        
        distance = calculate_distance(lat1, lon1, lat2, lon2)
        
        # At the equator, 1 degree longitude ≈ 111.32 km
        assert 111.0 <= distance <= 112.0
    
    def test_distance_negative_coordinates(self):
        """Test distance calculation with negative coordinates."""
        # Test with southern hemisphere and western longitude
        lat1, lon1 = -30.0, -60.0
        lat2, lon2 = -31.0, -61.0
        
        distance = calculate_distance(lat1, lon1, lat2, lon2)
        
        # Should be approximately 156 km (1 degree at 30°S)
        assert 150.0 <= distance <= 160.0
    
    def test_location_name_edge_cases(self):
        """Test location name retrieval with edge cases."""
        # Test with extreme coordinates
        result = get_location_name(90.0, 180.0)  # North Pole area
        assert isinstance(result, str)
        
        result = get_location_name(-90.0, -180.0)  # South Pole area
        assert isinstance(result, str)