-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Create enum types
CREATE TYPE user_role AS ENUM ('admin', 'researcher', 'observer');
CREATE TYPE project_status AS ENUM ('active', 'completed', 'paused', 'cancelled');
CREATE TYPE conservation_status AS ENUM ('LC', 'NT', 'VU', 'EN', 'CR', 'EW', 'EX');

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(80) UNIQUE NOT NULL,
    email VARCHAR(120) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    role user_role DEFAULT 'observer',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);

-- Species table
CREATE TABLE species (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    scientific_name VARCHAR(100) UNIQUE NOT NULL,
    common_name VARCHAR(100) NOT NULL,
    family VARCHAR(50),
    genus VARCHAR(50),
    species_code VARCHAR(10) UNIQUE,
    conservation_status conservation_status,
    description TEXT,
    habitat VARCHAR(200),
    image_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Projects table
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    location VARCHAR(200),
    start_date DATE,
    end_date DATE,
    status project_status DEFAULT 'active',
    created_by_id UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Project members (many-to-many)
CREATE TABLE project_users (
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    PRIMARY KEY (project_id, user_id)
);

-- Observations table
CREATE TABLE observations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    species_id UUID NOT NULL REFERENCES species(id),
    observer_id UUID NOT NULL REFERENCES users(id),
    observation_date TIMESTAMP NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    location_name VARCHAR(200),
    count INTEGER DEFAULT 1,
    behavior VARCHAR(100),
    habitat_description TEXT,
    weather_conditions VARCHAR(100),
    notes TEXT,
    image_urls JSON,
    audio_urls JSON,
    accuracy DECIMAL(10, 2),
    altitude DECIMAL(10, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indicators table
CREATE TABLE indicators (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    metric_type VARCHAR(50) NOT NULL,
    value DECIMAL(10, 4),
    unit VARCHAR(20),
    calculation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Resources table
CREATE TABLE resources (
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
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

CREATE INDEX idx_species_scientific_name ON species(scientific_name);
CREATE INDEX idx_species_common_name ON species(common_name);
CREATE INDEX idx_species_family ON species(family);
CREATE INDEX idx_species_conservation_status ON species(conservation_status);

CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_created_by ON projects(created_by_id);
CREATE INDEX idx_projects_created_at ON projects(created_at);

CREATE INDEX idx_observations_project_id ON observations(project_id);
CREATE INDEX idx_observations_species_id ON observations(species_id);
CREATE INDEX idx_observations_observer_id ON observations(observer_id);
CREATE INDEX idx_observations_date ON observations(observation_date);
CREATE INDEX idx_observations_location ON observations(latitude, longitude);

CREATE INDEX idx_indicators_project_id ON indicators(project_id);
CREATE INDEX idx_indicators_type ON indicators(metric_type);

CREATE INDEX idx_resources_type ON resources(resource_type);
CREATE INDEX idx_resources_category ON resources(category);
CREATE INDEX idx_resources_public ON resources(is_public);

-- Create triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$ language 'plpgsql';

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_observations_updated_at BEFORE UPDATE ON observations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();