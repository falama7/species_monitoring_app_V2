import axios from 'axios';
import { authAPI, projectsAPI } from '../../src/services/api';

jest.mock('axios');
const mockedAxios = axios;

describe('API Services', () => {
  beforeEach(() => {
    mockedAxios.create.mockReturnValue(mockedAxios);
    mockedAxios.interceptors = {
      request: { use: jest.fn() },
      response: { use: jest.fn() }
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('authAPI', () => {
    test('login makes correct API call', async () => {
      const loginData = { username: 'test', password: 'password' };
      const responseData = { access_token: 'token123', user: { id: 1 } };
      
      mockedAxios.post.mockResolvedValue({ data: responseData });
      
      const result = await authAPI.login(loginData);
      
      expect(mockedAxios.post).toHaveBeenCalledWith('/auth/login', loginData);
      expect(result.data).toEqual(responseData);
    });

    test('register makes correct API call', async () => {
      const userData = {
        username: 'test',
        email: 'test@example.com',
        password: 'password123',
        first_name: 'Test',
        last_name: 'User'
      };
      
      mockedAxios.post.mockResolvedValue({ data: { user: userData } });
      
      await authAPI.register(userData);
      
      expect(mockedAxios.post).toHaveBeenCalledWith('/auth/register', userData);
    });
  });

  describe('projectsAPI', () => {
    test('getProjects makes correct API call', async () => {
      const params = { page: 1, per_page: 20 };
      
      mockedAxios.get.mockResolvedValue({ data: { projects: [] } });
      
      await projectsAPI.getProjects(params);
      
      expect(mockedAxios.get).toHaveBeenCalledWith('/projects', { params });
    });

    test('createProject makes correct API call', async () => {
      const projectData = { name: 'Test Project', description: 'Test' };
      
      mockedAxios.post.mockResolvedValue({ data: { project: projectData } });
      
      await projectsAPI.createProject(projectData);
      
      expect(mockedAxios.post).toHaveBeenCalledWith('/projects', projectData);
    });
  });
});