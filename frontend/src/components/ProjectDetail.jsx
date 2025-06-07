import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  IconButton,
  Tab,
  Tabs,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Avatar,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Autocomplete
} from '@mui/material';
import {
  Edit,
  Delete,
  Add,
  Person,
  LocationOn,
  DateRange,
  TrendingUp,
  Map,
  TableChart,
  Download,
  PersonAdd,
  RemoveCircle
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { projectsAPI, observationsAPI, authAPI } from '../services/api';
import ObservationForm from './ObservationForm';
import ProjectForm from './ProjectForm';
import MapView from './MapView';
import ChartContainer from './ChartContainer';
import ConfirmDialog from './ConfirmDialog';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';

const TabPanel = ({ children, value, index, ...other }) => (
  <div
    role="tabpanel"
    hidden={value !== index}
    id={`project-tabpanel-${index}`}
    aria-labelledby={`project-tab-${index}`}
    {...other}
  >
    {value === index && (
      <Box sx={{ py: 3 }}>
        {children}
      </Box>
    )}
  </div>
);

const ProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [project, setProject] = useState(null);
  const [observations, setObservations] = useState([]);
  const [members, setMembers] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [tabValue, setTabValue] = useState(0);
  const [observationFormOpen, setObservationFormOpen] = useState(false);
  const [projectFormOpen, setProjectFormOpen] = useState(false);
  const [memberDialogOpen, setMemberDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, type: '', target: null });

  useEffect(() => {
    if (id) {
      loadProjectData();
    }
  }, [id]);

  const loadProjectData = async () => {
    try {
      setLoading(true);
      
      // Load project details
      const projectResponse = await projectsAPI.getProject(id);
      setProject(projectResponse.data.project);
      
      // Load project observations
      const observationsResponse = await observationsAPI.getObservations({
        project_id: id,
        per_page: 1000
      });
      setObservations(observationsResponse.data.observations);
      
      // Load project members
      const membersResponse = await projectsAPI.getMembers(id);
      setMembers(membersResponse.data.members);
      
    } catch (err) {
      setError('Failed to load project data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await authAPI.getUsers({ per_page: 1000 });
      setUsers(response.data.users);
    } catch (err) {
      console.error('Failed to load users:', err);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleAddObservation = () => {
    setObservationFormOpen(true);
  };

  const handleEditProject = () => {
    setProjectFormOpen(true);
  };

  const handleDeleteProject = () => {
    setDeleteDialog({
      open: true,
      type: 'project',
      target: project
    });
  };

  const handleAddMember = () => {
    loadUsers();
    setMemberDialogOpen(true);
  };

  const handleRemoveMember = (member) => {
    setDeleteDialog({
      open: true,
      type: 'member',
      target: member
    });
  };

  const confirmDelete = async () => {
    try {
      const { type, target } = deleteDialog;
      
      if (type === 'project') {
        await projectsAPI.deleteProject(target.id);
        navigate('/projects');
      } else if (type === 'member') {
        await projectsAPI.removeMember(project.id, target.id);
        setMembers(members.filter(m => m.id !== target.id));
      }
      
      setDeleteDialog({ open: false, type: '', target: null });
    } catch (err) {
      setError(`Failed to delete ${deleteDialog.type}`);
    }
  };

  const handleAddMemberConfirm = async () => {
    if (!selectedUser) return;
    
    try {
      await projectsAPI.addMember(project.id, { user_id: selectedUser.id });
      setMembers([...members, selectedUser]);
      setMemberDialogOpen(false);
      setSelectedUser(null);
    } catch (err) {
      setError('Failed to add member');
    }
  };

  const handleObservationFormSuccess = (savedObservation) => {
    setObservations([savedObservation, ...observations]);
    setObservationFormOpen(false);
  };

  const handleProjectFormSuccess = (savedProject) => {
    setProject(savedProject);
    setProjectFormOpen(false);
  };

  const getProjectStatusColor = (status) => {
    switch (status) {
      case 'active': return 'success';
      case 'completed': return 'primary';
      case 'paused': return 'warning';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const canEditProject = () => {
    return user?.role === 'admin' || project?.created_by?.id === user?.id;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const calculateStats = () => {
    const totalObservations = observations.length;
    const uniqueSpecies = new Set(observations.map(obs => obs.species?.id)).size;
    const totalIndividuals = observations.reduce((sum, obs) => sum + obs.count, 0);
    const recentObservations = observations.filter(
      obs => new Date(obs.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    ).length;

    return {
      totalObservations,
      uniqueSpecies,
      totalIndividuals,
      recentObservations
    };
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} onRetry={loadProjectData} />;
  if (!project) return <ErrorMessage message="Project not found" />;

  const stats = calculateStats();
  const availableUsers = users.filter(user => 
    !members.find(member => member.id === user.id)
  );

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Project Header */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Box display="flex" alignItems="center" gap={2} mb={2}>
              <Typography variant="h4" component="h1">
                {project.name}
              </Typography>
              <Chip
                label={project.status}
                color={getProjectStatusColor(project.status)}
                size="small"
              />
              {canEditProject() && (
                <Box ml="auto" display="flex" gap={1}>
                  <Button
                    variant="outlined"
                    startIcon={<Edit />}
                    onClick={handleEditProject}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<Delete />}
                    onClick={handleDeleteProject}
                  >
                    Delete
                  </Button>
                </Box>
              )}
            </Box>

            {project.description && (
              <Typography variant="body1" color="text.secondary" paragraph>
                {project.description}
              </Typography>
            )}

            <Grid container spacing={2}>
              {project.location && (
                <Grid item>
                  <Box display="flex" alignItems="center" gap={0.5}>
                    <LocationOn fontSize="small" color="action" />
                    <Typography variant="body2">
                      {project.location}
                    </Typography>
                  </Box>
                </Grid>
              )}
              
              <Grid item>
                <Box display="flex" alignItems="center" gap={0.5}>
                  <DateRange fontSize="small" color="action" />
                  <Typography variant="body2">
                    {formatDate(project.start_date)} 
                    {project.end_date && ` - ${formatDate(project.end_date)}`}
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item>
                <Box display="flex" alignItems="center" gap={0.5}>
                  <Person fontSize="small" color="action" />
                  <Typography variant="body2">
                    Created by {project.created_by?.first_name} {project.created_by?.last_name}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Grid>

          <Grid item xs={12} md={4}>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Card>
                  <CardContent sx={{ textAlign: 'center', py: 2 }}>
                    <Typography variant="h4" color="primary">
                      {stats.totalObservations}
                    </Typography>
                    <Typography variant="caption">
                      Total Observations
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6}>
                <Card>
                  <CardContent sx={{ textAlign: 'center', py: 2 }}>
                    <Typography variant="h4" color="secondary">
                      {stats.uniqueSpecies}
                    </Typography>
                    <Typography variant="caption">
                      Unique Species
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6}>
                <Card>
                  <CardContent sx={{ textAlign: 'center', py: 2 }}>
                    <Typography variant="h4" color="success.main">
                      {stats.totalIndividuals}
                    </Typography>
                    <Typography variant="caption">
                      Total Individuals
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6}>
                <Card>
                  <CardContent sx={{ textAlign: 'center', py: 2 }}>
                    <Typography variant="h4" color="warning.main">
                      {stats.recentObservations}
                    </Typography>
                    <Typography variant="caption">
                      This Week
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </Paper>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="project tabs"
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Overview" icon={<TrendingUp />} />
          <Tab label="Observations" icon={<TableChart />} />
          <Tab label="Map" icon={<Map />} />
          <Tab label="Members" icon={<Person />} />
        </Tabs>

        {/* Overview Tab */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <ChartContainer observations={observations} />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Recent Observations
                  </Typography>
                  {observations.slice(0, 5).map((observation) => (
                    <Box key={observation.id} sx={{ mb: 2 }}>
                      <Typography variant="body2">
                        <strong>{observation.species?.common_name}</strong>
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatDate(observation.observation_date)} • 
                        {observation.count} individuals • 
                        {observation.observer?.first_name} {observation.observer?.last_name}
                      </Typography>
                    </Box>
                  ))}
                  {observations.length === 0 && (
                    <Typography variant="body2" color="text.secondary">
                      No observations yet
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Project Team
                  </Typography>
                  {members.slice(0, 5).map((member) => (
                    <Box key={member.id} display="flex" alignItems="center" gap={1} sx={{ mb: 1 }}>
                      <Avatar sx={{ width: 24, height: 24 }}>
                        {member.first_name?.charAt(0)}
                      </Avatar>
                      <Typography variant="body2">
                        {member.first_name} {member.last_name}
                      </Typography>
                      <Chip label={member.role} size="small" sx={{ ml: 'auto' }} />
                    </Box>
                  ))}
                  {members.length > 5 && (
                    <Typography variant="caption" color="text.secondary">
                      +{members.length - 5} more members
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Observations Tab */}
        <TabPanel value={tabValue} index={1}>
          <Box display="flex" justifyContent="between" alignItems="center" mb={2}>
            <Typography variant="h6">
              Observations ({observations.length})
            </Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={handleAddObservation}
            >
              Add Observation
            </Button>
          </Box>

          <Grid container spacing={2}>
            {observations.map((observation) => (
              <Grid item xs={12} md={6} lg={4} key={observation.id}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {observation.species?.common_name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      <em>{observation.species?.scientific_name}</em>
                    </Typography>
                    <Box sx={{ mb: 1 }}>
                      <Chip
                        label={`${observation.count} individuals`}
                        size="small"
                        color="primary"
                        sx={{ mr: 0.5 }}
                      />
                      {observation.species?.conservation_status && (
                        <Chip
                          label={observation.species.conservation_status}
                          size="small"
                          color="warning"
                        />
                      )}
                    </Box>
                    <Typography variant="body2">
                      {formatDate(observation.observation_date)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Observer: {observation.observer?.first_name} {observation.observer?.last_name}
                    </Typography>
                    {observation.notes && (
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        {observation.notes.length > 100
                          ? `${observation.notes.substring(0, 100)}...`
                          : observation.notes
                        }
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {observations.length === 0 && (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="h6" gutterBottom>
                No observations yet
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Start recording wildlife sightings for this project
              </Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={handleAddObservation}
                sx={{ mt: 2 }}
              >
                Add First Observation
              </Button>
            </Paper>
          )}
        </TabPanel>

        {/* Map Tab */}
        <TabPanel value={tabValue} index={2}>
          <Box height="600px">
            <MapView
              observations={observations}
              height="100%"
              showAccuracyCircles={true}
            />
          </Box>
        </TabPanel>

        {/* Members Tab */}
        <TabPanel value={tabValue} index={3}>
          <Box display="flex" justifyContent="between" alignItems="center" mb={2}>
            <Typography variant="h6">
              Team Members ({members.length})
            </Typography>
            {canEditProject() && (
              <Button
                variant="contained"
                startIcon={<PersonAdd />}
                onClick={handleAddMember}
              >
                Add Member
              </Button>
            )}
          </Box>

          <List>
            {members.map((member, index) => (
              <React.Fragment key={member.id}>
                <ListItem>
                  <Avatar sx={{ mr: 2 }}>
                    {member.first_name?.charAt(0)}
                  </Avatar>
                  <ListItemText
                    primary={`${member.first_name} ${member.last_name}`}
                    secondary={
                      <Box>
                        <Typography variant="body2" component="span">
                          {member.email} • {member.role}
                        </Typography>
                        {member.id === project.created_by?.id && (
                          <Chip label="Creator" size="small" sx={{ ml: 1 }} />
                        )}
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    {canEditProject() && member.id !== project.created_by?.id && (
                      <IconButton
                        edge="end"
                        onClick={() => handleRemoveMember(member)}
                      >
                        <RemoveCircle />
                      </IconButton>
                    )}
                  </ListItemSecondaryAction>
                </ListItem>
                {index < members.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        </TabPanel>
      </Paper>

      {/* Dialogs */}
      <ObservationForm
        open={observationFormOpen}
        onClose={() => setObservationFormOpen(false)}
        onSuccess={handleObservationFormSuccess}
        projectId={project.id}
      />

      <ProjectForm
        open={projectFormOpen}
        onClose={() => setProjectFormOpen(false)}
        onSuccess={handleProjectFormSuccess}
        project={project}
      />

      {/* Add Member Dialog */}
      <Dialog open={memberDialogOpen} onClose={() => setMemberDialogOpen(false)}>
        <DialogTitle>Add Team Member</DialogTitle>
        <DialogContent>
          <Autocomplete
            sx={{ width: 300, mt: 2 }}
            options={availableUsers}
            getOptionLabel={(option) => `${option.first_name} ${option.last_name} (${option.email})`}
            value={selectedUser}
            onChange={(event, newValue) => setSelectedUser(newValue)}
            renderInput={(params) => (
              <TextField {...params} label="Select User" />
            )}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMemberDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleAddMemberConfirm}
            variant="contained"
            disabled={!selectedUser}
          >
            Add Member
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialog.open}
        title={`Delete ${deleteDialog.type === 'project' ? 'Project' : 'Member'}`}
        message={
          deleteDialog.type === 'project'
            ? `Are you sure you want to delete "${deleteDialog.target?.name}"? This will also delete all associated observations and cannot be undone.`
            : `Are you sure you want to remove "${deleteDialog.target?.first_name} ${deleteDialog.target?.last_name}" from this project?`
        }
        onConfirm={confirmDelete}
        onCancel={() => setDeleteDialog({ open: false, type: '', target: null })}
        severity="error"
      />
    </Container>
  );
};

export default ProjectDetail;