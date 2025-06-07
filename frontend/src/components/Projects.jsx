import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Button,
  Card,
  CardContent,
  CardActions,
  Chip,
  IconButton,
  Dialog,
  TextField,
  MenuItem,
  Fab
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  People,
  Visibility,
  LocationOn,
  DateRange
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { projectsAPI } from '../services/api';
import ProjectForm from './ProjectForm';
import ConfirmDialog from './ConfirmDialog';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';

const Projects = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [formOpen, setFormOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, project: null });

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const response = await projectsAPI.getProjects({
        search: searchTerm,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        per_page: 100
      });
      setProjects(response.data.projects);
    } catch (err) {
      setError('Failed to load projects');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = () => {
    setEditingProject(null);
    setFormOpen(true);
  };

  const handleEditProject = (project) => {
    setEditingProject(project);
    setFormOpen(true);
  };

  const handleDeleteProject = (project) => {
    setDeleteDialog({ open: true, project });
  };

  const confirmDelete = async () => {
    try {
      await projectsAPI.deleteProject(deleteDialog.project.id);
      setProjects(projects.filter(p => p.id !== deleteDialog.project.id));
      setDeleteDialog({ open: false, project: null });
    } catch (err) {
      setError('Failed to delete project');
    }
  };

  const handleFormSuccess = (savedProject) => {
    if (editingProject) {
      setProjects(projects.map(p => p.id === savedProject.id ? savedProject : p));
    } else {
      setProjects([savedProject, ...projects]);
    }
    setFormOpen(false);
    setEditingProject(null);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'success';
      case 'completed': return 'primary';
      case 'paused': return 'warning';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (project.location || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) return ;

  return (
    
      
        
          Projects
        
        }
          onClick={handleCreateProject}
        >
          New Project
        
      

      {error && }

      {/* Filters */}
      
        
          
            <TextField
              fullWidth
              label="Search projects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              size="small"
            />
          
          
            <TextField
              fullWidth
              select
              label="Status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              size="small"
            >
              All Status
              Active
              Completed
              Paused
              Cancelled
            
          
        
      

      {/* Projects Grid */}
      {filteredProjects.length > 0 ? (
        
          {filteredProjects.map((project) => (
            
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  '&:hover': {
                    boxShadow: 4,
                    cursor: 'pointer'
                  }
                }}
                onClick={() => navigate(`/projects/${project.id}`)}
              >
                
                  
                    
                      {project.name}
                    
                    
                  

                  {project.description && (
                    
                      {project.description}
                    
                  )}

                  
                    {project.location && (
                      
                        
                        
                          {project.location}
                        
                      
                    )}

                    {project.start_date && (
                      
                        
                        
                          {new Date(project.start_date).toLocaleDateString()}
                          {project.end_date && ` - ${new Date(project.end_date).toLocaleDateString()}`}
                        
                      
                    )}

                    
                      
                        
                        
                          {project.members_count} members
                        
                      
                      
                        
                        
                          {project.observations_count} observations
                        
                      
                    
                  
                

                
                  <Button
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/projects/${project.id}`);
                    }}
                  >
                    View Details
                  
                  
                  {(project.created_by?.id === user?.id || user?.role === 'admin') && (
                    
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditProject(project);
                        }}
                      >
                        
                      
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteProject(project);
                        }}
                      >
                        
                      
                    
                  )}
                
              
            
          ))}
        
      ) : (
        
          
            No projects found
          
          
            {searchTerm || statusFilter !== 'all' 
              ? 'Try adjusting your search criteria'
              : 'Create your first project to get started with wildlife monitoring'
            }
          
          }
            onClick={handleCreateProject}
          >
            Create Project
          
        
      )}

      {/* Floating Action Button for mobile */}
      
        
      

      {/* Project Form Dialog */}
      <ProjectForm
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditingProject(null);
        }}
        onSuccess={handleFormSuccess}
        project={editingProject}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialog.open}
        title="Delete Project"
        message={`Are you sure you want to delete "${deleteDialog.project?.name}"? This action cannot be undone.`}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteDialog({ open: false, project: null })}
        severity="error"
      />
    
  );
};

export default Projects;