import React, { createContext, useContext, useState, useCallback } from 'react';
import { Snackbar, Alert, AlertTitle } from '@mui/material';

const NotificationContext = createContext();

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const showNotification = useCallback((message, type = 'info', title = null, duration = 6000) => {
    const id = Date.now() + Math.random();
    const notification = {
      id,
      message,
      type,
      title,
      duration,
      timestamp: new Date()
    };

    setNotifications(prev => [...prev, notification]);

    // Auto-remove notification after duration
    if (duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, duration);
    }

    return id;
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Convenience methods
  const showSuccess = useCallback((message, title = 'Success') => {
    return showNotification(message, 'success', title);
  }, [showNotification]);

  const showError = useCallback((message, title = 'Error') => {
    return showNotification(message, 'error', title, 8000);
  }, [showNotification]);

  const showWarning = useCallback((message, title = 'Warning') => {
    return showNotification(message, 'warning', title);
  }, [showNotification]);

  const showInfo = useCallback((message, title = 'Info') => {
    return showNotification(message, 'info', title);
  }, [showNotification]);

  const value = {
    notifications,
    showNotification,
    removeNotification,
    clearAllNotifications,
    showSuccess,
    showError,
    showWarning,
    showInfo
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <NotificationContainer 
        notifications={notifications} 
        onClose={removeNotification}
      />
    </NotificationContext.Provider>
  );
};

const NotificationContainer = ({ notifications, onClose }) => {
  return (
    <>
      {notifications.map((notification) => (
        <Snackbar
          key={notification.id}
          open={true}
          autoHideDuration={notification.duration}
          onClose={() => onClose(notification.id)}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
          sx={{ 
            mt: notifications.indexOf(notification) * 7,
            zIndex: 9999 
          }}
        >
          <Alert
            onClose={() => onClose(notification.id)}
            severity={notification.type}
            variant="filled"
            sx={{ width: '100%', minWidth: 300 }}
          >
            {notification.title && (
              <AlertTitle>{notification.title}</AlertTitle>
            )}
            {notification.message}
          </Alert>
        </Snackbar>
      ))}
    </>
  );
};

export default NotificationContext; 