-- Species Monitoring Database Initialization Script
-- This script creates the database structure and inserts initial data

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(80) UNIQUE NOT NULL,
    email VARCHAR(120) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    role VARCHAR(20) DEFAULT 'observer',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);

-- Create species table
CREATE TABLE IF NOT EXISTS species (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    scientific_name VARCHAR(100) UNIQUE NOT NULL,
    common_name VARCHAR(100) NOT NULL,
    family VARCHAR(50),
    genus VARCHAR(50),
    species_code VARCHAR(10) UNIQUE,
    conservation_status VARCHAR(20),
    description TEXT,
    habitat VARCHAR(200),
    image_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    location VARCHAR(200),
    start_date DATE,
    end_date DATE,
    status VARCHAR(20) DEFAULT 'active',
    created_by_id UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create project_users association table
CREATE TABLE IF NOT EXISTS project_users (
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    PRIMARY KEY (project_id, user_id)
);

-- Create observations table
CREATE TABLE IF NOT EXISTS observations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id),
    species_id UUID NOT NULL REFERENCES species(id),
    observer_id UUID NOT NULL REFERENCES users(id),
    observation_date TIMESTAMP NOT NULL,
    latitude FLOAT NOT NULL,
    longitude FLOAT NOT NULL,
    location_name VARCHAR(200),
    count INTEGER DEFAULT 1,
    behavior VARCHAR(100),
    habitat_description TEXT,
    weather_conditions VARCHAR(100),
    notes TEXT,
    image_urls JSONB,
    audio_urls JSONB,
    accuracy FLOAT,
    altitude FLOAT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indicators table
CREATE TABLE IF NOT EXISTS indicators (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    metric_type VARCHAR(50) NOT NULL,
    value FLOAT,
    unit VARCHAR(20),
    calculation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create resources table
CREATE TABLE IF NOT EXISTS resources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    resource_type VARCHAR(50) NOT NULL,
    category VARCHAR(50),
    file_url VARCHAR(255),
    external_url VARCHAR(255),
    is_public BOOLEAN DEFAULT TRUE,
    created_by_id UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_observations_project_id ON observations(project_id);
CREATE INDEX IF NOT EXISTS idx_observations_species_id ON observations(species_id);
CREATE INDEX IF NOT EXISTS idx_observations_observer_id ON observations(observer_id);
CREATE INDEX IF NOT EXISTS idx_observations_date ON observations(observation_date);
CREATE INDEX IF NOT EXISTS idx_observations_location ON observations(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_projects_created_by ON projects(created_by_id);
CREATE INDEX IF NOT EXISTS idx_resources_created_by ON resources(created_by_id);
CREATE INDEX IF NOT EXISTS idx_resources_type ON resources(resource_type);
CREATE INDEX IF NOT EXISTS idx_resources_category ON resources(category);

-- Create spatial index for observations
CREATE INDEX IF NOT EXISTS idx_observations_geom ON observations USING GIST (ST_MakePoint(longitude, latitude));

-- Insert default admin user (password: admin123)
INSERT INTO users (username, email, password_hash, first_name, last_name, role) 
VALUES (
    'admin',
    'admin@speciesmonitoring.org',
    'pbkdf2:sha256:600000$ZrN8FqJmKnO1VeUv$8f9b4c5d2e1a3b6c9e0f2a5d8b1c4e7f0a3b6c9e2f5d8b1c4e7f0a3b6c9e2f5d8',
    'Admin',
    'User',
    'admin'
) ON CONFLICT (username) DO NOTHING;

-- Insert sample species data
INSERT INTO species (scientific_name, common_name, family, genus, species_code, conservation_status, description, habitat) VALUES
    ('Accipiter gentilis', 'Northern Goshawk', 'Accipitridae', 'Accipiter', 'NOGO', 'LC', 'Large forest-dwelling hawk with broad wings and long tail', 'Mature forests'),
    ('Falco peregrinus', 'Peregrine Falcon', 'Falconidae', 'Falco', 'PEFA', 'LC', 'Fastest bird in the world, known for spectacular hunting dives', 'Cliffs, tall buildings, open areas'),
    ('Bubo bubo', 'Eurasian Eagle-Owl', 'Strigidae', 'Bubo', 'EEOW', 'LC', 'Large owl with distinctive ear tufts and orange eyes', 'Rocky areas, forests, semi-deserts'),
    ('Cervus elaphus', 'Red Deer', 'Cervidae', 'Cervus', 'REDE', 'LC', 'Large deer species with impressive antlers in males', 'Forests, grasslands, mountains'),
    ('Ursus arctos', 'Brown Bear', 'Ursidae', 'Ursus', 'BRBE', 'LC', 'Large omnivorous mammal with thick fur', 'Forests, mountains, tundra'),
    ('Lynx lynx', 'Eurasian Lynx', 'Felidae', 'Lynx', 'EULY', 'LC', 'Medium-sized wild cat with tufted ears and spotted coat', 'Forests, rocky areas'),
    ('Canis lupus', 'Gray Wolf', 'Canidae', 'Canis', 'GRWO', 'LC', 'Largest wild member of the Canidae family', 'Forests, tundra, grasslands'),
    ('Aquila chrysaetos', 'Golden Eagle', 'Accipitridae', 'Aquila', 'GOEA', 'LC', 'Large bird of prey with golden-brown head feathers', 'Mountains, hills, cliffs'),
    ('Tetrao urogallus', 'Western Capercaillie', 'Phasianidae', 'Tetrao', 'WECA', 'LC', 'Largest member of the grouse family', 'Coniferous forests'),
    ('Alces alces', 'Moose', 'Cervidae', 'Alces', 'MOOS', 'LC', 'Largest member of the deer family', 'Forests near water bodies')
ON CONFLICT (scientific_name) DO NOTHING;

-- Insert sample project
INSERT INTO projects (name, description, location, start_date, status, created_by_id) 
SELECT 
    'Wildlife Monitoring Project 2024',
    'Comprehensive monitoring of wildlife populations in the national park region',
    'National Park Area',
    '2024-01-01',
    'active',
    id
FROM users WHERE username = 'admin'
ON CONFLICT DO NOTHING;

-- Insert sample resources
INSERT INTO resources (title, description, resource_type, category, is_public, created_by_id) 
SELECT 
    'Species Identification Guide',
    'Comprehensive guide for identifying common wildlife species in the monitoring area',
    'guide',
    'field_guides',
    true,
    id
FROM users WHERE username = 'admin'
UNION ALL
SELECT 
    'Data Collection Protocol',
    'Standard procedures for collecting and recording wildlife observations',
    'manual',
    'protocols',
    true,
    id
FROM users WHERE username = 'admin'
UNION ALL
SELECT 
    'GPS Device Manual',
    'Instructions for using GPS devices in the field',
    'manual',
    'equipment',
    true,
    id
FROM users WHERE username = 'admin'
ON CONFLICT DO NOTHING;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_observations_updated_at BEFORE UPDATE ON observations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO species_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO species_user;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO species_user;
