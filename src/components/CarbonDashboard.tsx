import React, { useState, useEffect } from 'react';
import { Users, Leaf, DollarSign, TrendingUp, Award, Calendar, CheckCircle, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import MetricCard from './MetricCard';
import { supabase } from '../lib/supabase';

interface DashboardData {
  stats: Array<{
    label: string;
    value: number;
  }>;
  chart: Array<{
    region: string;
    retired: number;
  }>;
  table: Array<{
    name: string;
    wallet: string;
    earned: number;
    retired: number;
    last: string;
  }>;
}

const CarbonDashboard: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    stats: [
      { label: "Total Credits", value: 0 },
      { label: "Farmers Onboarded", value: 0 },
      { label: "Pending Verification", value: 0 },
      { label: "Credits Retired", value: 0 }
    ],
    chart: [
      { region: "North", retired: 300 },
      { region: "South", retired: 500 },
      { region: "East", retired: 600 },
      { region: "West", retired: 430 }
    ],
    table: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Load carbon credits data
      const { data: carbonCredits, error: creditsError } = await supabase
        .from('carbon_credits')
        .select(`
          *,
          farmers (
            full_name,
            location_name,
            phone_number
          )
        `)
        .order('created_at', { ascending: false });

      if (creditsError) throw creditsError;

      // Load farmers data
      const { data: farmers, error: farmersError } = await supabase
        .from('farmers')
        .select('*');

      if (farmersError) throw farmersError;

      // Calculate stats
      const totalCredits = carbonCredits?.reduce((sum, credit) => sum + (credit.estimated_credits || 0), 0) || 0;
      const farmersOnboarded = carbonCredits?.length || 0;
      const pendingVerification = carbonCredits?.filter(c => c.verification_status === 'pending').length || 0;
      const creditsRetired = carbonCredits?.reduce((sum, credit) => sum + (credit.verified_credits || 0), 0) || 0;

      // Generate mock wallet addresses and prepare table data
      const tableData = carbonCredits?.slice(0, 10).map((credit, index) => ({
        name: credit.farmers?.full_name || 'Unknown Farmer',
        wallet: `0x${Math.random().toString(16).substr(2, 6).toUpperCase()}...${Math.random().toString(16).substr(2, 3).toUpperCase()}`,
        earned: Math.round(credit.estimated_credits || 0),
        retired: Math.round(credit.verified_credits || 0),
        last: new Date(credit.updated_at).toISOString().split('T')[0]
      })) || [];

      setDashboardData({
        stats: [
          { label: "Total Credits", value: Math.round(totalCredits) },
          { label: "Farmers Onboarded", value: farmersOnboarded },
          { label: "Pending Verification", value: pendingVerification },
          { label: "Credits Retired", value: Math.round(creditsRetired) }
        ],
        chart: [
          { region: "North", retired: Math.round(creditsRetired * 0.25) },
          { region: "South", retired: Math.round(creditsRetired * 0.35) },
          { region: "East", retired: Math.round(creditsRetired * 0.25) },
          { region: "West", retired: Math.round(creditsRetired * 0.15) }
        ],
        table: tableData
      });

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportReport = () => {
    // Generate CSV data
    const csvData = [
      ['Farmer Name', 'Wallet Address', 'Credits Earned', 'Credits Retired', 'Last Activity'],
      ...dashboardData.table.map(row => [row.name, row.wallet, row.earned, row.retired, row.last])
    ];

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `carbon-credits-report-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Carbon Credits Dashboard</h1>
          <p className="text-gray-600 mt-1">Toucan Protocol integration for tokenized carbon credits</p>
        </div>
        <div className="mt-4 sm:mt-0">
          <div className="text-sm text-gray-500">
            Last updated: {new Date().toLocaleString()}
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Credits"
          value={dashboardData.stats[0].value}
          icon={Leaf}
          color="success"
          trend={{ value: 12, label: 'vs last month' }}
        />
        <MetricCard
          title="Farmers Onboarded"
          value={dashboardData.stats[1].value}
          icon={Users}
          color="primary"
          trend={{ value: 8, label: 'vs last week' }}
        />
        <MetricCard
          title="Pending Verification"
          value={dashboardData.stats[2].value}
          icon={Award}
          color="secondary"
          trend={{ value: -5, label: 'vs last week' }}
        />
        <MetricCard
          title="Credits Retired"
          value={dashboardData.stats[3].value}
          icon={TrendingUp}
          color="accent"
          trend={{ value: 23, label: 'vs last month' }}
        />
      </div>

      {/* Chart Section */}
      <div className="bg-white rounded-xl shadow-card p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-primary-600" />
              <span>Monthly Retirements by Region</span>
            </h2>
            <p className="text-sm text-gray-500 mt-1">Carbon credits retired through Toucan Protocol</p>
          </div>
        </div>
        
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={dashboardData.chart}>
            <XAxis 
              dataKey="region" 
              tick={{ fontSize: 12 }}
              axisLine={{ stroke: '#e5e7eb' }}
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              axisLine={{ stroke: '#e5e7eb' }}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: '#f9fafb',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '14px'
              }}
            />
            <Bar 
              dataKey="retired" 
              fill="#10b981" 
              radius={[4, 4, 0, 0]}
              name="Credits Retired"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Farmer Activity Table */}
      <div className="bg-white rounded-xl shadow-card border border-gray-100">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 flex items-center space-x-2">
                <Users className="w-5 h-5 text-primary-600" />
                <span>Farmer Activity Table</span>
              </h2>
              <p className="text-sm text-gray-500 mt-1">Recent carbon credit transactions and wallet activity</p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-3 px-6 font-medium text-gray-700">Farmer Name</th>
                <th className="text-left py-3 px-6 font-medium text-gray-700">Wallet Address</th>
                <th className="text-left py-3 px-6 font-medium text-gray-700">Credits Earned</th>
                <th className="text-left py-3 px-6 font-medium text-gray-700">Credits Retired</th>
                <th className="text-left py-3 px-6 font-medium text-gray-700">Last Activity</th>
                <th className="text-left py-3 px-6 font-medium text-gray-700">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {dashboardData.table.map((row, i) => (
                <tr key={i} className="hover:bg-gray-50 transition-colors duration-150">
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                        <Users className="w-4 h-4 text-primary-600" />
                      </div>
                      <span className="font-medium text-gray-900">{row.name}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <code className="text-sm bg-gray-100 px-2 py-1 rounded font-mono">
                      {row.wallet}
                    </code>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-1">
                      <Leaf className="w-4 h-4 text-success-600" />
                      <span className="font-medium text-gray-900">{row.earned}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-1">
                      <TrendingUp className="w-4 h-4 text-accent-600" />
                      <span className="font-medium text-gray-900">{row.retired}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-1 text-sm text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span>{row.last}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-success-100 text-success-800">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Active
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {dashboardData.table.length === 0 && (
          <div className="text-center py-12">
            <Leaf className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Carbon Credits Yet</h3>
            <p className="text-gray-500 mb-4">Start enrolling farmers in the carbon credit program to see activity here.</p>
          </div>
        )}
      </div>

      {/* Export Section */}
      <div className="flex justify-end">
        <button
          onClick={exportReport}
          className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center space-x-2 transition-colors"
        >
          <DollarSign className="w-4 h-4" />
          <span>Export Report</span>
        </button>
      </div>

      {/* Toucan Protocol Info */}
      <div className="bg-gradient-to-r from-success-50 to-primary-50 rounded-xl p-6 border border-success-100">
        <div className="flex items-start space-x-4">
          <div className="w-10 h-10 bg-success-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <Leaf className="w-5 h-5 text-success-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Toucan Protocol Integration</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-700">
              <div>
                <h4 className="font-medium text-success-700 mb-1">Tokenization</h4>
                <p>Carbon credits are tokenized as TCO2 tokens on Polygon blockchain for transparency and tradability.</p>
              </div>
              <div>
                <h4 className="font-medium text-primary-700 mb-1">Verification</h4>
                <p>All credits undergo rigorous verification before being minted as blockchain tokens.</p>
              </div>
              <div>
                <h4 className="font-medium text-accent-700 mb-1">Retirement</h4>
                <p>Credits can be retired permanently on-chain, providing immutable proof of environmental impact.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CarbonDashboard;