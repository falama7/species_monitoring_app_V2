import os
import uuid
from flask import Blueprint, request, jsonify, current_app, send_from_directory
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename
from PIL import Image
import magic

uploads_bp = Blueprint('uploads', __name__, url_prefix='/api/uploads')

ALLOWED_IMAGE_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
ALLOWED_AUDIO_EXTENSIONS = {'mp3', 'wav', 'ogg', 'aac', 'm4a'}
MAX_IMAGE_SIZE = (1920, 1080)

def allowed_file(filename, allowed_extensions):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in allowed_extensions

def is_safe_file(file_path):
    """Check if uploaded file is safe"""
    try:
        mime = magic.from_file(file_path, mime=True)
        safe_mimes = [
            'image/jpeg', 'image/png', 'image/gif', 'image/webp',
            'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/aac'
        ]
        return mime in safe_mimes
    except:
        return False

@uploads_bp.route('/image', methods=['POST'])
@jwt_required()
def upload_image():
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        if not allowed_file(file.filename, ALLOWED_IMAGE_EXTENSIONS):
            return jsonify({'error': 'Invalid file type'}), 400
        
        # Generate unique filename
        file_extension = file.filename.rsplit('.', 1)[1].lower()
        filename = f"{uuid.uuid4()}.{file_extension}"
        
        # Create upload directory if it doesn't exist
        upload_dir = os.path.join(current_app.config['UPLOAD_FOLDER'], 'images')
        os.makedirs(upload_dir, exist_ok=True)
        
        file_path = os.path.join(upload_dir, filename)
        file.save(file_path)
        
        # Security check
        if not is_safe_file(file_path):
            os.remove(file_path)
            return jsonify({'error': 'Invalid file content'}), 400
        
        # Optimize image
        try:
            with Image.open(file_path) as img:
                # Convert to RGB if necessary
                if img.mode in ('RGBA', 'LA', 'P'):
                    img = img.convert('RGB')
                
                # Resize if too large
                if img.size[0] > MAX_IMAGE_SIZE[0] or img.size[1] > MAX_IMAGE_SIZE[1]:
                    img.thumbnail(MAX_IMAGE_SIZE, Image.Resampling.LANCZOS)
                
                # Save optimized image
                img.save(file_path, 'JPEG', quality=85, optimize=True)
        except Exception as e:
            current_app.logger.error(f"Image optimization error: {str(e)}")
            # Keep original if optimization fails
        
        file_url = f"/api/uploads/images/{filename}"
        
        return jsonify({
            'message': 'Image uploaded successfully',
            'file_url': file_url,
            'filename': filename
        })
        
    except Exception as e:
        current_app.logger.error(f"Image upload error: {str(e)}")
        return jsonify({'error': 'Upload failed'}), 500

@uploads_bp.route('/audio', methods=['POST'])
@jwt_required()
def upload_audio():
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        if not allowed_file(file.filename, ALLOWED_AUDIO_EXTENSIONS):
            return jsonify({'error': 'Invalid file type'}), 400
        
        # Generate unique filename
        file_extension = file.filename.rsplit('.', 1)[1].lower()
        filename = f"{uuid.uuid4()}.{file_extension}"
        
        # Create upload directory if it doesn't exist
        upload_dir = os.path.join(current_app.config['UPLOAD_FOLDER'], 'audio')
        os.makedirs(upload_dir, exist_ok=True)
        
        file_path = os.path.join(upload_dir, filename)
        file.save(file_path)
        
        # Security check
        if not is_safe_file(file_path):
            os.remove(file_path)
            return jsonify({'error': 'Invalid file content'}), 400
        
        file_url = f"/api/uploads/audio/{filename}"
        
        return jsonify({
            'message': 'Audio uploaded successfully',
            'file_url': file_url,
            'filename': filename
        })
        
    except Exception as e:
        current_app.logger.error(f"Audio upload error: {str(e)}")
        return jsonify({'error': 'Upload failed'}), 500

@uploads_bp.route('/images/')
def get_image(filename):
    try:
        upload_dir = os.path.join(current_app.config['UPLOAD_FOLDER'], 'images')
        return send_from_directory(upload_dir, filename)
    except Exception as e:
        current_app.logger.error(f"Image serve error: {str(e)}")
        return jsonify({'error': 'File not found'}), 404

@uploads_bp.route('/audio/')
def get_audio(filename):
    try:
        upload_dir = os.path.join(current_app.config['UPLOAD_FOLDER'], 'audio')
        return send_from_directory(upload_dir, filename)
    except Exception as e:
        current_app.logger.error(f"Audio serve error: {str(e)}")
        return jsonify({'error': 'File not found'}), 404

@uploads_bp.route('/files/', methods=['DELETE'])
@jwt_required()
def delete_file(file_id):
    try:
        # Note: In a real app, you'd want to track file ownership
        # and only allow deletion by file owner or admin
        current_user_id = get_jwt_identity()
        
        # This is a simplified example
        # You'd typically have a File model to track uploads
        
        return jsonify({'message': 'File deletion not implemented'}), 501
        
    except Exception as e:
        current_app.logger.error(f"File deletion error: {str(e)}")
        return jsonify({'error': 'Deletion failed'}), 500