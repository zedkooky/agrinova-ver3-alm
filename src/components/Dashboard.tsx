import React from 'react';
import { Users, Phone, Satellite, Leaf, Mic, Activity, TrendingUp, Clock } from 'lucide-react';
import MetricCard from './MetricCard';
import FarmersMap from './FarmersMap';
import FarmersTable from './FarmersTable';
import { DashboardStats, Farmer } from '../types';

interface DashboardProps {
  stats: DashboardStats;
  farmers: Farmer[];
}

const Dashboard: React.FC<DashboardProps> = ({ stats, farmers }) => {
  // Calculate enhanced stats
  const farmersWithFields = farmers.filter(f => f.field_locations && f.field_locations.length > 0).length;
  const farmersWithMultipleCrops = farmers.filter(f => f.crop_details && f.crop_details.length > 1).length;
  const totalFields = farmers.reduce((sum, f) => sum + (f.field_locations?.length || 0), 0);
  const totalHectares = farmers.reduce((sum, f) => 
    sum + (f.crop_details?.reduce((cropSum, cd) => cropSum + cd.hectareage, 0) || 0), 0
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Enhanced Dashboard</h1>
          <p className="text-gray-600 mt-1">AgriNova Platform - Precision Agriculture with Voice-First Experience</p>
        </div>
        <div className="mt-4 sm:mt-0">
          <div className="text-sm text-gray-500">
            Last updated: {new Date().toLocaleString()}
          </div>
        </div>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Farmers"
          value={stats.totalFarmers}
          icon={Users}
          color="primary"
          trend={{ value: 12, label: 'vs last month' }}
        />
        <MetricCard
          title="Mapped Fields"
          value={totalFields}
          icon={Satellite}
          color="secondary"
          trend={{ value: 25, label: 'precision agriculture' }}
        />
        <MetricCard
          title="Total Hectares"
          value={Math.round(totalHectares)}
          icon={TrendingUp}
          color="accent"
          trend={{ value: 18, label: 'under management' }}
        />
        <MetricCard
          title="Carbon Opt-ins"
          value={stats.totalCarbonOptIns}
          icon={Leaf}
          color="success"
          trend={{ value: 23, label: 'vs last month' }}
        />
      </div>

      {/* Live Voice Status Widget */}
      <div className="bg-gradient-to-r from-genz-green-50 to-electric-lime-50 rounded-xl shadow-card p-6 border border-genz-green-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-genz-green-100 rounded-lg flex items-center justify-center">
              <Mic className="w-5 h-5 text-genz-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Live Voice Status</h3>
              <p className="text-sm text-gray-600">ElevenLabs Voice Integration Activity</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-genz-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-genz-green-700">Active</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div className="text-center p-4 bg-white rounded-lg border border-genz-green-100">
            <div className="flex items-center justify-center mb-2">
              <Activity className="w-5 h-5 text-genz-green-600" />
            </div>
            <div className="text-2xl font-bold text-genz-green-600">3</div>
            <div className="text-sm text-gray-600">Active Sessions</div>
          </div>

          <div className="text-center p-4 bg-white rounded-lg border border-electric-lime-100">
            <div className="flex items-center justify-center mb-2">
              <Users className="w-5 h-5 text-electric-lime-600" />
            </div>
            <div className="text-2xl font-bold text-electric-lime-600">12</div>
            <div className="text-sm text-gray-600">Voice Enrollments Today</div>
          </div>

          <div className="text-center p-4 bg-white rounded-lg border border-neon-mint-100">
            <div className="flex items-center justify-center mb-2">
              <Clock className="w-5 h-5 text-neon-mint-600" />
            </div>
            <div className="text-2xl font-bold text-neon-mint-600">4.2</div>
            <div className="text-sm text-gray-600">Avg Call Duration (min)</div>
          </div>

          <div className="text-center p-4 bg-white rounded-lg border border-genz-green-100">
            <div className="flex items-center justify-center mb-2">
              <Leaf className="w-5 h-5 text-genz-green-600" />
            </div>
            <div className="text-2xl font-bold text-genz-green-600">8</div>
            <div className="text-sm text-gray-600">Pending Verifications</div>
          </div>
        </div>

        <div className="p-3 bg-white rounded-lg border border-genz-green-100">
          <h4 className="font-medium text-gray-900 mb-2">Recent Voice Activity</h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Maria Santos - Carbon enrollment completed</span>
              <span className="text-xs text-gray-400">2 min ago</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">John Kimani - Field mapping in progress</span>
              <span className="text-xs text-gray-400">5 min ago</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Fatima Al-Rashid - Language: Arabic, Status: Active</span>
              <span className="text-xs text-gray-400">8 min ago</span>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Stats Cards */}
      <div className="bg-white rounded-xl shadow-card p-6 border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Enhanced Metrics</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-gradient-to-r from-genz-green-50 to-electric-lime-50 rounded-lg border border-genz-green-100">
            <div className="flex items-center justify-center mb-2">
              <Satellite className="w-6 h-6 text-genz-green-600" />
            </div>
            <div className="text-2xl font-bold text-genz-green-600">{farmersWithFields}</div>
            <div className="text-sm text-gray-600">Multi-Field Farmers</div>
            <div className="text-xs text-gray-500 mt-1">
              {((farmersWithFields / stats.totalFarmers) * 100).toFixed(1)}% with mapped fields
            </div>
          </div>

          <div className="text-center p-4 bg-gradient-to-r from-electric-lime-50 to-neon-mint-50 rounded-lg border border-electric-lime-100">
            <div className="flex items-center justify-center mb-2">
              <Leaf className="w-6 h-6 text-electric-lime-600" />
            </div>
            <div className="text-2xl font-bold text-electric-lime-600">{farmersWithMultipleCrops}</div>
            <div className="text-sm text-gray-600">Crop Diversity</div>
            <div className="text-xs text-gray-500 mt-1">Farmers with multiple crops</div>
          </div>

          <div className="text-center p-4 bg-gradient-to-r from-neon-mint-50 to-genz-green-50 rounded-lg border border-neon-mint-100">
            <div className="flex items-center justify-center mb-2">
              <Mic className="w-6 h-6 text-neon-mint-600" />
            </div>
            <div className="text-2xl font-bold text-neon-mint-600">47</div>
            <div className="text-sm text-gray-600">Voice Interactions</div>
            <div className="text-xs text-gray-500 mt-1">ElevenLabs conversations</div>
          </div>

          <div className="text-center p-4 bg-gradient-to-r from-genz-green-50 to-electric-lime-50 rounded-lg border border-genz-green-100">
            <div className="flex items-center justify-center mb-2">
              <Activity className="w-6 h-6 text-genz-green-600" />
            </div>
            <div className="text-2xl font-bold text-genz-green-600">94%</div>
            <div className="text-sm text-gray-600">Precision Score</div>
            <div className="text-xs text-gray-500 mt-1">Field boundary accuracy</div>
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <FarmersMap farmers={farmers} />
        <div className="space-y-6">
          {/* Recent Activity */}
          <div className="bg-white rounded-xl shadow-card p-6 border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-genz-green-500 rounded-full"></div>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Maria Santos</span> completed voice enrollment - 3 fields mapped, carbon opt-in: YES
                </p>
                <span className="text-xs text-gray-400">2 min ago</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-electric-lime-500 rounded-full"></div>
                <p className="text-sm text-gray-600">
                  Enhanced satellite insight generated for <span className="font-medium">John Kimani</span> - 2 fields analyzed
                </p>
                <span className="text-xs text-gray-400">5 min ago</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-neon-mint-500 rounded-full"></div>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Fatima Al-Rashid</span> voice session (Arabic) - Field boundaries updated
                </p>
                <span className="text-xs text-gray-400">8 min ago</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-genz-green-500 rounded-full"></div>
                <p className="text-sm text-gray-600">
                  Precision agriculture insights delivered to <span className="font-medium">David Ochieng</span>
                </p>
                <span className="text-xs text-gray-400">12 min ago</span>
              </div>
            </div>
          </div>

          {/* Platform Performance */}
          <div className="bg-white rounded-xl shadow-card p-6 border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Platform Performance</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-gradient-to-r from-genz-green-50 to-electric-lime-50 rounded-lg">
                <div className="text-2xl font-bold text-genz-green-600">96%</div>
                <div className="text-sm text-gray-600">Voice Recognition Accuracy</div>
              </div>
              <div className="text-center p-4 bg-gradient-to-r from-electric-lime-50 to-neon-mint-50 rounded-lg">
                <div className="text-2xl font-bold text-electric-lime-600">3.8</div>
                <div className="text-sm text-gray-600">Avg Fields/Farmer</div>
              </div>
              <div className="text-center p-4 bg-gradient-to-r from-neon-mint-50 to-genz-green-50 rounded-lg">
                <div className="text-2xl font-bold text-neon-mint-600">87%</div>
                <div className="text-sm text-gray-600">Carbon Enrollment Rate</div>
              </div>
              <div className="text-center p-4 bg-gradient-to-r from-genz-green-50 to-electric-lime-50 rounded-lg">
                <div className="text-2xl font-bold text-genz-green-600">15s</div>
                <div className="text-sm text-gray-600">Avg Response Time</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Farmers Table */}
      <FarmersTable farmers={farmers} onFarmerUpdate={() => window.location.reload()} />

      {/* Voice Integration Status */}
      <div className="bg-gradient-to-r from-genz-green-100 to-electric-lime-100 rounded-xl p-6 border border-genz-green-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center space-x-2">
          <Mic className="w-5 h-5 text-genz-green-600" />
          <span>ElevenLabs Integration</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <h4 className="font-medium text-genz-green-700 mb-1">Voice-First Features</h4>
            <ul className="text-genz-green-600 space-y-1">
              <li>• Natural language enrollment</li>
              <li>• Multi-language support (7 languages)</li>
              <li>• Real-time data extraction</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-electric-lime-700 mb-1">Precision Agriculture</h4>
            <ul className="text-electric-lime-600 space-y-1">
              <li>• Field boundary mapping</li>
              <li>• Multi-crop tracking</li>
              <li>• Enhanced satellite insights</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;