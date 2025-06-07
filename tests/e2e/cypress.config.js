const { defineConfig } = require('cypress');

module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    supportFile: 'tests/e2e/cypress/support/e2e.js',
    specPattern: 'tests/e2e/cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    fixturesFolder: 'tests/e2e/cypress/fixtures',
    screenshotsFolder: 'tests/e2e/cypress/screenshots',
    videosFolder: 'tests/e2e/cypress/videos',
    viewportWidth: 1280,
    viewportHeight: 720,
    
    setupNodeEvents(on, config) {
      // implement node event listeners here
      on('task', {
        log(message) {
          console.log(message);
          return null;
        },
        
        // Database seeding task
        seedDatabase() {
          // This would connect to your test database and seed it
          return null;
        },
        
        // Clear database task
        clearDatabase() {
          // This would clear your test database
          return null;
        }
      });
      
      // Environment configuration
      config.env = {
        ...config.env,
        API_URL: process.env.CYPRESS_API_URL || 'http://localhost:5000/api',
        TEST_USER_EMAIL: 'test@example.com',
        TEST_USER_PASSWORD: 'testpassword123',
        ADMIN_USER_EMAIL: 'admin@example.com',
        ADMIN_USER_PASSWORD: 'admin123'
      };
      
      return config;
    },
    
    // Test isolation and cleanup
    testIsolation: true,
    
    // Network and timing
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    responseTimeout: 10000,
    pageLoadTimeout: 30000,
    
    // Video and screenshots
    video: true,
    videoCompression: 32,
    videosFolder: 'tests/e2e/cypress/videos',
    screenshotOnRunFailure: true,
    
    // Browser configuration
    chromeWebSecurity: false,
    
    // Retry configuration
    retries: {
      runMode: 2,
      openMode: 0
    },
    
    // Environment variables
    env: {
      coverage: false,
      codeCoverage: {
        exclude: ['cypress/**/*.*']
      }
    }
  },
  
  component: {
    devServer: {
      framework: 'create-react-app',
      bundler: 'webpack',
    },
    setupNodeEvents(on, config) {
      // Component testing setup
    },
    specPattern: 'src/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: 'tests/e2e/cypress/support/component.js'
  }
});