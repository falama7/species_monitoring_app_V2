import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Grid,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Tooltip,
  Fab,
  FormControlLabel,
  Switch,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Description as FileIcon,
  Link as LinkIcon,
  Public as PublicIcon,
  Lock as PrivateIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import api from '../services/api';
import LoadingSpinner from './LoadingSpinner';
import Pagination from './Pagination';
import ConfirmDialog from './ConfirmDialog';

const Resources = () => {
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();
  
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingResource, setEditingResource] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [resourceToDelete, setResourceToDelete] = useState(null);
  
  // Filters and search
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [publicFilter, setPublicFilter] = useState('');
  const [categories, setCategories] = useState([]);
  const [types, setTypes] = useState([]);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 12;
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    resource_type: '',
    category: '',
    external_url: '',
    is_public: true,
    file: null
  });
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    fetchResources();
    fetchCategories();
    fetchTypes();
  }, [currentPage, searchTerm, categoryFilter, typeFilter, publicFilter]);

  const fetchResources = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        per_page: itemsPerPage,
        ...(searchTerm && { search: searchTerm }),
        ...(categoryFilter && { category: categoryFilter }),
        ...(typeFilter && { type: typeFilter }),
        ...(publicFilter !== '' && { public: publicFilter === 'true' })
      };

      const response = await api.get('/resources', { params });
      setResources(response.data.resources);
      setTotalPages(response.data.pagination.pages);
      setTotalItems(response.data.pagination.total);
    } catch (error) {
      showError('Failed to fetch resources');
      console.error('Error fetching resources:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get('/resources/categories');
      setCategories(response.data.categories);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchTypes = async () => {
    try {
      const response = await api.get('/resources/types');
      setTypes(response.data.types);
    } catch (error) {
      console.error('Error fetching types:', error);
    }
  };

  const handleOpenDialog = (resource = null) => {
    if (resource) {
      setEditingResource(resource);
      setFormData({
        title: resource.title,
        description: resource.description,
        resource_type: resource.resource_type,
        category: resource.category || '',
        external_url: resource.external_url || '',
        is_public: resource.is_public,
        file: null
      });
    } else {
      setEditingResource(null);
      setFormData({
        title: '',
        description: '',
        resource_type: '',
        category: '',
        external_url: '',
        is_public: true,
        file: null
      });
    }
    setFormErrors({});
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingResource(null);
    setFormData({
      title: '',
      description: '',
      resource_type: '',
      category: '',
      external_url: '',
      is_public: true,
      file: null
    });
    setFormErrors({});
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    setFormData(prev => ({ ...prev, file }));
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.title.trim()) {
      errors.title = 'Title is required';
    }
    
    if (!formData.description.trim()) {
      errors.description = 'Description is required';
    }
    
    if (!formData.resource_type) {
      errors.resource_type = 'Resource type is required';
    }
    
    if (!formData.external_url && !formData.file && !editingResource?.file_url) {
      errors.file = 'Either upload a file or provide an external URL';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('resource_type', formData.resource_type);
      formDataToSend.append('category', formData.category);
      formDataToSend.append('external_url', formData.external_url);
      formDataToSend.append('is_public', formData.is_public);
      
      if (formData.file) {
        formDataToSend.append('file', formData.file);
      }

      if (editingResource) {
        await api.put(`/resources/${editingResource.id}`, formDataToSend, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        showSuccess('Resource updated successfully');
      } else {
        await api.post('/resources', formDataToSend, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        showSuccess('Resource created successfully');
      }

      handleCloseDialog();
      fetchResources();
    } catch (error) {
      showError(error.response?.data?.error || 'Failed to save resource');
    }
  };

  const handleDelete = async () => {
    if (!resourceToDelete) return;

    try {
      await api.delete(`/resources/${resourceToDelete.id}`);
      showSuccess('Resource deleted successfully');
      setDeleteDialogOpen(false);
      setResourceToDelete(null);
      fetchResources();
    } catch (error) {
      showError(error.response?.data?.error || 'Failed to delete resource');
    }
  };

  const handleDownload = async (resource) => {
    try {
      const response = await api.get(`/resources/download/${resource.id}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', resource.title);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      showError('Failed to download resource');
    }
  };

  const canEditResource = (resource) => {
    return user?.role === 'admin' || resource.created_by?.id === user?.id;
  };

  const resourceTypes = [
    'guide', 'manual', 'template', 'form', 'protocol', 'report', 'presentation', 'video', 'audio', 'image', 'other'
  ];

  if (loading && resources.length === 0) {
    return <LoadingSpinner />;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Resources
        </Typography>
        {(user?.role === 'admin' || user?.role === 'coordinator') && (
          <Fab
            color="primary"
            aria-label="add resource"
            onClick={() => handleOpenDialog()}
          >
            <AddIcon />
          </Fab>
        )}
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Search resources"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                }}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  label="Category"
                >
                  <MenuItem value="">All Categories</MenuItem>
                  {categories.map(category => (
                    <MenuItem key={category} value={category}>
                      {category}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  label="Type"
                >
                  <MenuItem value="">All Types</MenuItem>
                  {types.map(type => (
                    <MenuItem key={type} value={type}>
                      {type}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Visibility</InputLabel>
                <Select
                  value={publicFilter}
                  onChange={(e) => setPublicFilter(e.target.value)}
                  label="Visibility"
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="true">Public</MenuItem>
                  <MenuItem value="false">Private</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <Typography variant="body2" color="text.secondary">
                {totalItems} resource{totalItems !== 1 ? 's' : ''} found
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Resources Grid */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : resources.length === 0 ? (
        <Alert severity="info">
          No resources found. {(user?.role === 'admin' || user?.role === 'coordinator') && 'Click the + button to create your first resource.'}
        </Alert>
      ) : (
        <Grid container spacing={3}>
          {resources.map((resource) => (
            <Grid item xs={12} sm={6} md={4} key={resource.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Typography variant="h6" component="h2" sx={{ flexGrow: 1 }}>
                      {resource.title}
                    </Typography>
                    {resource.is_public ? (
                      <Tooltip title="Public">
                        <PublicIcon color="primary" fontSize="small" />
                      </Tooltip>
                    ) : (
                      <Tooltip title="Private">
                        <PrivateIcon color="secondary" fontSize="small" />
                      </Tooltip>
                    )}
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {resource.description}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                    <Chip 
                      label={resource.resource_type} 
                      size="small" 
                      color="primary" 
                      variant="outlined" 
                    />
                    {resource.category && (
                      <Chip 
                        label={resource.category} 
                        size="small" 
                        color="secondary" 
                        variant="outlined" 
                      />
                    )}
                  </Box>
                  
                  <Typography variant="caption" color="text.secondary">
                    Created by {resource.created_by?.first_name} {resource.created_by?.last_name}
                  </Typography>
                </CardContent>
                
                <CardActions>
                  {resource.file_url && (
                    <Tooltip title="Download file">
                      <IconButton 
                        size="small" 
                        onClick={() => handleDownload(resource)}
                      >
                        <DownloadIcon />
                      </IconButton>
                    </Tooltip>
                  )}
                  
                  {resource.external_url && (
                    <Tooltip title="Open external link">
                      <IconButton 
                        size="small" 
                        onClick={() => window.open(resource.external_url, '_blank')}
                      >
                        <LinkIcon />
                      </IconButton>
                    </Tooltip>
                  )}
                  
                  <Box sx={{ flexGrow: 1 }} />
                  
                  {canEditResource(resource) && (
                    <>
                      <Tooltip title="Edit">
                        <IconButton 
                          size="small" 
                          onClick={() => handleOpenDialog(resource)}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      
                      <Tooltip title="Delete">
                        <IconButton 
                          size="small" 
                          color="error"
                          onClick={() => {
                            setResourceToDelete(resource);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </>
                  )}
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </Box>
      )}

      {/* Create/Edit Dialog */}
      <Dialog 
        open={dialogOpen} 
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingResource ? 'Edit Resource' : 'Create New Resource'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                error={!!formErrors.title}
                helperText={formErrors.title}
                required
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                error={!!formErrors.description}
                helperText={formErrors.description}
                multiline
                rows={3}
                required
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth error={!!formErrors.resource_type}>
                <InputLabel>Resource Type *</InputLabel>
                <Select
                  value={formData.resource_type}
                  onChange={(e) => handleInputChange('resource_type', e.target.value)}
                  label="Resource Type *"
                >
                  {resourceTypes.map(type => (
                    <MenuItem key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </MenuItem>
                  ))}
                </Select>
                {formErrors.resource_type && (
                  <Typography variant="caption" color="error" sx={{ ml: 2 }}>
                    {formErrors.resource_type}
                  </Typography>
                )}
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Category"
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="External URL"
                value={formData.external_url}
                onChange={(e) => handleInputChange('external_url', e.target.value)}
                placeholder="https://example.com/resource"
              />
            </Grid>
            
            <Grid item xs={12}>
              <input
                accept="*/*"
                style={{ display: 'none' }}
                id="file-upload"
                type="file"
                onChange={handleFileChange}
              />
              <label htmlFor="file-upload">
                <Button variant="outlined" component="span" startIcon={<FileIcon />}>
                  {formData.file ? formData.file.name : 'Upload File'}
                </Button>
              </label>
              {formErrors.file && (
                <Typography variant="caption" color="error" display="block" sx={{ mt: 1 }}>
                  {formErrors.file}
                </Typography>
              )}
            </Grid>
            
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.is_public}
                    onChange={(e) => handleInputChange('is_public', e.target.checked)}
                  />
                }
                label="Make this resource public"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingResource ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title="Delete Resource"
        message={`Are you sure you want to delete "${resourceToDelete?.title}"? This action cannot be undone.`}
      />
    </Box>
  );
};

export default Resources; 