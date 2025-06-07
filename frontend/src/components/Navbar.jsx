import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Box,
  Avatar
} from '@mui/material';
import {
  AccountCircle,
  Dashboard,
  FolderOpen,
  Visibility,
  People,
  ExitToApp
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [anchorEl, setAnchorEl] = useState(null);

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    handleMenuClose();
  };

  const navigationItems = [
    { path: '/dashboard', label: 'Dashboard', icon: <Dashboard /> },
    { path: '/projects', label: 'Projects', icon: <FolderOpen /> },
    { path: '/observations', label: 'Observations', icon: <Visibility /> },
  ];

  // Add admin-only items
  if (user?.role === 'admin') {
    navigationItems.push({
      path: '/users',
      label: 'Users',
      icon: <People />
    });
  }

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography
          variant="h6"
          component="div"
          sx={{ flexGrow: 0, mr: 4, cursor: 'pointer' }}
          onClick={() => navigate('/dashboard')}
        >
          Species Monitor
        </Typography>

        <Box sx={{ flexGrow: 1, display: 'flex' }}>
          {navigationItems.map((item) => (
            <Button
              key={item.path}
              color="inherit"
              startIcon={item.icon}
              onClick={() => navigate(item.path)}
              sx={{
                mr: 2,
                backgroundColor: location.pathname === item.path ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                },
              }}
            >
              {item.label}
            </Button>
          ))}
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography variant="body2" sx={{ mr: 2 }}>
            {user?.first_name} {user?.last_name}
          </Typography>
          <IconButton
            size="large"
            aria-label="account of current user"
            aria-controls="menu-appbar"
            aria-haspopup="true"
            onClick={handleMenuClick}
            color="inherit"
          >
            <Avatar sx={{ width: 32, height: 32 }}>
              {user?.first_name?.charAt(0)?.toUpperCase()}
            </Avatar>
          </IconButton>
          <Menu
            id="menu-appbar"
            anchorEl={anchorEl}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            keepMounted
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
          >
            <MenuItem onClick={() => navigate('/profile')}>
              <AccountCircle sx={{ mr: 1 }} />
              Profile
            </MenuItem>
            <MenuItem onClick={handleLogout}>
              <ExitToApp sx={{ mr: 1 }} />
              Logout
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;