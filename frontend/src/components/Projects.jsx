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

  if (loading) return <LoadingSpinner />;

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4" component="h1">
          Projects
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleCreateProject}
        >
          New Project
        </Button>
      </Box>

      {error && <ErrorMessage message={error} onRetry={loadProjects} />}

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={8}>
            <TextField
              fullWidth
              label="Search projects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              select
              label="Status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              size="small"
            >
              <MenuItem value="all">All Status</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="completed">Completed</MenuItem>
              <MenuItem value="paused">Paused</MenuItem>
              <MenuItem value="cancelled">Cancelled</MenuItem>
            </TextField>
          </Grid>
        </Grid>
      </Paper>

      {/* Projects Grid */}
      {filteredProjects.length > 0 ? (
        <Grid container spacing={3}>
          {filteredProjects.map((project) => (
            <Grid item xs={12} sm={6} md={4} key={project.id}>
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
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                    <Typography variant="h6" component="h2" gutterBottom>
                      {project.name}
                    </Typography>
                    <Chip
                      label={project.status}
                      color={getStatusColor(project.status)}
                      size="small"
                    />
                  </Box>

                  {project.description && (
                    <Typography variant="body2" color="textSecondary" paragraph>
                      {project.description}
                    </Typography>
                  )}

                  <Box spacing={1}>
                    {project.location && (
                      <Box display="flex" alignItems="center" mb={1}>
                        <LocationOn fontSize="small" sx={{ mr: 1 }} />
                        <Typography variant="body2" color="textSecondary">
                          {project.location}
                        </Typography>
                      </Box>
                    )}

                    {project.start_date && (
                      <Box display="flex" alignItems="center" mb={1}>
                        <DateRange fontSize="small" sx={{ mr: 1 }} />
                        <Typography variant="body2" color="textSecondary">
                          {new Date(project.start_date).toLocaleDateString()}
                          {project.end_date && ` - ${new Date(project.end_date).toLocaleDateString()}`}
                        </Typography>
                      </Box>
                    )}

                    <Box display="flex" justifyContent="space-between" mt={2}>
                      <Box display="flex" alignItems="center">
                        <People fontSize="small" sx={{ mr: 0.5 }} />
                        <Typography variant="caption" color="textSecondary">
                          {project.members_count} members
                        </Typography>
                      </Box>
                      <Box display="flex" alignItems="center">
                        <Visibility fontSize="small" sx={{ mr: 0.5 }} />
                        <Typography variant="caption" color="textSecondary">
                          {project.observations_count} observations
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </CardContent>

                <CardActions sx={{ justifyContent: 'space-between' }}>
                  <Button
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/projects/${project.id}`);
                    }}
                  >
                    View Details
                  </Button>
                  <Box>
                    {(project.created_by?.id === user?.id || user?.role === 'admin') && (
                      <>
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditProject(project);
                          }}
                        >
                          <Edit />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteProject(project);
                          }}
                        >
                          <Delete />
                        </IconButton>
                      </>
                    )}
                  </Box>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Box textAlign="center" py={8}>
          <Typography variant="h6" gutterBottom>
            No projects found
          </Typography>
          <Typography variant="body2" color="textSecondary" paragraph>
            {searchTerm || statusFilter !== 'all' 
              ? 'Try adjusting your search criteria'
              : 'Create your first project to get started with wildlife monitoring'
            }
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleCreateProject}
          >
            Create Project
          </Button>
        </Box>
      )}

      {/* Floating Action Button for mobile */}
      <Fab
        color="primary"
        aria-label="add"
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          display: { sm: 'none' }
        }}
        onClick={handleCreateProject}
      >
        <Add />
      </Fab>

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
    </Container>
  );
};

export default Projects;