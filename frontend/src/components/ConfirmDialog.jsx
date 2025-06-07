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
        return <Error color="error" />;
      case 'warning':
        return <Warning color="warning" />;
      case 'info':
        return <Info color="info" />;
      case 'success':
        return <CheckCircle color="success" />;
      default:
        return <Warning color="warning" />;
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
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          {getIcon()}
          <Typography variant="h6">
            {title}
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Typography variant="body1">
          {message}
        </Typography>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleCancel} color="inherit">
          {cancelText}
        </Button>
        <Button onClick={onConfirm} variant="contained" color={getButtonColor()}>
          {confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmDialog;