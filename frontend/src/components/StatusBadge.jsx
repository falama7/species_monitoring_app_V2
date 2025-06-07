import React from 'react';
import { Chip } from '@mui/material';
import {
  CheckCircle,
  Cancel,
  Pause,
  PlayArrow,
  Warning,
  Info,
  Error,
  Schedule
} from '@mui/icons-material';

const StatusBadge = ({ status, type = 'project', size = 'small', showIcon = true }) => {
  const getStatusConfig = () => {
    switch (type) {
      case 'project':
        return getProjectStatusConfig(status);
      case 'observation':
        return getObservationStatusConfig(status);
      case 'user':
        return getUserStatusConfig(status);
      case 'conservation':
        return getConservationStatusConfig(status);
      default:
        return getDefaultStatusConfig(status);
    }
  };

  const getProjectStatusConfig = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return {
          label: 'Active',
          color: 'success',
          icon: <PlayArrow fontSize="small" />
        };
      case 'completed':
        return {
          label: 'Completed',
          color: 'primary',
          icon: <CheckCircle fontSize="small" />
        };
      case 'paused':
        return {
          label: 'Paused',
          color: 'warning',
          icon: <Pause fontSize="small" />
        };
      case 'cancelled':
        return {
          label: 'Cancelled',
          color: 'error',
          icon: <Cancel fontSize="small" />
        };
      default:
        return {
          label: status || 'Unknown',
          color: 'default',
          icon: <Info fontSize="small" />
        };
    }
  };

  const getObservationStatusConfig = (status) => {
    switch (status?.toLowerCase()) {
      case 'draft':
      case 'brouillon':
        return {
          label: 'Draft',
          color: 'default',
          icon: <Schedule fontSize="small" />
        };
      case 'pending':
      case 'en_attente':
        return {
          label: 'Pending',
          color: 'warning',
          icon: <Schedule fontSize="small" />
        };
      case 'validated':
      case 'validée':
        return {
          label: 'Validated',
          color: 'success',
          icon: <CheckCircle fontSize="small" />
        };
      case 'rejected':
        return {
          label: 'Rejected',
          color: 'error',
          icon: <Error fontSize="small" />
        };
      default:
        return {
          label: status || 'Unknown',
          color: 'default',
          icon: <Info fontSize="small" />
        };
    }
  };

  const getUserStatusConfig = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
      case true:
        return {
          label: 'Active',
          color: 'success',
          icon: <CheckCircle fontSize="small" />
        };
      case 'inactive':
      case false:
        return {
          label: 'Inactive',
          color: 'default',
          icon: <Cancel fontSize="small" />
        };
      case 'suspended':
        return {
          label: 'Suspended',
          color: 'error',
          icon: <Error fontSize="small" />
        };
      default:
        return {
          label: status?.toString() || 'Unknown',
          color: 'default',
          icon: <Info fontSize="small" />
        };
    }
  };

  const getConservationStatusConfig = (status) => {
    switch (status?.toUpperCase()) {
      case 'LC':
        return {
          label: 'LC - Least Concern',
          color: 'success',
          icon: <CheckCircle fontSize="small" />
        };
      case 'NT':
        return {
          label: 'NT - Near Threatened',
          color: 'info',
          icon: <Info fontSize="small" />
        };
      case 'VU':
        return {
          label: 'VU - Vulnerable',
          color: 'warning',
          icon: <Warning fontSize="small" />
        };
      case 'EN':
        return {
          label: 'EN - Endangered',
          color: 'error',
          icon: <Error fontSize="small" />
        };
      case 'CR':
        return {
          label: 'CR - Critically Endangered',
          color: 'error',
          icon: <Error fontSize="small" />
        };
      case 'EW':
        return {
          label: 'EW - Extinct in Wild',
          color: 'error',
          icon: <Cancel fontSize="small" />
        };
      case 'EX':
        return {
          label: 'EX - Extinct',
          color: 'error',
          icon: <Cancel fontSize="small" />
        };
      default:
        return {
          label: status || 'Unknown',
          color: 'default',
          icon: <Info fontSize="small" />
        };
    }
  };

  const getDefaultStatusConfig = (status) => {
    return {
      label: status || 'Unknown',
      color: 'default',
      icon: <Info fontSize="small" />
    };
  };

  const config = getStatusConfig();

  return (
    <Chip
      label={config.label}
      color={config.color}
      size={size}
      icon={showIcon ? config.icon : undefined}
      variant="filled"
    />
  );
};

export default StatusBadge;