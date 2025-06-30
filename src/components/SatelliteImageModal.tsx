import React, { useState, useEffect } from 'react';
import { 
  X, 
  Download, 
  Maximize2, 
  Minimize2, 
  Layers, 
  Eye, 
  EyeOff,
  Info,
  Calendar,
  MapPin,
  Satellite,
  Activity,
  Cloud,
  Thermometer
} from 'lucide-react';
import { apiCredentialsService } from '../services/apiCredentialsService';

interface SatelliteImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  insight: any;
  farmer: any;
}

interface ImageLayer {
  id: string;
  name: string;
  description: string;
  url?: string;
  visible: boolean;
  loading: boolean;
  error?: string;
}

const SatelliteImageModal: React.FC<SatelliteImageModalProps> = ({
  isOpen,
  onClose,
  insight,
  farmer
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedLayer, setSelectedLayer] = useState('rgb');
  const [layers, setLayers] = useState<ImageLayer[]>([
    {
      id: 'rgb',
      name: 'True Color (RGB)',
      description: 'Natural color satellite image',
      visible: true,
      loading: false
    },
    {
      id: 'ndvi',
      name: 'NDVI (Vegetation)',
      description: 'Normalized Difference Vegetation Index',
      visible: false,
      loading: false
    },
    {
      id: 'moisture',
      name: 'Soil Moisture',
      description: 'Soil water content analysis',
      visible: false,
      loading: false
    },
    {
      id: 'infrared',
      name: 'False Color (NIR)',
      description: 'Near-infrared composite',
      visible: false,
      loading: false
    }
  ]);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && insight) {
      loadSatelliteImages();
    }
  }, [isOpen, insight]);

  const loadSatelliteImages = async () => {
    if (!insight || !farmer) return;

    setImageLoading(true);
    setImageError(null);

    try {
      console.log('🖼️ Loading satellite images for insight:', insight.id);

      // Get API credentials including Google Maps API key
      const credentials = await apiCredentialsService.getCredentials();

      // Call our edge function to fetch satellite images
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sentinel-hub-integration`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify({
            action: 'fetch-images',
            farmerId: insight.farmer_id,
            latitude: farmer.latitude || insight.sentinel_data?.coordinates?.latitude || -1.2921,
            longitude: farmer.longitude || insight.sentinel_data?.coordinates?.longitude || 36.8219,
            imageDate: insight.image_date,
            layers: ['rgb', 'ndvi', 'moisture', 'infrared'],
            credentials: {
              sentinelHub: {
                clientId: credentials?.sentinelHub?.clientId,
                clientSecret: credentials?.sentinelHub?.clientSecret
              },
              maps: {
                googleMapsApiKey: credentials?.maps?.googleMapsApiKey
              }
            }
          })
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const imageData = await response.json();
      
      if (imageData.success && imageData.images) {
        // Update layers with fetched image URLs
        setLayers(prevLayers => 
          prevLayers.map(layer => ({
            ...layer,
            url: imageData.images[layer.id]?.url,
            loading: false,
            error: imageData.images[layer.id]?.error
          }))
        );
        console.log('✅ Satellite images loaded successfully from:', imageData.source);
      } else {
        throw new Error(imageData.error || 'Failed to fetch satellite images');
      }
    } catch (error) {
      console.error('❌ Error loading satellite images:', error);
      setImageError(error instanceof Error ? error.message : 'Failed to load images');
      
      // Set all layers to error state
      setLayers(prevLayers => 
        prevLayers.map(layer => ({
          ...layer,
          url: undefined,
          loading: false,
          error: 'Unable to load satellite imagery'
        }))
      );
    } finally {
      setImageLoading(false);
    }
  };

  const toggleLayerVisibility = (layerId: string) => {
    setLayers(prevLayers =>
      prevLayers.map(layer =>
        layer.id === layerId
          ? { ...layer, visible: !layer.visible }
          : layer
      )
    );
  };

  const downloadImage = async (layer: ImageLayer) => {
    if (!layer.url) return;

    try {
      const response = await fetch(layer.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `${farmer.full_name}_${layer.id}_${insight.image_date}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading image:', error);
      alert('Failed to download image');
    }
  };

  const getLayerColor = (layerId: string) => {
    const colors = {
      rgb: 'text-blue-600',
      ndvi: 'text-green-600',
      moisture: 'text-cyan-600',
      infrared: 'text-red-600'
    };
    return colors[layerId as keyof typeof colors] || 'text-gray-600';
  };

  const getLayerIcon = (layerId: string) => {
    switch (layerId) {
      case 'rgb': return <Eye className="w-4 h-4" />;
      case 'ndvi': return <Activity className="w-4 h-4" />;
      case 'moisture': return <Cloud className="w-4 h-4" />;
      case 'infrared': return <Thermometer className="w-4 h-4" />;
      default: return <Layers className="w-4 h-4" />;
    }
  };

  if (!isOpen) return null;

  const currentLayer = layers.find(l => l.id === selectedLayer);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className={`bg-white rounded-xl shadow-2xl ${
        isFullscreen ? 'w-full h-full' : 'w-full max-w-6xl h-5/6'
      } flex flex-col`}>
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
              <Satellite className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Satellite Imagery</h2>
              <p className="text-sm text-gray-500">
                {farmer.full_name} • {farmer.location_name} • {new Date(insight.image_date).toLocaleDateString()}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            >
              {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="w-80 border-r border-gray-200 flex flex-col">
            {/* Layer Controls */}
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                <Layers className="w-5 h-5" />
                <span>Image Layers</span>
              </h3>
              
              <div className="space-y-2">
                {layers.map((layer) => (
                  <div
                    key={layer.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      selectedLayer === layer.id
                        ? 'border-primary-300 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedLayer(layer.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={getLayerColor(layer.id)}>
                          {getLayerIcon(layer.id)}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{layer.name}</h4>
                          <p className="text-xs text-gray-500">{layer.description}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleLayerVisibility(layer.id);
                          }}
                          className={`p-1 rounded ${
                            layer.visible ? 'text-primary-600' : 'text-gray-400'
                          }`}
                          title={layer.visible ? 'Hide layer' : 'Show layer'}
                        >
                          {layer.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        </button>
                        
                        {layer.url && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              downloadImage(layer);
                            }}
                            className="p-1 text-gray-400 hover:text-gray-600"
                            title="Download image"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                    
                    {layer.loading && (
                      <div className="mt-2 flex items-center space-x-2 text-xs text-gray-500">
                        <div className="w-3 h-3 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
                        <span>Loading...</span>
                      </div>
                    )}
                    
                    {layer.error && (
                      <div className="mt-2 text-xs text-red-600">
                        Error: {layer.error}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Insight Data */}
            <div className="p-4 flex-1 overflow-y-auto">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                <Info className="w-5 h-5" />
                <span>Analysis Data</span>
              </h3>
              
              <div className="space-y-4">
                {/* NDVI Score */}
                <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                  <h4 className="font-medium text-green-900 mb-1">NDVI Score</h4>
                  <div className="text-2xl font-bold text-green-600">
                    {insight.ndvi_score?.toFixed(3)}
                  </div>
                  <p className="text-sm text-green-700">
                    {insight.ndvi_score > 0.6 ? 'Healthy vegetation' : 
                     insight.ndvi_score > 0.4 ? 'Moderate vegetation' : 'Poor vegetation'}
                  </p>
                </div>

                {/* Soil Moisture */}
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="font-medium text-blue-900 mb-1">Soil Moisture</h4>
                  <div className="text-2xl font-bold text-blue-600">
                    {insight.soil_moisture?.toFixed(1)}%
                  </div>
                  <p className="text-sm text-blue-700">
                    {insight.soil_moisture > 60 ? 'Optimal moisture' :
                     insight.soil_moisture > 40 ? 'Adequate moisture' : 'Low moisture'}
                  </p>
                </div>

                {/* Location Info */}
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <h4 className="font-medium text-gray-900 mb-2 flex items-center space-x-1">
                    <MapPin className="w-4 h-4" />
                    <span>Location</span>
                  </h4>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p>Lat: {farmer.latitude?.toFixed(4) || 'N/A'}</p>
                    <p>Lng: {farmer.longitude?.toFixed(4) || 'N/A'}</p>
                    <p>Crop: {farmer.crop || 'Unknown'}</p>
                    {insight.sentinel_data?.climateZone && (
                      <p>Climate: {insight.sentinel_data.climateZone}</p>
                    )}
                  </div>
                </div>

                {/* Acquisition Info */}
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <h4 className="font-medium text-gray-900 mb-2 flex items-center space-x-1">
                    <Calendar className="w-4 h-4" />
                    <span>Acquisition</span>
                  </h4>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p>Date: {new Date(insight.image_date).toLocaleDateString()}</p>
                    <p>Source: {insight.sentinel_data?.dataSource || 'Google Maps'}</p>
                    {insight.sentinel_data?.cloudCoverage !== undefined && (
                      <p>Clouds: {insight.sentinel_data.cloudCoverage}%</p>
                    )}
                    {insight.sentinel_data?.resolution && (
                      <p>Resolution: {insight.sentinel_data.resolution}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Image Display */}
          <div className="flex-1 flex flex-col">
            {imageLoading ? (
              <div className="flex-1 flex items-center justify-center bg-gray-50">
                <div className="text-center">
                  <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading satellite imagery...</p>
                </div>
              </div>
            ) : imageError ? (
              <div className="flex-1 flex items-center justify-center bg-gray-50">
                <div className="text-center">
                  <Satellite className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Image Loading Error</h3>
                  <p className="text-gray-500 mb-4">{imageError}</p>
                  <button
                    onClick={loadSatelliteImages}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                  >
                    Retry Loading
                  </button>
                </div>
              </div>
            ) : currentLayer?.url ? (
              <div className="flex-1 relative bg-gray-900">
                <img
                  src={currentLayer.url}
                  alt={currentLayer.name}
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    console.error('Image failed to load:', currentLayer.url);
                    setImageError('Failed to load satellite image');
                  }}
                />
                
                {/* Image Overlay Info */}
                <div className="absolute top-4 left-4 bg-black bg-opacity-75 text-white px-3 py-2 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <div className={`text-white`}>
                      {getLayerIcon(currentLayer.id)}
                    </div>
                    <span className="font-medium">{currentLayer.name}</span>
                  </div>
                  <p className="text-xs text-gray-300 mt-1">{currentLayer.description}</p>
                </div>

                {/* Scale/Legend */}
                <div className="absolute bottom-4 right-4 bg-black bg-opacity-75 text-white px-3 py-2 rounded-lg">
                  <div className="text-xs">
                    <p>Scale: 1:{Math.round(Math.random() * 5000 + 5000)}</p>
                    <p>Source: Google Maps</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center bg-gray-50">
                <div className="text-center">
                  <Satellite className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Image Available</h3>
                  <p className="text-gray-500">Satellite image not available for this layer</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SatelliteImageModal;