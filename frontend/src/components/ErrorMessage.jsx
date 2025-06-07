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
    
      }
              onClick={onRetry}
            >
              Retry
            
          )
        }
      >
        {title}
        {message}
      
    
  );
};

export default ErrorMessage;