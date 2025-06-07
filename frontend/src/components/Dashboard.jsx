import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip
} from '@mui/material';
import {
  TrendingUp,
  Visibility,
  FolderOpen,
  BugReport,
  Add,
  ArrowForward
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { projectsAPI, observationsAPI } from '../services/api';
import ChartContainer from './ChartContainer';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState({
    projects: [],
    recentObservations: [],
    stats: {
      totalProjects: 0,
      totalObservations: 0,
      uniqueSpecies: 0,
      recentActivity: 0
    }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load projects
      const projectsResponse = await projectsAPI.getProjects({ per_page: 5 });
      
      // Load recent observations
      const observationsResponse = await observationsAPI.getObservations({ per_page: 10 });
      
      // Calculate statistics
      const allProjectsResponse = await projectsAPI.getProjects({ per_page: 1000 });
      const allObservationsResponse = await observationsAPI.getObservations({ per_page: 1000 });
      
      const uniqueSpecies = new Set(
        allObservationsResponse.data.observations.map(obs => obs.species?.id)
      ).size;

      setDashboardData({
        projects: projectsResponse.data.projects,
        recentObservations: observationsResponse.data.observations,
        stats: {
          totalProjects: allProjectsResponse.data.total,
          totalObservations: allObservationsResponse.data.total,
          uniqueSpecies,
          recentActivity: observationsResponse.data.observations.filter(
            obs => new Date(obs.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          ).length
        }
      });
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon, color = 'primary' }) => (
    <Grid item xs={12} sm={6} md={3}>
      <Card>
        <CardContent>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box>
              {icon}
            </Box>
            <Box textAlign="right">
              <Typography variant="h4" color={`${color}.main`}>
                {value}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {title}
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Grid>
  );

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} onRetry={loadDashboardData} />;

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box mb={4}>
        <Typography variant="h4" gutterBottom>
          Welcome back, {user?.first_name}!
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Here's what's happening with your wildlife monitoring projects.
        </Typography>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={3} mb={4}>
        <StatCard
          title="Total Projects"
          value={dashboardData.stats.totalProjects}
          icon={<FolderOpen fontSize="large" />}
          color="primary"
        />
        <StatCard
          title="Total Observations"
          value={dashboardData.stats.totalObservations}
          icon={<Visibility fontSize="large" />}
          color="secondary"
        />
        <StatCard
          title="Unique Species"
          value={dashboardData.stats.uniqueSpecies}
          icon={<BugReport fontSize="large" />}
          color="success"
        />
        <StatCard
          title="This Week"
          value={dashboardData.stats.recentActivity}
          icon={<TrendingUp fontSize="large" />}
          color="warning"
        />
      </Grid>

      <Grid container spacing={3}>
        {/* Recent Projects */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">
                Recent Projects
              </Typography>
              <Button
                endIcon={<ArrowForward />}
                onClick={() => navigate('/projects')}
                size="small"
              >
                View All
              </Button>
            </Box>
            <Box>
              {dashboardData.projects.length > 0 ? (
                <List>
                  {dashboardData.projects.map((project) => (
                    <ListItem
                      key={project.id}
                      sx={{
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 1,
                        mb: 1,
                        '&:hover': {
                          backgroundColor: 'action.hover',
                          cursor: 'pointer'
                        }
                      }}
                      onClick={() => navigate(`/projects/${project.id}`)}
                    >
                      <ListItemText
                        primary={project.name}
                        secondary={
                          <Box>
                            <Typography variant="body2" color="textSecondary">
                              {project.location || 'No location specified'}
                            </Typography>
                            <Box display="flex" alignItems="center" gap={1} mt={0.5}>
                              <Chip
                                label={project.status}
                                size="small"
                                color={project.status === 'active' ? 'success' : 'default'}
                                sx={{ mr: 1 }}
                              />
                              <Typography variant="caption" color="textSecondary">
                                {project.observations_count} observations
                              </Typography>
                            </Box>
                          </Box>
                        }
                      />
                      <ListItemSecondaryAction>
                        <IconButton
                          edge="end"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/projects/${project.id}`);
                          }}
                        >
                          <ArrowForward />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Box textAlign="center" py={3}>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    No projects yet. Create your first project to get started!
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={() => navigate('/projects')}
                    sx={{ mt: 2 }}
                  >
                    Create Project
                  </Button>
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>

        {/* Recent Observations */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">
                Recent Observations
              </Typography>
              <Button
                endIcon={<ArrowForward />}
                onClick={() => navigate('/observations')}
                size="small"
              >
                View All
              </Button>
            </Box>
            <Box>
              {dashboardData.recentObservations.length > 0 ? (
                <List>
                  {dashboardData.recentObservations.map((observation) => (
                    <ListItem key={observation.id}>
                      <ListItemText
                        primary={observation.species?.common_name || 'Unknown Species'}
                        secondary={
                          <Box>
                            <Typography variant="body2" color="textSecondary">
                              {observation.observer?.first_name} {observation.observer?.last_name}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              {new Date(observation.observation_date).toLocaleDateString()} • {observation.count} individuals
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Box textAlign="center" py={3}>
                  <Typography variant="body2" color="textSecondary">
                    No observations yet. Start recording wildlife sightings!
                  </Typography>
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>

        {/* Charts */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Observation Trends
            </Typography>
            <ChartContainer observations={dashboardData.recentObservations} />
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard;