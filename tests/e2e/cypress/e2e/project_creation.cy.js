describe('Project Creation and Management', () => {
  beforeEach(() => {
    // Login before each test
    cy.visit('/login');
    cy.get('input[name="username"]').type('admin');
    cy.get('input[name="password"]').type('admin123');
    cy.get('button[type="submit"]').click();
    
    // Wait for dashboard to load
    cy.url().should('include', '/dashboard');
    
    // Navigate to projects
    cy.contains('Projects').click();
    cy.url().should('include', '/projects');
  });

  it('should display projects page', () => {
    cy.contains('Projects').should('be.visible');
    cy.get('[data-testid="new-project-button"]').should('be.visible');
    cy.get('[data-testid="projects-grid"]').should('be.visible');
  });

  it('should open project creation dialog', () => {
    cy.get('[data-testid="new-project-button"]').click();
    
    cy.get('[data-testid="project-form-dialog"]').should('be.visible');
    cy.contains('Create New Project').should('be.visible');
    cy.get('input[name="name"]').should('be.visible');
    cy.get('textarea[name="description"]').should('be.visible');
  });

  it('should validate required fields', () => {
    cy.get('[data-testid="new-project-button"]').click();
    
    // Try to submit without filling required fields
    cy.get('[data-testid="submit-project-button"]').click();
    
    // Should show validation errors
    cy.contains('Project name is required').should('be.visible');
  });

  it('should create a new project successfully', () => {
    const projectName = `Test Project ${Date.now()}`;
    const projectDescription = 'This is a test project created by Cypress';
    
    cy.get('[data-testid="new-project-button"]').click();
    
    // Fill out the form
    cy.get('input[name="name"]').type(projectName);
    cy.get('textarea[name="description"]').type(projectDescription);
    cy.get('input[name="location"]').type('Test Location');
    
    // Set start date
    cy.get('[data-testid="start-date-picker"]').click();
    cy.get('.MuiPickersDay-root[aria-label*="15"]').first().click();
    
    // Set end date
    cy.get('[data-testid="end-date-picker"]').click();
    cy.get('.MuiPickersDay-root[aria-label*="30"]').first().click();
    
    // Select status
    cy.get('[data-testid="status-select"]').click();
    cy.contains('Active').click();
    
    // Submit the form
    cy.get('[data-testid="submit-project-button"]').click();
    
    // Should close dialog and show success message
    cy.get('[data-testid="project-form-dialog"]').should('not.exist');
    cy.contains('Project created successfully').should('be.visible');
    
    // Should see the new project in the list
    cy.contains(projectName).should('be.visible');
    cy.contains(projectDescription).should('be.visible');
  });

  it('should edit an existing project', () => {
    // First create a project
    const originalName = `Original Project ${Date.now()}`;
    const updatedName = `Updated Project ${Date.now()}`;
    
    cy.get('[data-testid="new-project-button"]').click();
    cy.get('input[name="name"]').type(originalName);
    cy.get('textarea[name="description"]').type('Original description');
    cy.get('[data-testid="submit-project-button"]').click();
    
    // Wait for project to be created
    cy.contains(originalName).should('be.visible');
    
    // Find and click edit button
    cy.get(`[data-testid="project-card-${originalName}"]`)
      .find('[data-testid="edit-project-button"]')
      .click();
    
    // Update the project
    cy.get('input[name="name"]').clear().type(updatedName);
    cy.get('textarea[name="description"]').clear().type('Updated description');
    cy.get('[data-testid="submit-project-button"]').click();
    
    // Should see updated project
    cy.contains(updatedName).should('be.visible');
    cy.contains('Updated description').should('be.visible');
    cy.contains(originalName).should('not.exist');
  });

  it('should delete a project with confirmation', () => {
    // First create a project
    const projectName = `Project to Delete ${Date.now()}`;
    
    cy.get('[data-testid="new-project-button"]').click();
    cy.get('input[name="name"]').type(projectName);
    cy.get('[data-testid="submit-project-button"]').click();
    
    // Wait for project to be created
    cy.contains(projectName).should('be.visible');
    
    // Find and click delete button
    cy.get(`[data-testid="project-card-${projectName}"]`)
      .find('[data-testid="delete-project-button"]')
      .click();
    
    // Should show confirmation dialog
    cy.get('[data-testid="confirm-dialog"]').should('be.visible');
    cy.contains('Delete Project').should('be.visible');
    cy.contains(projectName).should('be.visible');
    
    // Confirm deletion
    cy.get('[data-testid="confirm-delete-button"]').click();
    
    // Project should be removed from list
    cy.contains(projectName).should('not.exist');
    cy.contains('Project deleted successfully').should('be.visible');
  });

  it('should cancel project deletion', () => {
    // First create a project
    const projectName = `Project to Keep ${Date.now()}`;
    
    cy.get('[data-testid="new-project-button"]').click();
    cy.get('input[name="name"]').type(projectName);
    cy.get('[data-testid="submit-project-button"]').click();
    
    // Wait for project to be created
    cy.contains(projectName).should('be.visible');
    
    // Find and click delete button
    cy.get(`[data-testid="project-card-${projectName}"]`)
      .find('[data-testid="delete-project-button"]')
      .click();
    
    // Cancel deletion
    cy.get('[data-testid="cancel-delete-button"]').click();
    
    // Project should still exist
    cy.contains(projectName).should('be.visible');
  });

  it('should filter projects by status', () => {
    // Create projects with different statuses
    const activeProject = `Active Project ${Date.now()}`;
    const completedProject = `Completed Project ${Date.now()}`;
    
    // Create active project
    cy.get('[data-testid="new-project-button"]').click();
    cy.get('input[name="name"]').type(activeProject);
    cy.get('[data-testid="status-select"]').click();
    cy.contains('Active').click();
    cy.get('[data-testid="submit-project-button"]').click();
    
    // Create completed project
    cy.get('[data-testid="new-project-button"]').click();
    cy.get('input[name="name"]').type(completedProject);
    cy.get('[data-testid="status-select"]').click();
    cy.contains('Completed').click();
    cy.get('[data-testid="submit-project-button"]').click();
    
    // Both projects should be visible initially
    cy.contains(activeProject).should('be.visible');
    cy.contains(completedProject).should('be.visible');
    
    // Filter by active status
    cy.get('[data-testid="status-filter"]').click();
    cy.contains('Active').click();
    
    // Only active project should be visible
    cy.contains(activeProject).should('be.visible');
    cy.contains(completedProject).should('not.exist');
    
    // Clear filter
    cy.get('[data-testid="clear-filters-button"]').click();
    
    // Both projects should be visible again
    cy.contains(activeProject).should('be.visible');
    cy.contains(completedProject).should('be.visible');
  });

  it('should search projects by name', () => {
    const searchableProject = `Searchable Project ${Date.now()}`;
    const otherProject = `Other Project ${Date.now()}`;
    
    // Create projects
    cy.get('[data-testid="new-project-button"]').click();
    cy.get('input[name="name"]').type(searchableProject);
    cy.get('[data-testid="submit-project-button"]').click();
    
    cy.get('[data-testid="new-project-button"]').click();
    cy.get('input[name="name"]').type(otherProject);
    cy.get('[data-testid="submit-project-button"]').click();
    
    // Both projects should be visible
    cy.contains(searchableProject).should('be.visible');
    cy.contains(otherProject).should('be.visible');
    
    // Search for specific project
    cy.get('[data-testid="search-input"]').type('Searchable');
    
    // Only matching project should be visible
    cy.contains(searchableProject).should('be.visible');
    cy.contains(otherProject).should('not.exist');
    
    // Clear search
    cy.get('[data-testid="search-input"]').clear();
    
    // Both projects should be visible again
    cy.contains(searchableProject).should('be.visible');
    cy.contains(otherProject).should('be.visible');
  });

  it('should navigate to project details', () => {
    const projectName = `Detail Project ${Date.now()}`;
    
    // Create a project
    cy.get('[data-testid="new-project-button"]').click();
    cy.get('input[name="name"]').type(projectName);
    cy.get('[data-testid="submit-project-button"]').click();
    
    // Click on project to view details
    cy.contains(projectName).click();
    
    // Should navigate to project detail page
    cy.url().should('include', '/projects/');
    cy.contains(projectName).should('be.visible');
    cy.contains('Overview').should('be.visible');
    cy.contains('Observations').should('be.visible');
    cy.contains('Members').should('be.visible');
  });

  it('should handle project creation errors', () => {
    // Mock server error response
    cy.intercept('POST', '/api/projects', {
      statusCode: 500,
      body: { error: 'Internal server error' }
    }).as('createProjectError');
    
    cy.get('[data-testid="new-project-button"]').click();
    cy.get('input[name="name"]').type('Error Project');
    cy.get('[data-testid="submit-project-button"]').click();
    
    cy.wait('@createProjectError');
    
    // Should show error message
    cy.contains('Failed to save project').should('be.visible');
    
    // Dialog should remain open
    cy.get('[data-testid="project-form-dialog"]').should('be.visible');
  });

  it('should validate date ranges', () => {
    cy.get('[data-testid="new-project-button"]').click();
    cy.get('input[name="name"]').type('Date Test Project');
    
    // Set end date before start date
    cy.get('[data-testid="start-date-picker"]').type('2024-12-31');
    cy.get('[data-testid="end-date-picker"]').type('2024-01-01');
    
    cy.get('[data-testid="submit-project-button"]').click();
    
    // Should show validation error
    cy.contains('End date must be after start date').should('be.visible');
  });

  it('should show empty state when no projects exist', () => {
    // Mock empty projects response
    cy.intercept('GET', '/api/projects*', {
      body: {
        projects: [],
        total: 0,
        pages: 0,
        current_page: 1,
        per_page: 20
      }
    }).as('getEmptyProjects');
    
    cy.reload();
    cy.wait('@getEmptyProjects');
    
    cy.contains('No projects found').should('be.visible');
    cy.contains('Create your first project').should('be.visible');
  });

  context('Project Permissions', () => {
    it('should only show edit/delete buttons for project owners', () => {
      // This test would require setting up different user accounts
      // and testing role-based permissions
    });
    
    it('should restrict project creation based on user role', () => {
      // Test that observers cannot create projects
      // while researchers and admins can
    });
  });

  context('Mobile Responsive', () => {
    it('should work on mobile devices', () => {
      cy.viewport('iphone-x');
      
      // Should show mobile-friendly layout
      cy.get('[data-testid="projects-grid"]').should('be.visible');
      cy.get('[data-testid="mobile-fab"]').should('be.visible');
      
      // Test mobile project creation
      cy.get('[data-testid="mobile-fab"]').click();
      cy.get('[data-testid="project-form-dialog"]').should('be.visible');
    });
  });
});