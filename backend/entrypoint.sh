#!/bin/bash
set -e

echo "Waiting for database..."
while ! pg_isready -h db -p 5432 -U species_user; do
  sleep 2
done

echo "Database ready!"

python -c "
from app import create_app
from app.models import db, User
app = create_app()
with app.app_context():
    db.create_all()
    admin = User.query.filter_by(username='admin').first()
    if not admin:
        admin = User(username='admin', email='admin@example.com', first_name='Admin', last_name='User', role='admin')
        admin.set_password('admin123')
        db.session.add(admin)
        db.session.commit()
        print('Admin created: admin/admin123')
"

exec "$@"
