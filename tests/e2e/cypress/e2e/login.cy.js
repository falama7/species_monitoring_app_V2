describe('Authentication', () => {
  beforeEach(() => {
    cy.visit('/login');
  });

  it('should display login form', () => {
    cy.get('[data-testid="login-form"]').should('be.visible');
    cy.get('input[name="username"]').should('be.visible');
    cy.get('input[name="password"]').should('be.visible');
    cy.get('button[type="submit"]').should('contain', 'Sign In');
  });

  it('should show validation errors for empty fields', () => {
    cy.get('button[type="submit"]').click();
    
    // Check for validation messages (these might be browser default or custom)
    cy.get('input[name="username"]').should('have.attr', 'required');
    cy.get('input[name="password"]').should('have.attr', 'required');
  });

  it('should show error for invalid credentials', () => {
    cy.get('input[name="username"]').type('invalid_user');
    cy.get('input[name="password"]').type('wrong_password');
    cy.get('button[type="submit"]').click();

    // Wait for error message
    cy.contains('Invalid credentials', { timeout: 10000 }).should('be.visible');
  });

  it('should login successfully with valid credentials', () => {
    // Use environment variables for test credentials
    cy.get('input[name="username"]').type('admin');
    cy.get('input[name="password"]').type('admin123');
    cy.get('button[type="submit"]').click();

    // Should redirect to dashboard
    cy.url().should('include', '/dashboard');
    cy.contains('Welcome back').should('be.visible');
  });

  it('should navigate to registration page', () => {
    cy.contains('Sign Up').click();
    cy.url().should('include', '/register');
    cy.contains('Create your account').should('be.visible');
  });

  it('should remember login state after page refresh', () => {
    // Login first
    cy.get('input[name="username"]').type('admin');
    cy.get('input[name="password"]').type('admin123');
    cy.get('button[type="submit"]').click();

    // Wait for redirect
    cy.url().should('include', '/dashboard');

    // Refresh the page
    cy.reload();

    // Should still be logged in
    cy.url().should('include', '/dashboard');
    cy.contains('Welcome back').should('be.visible');
  });

  it('should logout successfully', () => {
    // Login first
    cy.get('input[name="username"]').type('admin');
    cy.get('input[name="password"]').type('admin123');
    cy.get('button[type="submit"]').click();

    // Wait for dashboard
    cy.url().should('include', '/dashboard');

    // Click user menu and logout
    cy.get('[data-testid="user-menu"]').click();
    cy.contains('Logout').click();

    // Should redirect to login
    cy.url().should('include', '/login');
  });

  it('should redirect unauthenticated users to login', () => {
    // Try to access protected route
    cy.visit('/dashboard');
    cy.url().should('include', '/login');
  });

  context('Registration', () => {
    beforeEach(() => {
      cy.visit('/register');
    });

    it('should display registration form', () => {
      cy.get('[data-testid="register-form"]').should('be.visible');
      cy.get('input[name="username"]').should('be.visible');
      cy.get('input[name="email"]').should('be.visible');
      cy.get('input[name="password"]').should('be.visible');
      cy.get('input[name="confirmPassword"]').should('be.visible');
      cy.get('input[name="first_name"]').should('be.visible');
      cy.get('input[name="last_name"]').should('be.visible');
    });

    it('should validate password confirmation', () => {
      cy.get('input[name="password"]').type('password123');
      cy.get('input[name="confirmPassword"]').type('different_password');
      cy.get('button[type="submit"]').click();

      cy.contains('Passwords do not match').should('be.visible');
    });

    it('should validate email format', () => {
      cy.get('input[name="email"]').type('invalid-email');
      cy.get('input[name="username"]').type('testuser');
      cy.get('input[name="password"]').type('password123');
      cy.get('input[name="confirmPassword"]').type('password123');
      cy.get('input[name="first_name"]').type('Test');
      cy.get('input[name="last_name"]').type('User');
      cy.get('button[type="submit"]').click();

      // Should show email validation error
      cy.get('input[name="email"]').should('have.attr', 'aria-invalid', 'true');
    });

    it('should register new user successfully', () => {
      const timestamp = Date.now();
      const username = `testuser${timestamp}`;
      const email = `test${timestamp}@example.com`;

      cy.get('input[name="username"]').type(username);
      cy.get('input[name="email"]').type(email);
      cy.get('input[name="password"]').type('password123');
      cy.get('input[name="confirmPassword"]').type('password123');
      cy.get('input[name="first_name"]').type('Test');
      cy.get('input[name="last_name"]').type('User');
      
      // Select role
      cy.get('[data-testid="role-select"]').click();
      cy.contains('Observer').click();
      
      cy.get('button[type="submit"]').click();

      // Should redirect to dashboard after successful registration
      cy.url().should('include', '/dashboard');
      cy.contains('Welcome back, Test').should('be.visible');
    });

    it('should show error for duplicate username', () => {
      // Try to register with existing username
      cy.get('input[name="username"]').type('admin');
      cy.get('input[name="email"]').type('newemail@example.com');
      cy.get('input[name="password"]').type('password123');
      cy.get('input[name="confirmPassword"]').type('password123');
      cy.get('input[name="first_name"]').type('Test');
      cy.get('input[name="last_name"]').type('User');
      cy.get('button[type="submit"]').click();

      cy.contains('Username already exists').should('be.visible');
    });
  });

  context('Password Reset', () => {
    it('should show forgot password link', () => {
      cy.contains('Forgot password').should('be.visible');
    });

    // Note: Password reset functionality would need to be implemented
    // it('should send password reset email', () => {
    //   cy.contains('Forgot password').click();
    //   cy.get('input[name="email"]').type('user@example.com');
    //   cy.get('button[type="submit"]').click();
    //   cy.contains('Password reset email sent').should('be.visible');
    // });
  });

  context('Session Management', () => {
    it('should handle token expiration', () => {
      // Login first
      cy.get('input[name="username"]').type('admin');
      cy.get('input[name="password"]').type('admin123');
      cy.get('button[type="submit"]').click();

      // Wait for dashboard
      cy.url().should('include', '/dashboard');

      // Simulate token expiration by manipulating localStorage
      cy.window().then((window) => {
        window.localStorage.setItem('access_token', 'expired_token');
      });

      // Try to make an API call that requires authentication
      cy.visit('/projects');

      // Should redirect to login due to expired token
      cy.url().should('include', '/login');
    });

    it('should refresh token automatically', () => {
      // This would test automatic token refresh functionality
      // Implementation depends on your token refresh strategy
    });
  });

  context('Role-based Access', () => {
    it('should show appropriate navigation for different roles', () => {
      // Test admin access
      cy.get('input[name="username"]').type('admin');
      cy.get('input[name="password"]').type('admin123');
      cy.get('button[type="submit"]').click();

      cy.url().should('include', '/dashboard');
      
      // Admin should see Users menu
      cy.get('[data-testid="navbar"]').should('contain', 'Users');
    });

    it('should restrict access based on role', () => {
      // Login as observer
      cy.get('input[name="username"]').type('observer');
      cy.get('input[name="password"]').type('observer123');
      cy.get('button[type="submit"]').click();

      // Try to access admin-only page
      cy.visit('/users');
      
      // Should show access denied or redirect
      cy.contains('Access Denied').should('be.visible');
    });
  });

  context('Mobile Responsive', () => {
    it('should work on mobile devices', () => {
      cy.viewport('iphone-x');
      
      cy.get('input[name="username"]').should('be.visible');
      cy.get('input[name="password"]').should('be.visible');
      cy.get('button[type="submit"]').should('be.visible');

      // Test mobile login
      cy.get('input[name="username"]').type('admin');
      cy.get('input[name="password"]').type('admin123');
      cy.get('button[type="submit"]').click();

      cy.url().should('include', '/dashboard');
    });
  });

  context('Accessibility', () => {
    it('should be keyboard navigable', () => {
      // Tab through form elements
      cy.get('body').tab();
      cy.focused().should('have.attr', 'name', 'username');
      
      cy.focused().tab();
      cy.focused().should('have.attr', 'name', 'password');
      
      cy.focused().tab();
      cy.focused().should('have.attr', 'type', 'submit');
    });

    it('should have proper ARIA labels', () => {
      cy.get('input[name="username"]').should('have.attr', 'aria-label');
      cy.get('input[name="password"]').should('have.attr', 'aria-label');
    });

    it('should announce errors to screen readers', () => {
      cy.get('button[type="submit"]').click();
      
      // Check for aria-describedby or aria-live regions
      cy.get('[role="alert"]').should('exist');
    });
  });
});