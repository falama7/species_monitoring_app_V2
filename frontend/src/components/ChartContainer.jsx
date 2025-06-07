import React, { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { Box, Grid, Typography, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { format, parseISO, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const ChartContainer = ({ observations = [] }) => {
  const [chartType, setChartType] = React.useState('timeline');

  // Process data for timeline chart
  const timelineData = useMemo(() => {
    if (!observations.length) return { labels: [], datasets: [] };

    // Group observations by date
    const dateGroups = observations.reduce((acc, obs) => {
      const date = format(parseISO(obs.observation_date), 'yyyy-MM-dd');
      acc[date] = (acc[date] || 0) + obs.count;
      return acc;
    }, {});

    // Get last 7 days
    const dates = Object.keys(dateGroups).sort().slice(-7);
    const counts = dates.map(date => dateGroups[date] || 0);

    return {
      labels: dates.map(date => format(parseISO(date), 'MMM dd')),
      datasets: [
        {
          label: 'Observations',
          data: counts,
          borderColor: 'rgb(46, 125, 50)',
          backgroundColor: 'rgba(46, 125, 50, 0.1)',
          tension: 0.1,
        },
      ],
    };
  }, [observations]);

  // Process data for species chart
  const speciesData = useMemo(() => {
    if (!observations.length) return { labels: [], datasets: [] };

    const speciesGroups = observations.reduce((acc, obs) => {
      const species = obs.species?.common_name || 'Unknown';
      acc[species] = (acc[species] || 0) + obs.count;
      return acc;
    }, {});

    const sortedSpecies = Object.entries(speciesGroups)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10);

    const colors = [
      '#2e7d32', '#1976d2', '#ed6c02', '#9c27b0', '#d32f2f',
      '#00796b', '#5e35b1', '#c2185b', '#f57c00', '#388e3c'
    ];

    return {
      labels: sortedSpecies.map(([species]) => species),
      datasets: [
        {
          data: sortedSpecies.map(([, count]) => count),
          backgroundColor: colors.slice(0, sortedSpecies.length),
          borderWidth: 2,
          borderColor: '#fff',
        },
      ],
    };
  }, [observations]);

  // Process data for observers chart
  const observersData = useMemo(() => {
    if (!observations.length) return { labels: [], datasets: [] };

    const observerGroups = observations.reduce((acc, obs) => {
      const observer = `${obs.observer?.first_name || ''} ${obs.observer?.last_name || ''}`.trim() || 'Unknown';
      acc[observer] = (acc[observer] || 0) + 1;
      return acc;
    }, {});

    const sortedObservers = Object.entries(observerGroups)
      .sort(([,a], [,b]) => b - a);

    return {
      labels: sortedObservers.map(([observer]) => observer),
      datasets: [
        {
          label: 'Observations',
          data: sortedObservers.map(([, count]) => count),
          backgroundColor: 'rgba(25, 118, 210, 0.8)',
          borderColor: 'rgb(25, 118, 210)',
          borderWidth: 1,
        },
      ],
    };
  }, [observations]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
    },
    scales: chartType !== 'species' ? {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
        },
      },
    } : undefined,
  };

  const renderChart = () => {
    switch (chartType) {
      case 'timeline':
        return ;
      case 'species':
        return ;
      case 'observers':
        return ;
      default:
        return ;
    }
  };

  if (!observations.length) {
    return (
      
        
          No data available for charts
        
      
    );
  }

  return (
    
      
        
          Chart Type
          <Select
            value={chartType}
            label="Chart Type"
            onChange={(e) => setChartType(e.target.value)}
          >
            Timeline
            Species Distribution
            Observers Activity
          
        
      
      
      
        {renderChart()}
      
    
  );
};

export default ChartContainer;