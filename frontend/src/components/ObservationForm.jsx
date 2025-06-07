import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Button,
  Box
} from '@mui/material';
import { Warning, Error, Info, CheckCircle } from '@mui/icons-material';

const ConfirmDialog = ({
  open,
  onClose,
  onConfirm,
  onCancel,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  severity = 'warning' // warning, error, info, success
}) => {
  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      onClose();
    }
  };

  const getIcon = () => {
    switch (severity) {
      case 'error':
        return ;
      case 'warning':
        return ;
      case 'info':
        return ;
      case 'success':
        return ;
      default:
        return ;
    }
  };

  const getButtonColor = () => {
    switch (severity) {
      case 'error':
        return 'error';
      case 'warning':
        return 'warning';
      case 'info':
        return 'info';
      case 'success':
        return 'success';
      default:
        return 'primary';
    }
  };

  return (
    
      
        
          {getIcon()}
          
            {title}
          
        
      

      
        
          {message}
        
      

      
        
          {cancelText}
        
        
          {confirmText}
        
      
    
  );
};

export default ConfirmDialog;