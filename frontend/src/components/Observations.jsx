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
  CardMedia,
  CardActions,
  Chip,
  IconButton,
  TextField,
  MenuItem,
  Fab,
  Pagination,
  FormControl,
  InputLabel,
  Select,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  LocationOn,
  DateRange,
  Visibility,
  ExpandMore,
  FilterList,
  Map,
  TableChart
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { useAuth } from '../contexts/AuthContext';
import { observationsAPI, projectsAPI, speciesAPI } from '../services/api';
import ObservationForm from './ObservationForm';
import ConfirmDialog from './ConfirmDialog';
import MapView from './MapView';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';

const Observations = () => {
  const { user } = useAuth();
  const [observations, setObservations] = useState([]);
  const [projects, setProjects] = useState([]);
  const [species, setSpecies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    pages: 1,
    total: 0,
    per_page: 12
  });

  // Filters
  const [filters, setFilters] = useState({
    project_id: '',
    species_id: '',
    start_date: null,
    end_date: null,
    search: ''
  });

  // View state
  const [viewMode, setViewMode] = useState('cards'); // 'cards' or 'map'
  const [formOpen, setFormOpen] = useState(false);
  const [editingObservation, setEditingObservation] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, observation: null });

  useEffect(() => {
    loadObservations();
    loadProjects();
    loadSpecies();
  }, [pagination.page, filters]);

  const loadObservations = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        per_page: pagination.per_page,
        ...Object.fromEntries(
          Object.entries(filters).filter(([key, value]) => {
            if (key === 'start_date' || key === 'end_date') {
              return value !== null;
            }
            return value !== '' && value !== null;
          })
        )
      };

      // Format dates for API
      if (params.start_date) {
        params.start_date = params.start_date.toISOString().split('T')[0];
      }
      if (params.end_date) {
        params.end_date = params.end_date.toISOString().split('T')[0];
      }

      const response = await observationsAPI.getObservations(params);
      setObservations(response.data.observations);
      setPagination({
        page: response.data.current_page,
        pages: response.data.pages,
        total: response.data.total,
        per_page: response.data.per_page
      });
    } catch (err) {
      setError('Failed to load observations');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadProjects = async () => {
    try {
      const response = await projectsAPI.getProjects({ per_page: 1000 });
      setProjects(response.data.projects);
    } catch (err) {
      console.error('Failed to load projects:', err);
    }
  };

  const loadSpecies = async () => {
    try {
      const response = await speciesAPI.getSpecies({ per_page: 1000 });
      setSpecies(response.data.species);
    } catch (err) {
      console.error('Failed to load species:', err);
    }
  };

  const handleCreateObservation = () => {
    setEditingObservation(null);
    setFormOpen(true);
  };

  const handleEditObservation = (observation) => {
    setEditingObservation(observation);
    setFormOpen(true);
  };

  const handleDeleteObservation = (observation) => {
    setDeleteDialog({ open: true, observation });
  };

  const confirmDelete = async () => {
    try {
      await observationsAPI.deleteObservation(deleteDialog.observation.id);
      setObservations(observations.filter(o => o.id !== deleteDialog.observation.id));
      setDeleteDialog({ open: false, observation: null });
    } catch (err) {
      setError('Failed to delete observation');
    }
  };

  const handleFormSuccess = (savedObservation) => {
    if (editingObservation) {
      setObservations(observations.map(o => o.id === savedObservation.id ? savedObservation : o));
    } else {
      loadObservations(); // Refresh to get updated pagination
    }
    setFormOpen(false);
    setEditingObservation(null);
  };

  const handleFilterChange = (field, value) => {
    setFilters({ ...filters, [field]: value });
    setPagination({ ...pagination, page: 1 }); // Reset to first page
  };

  const clearFilters = () => {
    setFilters({
      project_id: '',
      species_id: '',
      start_date: null,
      end_date: null,
      search: ''
    });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusColor = (observation) => {
    const age = new Date() - new Date(observation.created_at);
    const days = age / (1000 * 60 * 60 * 24);
    
    if (days < 1) return 'success';
    if (days < 7) return 'info';
    if (days < 30) return 'warning';
    return 'default';
  };

  if (loading && observations.length === 0) return <LoadingSpinner />;

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Observations
        </Typography>
        <Box display="flex" gap={2}>
          <Button
            variant={viewMode === 'cards' ? 'contained' : 'outlined'}
            startIcon={<TableChart />}
            onClick={() => setViewMode('cards')}
          >
            Cards
          </Button>
          <Button
            variant={viewMode === 'map' ? 'contained' : 'outlined'}
            startIcon={<Map />}
            onClick={() => setViewMode('map')}
          >
            Map
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleCreateObservation}
          >
            New Observation
          </Button>
        </Box>
      </Box>

      {error && <ErrorMessage message={error} onRetry={loadObservations} />}

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Box display="flex" alignItems="center" gap={1}>
              <FilterList />
              <Typography>Filters</Typography>
              {Object.values(filters).some(v => v !== '' && v !== null) && (
                <Chip label="Active" size="small" color="primary" />
              )}
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Project</InputLabel>
                  <Select
                    value={filters.project_id}
                    label="Project"
                    onChange={(e) => handleFilterChange('project_id', e.target.value)}
                  >
                    <MenuItem value="">All Projects</MenuItem>
                    {projects.map((project) => (
                      <MenuItem key={project.id} value={project.id}>
                        {project.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Species</InputLabel>
                  <Select
                    value={filters.species_id}
                    label="Species"
                    onChange={(e) => handleFilterChange('species_id', e.target.value)}
                  >
                    <MenuItem value="">All Species</MenuItem>
                    {species.map((sp) => (
                      <MenuItem key={sp.id} value={sp.id}>
                        {sp.common_name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={2}>
                <DatePicker
                  label="Start Date"
                  value={filters.start_date}
                  onChange={(date) => handleFilterChange('start_date', date)}
                  renderInput={(params) => (
                    <TextField {...params} size="small" fullWidth />
                  )}
                />
              </Grid>

              <Grid item xs={12} md={2}>
                <DatePicker
                  label="End Date"
                  value={filters.end_date}
                  onChange={(date) => handleFilterChange('end_date', date)}
                  renderInput={(params) => (
                    <TextField {...params} size="small" fullWidth />
                  )}
                  minDate={filters.start_date}
                />
              </Grid>

              <Grid item xs={12} md={2}>
                <Box display="flex" gap={1}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Search"
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    placeholder="Search observations..."
                  />
                  <Button onClick={clearFilters} variant="outlined" size="small">
                    Clear
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>
      </Paper>

      {/* Results Summary */}
      <Box mb={2}>
        <Typography variant="body2" color="text.secondary">
          Showing {observations.length} of {pagination.total} observations
        </Typography>
      </Box>

      {/* Content */}
      {viewMode === 'map' ? (
        <Paper sx={{ height: '600px', p: 1 }}>
          <MapView
            observations={observations}
            height="100%"
            showAccuracyCircles={true}
          />
        </Paper>
      ) : (
        <>
          {/* Cards View */}
          {observations.length > 0 ? (
            <Grid container spacing={3}>
              {observations.map((observation) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={observation.id}>
                  <Card
                    sx={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      '&:hover': {
                        boxShadow: 4,
                      }
                    }}
                  >
                    {observation.image_urls && observation.image_urls.length > 0 && (
                      <CardMedia
                        component="img"
                        height="140"
                        image={observation.image_urls[0]}
                        alt={observation.species?.common_name}
                        sx={{ objectFit: 'cover' }}
                      />
                    )}

                    <CardContent sx={{ flexGrow: 1 }}>
                      <Typography variant="h6" component="div" gutterBottom>
                        {observation.species?.common_name || 'Unknown Species'}
                      </Typography>

                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        <em>{observation.species?.scientific_name}</em>
                      </Typography>

                      <Box sx={{ mb: 1 }}>
                        <Chip
                          label={`${observation.count} individuals`}
                          size="small"
                          color="primary"
                          sx={{ mr: 0.5, mb: 0.5 }}
                        />
                        {observation.species?.conservation_status && (
                          <Chip
                            label={observation.species.conservation_status}
                            size="small"
                            color="warning"
                            sx={{ mr: 0.5, mb: 0.5 }}
                          />
                        )}
                        <Chip
                          label={formatDate(observation.observation_date)}
                          size="small"
                          color={getStatusColor(observation)}
                          sx={{ mb: 0.5 }}
                        />
                      </Box>

                      <Box display="flex" alignItems="center" gap={0.5} mb={1}>
                        <LocationOn fontSize="small" color="action" />
                        <Typography variant="body2" color="text.secondary">
                          {observation.location_name || 
                           `${observation.latitude.toFixed(4)}, ${observation.longitude.toFixed(4)}`}
                        </Typography>
                      </Box>

                      <Typography variant="body2" color="text.secondary">
                        Observer: {observation.observer?.first_name} {observation.observer?.last_name}
                      </Typography>

                      {observation.behavior && (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          Behavior: {observation.behavior}
                        </Typography>
                      )}

                      {observation.notes && (
                        <Typography variant="body2" sx={{ mt: 1 }}>
                          {observation.notes.length > 100 
                            ? `${observation.notes.substring(0, 100)}...`
                            : observation.notes
                          }
                        </Typography>
                      )}
                    </CardContent>

                    <CardActions>
                      <IconButton
                        size="small"
                        onClick={() => handleEditObservation(observation)}
                        disabled={observation.observer?.id !== user?.id && user?.role !== 'admin'}
                      >
                        <Edit />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteObservation(observation)}
                        disabled={observation.observer?.id !== user?.id && user?.role !== 'admin'}
                      >
                        <Delete />
                      </IconButton>
                      <Box flexGrow={1} />
                      <Typography variant="caption" color="text.secondary">
                        {formatDateTime(observation.created_at)}
                      </Typography>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="h6" gutterBottom>
                No observations found
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {Object.values(filters).some(v => v !== '' && v !== null)
                  ? 'Try adjusting your search criteria'
                  : 'Start recording wildlife observations to see them here'
                }
              </Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={handleCreateObservation}
                sx={{ mt: 2 }}
              >
                Add Observation
              </Button>
            </Paper>
          )}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <Box display="flex" justifyContent="center" mt={4}>
              <Pagination
                count={pagination.pages}
                page={pagination.page}
                onChange={(event, value) => setPagination({ ...pagination, page: value })}
                color="primary"
              />
            </Box>
          )}
        </>
      )}

      {/* Floating Action Button for mobile */}
      <Fab
        color="primary"
        aria-label="add observation"
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          display: { xs: 'flex', md: 'none' }
        }}
        onClick={handleCreateObservation}
      >
        <Add />
      </Fab>

      {/* Observation Form Dialog */}
      <ObservationForm
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditingObservation(null);
        }}
        onSuccess={handleFormSuccess}
        observation={editingObservation}
        projectId={filters.project_id || null}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialog.open}
        title="Delete Observation"
        message={`Are you sure you want to delete this observation of ${deleteDialog.observation?.species?.common_name}? This action cannot be undone.`}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteDialog({ open: false, observation: null })}
        severity="error"
      />
    </Container>
  );
};

export default Observations;