"""Flask CLI commands for the application."""
import click
from flask.cli import with_appcontext
from flask import current_app
from .models import db, User, Species

@click.command()
@with_appcontext
def init_db():
    """Initialize the database."""
    db.create_all()
    click.echo('Initialized the database.')

@click.command()
@with_appcontext
def seed_data():
    """Seed the database with initial data."""
    # Check if admin user exists
    admin = User.query.filter_by(username='admin').first()
    if not admin:
        admin = User(
            username='admin',
            email='admin@example.com',
            first_name='Admin',
            last_name='User',
            role='admin'
        )
        admin.set_password('admin123')
        db.session.add(admin)
        click.echo('Created admin user: admin/admin123')
    
    # Add sample species if none exist
    if Species.query.count() == 0:
        sample_species = [
            {
                'scientific_name': 'Panthera leo',
                'common_name': 'African Lion',
                'family': 'Felidae',
                'genus': 'Panthera',
                'species_code': 'PLEO',
                'conservation_status': 'VU',
                'description': 'Large cat native to Africa and India',
                'habitat': 'Savannas, grasslands, and open woodlands'
            },
            {
                'scientific_name': 'Loxodonta africana',
                'common_name': 'African Elephant',
                'family': 'Elephantidae',
                'genus': 'Loxodonta',
                'species_code': 'LAFR',
                'conservation_status': 'EN',
                'description': 'Largest living terrestrial animal',
                'habitat': 'Savannas, forests, deserts, and marshes'
            },
            {
                'scientific_name': 'Acinonyx jubatus',
                'common_name': 'Cheetah',
                'family': 'Felidae',
                'genus': 'Acinonyx',
                'species_code': 'AJUB',
                'conservation_status': 'VU',
                'description': 'Fastest land animal',
                'habitat': 'Open grasslands and savannas'
            }
        ]
        
        for species_data in sample_species:
            species = Species(**species_data)
            db.session.add(species)
        
        click.echo(f'Added {len(sample_species)} sample species')
    
    db.session.commit()
    click.echo('Database seeded successfully!')

def init_app(app):
    """Register CLI commands with the app."""
    app.cli.add_command(init_db)
    app.cli.add_command(seed_data)