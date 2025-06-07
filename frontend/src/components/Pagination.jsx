import React from 'react';
import {
  Box,
  Pagination as MuiPagination,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material';

const Pagination = ({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  showItemsPerPage = true,
  showSummary = true,
  itemsPerPageOptions = [10, 20, 50, 100],
  size = 'medium'
}) => {
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const handlePageChange = (event, value) => {
    if (onPageChange) {
      onPageChange(value);
    }
  };

  const handleItemsPerPageChange = (event) => {
    if (onItemsPerPageChange) {
      onItemsPerPageChange(parseInt(event.target.value, 10));
    }
  };

  if (totalPages <= 1 && !showSummary && !showItemsPerPage) {
    return null;
  }

  return (
    <Box
      display="flex"
      justifyContent="space-between"
      alignItems="center"
      flexWrap="wrap"
      gap={2}
      sx={{ py: 2 }}
    >
      {/* Left side - Summary */}
      <Box display="flex" alignItems="center" gap={2}>
        {showSummary && (
          <Typography variant="body2" color="text.secondary">
            Showing {startItem}-{endItem} of {totalItems} items
          </Typography>
        )}

        {showItemsPerPage && (
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Per page</InputLabel>
            <Select
              value={itemsPerPage}
              label="Per page"
              onChange={handleItemsPerPageChange}
            >
              {itemsPerPageOptions.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
      </Box>

      {/* Right side - Pagination */}
      {totalPages > 1 && (
        <MuiPagination
          count={totalPages}
          page={currentPage}
          onChange={handlePageChange}
          size={size}
          showFirstButton
          showLastButton
          color="primary"
        />
      )}
    </Box>
  );
};

export default Pagination;