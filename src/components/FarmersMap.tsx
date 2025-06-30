import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Users, Maximize2, Minimize2 } from 'lucide-react';
import { googleMapsLoader } from '../utils/googleMapsLoader';
import { apiCredentialsService } from '../services/apiCredentialsService';

interface Farmer {
  id: string;
  full_name: string | null;
  location_name: string | null;
  latitude: number | null;
  longitude: number | null;
  crop: string | null;
  phone_number: string;
}

interface FarmersMapProps {
  farmers: Farmer[];
}

const FarmersMap: React.FC<FarmersMapProps> = ({ farmers }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedFarmer, setSelectedFarmer] = useState<Farmer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mapInstance, setMapInstance] = useState<any>(null);

  // Filter farmers with valid coordinates
  const farmersWithCoords = farmers.filter(f => f.latitude && f.longitude);
  const farmersWithoutCoords = farmers.length - farmersWithCoords.length;

  console.log('FarmersMap render:', {
    totalFarmers: farmers.length,
    farmersWithCoords: farmersWithCoords.length,
    farmersWithoutCoords,
    mapLoaded,
    isLoading,
    mapError
  });

  useEffect(() => {
    loadGoogleMaps();
  }, []);

  // Re-add markers when farmers data changes
  useEffect(() => {
    if (mapInstance && farmersWithCoords.length > 0) {
      console.log('Farmers data changed, adding markers for', farmersWithCoords.length, 'farmers');
      addFarmersToMap(mapInstance);
    }
  }, [farmers, mapInstance]);

  const loadGoogleMaps = async () => {
    setIsLoading(true);
    try {
      const credentials = await apiCredentialsService.getCredentials();
      const apiKey = credentials?.maps?.googleMapsApiKey;
      
      if (!apiKey) {
        setMapError('Google Maps API key not configured');
        setIsLoading(false);
        return;
      }

      console.log('Loading Google Maps with API key...');
      await googleMapsLoader.load({
        apiKey,
        libraries: ['geometry']
      });

      console.log('Google Maps loaded successfully');
      initializeMap();
    } catch (error) {
      console.error('Failed to load Google Maps:', error);
      setMapError('Failed to load Google Maps');
      setIsLoading(false);
    }
  };

  const initializeMap = () => {
    if (!googleMapsLoader.isGoogleMapsLoaded()) {
      setMapError('Google Maps not available');
      setIsLoading(false);
      return;
    }

    if (!mapRef.current) {
      console.error('Map element not found');
      setMapError('Map container not found');
      setIsLoading(false);
      return;
    }

    try {
      console.log('Initializing map...');
      
      // Default center (Lusaka, Zambia - heart of Africa)
      let center = { lat: -15.4167, lng: 28.2833 };
      let zoom = 6;

      // If we have farmers with coordinates, center on them
      if (farmersWithCoords.length > 0) {
        console.log('Centering map on farmers...');
        const bounds = new window.google.maps.LatLngBounds();
        farmersWithCoords.forEach(farmer => {
          if (farmer.latitude && farmer.longitude) {
            bounds.extend({ lat: farmer.latitude, lng: farmer.longitude });
          }
        });

        // Calculate center from bounds
        const boundsCenter = bounds.getCenter();
        center = { lat: boundsCenter.lat(), lng: boundsCenter.lng() };
        
        // Adjust zoom based on bounds
        const ne = bounds.getNorthEast();
        const sw = bounds.getSouthWest();
        const distance = window.google.maps.geometry.spherical.computeDistanceBetween(ne, sw);
        zoom = distance > 1000000 ? 5 : distance > 500000 ? 6 : distance > 100000 ? 8 : 10;
      }

      console.log('Creating map with center:', center, 'zoom:', zoom);

      const map = new window.google.maps.Map(mapRef.current, {
        center,
        zoom,
        styles: [
          {
            featureType: 'all',
            elementType: 'geometry.fill',
            stylers: [{ color: '#f5f5f5' }]
          },
          {
            featureType: 'water',
            elementType: 'geometry',
            stylers: [{ color: '#e9e9e9' }, { lightness: 17 }]
          },
          {
            featureType: 'landscape',
            elementType: 'geometry',
            stylers: [{ color: '#f5f5f5' }, { lightness: 20 }]
          }
        ],
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false
      });

      console.log('Map created successfully');
      setMapInstance(map);
      setMapLoaded(true);
      setMapError(null);
      setIsLoading(false);

      // Add farmers to map
      if (farmersWithCoords.length > 0) {
        addFarmersToMap(map);
      }

      console.log('Map initialization complete');
    } catch (error) {
      console.error('Error initializing map:', error);
      setMapError('Failed to initialize map');
      setIsLoading(false);
    }
  };

  const addFarmersToMap = (map: any) => {
    console.log('Adding', farmersWithCoords.length, 'farmers to map...');

    farmersWithCoords.forEach((farmer, index) => {
      if (!farmer.latitude || !farmer.longitude) {
        console.warn(`Farmer ${farmer.full_name} has invalid coordinates`);
        return;
      }

      console.log(`Adding marker ${index + 1} for farmer:`, farmer.full_name, 'at', farmer.latitude, farmer.longitude);

      const marker = new window.google.maps.Marker({
        position: { lat: farmer.latitude, lng: farmer.longitude },
        map,
        title: farmer.full_name || 'Unknown Farmer',
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: getCropColor(farmer.crop),
          fillOpacity: 0.8,
          strokeColor: '#ffffff',
          strokeWeight: 2
        }
      });

      const infoWindow = new window.google.maps.InfoWindow({
        content: createInfoWindowContent(farmer)
      });

      marker.addListener('click', () => {
        setSelectedFarmer(farmer);
        infoWindow.open(map, marker);
      });

      console.log(`Marker ${index + 1} added successfully`);
    });

    // Fit bounds if we have multiple farmers
    if (farmersWithCoords.length > 1) {
      const bounds = new window.google.maps.LatLngBounds();
      farmersWithCoords.forEach(farmer => {
        if (farmer.latitude && farmer.longitude) {
          bounds.extend({ lat: farmer.latitude, lng: farmer.longitude });
        }
      });
      map.fitBounds(bounds);
      
      // Ensure minimum zoom level
      const listener = window.google.maps.event.addListener(map, 'idle', () => {
        if (map.getZoom() > 15) map.setZoom(15);
        window.google.maps.event.removeListener(listener);
      });
    }

    console.log('All farmers added to map successfully');
  };

  const getCropColor = (crop: string | null): string => {
    const colors: Record<string, string> = {
      'Maize': '#f59e0b',
      'Rice': '#10b981',
      'Wheat': '#f97316',
      'Sorghum': '#8b5cf6',
      'Millet': '#06b6d4',
      'Cassava': '#84cc16',
      'Sweet Potato': '#f43f5e',
      'Beans': '#22c55e',
      'Groundnuts': '#a855f7',
      'Cotton': '#ffffff',
      'Coffee': '#92400e',
      'Tea': '#059669',
      'Cocoa': '#7c2d12',
      'Banana': '#fbbf24',
      'Plantain': '#65a30d'
    };
    return colors[crop || ''] || '#6b7280';
  };

  const createInfoWindowContent = (farmer: Farmer): string => {
    return `
      <div style="padding: 8px; min-width: 200px;">
        <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600; color: #1f2937;">
          ${farmer.full_name || 'Unknown Farmer'}
        </h3>
        <div style="margin-bottom: 4px; color: #6b7280; font-size: 14px;">
          📍 ${farmer.location_name || 'Unknown Location'}
        </div>
        <div style="margin-bottom: 4px; color: #6b7280; font-size: 14px;">
          📱 ${farmer.phone_number}
        </div>
        ${farmer.crop ? `
          <div style="margin-bottom: 4px; color: #6b7280; font-size: 14px;">
            🌾 ${farmer.crop}
          </div>
        ` : ''}
        <div style="margin-top: 8px; font-size: 12px; color: #9ca3af;">
          Lat: ${farmer.latitude?.toFixed(4)}, Lng: ${farmer.longitude?.toFixed(4)}
        </div>
      </div>
    `;
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // Fallback map for when Google Maps is not available
  const renderFallbackMap = () => (
    <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-blue-50 rounded-lg overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <svg className="w-full h-full" viewBox="0 0 400 300" fill="none">
          <path d="M0 150 Q100 100 200 150 T400 150" stroke="#10b981" strokeWidth="2" opacity="0.3"/>
          <path d="M0 200 Q150 180 300 200 Q350 195 400 200" stroke="#3b82f6" strokeWidth="2" opacity="0.3"/>
          <path d="M50 50 Q200 30 350 80" stroke="#10b981" strokeWidth="1" opacity="0.2"/>
        </svg>
      </div>

      {/* Farmer location pins */}
      {farmersWithCoords.slice(0, 12).map((farmer, index) => (
        <div
          key={farmer.id}
          className="absolute transform -translate-x-1/2 -translate-y-1/2 group cursor-pointer"
          style={{
            left: `${20 + (index % 4) * 20 + Math.random() * 10}%`,
            top: `${20 + Math.floor(index / 4) * 20 + Math.random() * 10}%`,
          }}
          onClick={() => setSelectedFarmer(farmer)}
        >
          <div className="relative">
            <MapPin 
              className="w-6 h-6 drop-shadow-sm" 
              fill={getCropColor(farmer.crop)}
              color="#ffffff"
            />
            
            {/* Tooltip */}
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
              <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap">
                <div className="font-medium">{farmer.full_name}</div>
                <div className="text-gray-300">{farmer.location_name}</div>
                <div className="text-gray-300">{farmer.crop}</div>
              </div>
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className={`bg-white rounded-xl shadow-card border border-gray-100 ${
      isFullscreen ? 'fixed inset-4 z-50' : ''
    }`}>
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
              <MapPin className="w-5 h-5 text-primary-600" />
              <span>Farmer Locations ({farmers.length.toLocaleString()})</span>
            </h3>
            <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
              <span className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-success-500 rounded-full"></div>
                <span>With coordinates: {farmersWithCoords.length}</span>
              </span>
              {farmersWithoutCoords > 0 && (
                <span className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-warning-500 rounded-full"></div>
                  <span>Pending location: {farmersWithoutCoords}</span>
                </span>
              )}
              {isLoading && (
                <span className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  <span>Loading map...</span>
                </span>
              )}
            </div>
          </div>
          <button
            onClick={toggleFullscreen}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            title={isFullscreen ? 'Exit fullscreen' : 'View fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </button>
        </div>
      </div>

      <div className={`relative ${isFullscreen ? 'h-full' : 'h-80'}`}>
        {/* Google Maps container - always present */}
        <div ref={mapRef} className="w-full h-full rounded-b-xl"></div>

        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50 rounded-b-xl">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-500">Loading Google Maps...</p>
            </div>
          </div>
        )}

        {/* Error overlay */}
        {mapError && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50 rounded-b-xl">
            <div className="text-center">
              <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500 mb-2">{mapError}</p>
              <p className="text-sm text-gray-400">
                Configure Google Maps API key in Settings to enable interactive maps
              </p>
            </div>
          </div>
        )}

        {/* Fallback map overlay */}
        {!isLoading && !mapError && !mapLoaded && renderFallbackMap()}

        {/* Legend */}
        <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 text-xs shadow-lg">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4 text-primary-600" />
              <span className="font-medium text-gray-700">
                {farmers.length.toLocaleString()} Total Farmers
              </span>
            </div>
            {farmersWithCoords.length > 0 && (
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-success-600" fill="currentColor" />
                <span className="text-gray-600">
                  {farmersWithCoords.length} with GPS coordinates
                </span>
              </div>
            )}
            {farmersWithoutCoords > 0 && (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded border-2 border-warning-500 border-dashed"></div>
                <span className="text-gray-600">
                  {farmersWithoutCoords} pending location data
                </span>
              </div>
            )}
            <div className="text-xs text-gray-500 pt-1 border-t border-gray-200">
              📍 Centered on Lusaka, Zambia (Heart of Africa)
            </div>
          </div>
        </div>

        {/* Crop Legend */}
        {farmersWithCoords.length > 0 && (
          <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 text-xs shadow-lg max-w-48">
            <h4 className="font-medium text-gray-700 mb-2">Crop Types</h4>
            <div className="grid grid-cols-2 gap-1">
              {[...new Set(farmersWithCoords.map(f => f.crop).filter(Boolean))].slice(0, 8).map(crop => (
                <div key={crop} className="flex items-center space-x-1">
                  <div 
                    className="w-3 h-3 rounded-full border border-white"
                    style={{ backgroundColor: getCropColor(crop) }}
                  ></div>
                  <span className="text-gray-600 truncate">{crop}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Selected Farmer Info */}
      {selectedFarmer && !mapLoaded && (
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Users className="w-4 h-4 text-primary-600" />
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-gray-900">{selectedFarmer.full_name}</h4>
              <p className="text-sm text-gray-600">{selectedFarmer.location_name}</p>
              <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                <span>📱 {selectedFarmer.phone_number}</span>
                {selectedFarmer.crop && <span>🌾 {selectedFarmer.crop}</span>}
              </div>
            </div>
            <button
              onClick={() => setSelectedFarmer(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FarmersMap;