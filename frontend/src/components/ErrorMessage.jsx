import React from 'react';
import { Alert, AlertTitle, Button, Box } from '@mui/material';
import { Refresh } from '@mui/icons-material';

const ErrorMessage = ({ 
  message = 'An error occurred', 
  title = 'Error',
  onRetry,
  severity = 'error' 
}) => {
  return (
    <Box sx={{ p: 2 }}>
      <Alert 
        severity={severity}
        action={
          onRetry && (
            <Button
              color="inherit"
              size="small"
              startIcon={<Refresh />}
              onClick={onRetry}
            >
              Retry
            </Button>
          )
        }
      >
        <AlertTitle>{title}</AlertTitle>
        {message}
      </Alert>
    </Box>
  );
};

export default ErrorMessage;