import pytest
from app.models import db, User

def test_register_user(client):
    """Test user registration."""
    user_data = {
        'username': 'newuser',
        'email': 'newuser@example.com',
        'password': 'password123',
        'first_name': 'New',
        'last_name': 'User',
        'role': 'observer'
    }
    
    response = client.post('/api/auth/register', json=user_data)
    
    assert response.status_code == 201
    assert 'access_token' in response.json
    assert 'user' in response.json
    assert response.json['user']['username'] == 'newuser'

def test_register_duplicate_username(client):
    """Test registration with duplicate username."""
    user_data = {
        'username': 'duplicate',
        'email': 'user1@example.com',
        'password': 'password123',
        'first_name': 'User',
        'last_name': 'One',
    }
    
    # First registration
    client.post('/api/auth/register', json=user_data)
    
    # Second registration with same username
    user_data['email'] = 'user2@example.com'
    response = client.post('/api/auth/register', json=user_data)
    
    assert response.status_code == 400
    assert 'Username already exists' in response.json['error']

def test_login_valid_credentials(client):
    """Test login with valid credentials."""
    # Register user first
    user_data = {
        'username': 'loginuser',
        'email': 'login@example.com',
        'password': 'password123',
        'first_name': 'Login',
        'last_name': 'User',
    }
    client.post('/api/auth/register', json=user_data)
    
    # Login
    login_data = {
        'username': 'loginuser',
        'password': 'password123'
    }
    
    response = client.post('/api/auth/login', json=login_data)
    
    assert response.status_code == 200
    assert 'access_token' in response.json
    assert 'user' in response.json

def test_login_invalid_credentials(client):
    """Test login with invalid credentials."""
    login_data = {
        'username': 'nonexistent',
        'password': 'wrongpassword'
    }
    
    response = client.post('/api/auth/login', json=login_data)
    
    assert response.status_code == 401
    assert 'Invalid credentials' in response.json['error']

def test_get_profile(client, auth_headers):
    """Test getting user profile."""
    response = client.get('/api/auth/profile', headers=auth_headers)
    
    assert response.status_code == 200
    assert 'user' in response.json
    assert response.json['user']['username'] == 'testuser'

def test_update_profile(client, auth_headers):
    """Test updating user profile."""
    update_data = {
        'first_name': 'Updated',
        'last_name': 'Name'
    }
    
    response = client.put('/api/auth/profile', json=update_data, headers=auth_headers)
    
    assert response.status_code == 200
    assert response.json['user']['first_name'] == 'Updated'
    assert response.json['user']['last_name'] == 'Name'

def test_change_password(client, auth_headers):
    """Test changing password."""
    password_data = {
        'current_password': 'testpass123',
        'new_password': 'newpassword123'
    }
    
    response = client.post('/api/auth/change-password', json=password_data, headers=auth_headers)
    
    assert response.status_code == 200
    assert 'Password changed successfully' in response.json['message']

def test_unauthorized_access(client):
    """Test accessing protected route without authentication."""
    response = client.get('/api/auth/profile')
    
    assert response.status_code == 401