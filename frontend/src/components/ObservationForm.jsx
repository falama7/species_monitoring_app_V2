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
  IconButton,
  Chip,
  FormControl,
  InputLabel,
  Select,
  Alert,
  CircularProgress,
  Card,
  CardMedia,
  CardActions,
  Autocomplete
} from '@mui/material';
import {
  PhotoCamera,
  Mic,
  LocationOn,
  Delete,
  Add,
  MyLocation
} from '@mui/icons-material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { observationsAPI, speciesAPI, uploadsAPI } from '../services/api';
import MapView from './MapView';
import LoadingSpinner from './LoadingSpinner';

const ObservationForm = ({ 
  open, 
  onClose, 
  onSuccess, 
  observation = null, 
  projectId = null 
}) => {
  const [formData, setFormData] = useState({
    project_id: projectId || '',
    species_id: '',
    observation_date: new Date(),
    latitude: null,
    longitude: null,
    location_name: '',
    count: 1,
    behavior: '',
    habitat_description: '',
    weather_conditions: '',
    notes: '',
    image_urls: [],
    audio_urls: [],
    accuracy: null,
    altitude: null
  });

  const [species, setSpecies] = useState([]);
  const [selectedSpecies, setSelectedSpecies] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);

  const behaviorOptions = [
    'Feeding', 'Resting', 'Moving', 'Breeding', 'Nesting',
    'Foraging', 'Drinking', 'Grooming', 'Playing', 'Fighting',
    'Calling', 'Territorial', 'Migrating', 'Other'
  ];

  const weatherOptions = [
    'Sunny', 'Cloudy', 'Partly Cloudy', 'Overcast', 'Rainy',
    'Drizzle', 'Foggy', 'Windy', 'Hot', 'Cold', 'Humid'
  ];

  useEffect(() => {
    if (open) {
      loadSpecies();
      if (observation) {
        populateForm(observation);
      } else {
        resetForm();
      }
    }
  }, [open, observation, projectId]);

  const loadSpecies = async () => {
    try {
      const response = await speciesAPI.getSpecies({ per_page: 1000 });
      setSpecies(response.data.species);
    } catch (err) {
      console.error('Failed to load species:', err);
    }
  };

  const populateForm = (obs) => {
    setFormData({
      project_id: obs.project_id || projectId,
      species_id: obs.species?.id || '',
      observation_date: new Date(obs.observation_date),
      latitude: obs.latitude,
      longitude: obs.longitude,
      location_name: obs.location_name || '',
      count: obs.count || 1,
      behavior: obs.behavior || '',
      habitat_description: obs.habitat_description || '',
      weather_conditions: obs.weather_conditions || '',
      notes: obs.notes || '',
      image_urls: obs.image_urls || [],
      audio_urls: obs.audio_urls || [],
      accuracy: obs.accuracy,
      altitude: obs.altitude
    });

    if (obs.species) {
      setSelectedSpecies(obs.species);
    }
  };

  const resetForm = () => {
    setFormData({
      project_id: projectId || '',
      species_id: '',
      observation_date: new Date(),
      latitude: null,
      longitude: null,
      location_name: '',
      count: 1,
      behavior: '',
      habitat_description: '',
      weather_conditions: '',
      notes: '',
      image_urls: [],
      audio_urls: [],
      accuracy: null,
      altitude: null
    });
    setSelectedSpecies(null);
    setError('');
  };

  const handleChange = (field) => (event) => {
    setFormData({
      ...formData,
      [field]: event.target.value
    });
  };

  const handleSpeciesChange = (event, value) => {
    setSelectedSpecies(value);
    setFormData({
      ...formData,
      species_id: value?.id || ''
    });
  };

  const handleDateChange = (date) => {
    setFormData({
      ...formData,
      observation_date: date
    });
  };

  const getCurrentLocation = async () => {
    setGettingLocation(true);
    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          reject,
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000
          }
        );
      });

      setFormData({
        ...formData,
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        altitude: position.coords.altitude
      });

      // Try to get location name
      try {
        const response = await fetch(
          `https://api.opencagedata.com/geocode/v1/json?q=${position.coords.latitude}+${position.coords.longitude}&key=YOUR_API_KEY`
        );
        const data = await response.json();
        if (data.results?.[0]) {
          setFormData(prev => ({
            ...prev,
            location_name: data.results[0].formatted
          }));
        }
      } catch (err) {
        console.warn('Failed to get location name:', err);
      }
    } catch (err) {
      setError('Failed to get current location. Please enter coordinates manually.');
    } finally {
      setGettingLocation(false);
    }
  };

  const handleLocationSelect = (location) => {
    setFormData({
      ...formData,
      latitude: location.latitude,
      longitude: location.longitude
    });
    setShowMap(false);
  };

  const handleFileUpload = async (files, type) => {
    if (!files.length) return;

    setUploading(true);
    try {
      const uploadPromises = Array.from(files).map(file => {
        if (type === 'image') {
          return uploadsAPI.uploadImage(file);
        } else {
          return uploadsAPI.uploadAudio(file);
        }
      });

      const responses = await Promise.all(uploadPromises);
      const urls = responses.map(response => response.data.file_url);

      const urlField = type === 'image' ? 'image_urls' : 'audio_urls';
      setFormData({
        ...formData,
        [urlField]: [...formData[urlField], ...urls]
      });
    } catch (err) {
      setError('Failed to upload files');
    } finally {
      setUploading(false);
    }
  };

  const removeFile = (index, type) => {
    const urlField = type === 'image' ? 'image_urls' : 'audio_urls';
    const newUrls = [...formData[urlField]];
    newUrls.splice(index, 1);
    setFormData({
      ...formData,
      [urlField]: newUrls
    });
  };

  const validateForm = () => {
    if (!formData.species_id) {
      setError('Please select a species');
      return false;
    }
    if (!formData.project_id) {
      setError('Project is required');
      return false;
    }
    if (!formData.latitude || !formData.longitude) {
      setError('Location coordinates are required');
      return false;
    }
    if (formData.count < 1) {
      setError('Count must be at least 1');
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
        observation_date: formData.observation_date.toISOString()
      };

      let response;
      if (observation) {
        response = await observationsAPI.updateObservation(observation.id, submitData);
      } else {
        response = await observationsAPI.createObservation(submitData);
      }

      onSuccess(response.data.observation);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save observation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog 
        open={open} 
        onClose={onClose} 
        maxWidth="md" 
        fullWidth
        data-testid="observation-form-dialog"
      >
        <DialogTitle>
          {observation ? 'Edit Observation' : 'Add New Observation'}
        </DialogTitle>

        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Grid container spacing={3} sx={{ mt: 1 }}>
            {/* Species Selection */}
            <Grid item xs={12}>
              <Autocomplete
                options={species}
                getOptionLabel={(option) => `${option.common_name} (${option.scientific_name})`}
                value={selectedSpecies}
                onChange={handleSpeciesChange}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Species *"
                    placeholder="Search for species..."
                    fullWidth
                  />
                )}
                renderOption={(props, option) => (
                  <Box component="li" {...props}>
                    <Box>
                      <Typography variant="body1">
                        {option.common_name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        <em>{option.scientific_name}</em>
                        {option.conservation_status && (
                          <Chip 
                            label={option.conservation_status} 
                            size="small" 
                            sx={{ ml: 1 }} 
                          />
                        )}
                      </Typography>
                    </Box>
                  </Box>
                )}
              />
            </Grid>

            {/* Date and Time */}
            <Grid item xs={12} md={6}>
              <DateTimePicker
                label="Observation Date & Time *"
                value={formData.observation_date}
                onChange={handleDateChange}
                renderInput={(params) => (
                  <TextField {...params} fullWidth />
                )}
                maxDateTime={new Date()}
              />
            </Grid>

            {/* Count */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Number of Individuals *"
                value={formData.count}
                onChange={handleChange('count')}
                inputProps={{ min: 1 }}
                required
              />
            </Grid>

            {/* Location Section */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Location
              </Typography>
              <Box display="flex" gap={1} mb={2}>
                <Button
                  variant="outlined"
                  startIcon={gettingLocation ? <CircularProgress size={16} /> : <MyLocation />}
                  onClick={getCurrentLocation}
                  disabled={gettingLocation}
                >
                  Get Current Location
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<LocationOn />}
                  onClick={() => setShowMap(true)}
                >
                  Select on Map
                </Button>
              </Box>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Latitude *"
                value={formData.latitude || ''}
                onChange={handleChange('latitude')}
                inputProps={{ step: 'any' }}
                required
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Longitude *"
                value={formData.longitude || ''}
                onChange={handleChange('longitude')}
                inputProps={{ step: 'any' }}
                required
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Location Name"
                value={formData.location_name}
                onChange={handleChange('location_name')}
                placeholder="Descriptive location name"
              />
            </Grid>

            {/* Accuracy and Altitude */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="GPS Accuracy (meters)"
                value={formData.accuracy || ''}
                onChange={handleChange('accuracy')}
                inputProps={{ step: 'any' }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Altitude (meters)"
                value={formData.altitude || ''}
                onChange={handleChange('altitude')}
                inputProps={{ step: 'any' }}
              />
            </Grid>

            {/* Behavior */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Behavior</InputLabel>
                <Select
                  value={formData.behavior}
                  label="Behavior"
                  onChange={handleChange('behavior')}
                >
                  <MenuItem value="">
                    <em>Select behavior</em>
                  </MenuItem>
                  {behaviorOptions.map((behavior) => (
                    <MenuItem key={behavior} value={behavior}>
                      {behavior}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Weather Conditions */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Weather Conditions</InputLabel>
                <Select
                  value={formData.weather_conditions}
                  label="Weather Conditions"
                  onChange={handleChange('weather_conditions')}
                >
                  <MenuItem value="">
                    <em>Select weather</em>
                  </MenuItem>
                  {weatherOptions.map((weather) => (
                    <MenuItem key={weather} value={weather}>
                      {weather}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Habitat Description */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Habitat Description"
                value={formData.habitat_description}
                onChange={handleChange('habitat_description')}
                placeholder="Describe the habitat and environment"
              />
            </Grid>

            {/* Notes */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Additional Notes"
                value={formData.notes}
                onChange={handleChange('notes')}
                placeholder="Any additional observations or notes"
              />
            </Grid>

            {/* Media Upload Section */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Media
              </Typography>
              
              {/* Image Upload */}
              <Box mb={2}>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <Typography variant="subtitle1">Photos</Typography>
                  <input
                    accept="image/*"
                    style={{ display: 'none' }}
                    id="image-upload"
                    multiple
                    type="file"
                    onChange={(e) => handleFileUpload(e.target.files, 'image')}
                  />
                  <label htmlFor="image-upload">
                    <IconButton color="primary" component="span" disabled={uploading}>
                      <PhotoCamera />
                    </IconButton>
                  </label>
                  {uploading && <CircularProgress size={20} />}
                </Box>

                <Grid container spacing={1}>
                  {formData.image_urls.map((url, index) => (
                    <Grid item xs={12} sm={6} md={4} key={index}>
                      <Card>
                        <CardMedia
                          component="img"
                          height="140"
                          image={url}
                          alt={`Observation ${index + 1}`}
                        />
                        <CardActions>
                          <IconButton
                            size="small"
                            onClick={() => removeFile(index, 'image')}
                          >
                            <Delete />
                          </IconButton>
                        </CardActions>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Box>

              {/* Audio Upload */}
              <Box>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <Typography variant="subtitle1">Audio Recordings</Typography>
                  <input
                    accept="audio/*"
                    style={{ display: 'none' }}
                    id="audio-upload"
                    multiple
                    type="file"
                    onChange={(e) => handleFileUpload(e.target.files, 'audio')}
                  />
                  <label htmlFor="audio-upload">
                    <IconButton color="primary" component="span" disabled={uploading}>
                      <Mic />
                    </IconButton>
                  </label>
                </Box>

                <Box display="flex" flexWrap="wrap" gap={1}>
                  {formData.audio_urls.map((url, index) => (
                    <Chip
                      key={index}
                      label={`Audio ${index + 1}`}
                      onDelete={() => removeFile(index, 'audio')}
                      deleteIcon={<Delete />}
                    />
                  ))}
                </Box>
              </Box>
            </Grid>
          </Grid>

          {loading && (
            <Box display="flex" justifyContent="center" mt={2}>
              <LoadingSpinner />
            </Box>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
            disabled={loading}
            data-testid="submit-observation-button"
          >
            {observation ? 'Update' : 'Save'} Observation
          </Button>
        </DialogActions>
      </Dialog>

      {/* Map Selection Dialog */}
      <Dialog 
        open={showMap} 
        onClose={() => setShowMap(false)} 
        maxWidth="lg" 
        fullWidth
      >
        <DialogTitle>Select Location on Map</DialogTitle>
        <DialogContent>
          <Box height="500px">
            <MapView
              observations={[]}
              center={formData.latitude && formData.longitude ? 
                [formData.latitude, formData.longitude] : [0, 0]
              }
              zoom={formData.latitude && formData.longitude ? 15 : 2}
              onLocationSelect={handleLocationSelect}
              height="100%"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowMap(false)}>
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ObservationForm;