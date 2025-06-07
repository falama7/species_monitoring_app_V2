import requests
from geopy.geocoders import Nominatim
from geopy.exc import GeocoderTimedOut, GeocoderServiceError
from flask import current_app

def get_location_name(latitude, longitude):
    """Get human-readable location name from coordinates"""
    try:
        geolocator = Nominatim(user_agent="species_monitoring_app")
        location = geolocator.reverse(f"{latitude}, {longitude}", timeout=10)
        
        if location:
            return location.address
        else:
            return f"Location ({latitude:.4f}, {longitude:.4f})"
    
    except (GeocoderTimedOut, GeocoderServiceError) as e:
        current_app.logger.warning(f"Geocoding error: {str(e)}")
        return f"Location ({latitude:.4f}, {longitude:.4f})"

def get_coordinates_from_address(address):
    """Get coordinates from address"""
    try:
        geolocator = Nominatim(user_agent="species_monitoring_app")
        location = geolocator.geocode(address, timeout=10)
        
        if location:
            return {
                'latitude': location.latitude,
                'longitude': location.longitude,
                'address': location.address
            }
        else:
            return None
    
    except (GeocoderTimedOut, GeocoderServiceError) as e:
        current_app.logger.warning(f"Geocoding error: {str(e)}")
        return None

def calculate_distance(lat1, lon1, lat2, lon2):
    """Calculate distance between two points in kilometers"""
    from math import radians, cos, sin, asin, sqrt
    
    # Convert decimal degrees to radians
    lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])
    
    # Haversine formula
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
    c = 2 * asin(sqrt(a))
    r = 6371  # Radius of earth in kilometers
    
    return c * r

def get_weather_data(latitude, longitude):
    """Get weather data for location (requires weather API key)"""
    try:
        api_key = current_app.config.get('WEATHER_API_KEY')
        if not api_key:
            return None
        
        # Example using OpenWeatherMap API
        url = f"http://api.openweathermap.org/data/2.5/weather"
        params = {
            'lat': latitude,
            'lon': longitude,
            'appid': api_key,
            'units': 'metric'
        }
        
        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()
        
        data = response.json()
        return {
            'temperature': data['main']['temp'],
            'humidity': data['main']['humidity'],
            'description': data['weather'][0]['description'],
            'wind_speed': data['wind']['speed']
        }
    
    except Exception as e:
        current_app.logger.warning(f"Weather API error: {str(e)}")
        return None