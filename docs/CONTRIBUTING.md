# Contributing to Species Monitoring Application

Thank you for your interest in contributing to the Species Monitoring Application! This document provides guidelines and information for contributors.

## Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [Getting Started](#getting-started)
3. [Development Setup](#development-setup)
4. [Contributing Guidelines](#contributing-guidelines)
5. [Coding Standards](#coding-standards)
6. [Testing Guidelines](#testing-guidelines)
7. [Documentation](#documentation)
8. [Pull Request Process](#pull-request-process)
9. [Release Process](#release-process)
10. [Getting Help](#getting-help)

## Code of Conduct

### Our Pledge

We pledge to make participation in our project a harassment-free experience for everyone, regardless of age, body size, disability, ethnicity, gender identity and expression, level of experience, nationality, personal appearance, race, religion, or sexual identity and orientation.

### Our Standards

Examples of behavior that contributes to creating a positive environment include:

- Using welcoming and inclusive language
- Being respectful of differing viewpoints and experiences
- Gracefully accepting constructive criticism
- Focusing on what is best for the community
- Showing empathy towards other community members

### Enforcement

Instances of abusive, harassing, or otherwise unacceptable behavior may be reported by contacting the project team at conduct@species-monitoring.org.

## Getting Started

### Prerequisites

Before contributing, ensure you have:

- **Git**: Version 2.30 or later
- **Docker**: Version 20.10 or later
- **Docker Compose**: Version 2.0 or later
- **Node.js**: Version 16 or later (for frontend development)
- **Python**: Version 3.9 or later (for backend development)

### Fork and Clone

1. Fork the repository on GitHub
2. Clone your fork locally:
   ```bash
   git clone https://github.com/your-username/species-monitoring.git
   cd species-monitoring
   ```
3. Add the upstream repository:
   ```bash
   git remote add upstream https://github.com/original-owner/species-monitoring.git
   ```

## Development Setup

### Quick Setup

1. **Environment Setup**:
   ```bash
   cp .env.example .env
   # Edit .env with your local configuration
   ```

2. **Start Development Environment**:
   ```bash
   make quick-start
   ```

3. **Verify Setup**:
   ```bash
   make status
   ```

### Manual Setup

#### Backend Setup

1. **Create Virtual Environment**:
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   pip install -r requirements-dev.txt  # Development dependencies
   ```

3. **Database Setup**:
   ```bash
   # Start PostgreSQL with Docker
   docker-compose up -d db redis
   
   # Run migrations
   flask db upgrade
   
   # Seed initial data
   flask seed-data
   ```

#### Frontend Setup

1. **Install Dependencies**:
   ```bash
   cd frontend
   npm install
   ```

2. **Start Development Server**:
   ```bash
   npm start
   ```

## Contributing Guidelines

### Types of Contributions

We welcome several types of contributions:

#### Bug Reports
- Use the bug report template
- Include steps to reproduce
- Provide expected vs actual behavior
- Include system information
- Add relevant screenshots or logs

#### Feature Requests
- Use the feature request template
- Clearly describe the feature
- Explain the use case and benefits
- Consider implementation complexity

#### Code Contributions
- Bug fixes
- New features
- Performance improvements
- Documentation improvements
- Test coverage improvements

#### Documentation
- API documentation
- User guides
- Code comments
- README improvements
- Translation contributions

### Contribution Workflow

1. **Check Existing Issues**:
   - Search existing issues before creating new ones
   - Comment on issues you'd like to work on
   - Wait for maintainer approval before starting work

2. **Create Feature Branch**:
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b bugfix/issue-number-description
   ```

3. **Make Changes**:
   - Follow coding standards
   - Write tests for new functionality
   - Update documentation as needed
   - Keep commits focused and atomic

4. **Test Your Changes**:
   ```bash
   make test
   make lint
   make security-scan
   ```

5. **Commit Changes**:
   ```bash
   git add .
   git commit -m "type: brief description
   
   Longer explanation if needed
   
   Fixes #issue-number"
   ```

6. **Push and Create PR**:
   ```bash
   git push origin feature/your-feature-name
   ```
   Then create a pull request on GitHub.

## Coding Standards

### General Principles

- **Clarity over cleverness**: Write code that is easy to understand
- **Consistency**: Follow existing patterns and conventions
- **Documentation**: Document complex logic and public APIs
- **Testing**: Write tests for new functionality
- **Security**: Follow security best practices

### Python (Backend)

#### Style Guide
- Follow [PEP 8](https://pep8.org/)
- Use [Black](https://github.com/psf/black) for code formatting
- Use [flake8](https://flake8.pycqa.org/) for linting
- Use [isort](https://pycqa.github.io/isort/) for import sorting

#### Code Examples

```python
# Good
class SpeciesObservation:
    """Represents a wildlife species observation."""
    
    def __init__(self, species_id: str, count: int, location: Tuple[float, float]):
        self.species_id = species_id
        self.count = count
        self.latitude, self.longitude = location
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert observation to dictionary format."""
        return {
            'species_id': self.species_id,
            'count': self.count,
            'latitude': self.latitude,
            'longitude': self.longitude
        }

# API endpoint example
@observations_bp.route('', methods=['POST'])
@jwt_required()
def create_observation():
    """Create a new observation."""
    try:
        data = request.get_json()
        result = observation_schema.load(data)
        
        observation = Observation(**result)
        db.session.add(observation)
        db.session.commit()
        
        return jsonify({
            'message': 'Observation created successfully',
            'observation': observation_schema.dump(observation)
        }), 201
        
    except ValidationError as err:
        return jsonify({'errors': err.messages}), 400
```

#### Testing
- Use [pytest](https://pytest.org/) for testing
- Write unit tests for individual functions
- Write integration tests for API endpoints
- Use fixtures for test data
- Aim for >80% test coverage

```python
def test_create_observation(client, auth_headers, sample_project, sample_species):
    """Test observation creation."""
    observation_data = {
        'project_id': sample_project.id,
        'species_id': sample_species.id,
        'observation_date': '2024-01-15T10:30:00Z',
        'latitude': 0.0,
        'longitude': 0.0,
        'count': 2
    }
    
    response = client.post('/api/observations', 
                          json=observation_data, 
                          headers=auth_headers)
    
    assert response.status_code == 201
    assert 'observation' in response.json
```

### JavaScript/React (Frontend)

#### Style Guide
- Use [ESLint](https://eslint.org/) with Airbnb configuration
- Use [Prettier](https://prettier.io/) for code formatting
- Use modern ES6+ features
- Follow React best practices

#### Code Examples

```javascript
// Good - Functional component with hooks
import React, { useState, useEffect } from 'react';
import { observationsAPI } from '../services/api';

const ObservationList = ({ projectId }) => {
  const [observations, setObservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadObservations = async () => {
      try {
        setLoading(true);
        const response = await observationsAPI.getObservations({ 
          project_id: projectId 
        });
        setObservations(response.data.observations);
      } catch (err) {
        setError('Failed to load observations');
      } finally {
        setLoading(false);
      }
    };

    if (projectId) {
      loadObservations();
    }
  }, [projectId]);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div>
      {observations.map(observation => (
        <ObservationCard 
          key={observation.id} 
          observation={observation} 
        />
      ))}
    </div>
  );
};

export default ObservationList;
```

#### Component Guidelines
- Use functional components with hooks
- Keep components small and focused
- Use TypeScript for type safety (if applicable)
- Write meaningful prop types or TypeScript interfaces
- Use Material-UI components consistently

#### Testing
- Use [Jest](https://jestjs.io/) and [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- Test user interactions, not implementation details
- Mock API calls in tests
- Write accessibility tests

```javascript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ObservationForm from '../ObservationForm';

test('submits observation form with valid data', async () => {
  const mockOnSubmit = jest.fn();
  
  render(<ObservationForm onSubmit={mockOnSubmit} />);
  
  fireEvent.change(screen.getByLabelText(/species/i), {
    target: { value: 'Panthera leo' }
  });
  
  fireEvent.click(screen.getByRole('button', { name: /submit/i }));
  
  await waitFor(() => {
    expect(mockOnSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        species: 'Panthera leo'
      })
    );
  });
});
```

### Database

#### Migrations
- Always create migrations for schema changes
- Use descriptive migration names
- Test migrations on sample data
- Provide rollback instructions

#### Naming Conventions
- Tables: plural, snake_case (`observations`, `species_data`)
- Columns: snake_case (`created_at`, `species_id`)
- Indexes: descriptive (`idx_observations_species_date`)
- Foreign keys: `table_id` format

## Testing Guidelines

### Test Categories

#### Unit Tests
- Test individual functions/methods
- Mock external dependencies
- Fast execution
- High coverage of business logic

#### Integration Tests
- Test API endpoints
- Test database interactions
- Test external service integrations
- Use test database

#### End-to-End Tests
- Test complete user workflows
- Use Cypress for browser testing
- Test critical user paths
- Run in CI/CD pipeline

### Running Tests

```bash
# All tests
make test

# Backend tests only
make test-backend

# Frontend tests only
make test-frontend

# E2E tests
make test-e2e

# With coverage
cd backend && pytest --cov=app tests/
cd frontend && npm test -- --coverage
```

### Test Data
- Use factories for test data generation
- Clean up test data after tests
- Use realistic but anonymized data
- Avoid dependencies between tests

## Documentation

### Code Documentation

#### Python
```python
def calculate_species_diversity(observations: List[Observation]) -> float:
    """Calculate Shannon diversity index for species observations.
    
    Args:
        observations: List of observation records
        
    Returns:
        Shannon diversity index value
        
    Raises:
        ValueError: If observations list is empty
        
    Example:
        >>> obs = [obs1, obs2, obs3]
        >>> diversity = calculate_species_diversity(obs)
        >>> print(f"Diversity: {diversity:.2f}")
    """
```

#### JavaScript
```javascript
/**
 * Formats coordinates for display
 * @param {number} latitude - Latitude in decimal degrees
 * @param {number} longitude - Longitude in decimal degrees
 * @param {number} precision - Number of decimal places
 * @returns {string} Formatted coordinate string
 */
const formatCoordinates = (latitude, longitude, precision = 4) => {
  // Implementation
};
```

### API Documentation
- Document all endpoints
- Include request/response examples
- Specify authentication requirements
- Document error responses
- Use OpenAPI/Swagger when possible

### User Documentation
- Write clear, step-by-step instructions
- Include screenshots for complex processes
- Provide troubleshooting guides
- Keep documentation updated with features

## Pull Request Process

### Before Submitting

1. **Ensure Tests Pass**:
   ```bash
   make test
   make lint
   ```

2. **Update Documentation**:
   - Update API docs for new endpoints
   - Update user guides for new features
   - Update CHANGELOG.md

3. **Check Security**:
   ```bash
   make security-scan
   ```

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] Tests added/updated
```

### Review Process

1. **Automated Checks**: All CI checks must pass
2. **Code Review**: At least one maintainer review required
3. **Testing**: Manual testing for significant changes
4. **Documentation**: Verify docs are updated
5. **Security**: Security review for sensitive changes

### Review Guidelines

#### For Reviewers
- Be constructive and specific in feedback
- Test significant changes locally
- Check for security implications
- Verify documentation updates
- Approve when ready for merge

#### For Contributors
- Respond to feedback promptly
- Make requested changes in separate commits
- Explain design decisions when asked
- Be open to suggestions and improvements

## Release Process

### Version Numbering
We use [Semantic Versioning](https://semver.org/):
- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes (backward compatible)

### Release Steps

1. **Update Version**:
   ```bash
   make tag-version VERSION=1.2.0
   ```

2. **Update CHANGELOG.md**:
   - Add release notes
   - List new features and bug fixes
   - Note any breaking changes

3. **Create Release PR**:
   - Include version bump
   - Include changelog updates
   - Get approval from maintainers

4. **Create GitHub Release**:
   - Tag the release
   - Include release notes
   - Attach built artifacts

5. **Deploy**:
   ```bash
   make deploy-prod
   ```

### Release Notes Template

```markdown
## [1.2.0] - 2024-01-15

### Added
- New species identification feature
- Export functionality for observations
- Advanced search filters

### Changed
- Improved map performance
- Updated user interface design

### Fixed
- GPS coordinate validation
- File upload error handling

### Security
- Updated dependencies
- Enhanced authentication
```

## Getting Help

### Community Support

- **GitHub Issues**: For bug reports and feature requests
- **Discussions**: For questions and general discussion
- **Discord**: Real-time chat with community
- **Stack Overflow**: Tag questions with `species-monitoring`

### Documentation

- **API Docs**: `/docs/API.md`
- **User Guide**: `/docs/USER_GUIDE.md`
- **Deployment**: `/docs/DEPLOYMENT.md`

### Maintainer Contact

For urgent issues or security concerns:
- Email: maintainers@species-monitoring.org
- Security: security@species-monitoring.org

### Debugging Help

When asking for help, include:
- Clear description of the problem
- Steps to reproduce the issue
- Expected vs actual behavior
- System information (OS, browser, versions)
- Relevant logs or error messages
- Screenshots if applicable

Thank you for contributing to the Species Monitoring Application! Your efforts help conservation researchers worldwide track and protect wildlife species.