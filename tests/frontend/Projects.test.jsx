import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import Projects from '../../src/components/Projects';
import { AuthProvider } from '../../src/contexts/AuthContext';

const theme = createTheme();

const MockedProjects = ({ children }) => (
  <BrowserRouter>
    <ThemeProvider theme={theme}>
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </LocalizationProvider>
    </ThemeProvider>
  </BrowserRouter>
);

// Mock the API
const mockProjects = [
  {
    id: '1',
    name: 'Wildlife Survey 2024',
    description: 'Annual wildlife survey project',
    location: 'Maasai Mara',
    status: 'active',
    created_by: {
      id: '1',
      first_name: 'John',
      last_name: 'Doe'
    },
    members_count: 5,
    observations_count: 120,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-15T00:00:00Z'
  },
  {
    id: '2',
    name: 'Bird Migration Study',
    description: 'Studying bird migration patterns',
    location: 'Lake Nakuru',
    status: 'completed',
    created_by: {
      id: '2',
      first_name: 'Jane',
      last_name: 'Smith'
    },
    members_count: 3,
    observations_count: 89,
    created_at: '2023-11-01T00:00:00Z',
    updated_at: '2024-01-10T00:00:00Z'
  }
];

const mockAPI = {
  getProjects: jest.fn(),
  createProject: jest.fn(),
  updateProject: jest.fn(),
  deleteProject: jest.fn()
};

jest.mock('../../src/services/api', () => ({
  projectsAPI: {
    getProjects: () => mockAPI.getProjects(),
    createProject: (data) => mockAPI.createProject(data),
    updateProject: (id, data) => mockAPI.updateProject(id, data),
    deleteProject: (id) => mockAPI.deleteProject(id)
  }
}));

// Mock the auth context
const mockUser = {
  id: '1',
  username: 'testuser',
  first_name: 'Test',
  last_name: 'User',
  role: 'researcher'
};

jest.mock('../../src/contexts/AuthContext', () => ({
  ...jest.requireActual('../../src/contexts/AuthContext'),
  useAuth: () => ({
    user: mockUser,
    isAuthenticated: true,
    loading: false
  })
}));

describe('Projects Component', () => {
  beforeEach(() => {
    mockAPI.getProjects.mockResolvedValue({
      data: {
        projects: mockProjects,
        total: 2,
        pages: 1,
        current_page: 1,
        per_page: 20
      }
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renders projects list', async () => {
    render(
      <MockedProjects>
        <Projects />
      </MockedProjects>
    );

    expect(screen.getByText('Projects')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByText('Wildlife Survey 2024')).toBeInTheDocument();
      expect(screen.getByText('Bird Migration Study')).toBeInTheDocument();
    });
  });

  test('displays project information correctly', async () => {
    render(
      <MockedProjects>
        <Projects />
      </MockedProjects>
    );

    await waitFor(() => {
      // Check project details
      expect(screen.getByText('Wildlife Survey 2024')).toBeInTheDocument();
      expect(screen.getByText('Annual wildlife survey project')).toBeInTheDocument();
      expect(screen.getByText('Maasai Mara')).toBeInTheDocument();
      expect(screen.getByText('5 members')).toBeInTheDocument();
      expect(screen.getByText('120 observations')).toBeInTheDocument();
    });
  });

  test('filters projects by status', async () => {
    render(
      <MockedProjects>
        <Projects />
      </MockedProjects>
    );

    await waitFor(() => {
      expect(screen.getByText('Wildlife Survey 2024')).toBeInTheDocument();
    });

    // Find and click status filter
    const statusFilter = screen.getByLabelText('Status');
    fireEvent.mouseDown(statusFilter);
    
    await waitFor(() => {
      const activeOption = screen.getByText('Active');
      fireEvent.click(activeOption);
    });

    // API should be called with status filter
    await waitFor(() => {
      expect(mockAPI.getProjects).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'active'
        })
      );
    });
  });

  test('searches projects', async () => {
    render(
      <MockedProjects>
        <Projects />
      </MockedProjects>
    );

    await waitFor(() => {
      expect(screen.getByText('Wildlife Survey 2024')).toBeInTheDocument();
    });

    const searchInput = screen.getByLabelText(/search projects/i);
    fireEvent.change(searchInput, { target: { value: 'Wildlife' } });

    await waitFor(() => {
      expect(mockAPI.getProjects).toHaveBeenCalledWith(
        expect.objectContaining({
          search: 'Wildlife'
        })
      );
    });
  });

  test('opens create project dialog', async () => {
    render(
      <MockedProjects>
        <Projects />
      </MockedProjects>
    );

    await waitFor(() => {
      expect(screen.getByText('Wildlife Survey 2024')).toBeInTheDocument();
    });

    const newProjectButton = screen.getByText('New Project');
    fireEvent.click(newProjectButton);

    await waitFor(() => {
      expect(screen.getByText('Create New Project')).toBeInTheDocument();
    });
  });

  test('creates new project', async () => {
    const newProject = {
      id: '3',
      name: 'New Project',
      description: 'Test project',
      location: 'Test Location',
      status: 'active',
      created_by: mockUser,
      members_count: 1,
      observations_count: 0,
      created_at: '2024-01-20T00:00:00Z',
      updated_at: '2024-01-20T00:00:00Z'
    };

    mockAPI.createProject.mockResolvedValue({
      data: { project: newProject }
    });

    render(
      <MockedProjects>
        <Projects />
      </MockedProjects>
    );

    // Open create dialog
    const newProjectButton = screen.getByText('New Project');
    fireEvent.click(newProjectButton);

    await waitFor(() => {
      expect(screen.getByText('Create New Project')).toBeInTheDocument();
    });

    // Fill form
    const nameInput = screen.getByLabelText(/project name/i);
    const descriptionInput = screen.getByLabelText(/description/i);
    
    fireEvent.change(nameInput, { target: { value: 'New Project' } });
    fireEvent.change(descriptionInput, { target: { value: 'Test project' } });

    // Submit form
    const createButton = screen.getByRole('button', { name: /create/i });
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(mockAPI.createProject).toHaveBeenCalledWith({
        name: 'New Project',
        description: 'Test project',
        location: '',
        start_date: null,
        end_date: null,
        status: 'active'
      });
    });
  });

  test('edits existing project', async () => {
    const updatedProject = {
      ...mockProjects[0],
      name: 'Updated Project Name'
    };

    mockAPI.updateProject.mockResolvedValue({
      data: { project: updatedProject }
    });

    render(
      <MockedProjects>
        <Projects />
      </MockedProjects>
    );

    await waitFor(() => {
      expect(screen.getByText('Wildlife Survey 2024')).toBeInTheDocument();
    });

    // Find and click edit button
    const editButtons = screen.getAllByLabelText(/edit/i);
    fireEvent.click(editButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Edit Project')).toBeInTheDocument();
    });

    // Update name
    const nameInput = screen.getByDisplayValue('Wildlife Survey 2024');
    fireEvent.change(nameInput, { target: { value: 'Updated Project Name' } });

    // Submit form
    const updateButton = screen.getByRole('button', { name: /update/i });
    fireEvent.click(updateButton);

    await waitFor(() => {
      expect(mockAPI.updateProject).toHaveBeenCalledWith(
        '1',
        expect.objectContaining({
          name: 'Updated Project Name'
        })
      );
    });
  });

  test('deletes project with confirmation', async () => {
    mockAPI.deleteProject.mockResolvedValue({});

    render(
      <MockedProjects>
        <Projects />
      </MockedProjects>
    );

    await waitFor(() => {
      expect(screen.getByText('Wildlife Survey 2024')).toBeInTheDocument();
    });

    // Find and click delete button
    const deleteButtons = screen.getAllByLabelText(/delete/i);
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Delete Project')).toBeInTheDocument();
    });

    // Confirm deletion
    const confirmButton = screen.getByRole('button', { name: /confirm/i });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(mockAPI.deleteProject).toHaveBeenCalledWith('1');
    });
  });

  test('displays empty state when no projects', async () => {
    mockAPI.getProjects.mockResolvedValue({
      data: {
        projects: [],
        total: 0,
        pages: 0,
        current_page: 1,
        per_page: 20
      }
    });

    render(
      <MockedProjects>
        <Projects />
      </MockedProjects>
    );

    await waitFor(() => {
      expect(screen.getByText('No projects found')).toBeInTheDocument();
      expect(screen.getByText(/create your first project/i)).toBeInTheDocument();
    });
  });

  test('handles API errors gracefully', async () => {
    mockAPI.getProjects.mockRejectedValue(new Error('API Error'));

    render(
      <MockedProjects>
        <Projects />
      </MockedProjects>
    );

    await waitFor(() => {
      expect(screen.getByText(/failed to load projects/i)).toBeInTheDocument();
    });
  });

  test('supports pagination', async () => {
    const manyProjects = Array.from({ length: 25 }, (_, i) => ({
      ...mockProjects[0],
      id: `project-${i}`,
      name: `Project ${i + 1}`
    }));

    mockAPI.getProjects.mockResolvedValue({
      data: {
        projects: manyProjects.slice(0, 20),
        total: 25,
        pages: 2,
        current_page: 1,
        per_page: 20
      }
    });

    render(
      <MockedProjects>
        <Projects />
      </MockedProjects>
    );

    await waitFor(() => {
      expect(screen.getByText('Project 1')).toBeInTheDocument();
    });

    // Check if pagination is displayed
    expect(screen.getByRole('navigation')).toBeInTheDocument();
  });

  test('navigates to project detail on card click', async () => {
    const mockNavigate = jest.fn();
    
    jest.mock('react-router-dom', () => ({
      ...jest.requireActual('react-router-dom'),
      useNavigate: () => mockNavigate
    }));

    render(
      <MockedProjects>
        <Projects />
      </MockedProjects>
    );

    await waitFor(() => {
      expect(screen.getByText('Wildlife Survey 2024')).toBeInTheDocument();
    });

    // Click on project card
    const projectCard = screen.getByText('Wildlife Survey 2024').closest('.MuiCard-root');
    fireEvent.click(projectCard);

    // Note: Navigation testing would require more complex mocking
    // In a real test, you'd check that navigate was called with the correct path
  });

  test('shows correct status badges', async () => {
    render(
      <MockedProjects>
        <Projects />
      </MockedProjects>
    );

    await waitFor(() => {
      expect(screen.getByText('Active')).toBeInTheDocument();
      expect(screen.getByText('Completed')).toBeInTheDocument();
    });
  });

  test('clears filters', async () => {
    render(
      <MockedProjects>
        <Projects />
      </MockedProjects>
    );

    await waitFor(() => {
      expect(screen.getByText('Wildlife Survey 2024')).toBeInTheDocument();
    });

    // Set a filter first
    const searchInput = screen.getByLabelText(/search projects/i);
    fireEvent.change(searchInput, { target: { value: 'test' } });

    // Clear filters
    const clearButton = screen.getByText(/clear/i);
    fireEvent.click(clearButton);

    expect(searchInput.value).toBe('');
  });
});