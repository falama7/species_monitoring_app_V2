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
    
      
        
          
            {icon}
          
          
            
              {value}
            
            
              {title}
            
          
        
      
    
  );

  if (loading) return ;
  if (error) return ;

  return (
    
      
        
          Welcome back, {user?.first_name}!
        
        
          Here's what's happening with your wildlife monitoring projects.
        
      

      {/* Statistics Cards */}
      
        
          }
            color="primary"
          />
        
        
          }
            color="secondary"
          />
        
        
          }
            color="success"
          />
        
        
          }
            color="warning"
          />
        
      

      
        {/* Recent Projects */}
        
          
            
              
                Recent Projects
              
              }
                onClick={() => navigate('/projects')}
                size="small"
              >
                View All
              
            
            
            
              {dashboardData.projects.length > 0 ? (
                
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
                      
                            
                              {project.location || 'No location specified'}
                            
                            
                              <Chip
                                label={project.status}
                                size="small"
                                color={project.status === 'active' ? 'success' : 'default'}
                                sx={{ mr: 1 }}
                              />
                              
                                {project.observations_count} observations
                              
                            
                          
                        }
                      />
                      
                        <IconButton
                          edge="end"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/projects/${project.id}`);
                          }}
                        >
                          
                        
                      
                    
                  ))}
                
              ) : (
                
                  
                  
                    No projects yet. Create your first project to get started!
                  
                  }
                    onClick={() => navigate('/projects')}
                    sx={{ mt: 2 }}
                  >
                    Create Project
                  
                
              )}
            
          
        

        {/* Recent Observations */}
        
          
            
              
                Recent Observations
              
              }
                onClick={() => navigate('/observations')}
                size="small"
              >
                View All
              
            
            
            
              {dashboardData.recentObservations.length > 0 ? (
                
                  {dashboardData.recentObservations.map((observation) => (
                    
                      
                            
                              {observation.observer?.first_name} {observation.observer?.last_name}
                            
                            
                              {new Date(observation.observation_date).toLocaleDateString()} • {observation.count} individuals
                            
                          
                        }
                      />
                    
                  ))}
                
              ) : (
                
                  
                  
                    No observations yet. Start recording wildlife sightings!
                  
                
              )}
            
          
        

        {/* Charts */}
        
          
            
              Observation Trends
            
            
          
        
      
    
  );
};

export default Dashboard;