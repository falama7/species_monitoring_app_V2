import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import Login from '../../src/components/Login';
import { AuthProvider } from '../../src/contexts/AuthContext';

const theme = createTheme();

const MockedLogin = () => (
  
    
      
        
      
    
  
);

// Mock the auth context
const mockLogin = jest.fn();
jest.mock('../../src/contexts/AuthContext', () => ({
  ...jest.requireActual('../../src/contexts/AuthContext'),
  useAuth: () => ({
    login: mockLogin,
    isAuthenticated: false,
    loading: false
  })
}));

describe('Login Component', () => {
  beforeEach(() => {
    mockLogin.mockClear();
  });

  test('renders login form', () => {
    render();
    
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  test('submits form with valid data', async () => {
    mockLogin.mockResolvedValue({ success: true });
    
    render();
    
    fireEvent.change(screen.getByLabelText(/username/i), {
      target: { value: 'testuser' }
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' }
    });
    
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        username: 'testuser',
        password: 'password123'
      });
    });
  });

  test('displays error message on login failure', async () => {
    mockLogin.mockResolvedValue({ 
      success: false, 
      error: 'Invalid credentials' 
    });
    
    render();
    
    fireEvent.change(screen.getByLabelText(/username/i), {
      target: { value: 'testuser' }
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'wrongpassword' }
    });
    
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    
    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
    });
  });

  test('has link to registration page', () => {
    render();
    
    expect(screen.getByText(/don't have an account/i)).toBeInTheDocument();
  });
});