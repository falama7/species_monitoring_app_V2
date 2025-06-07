import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Grid,
  MenuItem,
  Box,
  Typography,
  Alert
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { projectsAPI } from '../services/api';
import LoadingSpinner from './LoadingSpinner';

const ProjectForm = ({ open, onClose, onSuccess, project = null }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    location: '',
    start_date: null,
    end_date: null,
    status: 'active'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const statusOptions = [
    { value: 'active', label: 'Active' },
    { value: 'completed', label: 'Completed' },
    { value: 'paused', label: 'Paused' },
    { value: 'cancelled', label: 'Cancelled' }
  ];

  useEffect(() => {
    if (project) {
      setFormData({
        name: project.name || '',
        description: project.description || '',
        location: project.location || '',
        start_date: project.start_date ? new Date(project.start_date) : null,
        end_date: project.end_date ? new Date(project.end_date) : null,
        status: project.status || 'active'
      });
    } else {
      setFormData({
        name: '',
        description: '',
        location: '',
        start_date: null,
        end_date: null,
        status: 'active'
      });
    }
    setError('');
  }, [project, open]);

  const handleChange = (field) => (event) => {
    setFormData({
      ...formData,
      [field]: event.target.value
    });
  };

  const handleDateChange = (field) => (date) => {
    setFormData({
      ...formData,
      [field]: date
    });
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Project name is required');
      return false;
    }
    if (formData.start_date && formData.end_date && formData.start_date > formData.end_date) {
      setError('End date must be after start date');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const submitData = {
        ...formData,
        start_date: formData.start_date ? formData.start_date.toISOString().split('T')[0] : null,
        end_date: formData.end_date ? formData.end_date.toISOString().split('T')[0] : null
      };

      let response;
      if (project) {
        response = await projectsAPI.updateProject(project.id, submitData);
      } else {
        response = await projectsAPI.createProject(submitData);
      }

      onSuccess(response.data.project);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {project ? 'Edit Project' : 'Create New Project'}
      </DialogTitle>

      <DialogContent>
        <Box component="form" onSubmit={handleSubmit}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Project Name"
                value={formData.name}
                onChange={handleChange('name')}
                required
                disabled={loading}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                value={formData.description}
                onChange={handleChange('description')}
                multiline
                rows={4}
                disabled={loading}
                helperText="Describe the project goals and methodology"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Location"
                value={formData.location}
                onChange={handleChange('location')}
                disabled={loading}
                helperText="Study area or location"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Status"
                value={formData.status}
                onChange={handleChange('status')}
                disabled={loading}
              >
                {statusOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} sm={6}>
              <DatePicker
                label="Start Date"
                value={formData.start_date}
                onChange={handleDateChange('start_date')}
                renderInput={(params) => (
                  <TextField {...params} fullWidth disabled={loading} />
                )}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <DatePicker
                label="End Date"
                value={formData.end_date}
                onChange={handleDateChange('end_date')}
                renderInput={(params) => (
                  <TextField {...params} fullWidth disabled={loading} />
                )}
                minDate={formData.start_date}
              />
            </Grid>
          </Grid>

          {loading && (
            <Box display="flex" justifyContent="center" mt={2}>
              <LoadingSpinner />
            </Box>
          )}
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} variant="contained" disabled={loading}>
          {project ? 'Update' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ProjectForm;