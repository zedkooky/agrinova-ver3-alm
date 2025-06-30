import React, { useState, useEffect } from 'react';
import { Leaf, DollarSign, TrendingUp, Award, Calendar, CheckCircle, Wallet, ExternalLink, Copy, Plus, Settings } from 'lucide-react';
import { carbonCreditService } from '../services/carbonCreditService';
import { supabase } from '../lib/supabase';

interface CarbonCreditsProps {
  farmers: any[];
}

const CarbonCredits: React.FC<CarbonCreditsProps> = ({ farmers }) => {
  const [credits, setCredits] = useState<any[]>([]);
  const [marketData, setMarketData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [selectedFarmer, setSelectedFarmer] = useState<string>('');
  const [showEnrollForm, setShowEnrollForm] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [selectedFarmerForWallet, setSelectedFarmerForWallet] = useState<any>(null);
  const [formData, setFormData] = useState({
    practices: [] as string[],
    acreage: 0,
    cropType: ''
  });

  useEffect(() => {
    loadCredits();
    loadMarketData();
  }, []);

  const loadCredits = async () => {
    try {
      const { data, error } = await supabase
        .from('carbon_credits')
        .select(`
          *,
          farmers (
            full_name,
            location_name,
            crop,
            phone_number
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCredits(data || []);
    } catch (error) {
      console.error('Error loading credits:', error);
    }
  };

  const loadMarketData = async () => {
    try {
      const data = await carbonCreditService.getMarketData();
      setMarketData(data);
    } catch (error) {
      console.error('Error loading market data:', error);
    }
  };

  const handleEnroll = async () => {
    if (!selectedFarmer || formData.practices.length === 0) return;

    setLoading(true);
    try {
      const result = await carbonCreditService.submitCarbonCredit({
        farmerId: selectedFarmer,
        practices: formData.practices,
        acreage: formData.acreage,
        cropType: formData.cropType
      });

      await loadCredits();
      setShowEnrollForm(false);
      setSelectedFarmer('');
      setFormData({ practices: [], acreage: 0, cropType: '' });
      
      alert('Carbon credit application submitted successfully! Wallet will be created automatically.');
    } catch (error) {
      console.error('Error enrolling farmer:', error);
      alert('Failed to submit carbon credit application');
    } finally {
      setLoading(false);
    }
  };

  const generateWalletAddress = () => {
    // Generate a mock Ethereum wallet address
    const chars = '0123456789abcdef';
    let address = '0x';
    for (let i = 0; i < 40; i++) {
      address += chars[Math.floor(Math.random() * chars.length)];
    }
    return address;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  const openWalletModal = (farmer: any) => {
    setSelectedFarmerForWallet(farmer);
    setShowWalletModal(true);
  };

  const eligiblePractices = carbonCreditService.getEligiblePractices();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return 'bg-success-100 text-success-800';
      case 'pending': return 'bg-warning-100 text-warning-800';
      case 'rejected': return 'bg-error-100 text-error-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const totalValue = credits.reduce((sum, credit) => sum + (credit.total_value || 0), 0);
  const totalCredits = credits.reduce((sum, credit) => sum + (credit.estimated_credits || 0), 0);
  const verifiedCredits = credits.filter(c => c.verification_status === 'verified').length;

  // Get farmers who are opted into carbon credits
  const optedInFarmers = farmers.filter(farmer => 
    credits.some(credit => credit.farmer_id === farmer.id)
  );

  // Get farmers who are NOT opted in
  const notOptedInFarmers = farmers.filter(farmer => 
    !credits.some(credit => credit.farmer_id === farmer.id)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Carbon Credits & Toucan Protocol</h1>
          <p className="text-gray-600 mt-1">Sustainable farming practices carbon credit program with blockchain tokenization</p>
        </div>
        <button
          onClick={() => setShowEnrollForm(true)}
          className="mt-4 sm:mt-0 px-6 py-2 bg-success-600 text-white rounded-lg hover:bg-success-700 flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Enroll Farmer</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-card p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Credits</p>
              <p className="text-3xl font-bold text-gray-900">{totalCredits.toFixed(1)}</p>
            </div>
            <Leaf className="w-8 h-8 text-success-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-card p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Value</p>
              <p className="text-3xl font-bold text-success-600">${totalValue.toLocaleString()}</p>
            </div>
            <DollarSign className="w-8 h-8 text-success-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-card p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Verified</p>
              <p className="text-3xl font-bold text-primary-600">{verifiedCredits}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-primary-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-card p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Wallets Created</p>
              <p className="text-3xl font-bold text-accent-600">{optedInFarmers.length}</p>
            </div>
            <Wallet className="w-8 h-8 text-accent-600" />
          </div>
        </div>
      </div>

      {/* Market Info */}
      {marketData && (
        <div className="bg-white rounded-xl shadow-card p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Market Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Current Price</h4>
              <p className="text-2xl font-bold text-success-600">${marketData.currentPrice.toFixed(2)}</p>
              <p className={`text-sm ${marketData.priceChange >= 0 ? 'text-success-600' : 'text-error-600'}`}>
                {marketData.priceChange >= 0 ? '+' : ''}{marketData.priceChange.toFixed(1)}% (24h)
              </p>
            </div>
            <div>
              <h4 className="font-medium text-gray-700 mb-2">24h Volume</h4>
              <p className="text-2xl font-bold text-gray-900">{marketData.volume24h.toLocaleString()}</p>
              <p className="text-sm text-gray-500">credits traded</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Top Buyers</h4>
              <div className="space-y-1">
                {marketData.topBuyers.slice(0, 3).map((buyer: string, index: number) => (
                  <p key={index} className="text-sm text-gray-600">{buyer}</p>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Opted-In Farmers Section */}
      {optedInFarmers.length > 0 && (
        <div className="bg-white rounded-xl shadow-card border border-gray-100">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
              <Wallet className="w-5 h-5 text-success-600" />
              <span>Farmers with Carbon Credit Wallets ({optedInFarmers.length})</span>
            </h3>
            <p className="text-sm text-gray-500 mt-1">Farmers enrolled in the Toucan Protocol carbon credit program</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-3 px-6 font-medium text-gray-700">Farmer</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-700">Wallet Address</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-700">Credits Earned</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-700">Credits Retired</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-700">Total Value</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-700">Status</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {optedInFarmers.map((farmer) => {
                  const farmerCredit = credits.find(c => c.farmer_id === farmer.id);
                  const walletAddress = generateWalletAddress();
                  
                  return (
                    <tr key={farmer.id} className="hover:bg-gray-50 transition-colors duration-150">
                      <td className="py-4 px-6">
                        <div>
                          <div className="font-medium text-gray-900">{farmer.full_name}</div>
                          <div className="text-sm text-gray-500">{farmer.location_name}</div>
                          <div className="text-xs text-gray-400">{farmer.phone_number}</div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-2">
                          <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">
                            {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                          </code>
                          <button
                            onClick={() => copyToClipboard(walletAddress)}
                            className="text-gray-400 hover:text-gray-600"
                            title="Copy wallet address"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-1">
                          <Leaf className="w-4 h-4 text-success-600" />
                          <span className="font-medium text-gray-900">
                            {farmerCredit?.estimated_credits?.toFixed(1) || '0.0'}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-1">
                          <TrendingUp className="w-4 h-4 text-accent-600" />
                          <span className="font-medium text-gray-900">
                            {farmerCredit?.verified_credits?.toFixed(1) || '0.0'}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-1">
                          <DollarSign className="w-4 h-4 text-success-600" />
                          <span className="font-medium text-success-600">
                            ${farmerCredit?.total_value?.toLocaleString() || '0'}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(farmerCredit?.verification_status)}`}>
                          {farmerCredit?.verification_status || 'pending'}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => openWalletModal(farmer)}
                            className="text-primary-600 hover:text-primary-700"
                            title="View wallet details"
                          >
                            <Wallet className="w-4 h-4" />
                          </button>
                          <button
                            className="text-gray-400 hover:text-gray-600"
                            title="View on blockchain"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Not Opted-In Farmers Section */}
      {notOptedInFarmers.length > 0 && (
        <div className="bg-white rounded-xl shadow-card border border-gray-100">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
              <Settings className="w-5 h-5 text-warning-600" />
              <span>Farmers Not Enrolled ({notOptedInFarmers.length})</span>
            </h3>
            <p className="text-sm text-gray-500 mt-1">Farmers who haven't joined the carbon credit program yet</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-3 px-6 font-medium text-gray-700">Farmer</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-700">Location</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-700">Crop</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-700">Phone</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {notOptedInFarmers.slice(0, 10).map((farmer) => (
                  <tr key={farmer.id} className="hover:bg-gray-50 transition-colors duration-150">
                    <td className="py-4 px-6">
                      <div className="font-medium text-gray-900">{farmer.full_name}</div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-sm text-gray-600">{farmer.location_name}</div>
                    </td>
                    <td className="py-4 px-6">
                      {farmer.crop && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-success-100 text-success-800">
                          {farmer.crop}
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-sm text-gray-600">{farmer.phone_number}</div>
                    </td>
                    <td className="py-4 px-6">
                      <button
                        onClick={() => {
                          setSelectedFarmer(farmer.id);
                          setShowEnrollForm(true);
                        }}
                        className="px-3 py-1 bg-success-600 text-white text-sm rounded-lg hover:bg-success-700 flex items-center space-x-1"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Enroll</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {notOptedInFarmers.length > 10 && (
            <div className="p-4 border-t border-gray-200 text-center">
              <p className="text-sm text-gray-500">
                Showing 10 of {notOptedInFarmers.length} farmers not enrolled
              </p>
            </div>
          )}
        </div>
      )}

      {/* Enrollment Modal */}
      {showEnrollForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Enroll in Carbon Credit Program</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Farmer</label>
                <select
                  value={selectedFarmer}
                  onChange={(e) => setSelectedFarmer(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">Choose a farmer</option>
                  {notOptedInFarmers.map(farmer => (
                    <option key={farmer.id} value={farmer.id}>
                      {farmer.full_name} - {farmer.location_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sustainable Practices</label>
                <div className="grid grid-cols-2 gap-2">
                  {eligiblePractices.map(practice => (
                    <label key={practice.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.practices.includes(practice.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData(prev => ({
                              ...prev,
                              practices: [...prev.practices, practice.id]
                            }));
                          } else {
                            setFormData(prev => ({
                              ...prev,
                              practices: prev.practices.filter(p => p !== practice.id)
                            }));
                          }
                        }}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="text-sm text-gray-700">{practice.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Acreage</label>
                  <input
                    type="number"
                    value={formData.acreage}
                    onChange={(e) => setFormData(prev => ({ ...prev, acreage: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Enter acreage"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Crop Type</label>
                  <select
                    value={formData.cropType}
                    onChange={(e) => setFormData(prev => ({ ...prev, cropType: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">Select crop</option>
                    <option value="corn">Corn</option>
                    <option value="soy">Soy</option>
                    <option value="wheat">Wheat</option>
                    <option value="rice">Rice</option>
                    <option value="cotton">Cotton</option>
                  </select>
                </div>
              </div>

              {formData.practices.length > 0 && formData.acreage > 0 && formData.cropType && (
                <div className="p-4 bg-success-50 rounded-lg">
                  <h4 className="font-medium text-success-900 mb-2">Estimated Credits & Wallet Creation</h4>
                  <p className="text-2xl font-bold text-success-600">
                    {carbonCreditService.calculateEstimatedCredits(formData.practices, formData.acreage, formData.cropType)} credits
                  </p>
                  <p className="text-sm text-success-700">
                    Estimated value: ${(carbonCreditService.calculateEstimatedCredits(formData.practices, formData.acreage, formData.cropType) * (marketData?.currentPrice || 20)).toLocaleString()}
                  </p>
                  <div className="mt-2 p-2 bg-white rounded border border-success-200">
                    <p className="text-xs text-success-800">
                      🔐 A secure Web3 wallet will be automatically created for this farmer upon enrollment
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-4 mt-6">
              <button
                onClick={() => {
                  setShowEnrollForm(false);
                  setSelectedFarmer('');
                  setFormData({ practices: [], acreage: 0, cropType: '' });
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleEnroll}
                disabled={!selectedFarmer || formData.practices.length === 0 || loading}
                className="px-6 py-2 bg-success-600 text-white rounded-lg hover:bg-success-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Enrolling...' : 'Enroll & Create Wallet'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Wallet Details Modal */}
      {showWalletModal && selectedFarmerForWallet && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Wallet Details</h3>
              <button
                onClick={() => setShowWalletModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900">{selectedFarmerForWallet.full_name}</h4>
                <p className="text-sm text-gray-500">{selectedFarmerForWallet.location_name}</p>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <h5 className="font-medium text-gray-900 mb-2">Wallet Address</h5>
                <div className="flex items-center space-x-2">
                  <code className="text-sm bg-white px-3 py-2 rounded border flex-1 font-mono">
                    {generateWalletAddress()}
                  </code>
                  <button
                    onClick={() => copyToClipboard(generateWalletAddress())}
                    className="p-2 text-gray-400 hover:text-gray-600"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-success-50 rounded-lg">
                  <h5 className="font-medium text-success-900">TCO2 Balance</h5>
                  <p className="text-xl font-bold text-success-600">
                    {credits.find(c => c.farmer_id === selectedFarmerForWallet.id)?.estimated_credits?.toFixed(1) || '0.0'}
                  </p>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg">
                  <h5 className="font-medium text-blue-900">USD Value</h5>
                  <p className="text-xl font-bold text-blue-600">
                    ${credits.find(c => c.farmer_id === selectedFarmerForWallet.id)?.total_value?.toLocaleString() || '0'}
                  </p>
                </div>
              </div>

              <div className="p-4 bg-primary-50 rounded-lg border border-primary-200">
                <h5 className="font-medium text-primary-900 mb-2">Blockchain Details</h5>
                <div className="space-y-1 text-sm text-primary-800">
                  <p>Network: Polygon (MATIC)</p>
                  <p>Protocol: Toucan Protocol</p>
                  <p>Token Standard: ERC-20 (TCO2)</p>
                  <p>Registry: Verra VCS</p>
                </div>
              </div>

              <div className="flex space-x-3">
                <button className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center justify-center space-x-2">
                  <ExternalLink className="w-4 h-4" />
                  <span>View on PolygonScan</span>
                </button>
                <button className="flex-1 px-4 py-2 bg-success-600 text-white rounded-lg hover:bg-success-700 flex items-center justify-center space-x-2">
                  <TrendingUp className="w-4 h-4" />
                  <span>Retire Credits</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
                <h4 className="font-medium text-success-700 mb-1">Automatic Wallet Creation</h4>
                <p>Each enrolled farmer gets a secure Web3 wallet for receiving and managing TCO2 tokens on Polygon.</p>
              </div>
              <div>
                <h4 className="font-medium text-primary-700 mb-1">Tokenized Credits</h4>
                <p>Verified carbon credits are minted as TCO2 tokens, providing transparency and tradability on-chain.</p>
              </div>
              <div>
                <h4 className="font-medium text-accent-700 mb-1">Retirement & Trading</h4>
                <p>Farmers can retire credits for environmental impact or trade them on decentralized exchanges.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CarbonCredits;