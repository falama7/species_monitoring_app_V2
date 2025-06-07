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
    { path: '/dashboard', label: 'Dashboard', icon:  },
    { path: '/projects', label: 'Projects', icon:  },
    { path: '/observations', label: 'Observations', icon:  },
  ];

  // Add admin-only items
  if (user?.role === 'admin') {
    navigationItems.push({
      path: '/users',
      label: 'Users',
      icon: 
    });
  }

  return (
    
      
        <Typography
          variant="h6"
          component="div"
          sx={{ flexGrow: 0, mr: 4, cursor: 'pointer' }}
          onClick={() => navigate('/dashboard')}
        >
          Species Monitor
        

        
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
            
          ))}
        

        
          
            {user?.first_name} {user?.last_name}
          
          
            
              {user?.first_name?.charAt(0)?.toUpperCase()}
            
          
          
            <MenuItem onClick={() => navigate('/profile')}>
              
              Profile
            
            
              
              Logout
            
          
        
      
    
  );
};

export default Navbar;