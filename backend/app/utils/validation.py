import re
from datetime import datetime
from flask import jsonify
from marshmallow import ValidationError

def validate_email(email):
    """Validate email format"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def validate_password(password):
    """Validate password strength"""
    if len(password) < 8:
        return False, "Password must be at least 8 characters long"
    
    if not re.search(r'[A-Z]', password):
        return False, "Password must contain at least one uppercase letter"
    
    if not re.search(r'[a-z]', password):
        return False, "Password must contain at least one lowercase letter"
    
    if not re.search(r'\d', password):
        return False, "Password must contain at least one digit"
    
    return True, "Password is valid"

def validate_coordinates(latitude, longitude):
    """Validate GPS coordinates"""
    try:
        lat = float(latitude)
        lon = float(longitude)
        
        if not (-90 <= lat <= 90):
            return False, "Latitude must be between -90 and 90"
        
        if not (-180 <= lon <= 180):
            return False, "Longitude must be between -180 and 180"
        
        return True, "Coordinates are valid"
    except (ValueError, TypeError):
        return False, "Invalid coordinate format"

def validate_date_range(start_date, end_date):
    """Validate date range"""
    try:
        if isinstance(start_date, str):
            start_date = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
        if isinstance(end_date, str):
            end_date = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
        
        if start_date >= end_date:
            return False, "Start date must be before end date"
        
        return True, "Date range is valid"
    except (ValueError, TypeError):
        return False, "Invalid date format"

def validate_species_code(code):
    """Validate species code format"""
    if not code:
        return True, "Species code is optional"
    
    # Species code should be 2-10 uppercase letters
    pattern = r'^[A-Z]{2,10}$'
    if not re.match(pattern, code):
        return False, "Species code must be 2-10 uppercase letters"
    
    return True, "Species code is valid"

def validate_file_extension(filename, allowed_extensions):
    """Validate file extension"""
    if not filename:
        return False, "Filename is required"
    
    if '.' not in filename:
        return False, "File must have an extension"
    
    extension = filename.rsplit('.', 1)[1].lower()
    if extension not in allowed_extensions:
        return False, f"File extension must be one of: {', '.join(allowed_extensions)}"
    
    return True, "File extension is valid"

def validate_json(schema, data):
    """Validate JSON data against schema"""
    try:
        result = schema.load(data)
        return True, result, None
    except ValidationError as err:
        return False, None, err.messages

def validate_observation_count(count):
    """Validate observation count"""
    try:
        count = int(count)
        if count < 1:
            return False, "Count must be at least 1"
        if count > 10000:
            return False, "Count seems unreasonably high (max 10,000)"
        return True, "Count is valid"
    except (ValueError, TypeError):
        return False, "Count must be a valid integer"

def validate_user_role(role):
    """Validate user role"""
    valid_roles = ['admin', 'coordinator', 'observer']
    if role not in valid_roles:
        return False, f"Role must be one of: {', '.join(valid_roles)}"
    return True, "Role is valid"

def validate_project_status(status):
    """Validate project status"""
    valid_statuses = ['active', 'completed', 'paused', 'cancelled']
    if status not in valid_statuses:
        return False, f"Status must be one of: {', '.join(valid_statuses)}"
    return True, "Status is valid"

def validate_conservation_status(status):
    """Validate conservation status"""
    valid_statuses = ['LC', 'NT', 'VU', 'EN', 'CR', 'EW', 'EX', 'DD', 'NE']
    if status and status not in valid_statuses:
        return False, f"Conservation status must be one of: {', '.join(valid_statuses)}"
    return True, "Conservation status is valid"

def validate_required_fields(data, required_fields):
    """Validate that required fields are present and not empty"""
    missing_fields = []
    empty_fields = []
    
    for field in required_fields:
        if field not in data:
            missing_fields.append(field)
        elif not data[field] or (isinstance(data[field], str) and not data[field].strip()):
            empty_fields.append(field)
    
    if missing_fields:
        return False, f"Missing required fields: {', '.join(missing_fields)}"
    
    if empty_fields:
        return False, f"Empty required fields: {', '.join(empty_fields)}"
    
    return True, "All required fields are present"

def sanitize_string(value, max_length=None):
    """Sanitize string input"""
    if not isinstance(value, str):
        return str(value) if value is not None else ""
    
    # Remove leading/trailing whitespace
    value = value.strip()
    
    # Remove potentially dangerous characters
    value = re.sub(r'[<>"\']', '', value)
    
    # Truncate if necessary
    if max_length and len(value) > max_length:
        value = value[:max_length]
    
    return value

def validate_pagination_params(page, per_page, max_per_page=100):
    """Validate pagination parameters"""
    try:
        page = int(page) if page else 1
        per_page = int(per_page) if per_page else 10
        
        if page < 1:
            return False, None, None, "Page must be at least 1"
        
        if per_page < 1:
            return False, None, None, "Per page must be at least 1"
        
        if per_page > max_per_page:
            return False, None, None, f"Per page cannot exceed {max_per_page}"
        
        return True, page, per_page, "Pagination parameters are valid"
    
    except (ValueError, TypeError):
        return False, None, None, "Invalid pagination parameters" 