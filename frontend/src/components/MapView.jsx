import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import { Box, Typography, Chip, Card, CardContent } from '@mui/material';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in React Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom icons for different species
const createCustomIcon = (color = '#2e7d32') => {
  return L.divIcon({
    html: `<div style="background-color: ${color}; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
    className: 'custom-div-icon',
    iconSize: [20, 20],
    iconAnchor: [10, 10]
  });
};

const speciesColors = {
  'Panthera leo': '#ff6b35',
  'Loxodonta africana': '#7b68ee',
  'Acinonyx jubatus': '#ffd700',
  'Giraffa camelopardalis': '#ff69b4',
  'default': '#2e7d32'
};

const MapController = ({ center, zoom, observations, onLocationSelect }) => {
  const map = useMap();

  useEffect(() => {
    if (center) {
      map.setView(center, zoom || 10);
    }
  }, [map, center, zoom]);

  useEffect(() => {
    if (onLocationSelect) {
      const handleClick = (e) => {
        onLocationSelect({
          latitude: e.latlng.lat,
          longitude: e.latlng.lng
        });
      };

      map.on('click', handleClick);
      return () => {
        map.off('click', handleClick);
      };
    }
  }, [map, onLocationSelect]);

  return null;
};

const MapView = ({ 
  observations = [], 
  center = [0, 0], 
  zoom = 2, 
  height = '500px',
  onLocationSelect,
  selectedObservation,
  showAccuracyCircles = false
}) => {
  const [mapCenter, setMapCenter] = useState(center);
  const [mapZoom, setMapZoom] = useState(zoom);

  useEffect(() => {
    if (observations.length > 0) {
      // Calculate bounds to fit all observations
      const lats = observations.map(obs => obs.latitude);
      const lngs = observations.map(obs => obs.longitude);
      
      const minLat = Math.min(...lats);
      const maxLat = Math.max(...lats);
      const minLng = Math.min(...lngs);
      const maxLng = Math.max(...lngs);
      
      const centerLat = (minLat + maxLat) / 2;
      const centerLng = (minLng + maxLng) / 2;
      
      setMapCenter([centerLat, centerLng]);
      
      // Calculate appropriate zoom level
      const latDiff = maxLat - minLat;
      const lngDiff = maxLng - minLng;
      const maxDiff = Math.max(latDiff, lngDiff);
      
      let calculatedZoom = 10;
      if (maxDiff > 10) calculatedZoom = 3;
      else if (maxDiff > 5) calculatedZoom = 5;
      else if (maxDiff > 1) calculatedZoom = 7;
      else if (maxDiff > 0.1) calculatedZoom = 10;
      else calculatedZoom = 12;
      
      setMapZoom(calculatedZoom);
    }
  }, [observations]);

  const getSpeciesIcon = (speciesName) => {
    const color = speciesColors[speciesName] || speciesColors.default;
    return createCustomIcon(color);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <Box sx={{ height, width: '100%', position: 'relative' }}>
      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapController 
          center={mapCenter} 
          zoom={mapZoom} 
          observations={observations}
          onLocationSelect={onLocationSelect}
        />

        {observations.map((observation) => (
          <React.Fragment key={observation.id}>
            <Marker
              position={[observation.latitude, observation.longitude]}
              icon={getSpeciesIcon(observation.species?.scientific_name)}
            >
              <Popup>
                <Card sx={{ minWidth: 200, maxWidth: 300 }}>
                  <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                    <Typography variant="h6" component="div" gutterBottom>
                      {observation.species?.common_name || 'Unknown Species'}
                    </Typography>
                    
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      <em>{observation.species?.scientific_name}</em>
                    </Typography>
                    
                    <Box sx={{ mb: 1 }}>
                      <Chip 
                        label={`${observation.count} individuals`}
                        size="small"
                        color="primary"
                        sx={{ mr: 1, mb: 0.5 }}
                      />
                      {observation.species?.conservation_status && (
                        <Chip 
                          label={observation.species.conservation_status}
                          size="small"
                          color="warning"
                          sx={{ mb: 0.5 }}
                        />
                      )}
                    </Box>
                    
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Date:</strong> {formatDate(observation.observation_date)}
                    </Typography>
                    
                    {observation.location_name && (
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        <strong>Location:</strong> {observation.location_name}
                      </Typography>
                    )}
                    
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Observer:</strong> {observation.observer?.first_name} {observation.observer?.last_name}
                    </Typography>
                    
                    {observation.behavior && (
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        <strong>Behavior:</strong> {observation.behavior}
                      </Typography>
                    )}
                    
                    {observation.notes && (
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        <strong>Notes:</strong> {observation.notes}
                      </Typography>
                    )}
                    
                    <Typography variant="caption" color="text.secondary">
                      Coordinates: {observation.latitude.toFixed(4)}, {observation.longitude.toFixed(4)}
                      {observation.accuracy && ` (±${observation.accuracy}m)`}
                    </Typography>
                  </CardContent>
                </Card>
              </Popup>
            </Marker>
            
            {showAccuracyCircles && observation.accuracy && (
              <Circle
                center={[observation.latitude, observation.longitude]}
                radius={observation.accuracy}
                pathOptions={{
                  fillColor: speciesColors[observation.species?.scientific_name] || speciesColors.default,
                  fillOpacity: 0.1,
                  color: speciesColors[observation.species?.scientific_name] || speciesColors.default,
                  weight: 1
                }}
              />
            )}
          </React.Fragment>
        ))}
      </MapContainer>
      
      {onLocationSelect && (
        <Box
          sx={{
            position: 'absolute',
            top: 10,
            left: 10,
            backgroundColor: 'white',
            padding: 1,
            borderRadius: 1,
            boxShadow: 1,
            zIndex: 1000
          }}
        >
          <Typography variant="caption">
            Click on the map to select a location
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default MapView;