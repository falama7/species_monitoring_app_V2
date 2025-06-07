#!/bin/bash
set -e

echo "🚀 Starting Species Monitoring App in Development Mode"

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "⚠️  Please edit .env file with your configuration"
fi

# Start services
echo "🐳 Starting Docker services..."
docker-compose up -d db redis

# Wait for services
echo "⏳ Waiting for services to be ready..."
sleep 10

# Start backend in development mode
echo "🐍 Starting backend..."
cd backend
export FLASK_ENV=development
export FLASK_APP=wsgi.py
pip install -r requirements.txt
flask run --host=0.0.0.0 --port=5000 &

# Start frontend in development mode
echo "⚛️  Starting frontend..."
cd ../frontend
npm install
npm start &

echo "✅ Development environment started!"
echo "Frontend: http://localhost:3000"
echo "Backend: http://localhost:5000"
echo "Admin credentials: admin / admin123"

wait