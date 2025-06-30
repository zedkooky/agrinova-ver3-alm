import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Search, Loader, CheckCircle } from 'lucide-react';
import { googleMapsLoader } from '../utils/googleMapsLoader';
import { apiCredentialsService } from '../services/apiCredentialsService';

interface LocationPickerProps {
  onLocationSelect: (location: {
    name: string;
    latitude: number;
    longitude: number;
    address: string;
  }) => void;
  initialValue?: string;
  placeholder?: string;
}

const LocationPicker: React.FC<LocationPickerProps> = ({
  onLocationSelect,
  initialValue = '',
  placeholder = 'Search for a location...'
}) => {
  const [searchValue, setSearchValue] = useState(initialValue);
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<any>(null);
  const [googleMapsLoaded, setGoogleMapsLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  
  const autocompleteService = useRef<any>(null);
  const placesService = useRef<any>(null);
  const searchTimeout = useRef<NodeJS.Timeout>();

  useEffect(() => {
    loadGoogleMapsAPI();
  }, []);

  const loadGoogleMapsAPI = async () => {
    try {
      const credentials = await apiCredentialsService.getCredentials();
      const apiKey = credentials?.maps?.googleMapsApiKey;
      
      if (!apiKey) {
        setLoadError('Google Maps API key not configured');
        return;
      }

      await googleMapsLoader.load({
        apiKey,
        libraries: ['places', 'geometry']
      });

      initializeServices();
    } catch (error) {
      console.error('Error loading Google Maps API:', error);
      setLoadError('Failed to load Google Maps API');
    }
  };

  const initializeServices = () => {
    if (window.google && window.google.maps && window.google.maps.places) {
      autocompleteService.current = new window.google.maps.places.AutocompleteService();
      
      // Create a dummy map for PlacesService (required by Google Maps API)
      const dummyMap = new window.google.maps.Map(document.createElement('div'));
      placesService.current = new window.google.maps.places.PlacesService(dummyMap);
      
      setGoogleMapsLoaded(true);
      setLoadError(null);
    } else {
      setLoadError('Google Maps Places API not available');
    }
  };

  const searchPlaces = (query: string) => {
    if (!autocompleteService.current || !query.trim()) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    
    const request = {
      input: query,
      types: ['geocode', 'establishment'],
      componentRestrictions: { country: [] }, // Allow all countries
    };

    autocompleteService.current.getPlacePredictions(request, (predictions: any[], status: any) => {
      setIsLoading(false);
      
      if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
        setSuggestions(predictions.slice(0, 5)); // Limit to 5 suggestions
        setShowSuggestions(true);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    });
  };

  const handleInputChange = (value: string) => {
    setSearchValue(value);
    setSelectedLocation(null);
    
    // Clear previous timeout
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }
    
    // Debounce search
    searchTimeout.current = setTimeout(() => {
      searchPlaces(value);
    }, 300);
  };

  const selectPlace = (place: any) => {
    if (!placesService.current) return;

    setIsLoading(true);
    setShowSuggestions(false);
    setSearchValue(place.description);

    const request = {
      placeId: place.place_id,
      fields: ['name', 'geometry', 'formatted_address', 'address_components']
    };

    placesService.current.getDetails(request, (placeDetails: any, status: any) => {
      setIsLoading(false);
      
      if (status === window.google.maps.places.PlacesServiceStatus.OK && placeDetails) {
        const location = {
          name: placeDetails.name || place.structured_formatting?.main_text || '',
          latitude: placeDetails.geometry.location.lat(),
          longitude: placeDetails.geometry.location.lng(),
          address: placeDetails.formatted_address || place.description
        };
        
        setSelectedLocation(location);
        onLocationSelect(location);
      } else {
        console.error('Failed to get place details');
      }
    });
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by this browser');
      return;
    }

    setIsLoading(true);
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        
        // Reverse geocode to get address
        if (googleMapsLoaded && window.google && window.google.maps) {
          const geocoder = new window.google.maps.Geocoder();
          const latlng = { lat: latitude, lng: longitude };
          
          geocoder.geocode({ location: latlng }, (results: any[], status: any) => {
            setIsLoading(false);
            
            if (status === 'OK' && results[0]) {
              const location = {
                name: 'Current Location',
                latitude,
                longitude,
                address: results[0].formatted_address
              };
              
              setSearchValue(location.address);
              setSelectedLocation(location);
              onLocationSelect(location);
            } else {
              // Fallback without address
              const location = {
                name: 'Current Location',
                latitude,
                longitude,
                address: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
              };
              
              setSearchValue(location.address);
              setSelectedLocation(location);
              onLocationSelect(location);
            }
          });
        } else {
          setIsLoading(false);
          const location = {
            name: 'Current Location',
            latitude,
            longitude,
            address: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
          };
          
          setSearchValue(location.address);
          setSelectedLocation(location);
          onLocationSelect(location);
        }
      },
      (error) => {
        setIsLoading(false);
        console.error('Error getting current location:', error);
        alert('Failed to get current location. Please search manually.');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  };

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Location *
      </label>
      
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            value={searchValue}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder={placeholder}
            className={`w-full pl-10 pr-12 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
              selectedLocation ? 'border-success-300 bg-success-50' : 'border-gray-300'
            }`}
            disabled={isLoading}
          />
          
          {isLoading && (
            <Loader className="absolute right-8 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 animate-spin" />
          )}
          
          {selectedLocation && (
            <CheckCircle className="absolute right-8 top-1/2 transform -translate-y-1/2 text-success-500 w-4 h-4" />
          )}
          
          <button
            type="button"
            onClick={getCurrentLocation}
            disabled={isLoading}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-primary-600 disabled:opacity-50"
            title="Use current location"
          >
            <MapPin className="w-4 h-4" />
          </button>
        </div>

        {/* Suggestions Dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {suggestions.map((suggestion, index) => (
              <button
                key={suggestion.place_id}
                type="button"
                onClick={() => selectPlace(suggestion)}
                className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 focus:bg-gray-50 focus:outline-none"
              >
                <div className="flex items-start space-x-3">
                  <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 truncate">
                      {suggestion.structured_formatting?.main_text || suggestion.description}
                    </div>
                    {suggestion.structured_formatting?.secondary_text && (
                      <div className="text-sm text-gray-500 truncate">
                        {suggestion.structured_formatting.secondary_text}
                      </div>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Selected Location Info */}
      {selectedLocation && (
        <div className="mt-2 p-3 bg-success-50 border border-success-200 rounded-lg">
          <div className="flex items-start space-x-2">
            <CheckCircle className="w-4 h-4 text-success-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-success-900">
                Location Selected
              </div>
              <div className="text-sm text-success-700 truncate">
                {selectedLocation.address}
              </div>
              <div className="text-xs text-success-600 mt-1">
                Lat: {selectedLocation.latitude.toFixed(6)}, Lng: {selectedLocation.longitude.toFixed(6)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error or Fallback Info */}
      {loadError && (
        <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start space-x-2">
            <MapPin className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-yellow-800">
              <div className="font-medium">Manual Coordinates</div>
              <div>{loadError}. You can manually enter coordinates below.</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LocationPicker;