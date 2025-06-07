import React from 'react';
import { Navigate } from 'react-router-dom';
import { CircularProgress, Box } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      
        
      
    );
  }

  if (!isAuthenticated) {
    return ;
  }

  return children;
};

export default ProtectedRoute;