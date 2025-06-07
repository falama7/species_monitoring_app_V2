import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  TextField,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Avatar,
  Pagination,
  FormControl,
  InputLabel,
  Select
} from '@mui/material';
import {
  Edit,
  Delete,
  PersonAdd,
  Search,
  FilterList,
  Block,
  CheckCircle
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { authAPI } from '../services/api';
import ConfirmDialog from './ConfirmDialog';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';

const UserManagement = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    pages: 1,
    total: 0,
    per_page: 20
  });

  // Filters and search
  const [filters, setFilters] = useState({
    search: '',
    role: '',
    is_active: ''
  });

  // Dialog states
  const [userFormOpen, setUserFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, user: null });

  // Form state
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    role: 'observer',
    is_active: true
  });

  useEffect(() => {
    loadUsers();
  }, [pagination.page, filters]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        per_page: pagination.per_page,
        ...Object.fromEntries(
          Object.entries(filters).filter(([key, value]) => value !== '')
        )
      };

      const response = await authAPI.getUsers(params);
      setUsers(response.data.users);
      setPagination({
        page: response.data.current_page,
        pages: response.data.pages,
        total: response.data.total,
        per_page: response.data.per_page
      });
    } catch (err) {
      setError('Failed to load users');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = () => {
    setEditingUser(null);
    setFormData({
      username: '',
      email: '',
      first_name: '',
      last_name: '',
      role: 'observer',
      is_active: true
    });
    setUserFormOpen(true);
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      role: user.role,
      is_active: user.is_active
    });
    setUserFormOpen(true);
  };

  const handleDeleteUser = (user) => {
    setDeleteDialog({ open: true, user });
  };

  const handleToggleUserStatus = async (user) => {
    try {
      // This would require an API endpoint to toggle user status
      // For now, we'll simulate it
      const updatedUser = { ...user, is_active: !user.is_active };
      setUsers(users.map(u => u.id === user.id ? updatedUser : u));
    } catch (err) {
      setError('Failed to update user status');
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      if (editingUser) {
        // Update user - would need an update endpoint
        console.log('Update user:', formData);
      } else {
        // Create user
        const response = await authAPI.register({
          ...formData,
          password: 'tempPassword123' // In real app, generate or send via email
        });
        setUsers([response.data.user, ...users]);
      }
      
      setUserFormOpen(false);
      setEditingUser(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save user');
    }
  };

  const confirmDelete = async () => {
    try {
      // This would require a delete user endpoint
      setUsers(users.filter(u => u.id !== deleteDialog.user.id));
      setDeleteDialog({ open: false, user: null });
    } catch (err) {
      setError('Failed to delete user');
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters({ ...filters, [field]: value });
    setPagination({ ...pagination, page: 1 });
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return 'error';
      case 'researcher': return 'warning';
      case 'observer': return 'info';
      default: return 'default';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (currentUser?.role !== 'admin') {
    return (
      <Container maxWidth="md" sx={{ py: 3 }}>
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h5" gutterBottom>
            Access Denied
          </Typography>
          <Typography variant="body1" color="text.secondary">
            You need administrator privileges to access user management.
          </Typography>
        </Paper>
      </Container>
    );
  }

  if (loading && users.length === 0) return <LoadingSpinner />;

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          User Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<PersonAdd />}
          onClick={handleCreateUser}
        >
          Add User
        </Button>
      </Box>

      {error && <ErrorMessage message={error} onRetry={loadUsers} />}

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              size="small"
              label="Search users..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              InputProps={{
                startAdornment: <Search sx={{ mr: 1, color: 'action.active' }} />
              }}
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Role</InputLabel>
              <Select
                value={filters.role}
                label="Role"
                onChange={(e) => handleFilterChange('role', e.target.value)}
              >
                <MenuItem value="">All Roles</MenuItem>
                <MenuItem value="admin">Administrator</MenuItem>
                <MenuItem value="researcher">Researcher</MenuItem>
                <MenuItem value="observer">Observer</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select
                value={filters.is_active}
                label="Status"
                onChange={(e) => handleFilterChange('is_active', e.target.value)}
              >
                <MenuItem value="">All Users</MenuItem>
                <MenuItem value="true">Active</MenuItem>
                <MenuItem value="false">Inactive</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={2}>
            <Button
              fullWidth
              variant="outlined"
              onClick={() => setFilters({ search: '', role: '', is_active: '' })}
            >
              Clear
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Results Summary */}
      <Box mb={2}>
        <Typography variant="body2" color="text.secondary">
          Showing {users.length} of {pagination.total} users
        </Typography>
      </Box>

      {/* Users Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>User</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Last Login</TableCell>
              <TableCell>Created</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id} hover>
                <TableCell>
                  <Box display="flex" alignItems="center" gap={2}>
                    <Avatar>
                      {user.first_name?.charAt(0)?.toUpperCase()}
                    </Avatar>
                    <Box>
                      <Typography variant="body1">
                        {user.first_name} {user.last_name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        @{user.username}
                      </Typography>
                    </Box>
                  </Box>
                </TableCell>

                <TableCell>
                  <Typography variant="body2">
                    {user.email}
                  </Typography>
                </TableCell>

                <TableCell>
                  <Chip 
                    label={user.role} 
                    color={getRoleColor(user.role)}
                    size="small"
                  />
                </TableCell>

                <TableCell>
                  <Chip
                    label={user.is_active ? 'Active' : 'Inactive'}
                    color={user.is_active ? 'success' : 'default'}
                    size="small"
                    icon={user.is_active ? <CheckCircle /> : <Block />}
                  />
                </TableCell>

                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {user.last_login ? formatDate(user.last_login) : 'Never'}
                  </Typography>
                </TableCell>

                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {formatDate(user.created_at)}
                  </Typography>
                </TableCell>

                <TableCell align="right">
                  <IconButton
                    size="small"
                    onClick={() => handleEditUser(user)}
                    disabled={user.id === currentUser?.id}
                  >
                    <Edit />
                  </IconButton>
                  
                  <IconButton
                    size="small"
                    onClick={() => handleToggleUserStatus(user)}
                    disabled={user.id === currentUser?.id}
                    color={user.is_active ? 'warning' : 'success'}
                  >
                    {user.is_active ? <Block /> : <CheckCircle />}
                  </IconButton>

                  <IconButton
                    size="small"
                    onClick={() => handleDeleteUser(user)}
                    disabled={user.id === currentUser?.id}
                    color="error"
                  >
                    <Delete />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <Box display="flex" justifyContent="center" mt={3}>
          <Pagination
            count={pagination.pages}
            page={pagination.page}
            onChange={(event, value) => setPagination({ ...pagination, page: value })}
            color="primary"
          />
        </Box>
      )}

      {/* User Form Dialog */}
      <Dialog 
        open={userFormOpen} 
        onClose={() => setUserFormOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <form onSubmit={handleFormSubmit}>
          <DialogTitle>
            {editingUser ? 'Edit User' : 'Add New User'}
          </DialogTitle>

          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="First Name"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  required
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Last Name"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  required
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  required
                  disabled={editingUser}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  type="email"
                  label="Email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Role</InputLabel>
                  <Select
                    value={formData.role}
                    label="Role"
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  >
                    <MenuItem value="observer">Observer</MenuItem>
                    <MenuItem value="researcher">Researcher</MenuItem>
                    <MenuItem value="admin">Administrator</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={formData.is_active}
                    label="Status"
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.value })}
                  >
                    <MenuItem value={true}>Active</MenuItem>
                    <MenuItem value={false}>Inactive</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </DialogContent>

          <DialogActions>
            <Button onClick={() => setUserFormOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="contained">
              {editingUser ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialog.open}
        title="Delete User"
        message={`Are you sure you want to delete "${deleteDialog.user?.first_name} ${deleteDialog.user?.last_name}"? This action cannot be undone.`}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteDialog({ open: false, user: null })}
        severity="error"
      />
    </Container>
  );
};

export default UserManagement;