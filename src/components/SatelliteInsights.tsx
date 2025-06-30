import React, { useState, useEffect } from 'react';
import { 
  Satellite, 
  TrendingUp, 
  Droplets, 
  Leaf, 
  Calendar, 
  MapPin, 
  RefreshCw, 
  Settings,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  Activity,
  Cloud,
  Thermometer,
  Image as ImageIcon,
  Eye
} from 'lucide-react';
import { sentinelHubService } from '../services/sentinelHub';
import { supabase } from '../lib/supabase';
import SatelliteImageModal from './SatelliteImageModal';

interface SatelliteInsightsProps {
  farmers: any[];
}

const SatelliteInsights: React.FC<SatelliteInsightsProps> = ({ farmers }) => {
  const [insights, setInsights] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedFarmer, setSelectedFarmer] = useState<string>('');
  const [apiStatus, setApiStatus] = useState<any>(null);
  const [showApiStatus, setShowApiStatus] = useState(false);
  const [selectedInsight, setSelectedInsight] = useState<any>(null);
  const [showImageModal, setShowImageModal] = useState(false);

  useEffect(() => {
    loadInsights();
    loadApiStatus();
  }, []);

  const loadInsights = async () => {
    try {
      const { data, error } = await supabase
        .from('satellite_insights')
        .select(`
          *,
          farmers (
            full_name,
            location_name,
            crop,
            latitude,
            longitude
          )
        `)
        .order('created_at', { ascending: false })
        .limit(12);

      if (error) throw error;
      setInsights(data || []);
    } catch (error) {
      console.error('Error loading insights:', error);
    }
  };

  const loadApiStatus = async () => {
    try {
      const status = await sentinelHubService.getApiStatus();
      setApiStatus(status);
    } catch (error) {
      console.error('Error loading API status:', error);
    }
  };

  const generateInsight = async () => {
    if (!selectedFarmer) return;

    setLoading(true);
    try {
      const farmer = farmers.find(f => f.id === selectedFarmer);
      if (!farmer) return;

      console.log('🚀 Generating satellite insight for farmer:', farmer.full_name);

      // Use farmer's actual coordinates or default to Nairobi, Kenya
      const latitude = farmer.latitude || -1.2921;
      const longitude = farmer.longitude || 36.8219;
      
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      console.log('📡 Calling Sentinel Hub service...');
      const insight = await sentinelHubService.getSatelliteInsights(
        farmer.id,
        latitude,
        longitude,
        startDate,
        endDate
      );

      console.log('💾 Saving insight to database...');
      // Save to database
      const { error } = await supabase
        .from('satellite_insights')
        .insert({
          farmer_id: farmer.id,
          image_date: insight.imageDate,
          ndvi_score: insight.ndviScore,
          soil_moisture: insight.soilMoisture,
          vegetation_index: insight.vegetationIndex,
          recommendation: insight.recommendation,
          image_url: insight.imageUrl,
          sentinel_data: insight.sentinelData
        });

      if (error) throw error;

      await loadInsights();
      setSelectedFarmer('');
      
      // Show detailed success message
      const isRealData = insight.sentinelData?.apiResponse;
      const dataSource = isRealData ? 'Sentinel Hub API' : 'Consistent Mock Data';
      
      alert(`✅ Satellite insight generated successfully for ${farmer.full_name}!

📊 Data Source: ${dataSource}
🌱 NDVI Score: ${insight.ndviScore.toFixed(3)} (${getNDVIStatus(insight.ndviScore)})
💧 Soil Moisture: ${insight.soilMoisture.toFixed(1)}% (${getMoistureStatus(insight.soilMoisture)})
📈 Vegetation Index: ${insight.vegetationIndex.toFixed(1)}
🌍 Climate Zone: ${insight.sentinelData?.climateZone || 'Unknown'}
🗓️ Season: ${insight.sentinelData?.season || 'Unknown'}

${isRealData ? '🛰️ Real satellite data from Sentinel-2' : '📊 Consistent mock data based on location and season'}`);
      
    } catch (error) {
      console.error('❌ Error generating insight:', error);
      alert('Failed to generate satellite insight. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const refreshInsights = async () => {
    setLoading(true);
    await Promise.all([loadInsights(), loadApiStatus()]);
    setLoading(false);
  };

  const getNDVIColor = (ndvi: number) => {
    if (ndvi > 0.6) return 'text-success-600 bg-success-100';
    if (ndvi > 0.4) return 'text-warning-600 bg-warning-100';
    return 'text-error-600 bg-error-100';
  };

  const getNDVIStatus = (ndvi: number) => {
    if (ndvi > 0.7) return 'Excellent';
    if (ndvi > 0.6) return 'Very Good';
    if (ndvi > 0.4) return 'Moderate';
    if (ndvi > 0.3) return 'Poor';
    return 'Critical';
  };

  const getMoistureColor = (moisture: number) => {
    if (moisture > 60) return 'text-blue-600';
    if (moisture > 40) return 'text-blue-500';
    if (moisture > 20) return 'text-orange-500';
    return 'text-red-500';
  };

  const getMoistureStatus = (moisture: number) => {
    if (moisture > 70) return 'Optimal';
    if (moisture > 50) return 'Good';
    if (moisture > 30) return 'Low';
    return 'Critical';
  };

  const getApiStatusIcon = () => {
    if (!apiStatus) return <Activity className="w-4 h-4 text-gray-400" />;
    if (!apiStatus.configured) return <Settings className="w-4 h-4 text-warning-500" />;
    if (apiStatus.connected) return <CheckCircle className="w-4 h-4 text-success-500" />;
    return <XCircle className="w-4 h-4 text-error-500" />;
  };

  const getApiStatusText = () => {
    if (!apiStatus) return 'Checking...';
    if (!apiStatus.configured) return 'Not Configured';
    if (apiStatus.connected) return 'Connected';
    return 'Disconnected';
  };

  const totalValue = insights.reduce((sum, insight) => sum + (insight.ndvi_score || 0), 0);
  const totalCredits = insights.reduce((sum, insight) => sum + (insight.soil_moisture || 0), 0);
  const healthyInsights = insights.filter(i => (i.ndvi_score || 0) > 0.6).length;

  const openImageModal = (insight: any) => {
    setSelectedInsight(insight);
    setShowImageModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Satellite Insights</h1>
          <p className="text-gray-600 mt-1">Real-time crop monitoring via Sentinel-2 satellite data with image visualization</p>
        </div>
        <div className="mt-4 sm:mt-0 flex items-center space-x-4">
          {/* API Status Indicator */}
          <button
            onClick={() => setShowApiStatus(!showApiStatus)}
            className="flex items-center space-x-2 px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            title="API Status"
          >
            {getApiStatusIcon()}
            <span className="text-sm font-medium text-gray-700">{getApiStatusText()}</span>
          </button>

          <button
            onClick={refreshInsights}
            disabled={loading}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 flex items-center space-x-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <select
            value={selectedFarmer}
            onChange={(e) => setSelectedFarmer(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="">Select Farmer</option>
            {farmers.map(farmer => (
              <option key={farmer.id} value={farmer.id}>
                {farmer.full_name} - {farmer.location_name}
              </option>
            ))}
          </select>
          <button
            onClick={generateInsight}
            disabled={!selectedFarmer || loading}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            <Satellite className="w-4 h-4" />
            <span>{loading ? 'Generating...' : 'Generate Insight'}</span>
          </button>
        </div>
      </div>

      {/* API Status Panel */}
      {showApiStatus && apiStatus && (
        <div className="bg-white rounded-xl shadow-card p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
              <Activity className="w-5 h-5 text-primary-600" />
              <span>Sentinel Hub API Status</span>
            </h3>
            <button
              onClick={() => setShowApiStatus(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                {apiStatus.configured ? (
                  <CheckCircle className="w-6 h-6 text-success-600" />
                ) : (
                  <Settings className="w-6 h-6 text-warning-600" />
                )}
              </div>
              <h4 className="font-medium text-gray-900">Configuration</h4>
              <p className="text-sm text-gray-600">
                {apiStatus.configured ? 'Credentials Set' : 'Not Configured'}
              </p>
            </div>

            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                {apiStatus.connected ? (
                  <CheckCircle className="w-6 h-6 text-success-600" />
                ) : (
                  <XCircle className="w-6 h-6 text-error-600" />
                )}
              </div>
              <h4 className="font-medium text-gray-900">Connection</h4>
              <p className="text-sm text-gray-600">
                {apiStatus.connected ? 'API Accessible' : 'Cannot Connect'}
              </p>
            </div>

            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <Activity className="w-6 h-6 text-blue-600" />
              </div>
              <h4 className="font-medium text-gray-900">Usage</h4>
              {apiStatus.usage ? (
                <p className="text-sm text-gray-600">
                  {apiStatus.usage.remainingRequests} / {apiStatus.usage.requestLimit} remaining
                </p>
              ) : (
                <p className="text-sm text-gray-600">Not Available</p>
              )}
            </div>
          </div>

          {!apiStatus.configured && (
            <div className="mt-4 p-4 bg-warning-50 border border-warning-200 rounded-lg">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-warning-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-warning-900">API Not Configured</h4>
                  <p className="text-sm text-warning-700 mt-1">
                    Configure your Sentinel Hub credentials in Settings to access real satellite data.
                    Currently using consistent mock data based on location and seasonal patterns.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-card p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Insights</p>
              <p className="text-3xl font-bold text-gray-900">{insights.length}</p>
            </div>
            <Satellite className="w-8 h-8 text-primary-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-card p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg NDVI</p>
              <p className="text-3xl font-bold text-success-600">
                {insights.length > 0 
                  ? (insights.reduce((sum, i) => sum + (i.ndvi_score || 0), 0) / insights.length).toFixed(3)
                  : '0.000'
                }
              </p>
            </div>
            <Leaf className="w-8 h-8 text-success-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-card p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Moisture</p>
              <p className="text-3xl font-bold text-blue-600">
                {insights.length > 0 
                  ? (insights.reduce((sum, i) => sum + (i.soil_moisture || 0), 0) / insights.length).toFixed(1)
                  : '0.0'
                }%
              </p>
            </div>
            <Droplets className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-card p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Healthy Crops</p>
              <p className="text-3xl font-bold text-success-600">
                {healthyInsights}
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-success-600" />
          </div>
        </div>
      </div>

      {/* Insights Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {insights.map((insight) => (
          <div key={insight.id} className="bg-white rounded-xl shadow-card p-6 border border-gray-100 hover:shadow-card-hover transition-shadow duration-200">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                  <Satellite className="w-5 h-5 text-primary-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{insight.farmers?.full_name}</h3>
                  <p className="text-sm text-gray-500 flex items-center space-x-1">
                    <MapPin className="w-3 h-3" />
                    <span>{insight.farmers?.location_name}</span>
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <div className="flex items-center space-x-1 text-sm text-gray-500">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(insight.image_date).toLocaleDateString()}</span>
                </div>
                {insight.sentinel_data?.apiResponse && (
                  <div className="flex items-center space-x-1 text-xs text-success-600 mt-1">
                    <CheckCircle className="w-3 h-3" />
                    <span>Real API Data</span>
                  </div>
                )}
              </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-center space-x-1 mb-1">
                  <Leaf className="w-4 h-4 text-success-600" />
                  <span className="text-xs font-medium text-gray-600">NDVI</span>
                </div>
                <div className={`text-lg font-bold ${getNDVIColor(insight.ndvi_score).split(' ')[0]}`}>
                  {insight.ndvi_score?.toFixed(3)}
                </div>
                <div className={`text-xs px-2 py-1 rounded-full ${getNDVIColor(insight.ndvi_score)}`}>
                  {getNDVIStatus(insight.ndvi_score)}
                </div>
              </div>

              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-center space-x-1 mb-1">
                  <Droplets className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-medium text-gray-600">Moisture</span>
                </div>
                <div className={`text-lg font-bold ${getMoistureColor(insight.soil_moisture)}`}>
                  {insight.soil_moisture?.toFixed(1)}%
                </div>
                <div className="text-xs text-gray-500">{getMoistureStatus(insight.soil_moisture)}</div>
              </div>
            </div>

            {/* Vegetation Index */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">Vegetation Index</span>
                <span className="text-sm font-bold text-gray-900">{insight.vegetation_index?.toFixed(1)}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-success-400 to-success-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(insight.vegetation_index, 100)}%` }}
                ></div>
              </div>
            </div>

            {/* Environmental Data */}
            {insight.sentinel_data && (
              <div className="mb-4 grid grid-cols-2 gap-2 text-xs">
                {insight.sentinel_data.climateZone && (
                  <div className="flex items-center space-x-1 text-gray-600">
                    <Thermometer className="w-3 h-3" />
                    <span>{insight.sentinel_data.climateZone}</span>
                  </div>
                )}
                {insight.sentinel_data.season && (
                  <div className="flex items-center space-x-1 text-gray-600">
                    <Calendar className="w-3 h-3" />
                    <span>{insight.sentinel_data.season}</span>
                  </div>
                )}
                {insight.sentinel_data.cloudCoverage !== undefined && (
                  <div className="flex items-center space-x-1 text-gray-600">
                    <Cloud className="w-3 h-3" />
                    <span>{insight.sentinel_data.cloudCoverage}% clouds</span>
                  </div>
                )}
                {insight.sentinel_data.qualityScore && (
                  <div className="flex items-center space-x-1 text-gray-600">
                    <Activity className="w-3 h-3" />
                    <span>Q: {(insight.sentinel_data.qualityScore * 100).toFixed(0)}%</span>
                  </div>
                )}
              </div>
            )}

            {/* Recommendation */}
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-100 mb-4">
              <h4 className="text-sm font-medium text-blue-900 mb-1 flex items-center space-x-1">
                <Info className="w-3 h-3" />
                <span>Recommendation</span>
              </h4>
              <p className="text-sm text-blue-800">{insight.recommendation}</p>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1 text-sm">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600">
                  {insight.farmers?.crop || 'Unknown Crop'}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => openImageModal(insight)}
                  className="flex items-center space-x-1 px-3 py-1 bg-primary-100 text-primary-700 rounded-lg hover:bg-primary-200 transition-colors text-sm"
                  title="View satellite images"
                >
                  <ImageIcon className="w-4 h-4" />
                  <span>View Images</span>
                </button>
                <div className="flex items-center space-x-1 text-gray-500">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-sm">{insight.sentinel_data?.dataSource || 'Sentinel-2'}</span>
                </div>
              </div>
            </div>

            {/* Coordinates if available */}
            {insight.sentinel_data?.coordinates && (
              <div className="mt-2 text-xs text-gray-400">
                Lat: {insight.sentinel_data.coordinates.latitude?.toFixed(4)}, 
                Lng: {insight.sentinel_data.coordinates.longitude?.toFixed(4)}
                {insight.sentinel_data.resolution && ` • ${insight.sentinel_data.resolution} resolution`}
              </div>
            )}
          </div>
        ))}
      </div>

      {insights.length === 0 && (
        <div className="text-center py-12">
          <Satellite className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Satellite Insights Yet</h3>
          <p className="text-gray-500 mb-4">Generate your first satellite insight by selecting a farmer above.</p>
          <div className="text-sm text-gray-400">
            <p>💡 <strong>Tip:</strong> Satellite insights provide:</p>
            <ul className="mt-2 space-y-1">
              <li>• Real-time vegetation health (NDVI)</li>
              <li>• Soil moisture analysis</li>
              <li>• Climate-aware recommendations</li>
              <li>• Satellite image visualization</li>
            </ul>
          </div>
        </div>
      )}

      {/* Info Panel */}
      <div className="bg-gradient-to-r from-primary-50 to-blue-50 rounded-xl p-6 border border-primary-100">
        <div className="flex items-start space-x-4">
          <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <Satellite className="w-5 h-5 text-primary-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Enhanced Satellite Insights with Image Visualization</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-700">
              <div>
                <h4 className="font-medium text-primary-700 mb-1">NDVI Analysis</h4>
                <p>Normalized Difference Vegetation Index measures plant health and chlorophyll content with climate-zone awareness.</p>
              </div>
              <div>
                <h4 className="font-medium text-blue-700 mb-1">Soil Moisture</h4>
                <p>Advanced moisture estimation considering seasonal patterns, latitude effects, and regional climate conditions.</p>
              </div>
              <div>
                <h4 className="font-medium text-success-700 mb-1">Image Visualization</h4>
                <p>View actual satellite images including RGB, NDVI, soil moisture, and infrared layers for comprehensive analysis.</p>
              </div>
            </div>
            <div className="mt-4 p-3 bg-white/50 rounded-lg">
              <p className="text-sm text-gray-600">
                <strong>Enhanced Features:</strong> Click "View Images" on any insight to explore multiple satellite image layers, 
                download high-resolution images, and get detailed environmental data overlays for precision agriculture.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Satellite Image Modal */}
      {showImageModal && selectedInsight && (
        <SatelliteImageModal
          isOpen={showImageModal}
          onClose={() => {
            setShowImageModal(false);
            setSelectedInsight(null);
          }}
          insight={selectedInsight}
          farmer={selectedInsight.farmers}
        />
      )}
    </div>
  );
};

export default SatelliteInsights;