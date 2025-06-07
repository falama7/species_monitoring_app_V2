import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  TextField,
  MenuItem,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  Tab,
  Tabs
} from '@mui/material';
import {
  Download,
  PlayCircle,
  Article,
  School,
  Science,
  Map,
  Camera,
  Headphones,
  Link as LinkIcon,
  ExpandMore,
  Search,
  FilterList
} from '@mui/icons-material';
import { resourcesAPI } from '../services/api';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';

const TabPanel = ({ children, value, index, ...other }) => (
  <div
    role="tabpanel"
    hidden={value !== index}
    id={`guide-tabpanel-${index}`}
    aria-labelledby={`guide-tab-${index}`}
    {...other}
  >
    {value === index && (
      <Box sx={{ py: 3 }}>
        {children}
      </Box>
    )}
  </div>
);

const GuideSection = () => {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    resource_type: ''
  });

  // Static guide content
  const fieldGuides = [
    {
      id: 'observation_basics',
      title: 'Basic Wildlife Observation',
      description: 'Learn the fundamentals of wildlife observation and data recording',
      sections: [
        {
          title: 'Before You Start',
          content: [
            'Check weather conditions and plan accordingly',
            'Bring necessary equipment (binoculars, camera, notebook)',
            'Review target species information',
            'Ensure GPS device/phone is charged and functional'
          ]
        },
        {
          title: 'During Observation',
          content: [
            'Record exact time and location coordinates',
            'Count individuals carefully and note age/sex if possible',
            'Observe and record behavior patterns',
            'Take photos when possible without disturbing animals',
            'Note environmental conditions and habitat details'
          ]
        },
        {
          title: 'Data Recording Best Practices',
          content: [
            'Use standardized terminology',
            'Be specific and detailed in descriptions',
            'Record uncertainties and limitations',
            'Cross-reference with field guides for identification',
            'Upload data promptly while observations are fresh'
          ]
        }
      ]
    },
    {
      id: 'photo_guidelines',
      title: 'Photography Guidelines',
      description: 'Best practices for wildlife photography in monitoring projects',
      sections: [
        {
          title: 'Technical Requirements',
          content: [
            'Use minimum 5MP resolution for identification purposes',
            'Ensure adequate lighting - avoid backlit subjects',
            'Include scale references when possible',
            'Capture multiple angles for better identification',
            'Record GPS coordinates in photo metadata'
          ]
        },
        {
          title: 'Ethical Photography',
          content: [
            'Maintain safe distances from wildlife',
            'Never use flash photography near sensitive species',
            'Avoid disturbing nesting or feeding behaviors',
            'Respect protected areas and access restrictions',
            'Share location data responsibly'
          ]
        }
      ]
    },
    {
      id: 'data_entry',
      title: 'Data Entry Protocol',
      description: 'Step-by-step guide for entering observations into the system',
      sections: [
        {
          title: 'Required Information',
          content: [
            'Species identification (scientific and common names)',
            'Date and time of observation',
            'GPS coordinates (latitude/longitude)',
            'Number of individuals observed',
            'Project assignment'
          ]
        },
        {
          title: 'Optional but Valuable Data',
          content: [
            'Behavioral observations',
            'Habitat description',
            'Weather conditions',
            'Associated species',
            'Photos and audio recordings',
            'Observer confidence level'
          ]
        }
      ]
    }
  ];

  const tutorials = [
    {
      title: 'Getting Started with the App',
      type: 'video',
      duration: '5 min',
      description: 'Introduction to the Species Monitoring application'
    },
    {
      title: 'Creating Your First Project',
      type: 'interactive',
      duration: '10 min',
      description: 'Step-by-step tutorial for setting up a monitoring project'
    },
    {
      title: 'Recording Observations',
      type: 'video',
      duration: '8 min',
      description: 'How to properly record and submit wildlife observations'
    },
    {
      title: 'Using the Map Interface',
      type: 'interactive',
      duration: '6 min',
      description: 'Navigate and utilize the interactive mapping features'
    },
    {
      title: 'Data Export and Analysis',
      type: 'video',
      duration: '12 min',
      description: 'Learn to export data and generate reports'
    }
  ];

  useEffect(() => {
    loadResources();
  }, [filters]);

  const loadResources = async () => {
    try {
      setLoading(true);
      const params = {
        per_page: 100,
        ...Object.fromEntries(
          Object.entries(filters).filter(([key, value]) => value !== '')
        )
      };
      
      const response = await resourcesAPI.getResources(params);
      setResources(response.data.resources || []);
    } catch (err) {
      setError('Failed to load resources');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleFilterChange = (field, value) => {
    setFilters({ ...filters, [field]: value });
  };

  const getResourceIcon = (type) => {
    switch (type) {
      case 'pdf': return <Article />;
      case 'video': return <PlayCircle />;
      case 'audio': return <Headphones />;
      case 'link': return <LinkIcon />;
      case 'guide': return <School />;
      case 'template': return <Science />;
      default: return <Article />;
    }
  };

  const renderGuideContent = (guide) => (
    <Accordion key={guide.id}>
      <AccordionSummary expandIcon={<ExpandMore />}>
        <Box>
          <Typography variant="h6">{guide.title}</Typography>
          <Typography variant="body2" color="text.secondary">
            {guide.description}
          </Typography>
        </Box>
      </AccordionSummary>
      <AccordionDetails>
        {guide.sections.map((section, index) => (
          <Box key={index} sx={{ mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
              {section.title}
            </Typography>
            <List dense>
              {section.content.map((item, itemIndex) => (
                <ListItem key={itemIndex} sx={{ py: 0.5 }}>
                  <ListItemIcon sx={{ minWidth: 30 }}>
                    <Box 
                      sx={{ 
                        width: 6, 
                        height: 6, 
                        borderRadius: '50%', 
                        bgcolor: 'primary.main' 
                      }} 
                    />
                  </ListItemIcon>
                  <ListItemText primary={item} />
                </ListItem>
              ))}
            </List>
            {index < guide.sections.length - 1 && <Divider sx={{ my: 2 }} />}
          </Box>
        ))}
      </AccordionDetails>
    </Accordion>
  );

  if (loading) return <LoadingSpinner />;

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Methodology Guide
      </Typography>
      
      <Typography variant="body1" color="text.secondary" paragraph>
        Comprehensive guides, tutorials, and resources for effective wildlife monitoring
      </Typography>

      {error && <ErrorMessage message={error} onRetry={loadResources} />}

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange} variant="scrollable">
          <Tab label="Field Protocols" icon={<Map />} />
          <Tab label="Tutorials" icon={<School />} />
          <Tab label="Resources" icon={<Article />} />
          <Tab label="Templates" icon={<Science />} />
        </Tabs>
      </Paper>

      {/* Field Protocols Tab */}
      <TabPanel value={tabValue} index={0}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h5" gutterBottom>
            Field Protocols & Best Practices
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            Essential guidelines for conducting effective wildlife monitoring in the field.
          </Typography>
        </Box>

        {fieldGuides.map(renderGuideContent)}
      </TabPanel>

      {/* Tutorials Tab */}
      <TabPanel value={tabValue} index={1}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h5" gutterBottom>
            Interactive Tutorials
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            Step-by-step tutorials to help you master the Species Monitoring application.
          </Typography>
        </Box>

        <Grid container spacing={3}>
          {tutorials.map((tutorial, index) => (
            <Grid item xs={12} md={6} key={index}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" gap={1} mb={2}>
                    {tutorial.type === 'video' ? <PlayCircle color="primary" /> : <School color="primary" />}
                    <Chip 
                      label={tutorial.duration} 
                      size="small" 
                      variant="outlined" 
                    />
                  </Box>
                  
                  <Typography variant="h6" gutterBottom>
                    {tutorial.title}
                  </Typography>
                  
                  <Typography variant="body2" color="text.secondary">
                    {tutorial.description}
                  </Typography>
                </CardContent>
                
                <CardActions>
                  <Button 
                    size="small" 
                    startIcon={tutorial.type === 'video' ? <PlayCircle /> : <School />}
                  >
                    {tutorial.type === 'video' ? 'Watch Video' : 'Start Tutorial'}
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      </TabPanel>

      {/* Resources Tab */}
      <TabPanel value={tabValue} index={2}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h5" gutterBottom>
            Downloadable Resources
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            Documents, guides, and reference materials for wildlife monitoring.
          </Typography>
        </Box>

        {/* Filters */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                size="small"
                label="Search resources..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                InputProps={{
                  startAdornment: <Search sx={{ mr: 1, color: 'action.active' }} />
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                select
                size="small"
                label="Category"
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
              >
                <MenuItem value="">All Categories</MenuItem>
                <MenuItem value="protocols">Field Protocols</MenuItem>
                <MenuItem value="identification">Species ID</MenuItem>
                <MenuItem value="analysis">Data Analysis</MenuItem>
                <MenuItem value="equipment">Equipment</MenuItem>
              </TextField>
            </Grid>
            
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                select
                size="small"
                label="Type"
                value={filters.resource_type}
                onChange={(e) => handleFilterChange('resource_type', e.target.value)}
              >
                <MenuItem value="">All Types</MenuItem>
                <MenuItem value="pdf">PDF Documents</MenuItem>
                <MenuItem value="video">Videos</MenuItem>
                <MenuItem value="template">Templates</MenuItem>
                <MenuItem value="guide">Guides</MenuItem>
              </TextField>
            </Grid>
          </Grid>
        </Paper>

        {/* Resources Grid */}
        <Grid container spacing={3}>
          {resources.map((resource) => (
            <Grid item xs={12} sm={6} md={4} key={resource.id}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" gap={1} mb={2}>
                    {getResourceIcon(resource.resource_type)}
                    <Chip 
                      label={resource.resource_type || 'Document'} 
                      size="small" 
                      variant="outlined" 
                    />
                  </Box>
                  
                  <Typography variant="h6" gutterBottom>
                    {resource.title}
                  </Typography>
                  
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {resource.description}
                  </Typography>
                  
                  {resource.category && (
                    <Chip 
                      label={resource.category} 
                      size="small" 
                      color="primary" 
                      variant="outlined" 
                    />
                  )}
                </CardContent>
                
                <CardActions>
                  {resource.file_url && (
                    <Button 
                      size="small" 
                      startIcon={<Download />}
                      href={resource.file_url}
                      target="_blank"
                    >
                      Download
                    </Button>
                  )}
                  {resource.external_url && (
                    <Button 
                      size="small" 
                      startIcon={<LinkIcon />}
                      href={resource.external_url}
                      target="_blank"
                    >
                      Visit Link
                    </Button>
                  )}
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>

        {resources.length === 0 && (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom>
              No resources found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Try adjusting your search criteria or check back later for new resources.
            </Typography>
          </Paper>
        )}
      </TabPanel>

      {/* Templates Tab */}
      <TabPanel value={tabValue} index={3}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h5" gutterBottom>
            Data Collection Templates
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            Standardized forms and templates for consistent data collection.
          </Typography>
        </Box>

        <Grid container spacing={3}>
          {[
            {
              title: 'Field Data Sheet',
              description: 'Printable form for recording observations in the field',
              format: 'PDF',
              icon: <Article />
            },
            {
              title: 'Species Checklist Template',
              description: 'Customizable checklist for target species',
              format: 'Excel',
              icon: <Science />
            },
            {
              title: 'Project Planning Template',
              description: 'Template for planning new monitoring projects',
              format: 'Word',
              icon: <Map />
            },
            {
              title: 'Photo Metadata Sheet',
              description: 'Template for recording photo details and metadata',
              format: 'CSV',
              icon: <Camera />
            }
          ].map((template, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" gap={1} mb={2}>
                    {template.icon}
                    <Chip 
                      label={template.format} 
                      size="small" 
                      variant="outlined" 
                    />
                  </Box>
                  
                  <Typography variant="h6" gutterBottom>
                    {template.title}
                  </Typography>
                  
                  <Typography variant="body2" color="text.secondary">
                    {template.description}
                  </Typography>
                </CardContent>
                
                <CardActions>
                  <Button size="small" startIcon={<Download />}>
                    Download Template
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      </TabPanel>
    </Container>
  );
};

export default GuideSection;