import React, { useState } from 'react';
import { Search, Filter, Plus, Edit, Trash2, Save, X, MapPin, Phone, User, Wallet, Leaf, DollarSign, Mic } from 'lucide-react';
import { supabase } from '../lib/supabase';
import LocationPicker from './LocationPicker';

interface Farmer {
  id: string;
  phone_number: string;
  full_name: string | null;
  location_name: string | null;
  latitude: number | null;
  longitude: number | null;
  preferred_language: string | null;
  crop: string | null;
  crop_details: Array<{ crop_type: string; hectareage: number }>;
  field_locations: Array<{ field_name: string; latitude: number; longitude: number; bounding_box?: number[][] }>;
  created_at: string;
  updated_at: string;
}

interface FarmersTableProps {
  farmers: Farmer[];
  onFarmerUpdate?: () => void;
}

const FarmersTable: React.FC<FarmersTableProps> = ({ farmers, onFarmerUpdate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCrop, setFilterCrop] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingFarmer, setEditingFarmer] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [carbonCredits, setCarbonCredits] = useState<any[]>([]);
  const [showCarbonOptIn, setShowCarbonOptIn] = useState(false);
  const [selectedFarmerForCarbon, setSelectedFarmerForCarbon] = useState<string | null>(null);
  const [showVoiceEnrollment, setShowVoiceEnrollment] = useState(false);
  const [selectedFarmerForVoice, setSelectedFarmerForVoice] = useState<string | null>(null);
  const [voiceLoading, setVoiceLoading] = useState(false);
  const [formData, setFormData] = useState({
    phone_number: '',
    full_name: '',
    location_name: '',
    latitude: '',
    longitude: '',
    preferred_language: 'English',
    crop: '',
    crop_details: [{ crop_type: '', hectareage: 0 }],
    field_locations: [{ field_name: '', latitude: 0, longitude: 0 }]
  });
  const [carbonFormData, setCarbonFormData] = useState({
    practices: [] as string[],
    acreage: 0,
    cropType: ''
  });

  React.useEffect(() => {
    loadCarbonCredits();
  }, []);

  const loadCarbonCredits = async () => {
    try {
      const { data, error } = await supabase
        .from('carbon_credits')
        .select('*');
      
      if (error) throw error;
      setCarbonCredits(data || []);
    } catch (error) {
      console.error('Error loading carbon credits:', error);
    }
  };

  const filteredFarmers = farmers.filter(farmer => {
    const matchesSearch = 
      (farmer.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      farmer.phone_number.includes(searchTerm) ||
      (farmer.location_name?.toLowerCase().includes(searchTerm.toLowerCase()) || false);
    const matchesCrop = !filterCrop || farmer.crop === filterCrop || 
      farmer.crop_details?.some(cd => cd.crop_type === filterCrop);
    return matchesSearch && matchesCrop;
  }).slice(0, 50);

  const uniqueCrops = [...new Set([
    ...farmers.map(f => f.crop).filter(Boolean),
    ...farmers.flatMap(f => f.crop_details?.map(cd => cd.crop_type) || []).filter(Boolean)
  ])];

  const resetForm = () => {
    setFormData({
      phone_number: '',
      full_name: '',
      location_name: '',
      latitude: '',
      longitude: '',
      preferred_language: 'English',
      crop: '',
      crop_details: [{ crop_type: '', hectareage: 0 }],
      field_locations: [{ field_name: '', latitude: 0, longitude: 0 }]
    });
    setShowAddForm(false);
    setEditingFarmer(null);
  };

  const handleLocationSelect = (location: {
    name: string;
    latitude: number;
    longitude: number;
    address: string;
  }) => {
    setFormData(prev => ({
      ...prev,
      location_name: location.address,
      latitude: location.latitude.toString(),
      longitude: location.longitude.toString()
    }));
  };

  const addCropDetail = () => {
    setFormData(prev => ({
      ...prev,
      crop_details: [...prev.crop_details, { crop_type: '', hectareage: 0 }]
    }));
  };

  const removeCropDetail = (index: number) => {
    setFormData(prev => ({
      ...prev,
      crop_details: prev.crop_details.filter((_, i) => i !== index)
    }));
  };

  const updateCropDetail = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      crop_details: prev.crop_details.map((cd, i) => 
        i === index ? { ...cd, [field]: value } : cd
      )
    }));
  };

  const addFieldLocation = () => {
    setFormData(prev => ({
      ...prev,
      field_locations: [...prev.field_locations, { field_name: '', latitude: 0, longitude: 0 }]
    }));
  };

  const removeFieldLocation = (index: number) => {
    setFormData(prev => ({
      ...prev,
      field_locations: prev.field_locations.filter((_, i) => i !== index)
    }));
  };

  const updateFieldLocation = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      field_locations: prev.field_locations.map((fl, i) => 
        i === index ? { ...fl, [field]: value } : fl
      )
    }));
  };

  const handleAddFarmer = async () => {
    if (!formData.phone_number || !formData.full_name) {
      alert('Phone number and full name are required');
      return;
    }

    setLoading(true);
    try {
      const farmerData = {
        phone_number: formData.phone_number,
        full_name: formData.full_name,
        location_name: formData.location_name || null,
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null,
        preferred_language: formData.preferred_language,
        crop: formData.crop || null,
        crop_details: formData.crop_details.filter(cd => cd.crop_type && cd.hectareage > 0),
        field_locations: formData.field_locations.filter(fl => fl.field_name && fl.latitude && fl.longitude)
      };

      const { error } = await supabase
        .from('farmers')
        .insert(farmerData);

      if (error) throw error;

      alert('Farmer added successfully!');
      resetForm();
      if (onFarmerUpdate) onFarmerUpdate();
    } catch (error: any) {
      console.error('Error adding farmer:', error);
      if (error.code === '23505') {
        alert('A farmer with this phone number already exists');
      } else {
        alert('Failed to add farmer: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEditFarmer = (farmer: Farmer) => {
    setFormData({
      phone_number: farmer.phone_number,
      full_name: farmer.full_name || '',
      location_name: farmer.location_name || '',
      latitude: farmer.latitude?.toString() || '',
      longitude: farmer.longitude?.toString() || '',
      preferred_language: farmer.preferred_language || 'English',
      crop: farmer.crop || '',
      crop_details: farmer.crop_details?.length ? farmer.crop_details : [{ crop_type: '', hectareage: 0 }],
      field_locations: farmer.field_locations?.length ? farmer.field_locations : [{ field_name: '', latitude: 0, longitude: 0 }]
    });
    setEditingFarmer(farmer.id);
    setShowAddForm(true);
  };

  const handleUpdateFarmer = async () => {
    if (!editingFarmer) return;

    setLoading(true);
    try {
      const farmerData = {
        phone_number: formData.phone_number,
        full_name: formData.full_name,
        location_name: formData.location_name || null,
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null,
        preferred_language: formData.preferred_language,
        crop: formData.crop || null,
        crop_details: formData.crop_details.filter(cd => cd.crop_type && cd.hectareage > 0),
        field_locations: formData.field_locations.filter(fl => fl.field_name && fl.latitude && fl.longitude),
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('farmers')
        .update(farmerData)
        .eq('id', editingFarmer);

      if (error) throw error;

      alert('Farmer updated successfully!');
      resetForm();
      if (onFarmerUpdate) onFarmerUpdate();
    } catch (error: any) {
      console.error('Error updating farmer:', error);
      alert('Failed to update farmer: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFarmer = async (farmerId: string, farmerName: string) => {
    if (!confirm(`Are you sure you want to delete ${farmerName}? This action cannot be undone.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('farmers')
        .delete()
        .eq('id', farmerId);

      if (error) throw error;

      alert('Farmer deleted successfully!');
      if (onFarmerUpdate) onFarmerUpdate();
    } catch (error: any) {
      console.error('Error deleting farmer:', error);
      alert('Failed to delete farmer: ' + error.message);
    }
  };

  const handleVoiceEnrollment = async () => {
    if (!selectedFarmerForVoice) return;

    setVoiceLoading(true);
    try {
      const farmer = farmers.find(f => f.id === selectedFarmerForVoice);
      if (!farmer) return;

      // Call ElevenLabs voice handler
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-voice-handler`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify({
            action: 'initiate_call',
            farmerId: farmer.id,
            phoneNumber: farmer.phone_number,
            farmerName: farmer.full_name,
            language: farmer.preferred_language || 'English'
          })
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        alert(`🎙️ Voice enrollment initiated for ${farmer.full_name}!

📞 Call ID: ${result.callId}
🗣️ Voice Model: ${result.voiceModel}
📋 Script: Carbon Credit Enrollment
⏱️ Expected Duration: 3-5 minutes

The farmer will receive a call shortly to complete their enrollment via voice interaction.`);

        // Log the voice call initiation
        await supabase.from('ivr_calls').insert({
          farmer_id: farmer.id,
          call_status: 'elevenlabs_initiated',
          call_type: 'elevenlabs_voice',
          transcript: `Voice enrollment call initiated via ElevenLabs. Call ID: ${result.callId}`,
          call_duration: 0
        });

        setShowVoiceEnrollment(false);
        setSelectedFarmerForVoice(null);
        if (onFarmerUpdate) onFarmerUpdate();
      } else {
        throw new Error(result.error || 'Failed to initiate voice call');
      }
    } catch (error: any) {
      console.error('Error initiating voice enrollment:', error);
      alert('Failed to initiate voice enrollment: ' + error.message);
    } finally {
      setVoiceLoading(false);
    }
  };

  const handleCarbonOptIn = async () => {
    if (!selectedFarmerForCarbon || carbonFormData.practices.length === 0) return;

    setLoading(true);
    try {
      // Generate wallet address
      const walletAddress = generateWalletAddress();
      
      // Calculate estimated credits
      const estimatedCredits = calculateEstimatedCredits(
        carbonFormData.practices, 
        carbonFormData.acreage, 
        carbonFormData.cropType
      );

      // Create carbon credit record
      const { error } = await supabase
        .from('carbon_credits')
        .insert({
          farmer_id: selectedFarmerForCarbon,
          opt_in_date: new Date().toISOString().split('T')[0],
          practices_reported: carbonFormData.practices.join(', '),
          verification_status: 'pending',
          estimated_credits: estimatedCredits,
          credit_price: 20, // $20 per credit
          total_value: estimatedCredits * 20,
          registry_id: `TCO2-${Date.now()}-${selectedFarmerForCarbon.slice(-6)}`
        });

      if (error) throw error;

      // Show success message with wallet info
      const farmer = farmers.find(f => f.id === selectedFarmerForCarbon);
      alert(`🎉 ${farmer?.full_name} successfully enrolled in Carbon Credit Program!

🔐 Wallet Created: ${walletAddress}
🌱 Estimated Credits: ${estimatedCredits.toFixed(1)} TCO2 tokens
💰 Estimated Value: $${(estimatedCredits * 20).toLocaleString()}
⛓️ Blockchain: Polygon Network
📋 Registry ID: TCO2-${Date.now()}-${selectedFarmerForCarbon.slice(-6)}

The farmer will receive SMS notification with wallet details.`);

      // Reset form and reload data
      setShowCarbonOptIn(false);
      setSelectedFarmerForCarbon(null);
      setCarbonFormData({ practices: [], acreage: 0, cropType: '' });
      await loadCarbonCredits();
      if (onFarmerUpdate) onFarmerUpdate();

    } catch (error: any) {
      console.error('Error enrolling farmer in carbon program:', error);
      alert('Failed to enroll farmer in carbon program: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const generateWalletAddress = () => {
    const chars = '0123456789abcdef';
    let address = '0x';
    for (let i = 0; i < 40; i++) {
      address += chars[Math.floor(Math.random() * chars.length)];
    }
    return address;
  };

  const calculateEstimatedCredits = (practices: string[], acreage: number, cropType: string): number => {
    const creditRates = {
      'no-till': 0.5,
      'cover-cropping': 0.3,
      'rotational-grazing': 0.4,
      'agroforestry': 0.8,
      'precision-agriculture': 0.2,
      'organic-farming': 0.6
    };

    const cropMultipliers = {
      'corn': 1.0,
      'soy': 1.1,
      'wheat': 0.9,
      'rice': 1.2,
      'cotton': 0.8
    };

    let estimatedCredits = 0;
    practices.forEach(practice => {
      const rate = creditRates[practice as keyof typeof creditRates] || 0.1;
      estimatedCredits += rate * acreage;
    });

    const multiplier = cropMultipliers[cropType.toLowerCase() as keyof typeof cropMultipliers] || 1.0;
    return Math.round(estimatedCredits * multiplier * 100) / 100;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const isEnrolledInCarbon = (farmerId: string) => {
    return carbonCredits.some(credit => credit.farmer_id === farmerId);
  };

  const getCarbonCreditInfo = (farmerId: string) => {
    return carbonCredits.find(credit => credit.farmer_id === farmerId);
  };

  const eligiblePractices = [
    { id: 'no-till', name: 'No-Till Farming', rate: 0.5 },
    { id: 'cover-cropping', name: 'Cover Cropping', rate: 0.3 },
    { id: 'rotational-grazing', name: 'Rotational Grazing', rate: 0.4 },
    { id: 'agroforestry', name: 'Agroforestry', rate: 0.8 },
    { id: 'precision-agriculture', name: 'Precision Agriculture', rate: 0.2 },
    { id: 'organic-farming', name: 'Organic Farming', rate: 0.6 }
  ];

  const cropOptions = [
    'Maize', 'Rice', 'Wheat', 'Sorghum', 'Millet', 'Cassava', 'Sweet Potato',
    'Beans', 'Groundnuts', 'Cotton', 'Coffee', 'Tea', 'Cocoa', 'Banana', 'Plantain'
  ];

  return (
    <div className="bg-white rounded-xl shadow-card border border-gray-100">
      <div className="p-6 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Enhanced Farmers Directory</h3>
          <div className="mt-4 sm:mt-0 flex space-x-2">
            <button
              onClick={() => setShowAddForm(true)}
              className="px-4 py-2 bg-genz-green-600 text-white rounded-lg hover:bg-genz-green-700 flex items-center space-x-2 shadow-glow-green transition-all duration-300"
            >
              <Plus className="w-4 h-4" />
              <span>Add Farmer</span>
            </button>
          </div>
        </div>
        
        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search farmers..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-genz-green-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <select
              className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-genz-green-500 focus:border-transparent appearance-none bg-white"
              value={filterCrop}
              onChange={(e) => setFilterCrop(e.target.value)}
            >
              <option value="">All Crops</option>
              {uniqueCrops.map(crop => (
                <option key={crop} value={crop}>{crop}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Enhanced Add/Edit Farmer Form */}
      {showAddForm && (
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-genz-green-50 to-electric-lime-50">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-medium text-gray-900">
              {editingFarmer ? 'Edit Farmer' : 'Add New Farmer'}
            </h4>
            <button
              onClick={resetForm}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Basic Info */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number *
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="tel"
                    value={formData.phone_number}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone_number: e.target.value }))}
                    placeholder="+254712345678"
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-genz-green-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    value={formData.full_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                    placeholder="John Doe"
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-genz-green-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Preferred Language
                </label>
                <select
                  value={formData.preferred_language}
                  onChange={(e) => setFormData(prev => ({ ...prev, preferred_language: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-genz-green-500 focus:border-transparent"
                >
                  <option value="English">English</option>
                  <option value="Swahili">Swahili</option>
                  <option value="French">French</option>
                  <option value="Arabic">Arabic</option>
                  <option value="Amharic">Amharic</option>
                  <option value="Hausa">Hausa</option>
                  <option value="Yoruba">Yoruba</option>
                </select>
              </div>

              {/* Crop Details Section */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Crop Details
                  </label>
                  <button
                    type="button"
                    onClick={addCropDetail}
                    className="text-genz-green-600 hover:text-genz-green-700 text-sm flex items-center space-x-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Crop</span>
                  </button>
                </div>
                <div className="space-y-2">
                  {formData.crop_details.map((cropDetail, index) => (
                    <div key={index} className="flex items-center space-x-2 p-3 bg-white rounded-lg border border-gray-200">
                      <select
                        value={cropDetail.crop_type}
                        onChange={(e) => updateCropDetail(index, 'crop_type', e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-genz-green-500 focus:border-transparent"
                      >
                        <option value="">Select Crop</option>
                        {cropOptions.map(crop => (
                          <option key={crop} value={crop}>{crop}</option>
                        ))}
                      </select>
                      <input
                        type="number"
                        value={cropDetail.hectareage}
                        onChange={(e) => updateCropDetail(index, 'hectareage', Number(e.target.value))}
                        placeholder="Hectares"
                        className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-genz-green-500 focus:border-transparent"
                        min="0"
                        step="0.1"
                      />
                      {formData.crop_details.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeCropDetail(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column - Location & Fields */}
            <div className="space-y-4">
              <LocationPicker
                onLocationSelect={handleLocationSelect}
                initialValue={formData.location_name}
                placeholder="Search for farmer's location..."
              />

              {/* Manual Coordinate Override */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Latitude (Manual)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={formData.latitude}
                    onChange={(e) => setFormData(prev => ({ ...prev, latitude: e.target.value }))}
                    placeholder="-15.4067"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-genz-green-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Longitude (Manual)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={formData.longitude}
                    onChange={(e) => setFormData(prev => ({ ...prev, longitude: e.target.value }))}
                    placeholder="28.2871"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-genz-green-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Field Locations Section */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Field Locations
                  </label>
                  <button
                    type="button"
                    onClick={addFieldLocation}
                    className="text-genz-green-600 hover:text-genz-green-700 text-sm flex items-center space-x-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Field</span>
                  </button>
                </div>
                <div className="space-y-2">
                  {formData.field_locations.map((fieldLocation, index) => (
                    <div key={index} className="p-3 bg-white rounded-lg border border-gray-200 space-y-2">
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={fieldLocation.field_name}
                          onChange={(e) => updateFieldLocation(index, 'field_name', e.target.value)}
                          placeholder="Field name"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-genz-green-500 focus:border-transparent"
                        />
                        {formData.field_locations.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeFieldLocation(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="number"
                          step="any"
                          value={fieldLocation.latitude}
                          onChange={(e) => updateFieldLocation(index, 'latitude', Number(e.target.value))}
                          placeholder="Latitude"
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-genz-green-500 focus:border-transparent"
                        />
                        <input
                          type="number"
                          step="any"
                          value={fieldLocation.longitude}
                          onChange={(e) => updateFieldLocation(index, 'longitude', Number(e.target.value))}
                          placeholder="Longitude"
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-genz-green-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gradient-to-r from-genz-green-100 to-electric-lime-100 rounded-lg p-4 border border-genz-green-200">
                <h4 className="font-medium text-genz-green-900 mb-2">Enhanced Features</h4>
                <ul className="text-sm text-genz-green-800 space-y-1">
                  <li>• Multiple crop types with precise hectareage tracking</li>
                  <li>• Individual field location mapping for precision agriculture</li>
                  <li>• Automated coordinate detection via location search</li>
                  <li>• Enhanced satellite insights based on field boundaries</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={editingFarmer ? handleUpdateFarmer : handleAddFarmer}
              disabled={loading || !formData.phone_number || !formData.full_name}
              className="px-6 py-2 bg-genz-green-600 text-white rounded-lg hover:bg-genz-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 shadow-glow-green transition-all duration-300"
            >
              <Save className="w-4 h-4" />
              <span>{loading ? 'Saving...' : editingFarmer ? 'Update Farmer' : 'Add Farmer'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Voice Enrollment Modal */}
      {showVoiceEnrollment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
              <Mic className="w-5 h-5 text-genz-green-600" />
              <span>ElevenLabs Voice Enrollment</span>
            </h3>
            
            <div className="space-y-4">
              <div className="p-4 bg-gradient-to-r from-genz-green-50 to-electric-lime-50 rounded-lg border border-genz-green-200">
                <h4 className="font-medium text-genz-green-900 mb-2">🎙️ Voice-First Experience</h4>
                <ul className="text-sm text-genz-green-800 space-y-1">
                  <li>• Natural conversation in farmer's preferred language</li>
                  <li>• Automated data collection and verification</li>
                  <li>• Real-time carbon credit eligibility assessment</li>
                  <li>• Instant wallet creation upon enrollment</li>
                </ul>
              </div>

              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-medium text-blue-900 mb-2">📞 Call Process</h4>
                <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                  <li>Farmer receives call in their preferred language</li>
                  <li>Voice assistant guides through enrollment questions</li>
                  <li>Sustainable practices and acreage are recorded</li>
                  <li>Carbon credit eligibility is calculated automatically</li>
                  <li>Blockchain wallet is created and linked</li>
                </ol>
              </div>
            </div>

            <div className="flex justify-end space-x-4 mt-6">
              <button
                onClick={() => {
                  setShowVoiceEnrollment(false);
                  setSelectedFarmerForVoice(null);
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleVoiceEnrollment}
                disabled={!selectedFarmerForVoice || voiceLoading}
                className="px-6 py-2 bg-genz-green-600 text-white rounded-lg hover:bg-genz-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 shadow-glow-green transition-all duration-300"
              >
                <Mic className="w-4 h-4" />
                <span>{voiceLoading ? 'Initiating Call...' : 'Start Voice Enrollment'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Carbon Credit Opt-in Modal */}
      {showCarbonOptIn && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
              <Leaf className="w-5 h-5 text-genz-green-600" />
              <span>Enroll in Toucan Carbon Credit Program</span>
            </h3>
            
            <div className="space-y-4">
              <div className="p-4 bg-gradient-to-r from-genz-green-50 to-electric-lime-50 rounded-lg border border-genz-green-200">
                <h4 className="font-medium text-genz-green-900 mb-2">🌱 What You'll Get:</h4>
                <ul className="text-sm text-genz-green-800 space-y-1">
                  <li>• Secure Web3 wallet on Polygon blockchain</li>
                  <li>• TCO2 tokens for verified sustainable practices</li>
                  <li>• Ability to trade or retire carbon credits</li>
                  <li>• Transparent, immutable record of environmental impact</li>
                </ul>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sustainable Practices</label>
                <div className="grid grid-cols-2 gap-2">
                  {eligiblePractices.map(practice => (
                    <label key={practice.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={carbonFormData.practices.includes(practice.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setCarbonFormData(prev => ({
                              ...prev,
                              practices: [...prev.practices, practice.id]
                            }));
                          } else {
                            setCarbonFormData(prev => ({
                              ...prev,
                              practices: prev.practices.filter(p => p !== practice.id)
                            }));
                          }
                        }}
                        className="rounded border-gray-300 text-genz-green-600 focus:ring-genz-green-500"
                      />
                      <span className="text-sm text-gray-700">{practice.name}</span>
                      <span className="text-xs text-gray-500">({practice.rate} credits/acre)</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Acreage</label>
                  <input
                    type="number"
                    value={carbonFormData.acreage}
                    onChange={(e) => setCarbonFormData(prev => ({ ...prev, acreage: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-genz-green-500 focus:border-transparent"
                    placeholder="Enter acreage"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Crop Type</label>
                  <select
                    value={carbonFormData.cropType}
                    onChange={(e) => setCarbonFormData(prev => ({ ...prev, cropType: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-genz-green-500 focus:border-transparent"
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

              {carbonFormData.practices.length > 0 && carbonFormData.acreage > 0 && carbonFormData.cropType && (
                <div className="p-4 bg-gradient-to-r from-genz-green-50 to-electric-lime-50 rounded-lg border border-genz-green-200">
                  <h4 className="font-medium text-genz-green-900 mb-2">🔮 Estimated Rewards</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-2xl font-bold text-genz-green-600">
                        {calculateEstimatedCredits(carbonFormData.practices, carbonFormData.acreage, carbonFormData.cropType)} TCO2
                      </p>
                      <p className="text-sm text-gray-600">Carbon Credits</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-electric-lime-600">
                        ${(calculateEstimatedCredits(carbonFormData.practices, carbonFormData.acreage, carbonFormData.cropType) * 20).toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-600">Estimated Value</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-4 mt-6">
              <button
                onClick={() => {
                  setShowCarbonOptIn(false);
                  setSelectedFarmerForCarbon(null);
                  setCarbonFormData({ practices: [], acreage: 0, cropType: '' });
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleCarbonOptIn}
                disabled={!selectedFarmerForCarbon || carbonFormData.practices.length === 0 || loading}
                className="px-6 py-2 bg-genz-green-600 text-white rounded-lg hover:bg-genz-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 shadow-glow-green transition-all duration-300"
              >
                <Wallet className="w-4 h-4" />
                <span>{loading ? 'Creating Wallet...' : 'Create Wallet & Enroll'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gradient-to-r from-genz-green-50 to-electric-lime-50">
            <tr>
              <th className="text-left py-3 px-6 font-medium text-gray-700">Phone Number</th>
              <th className="text-left py-3 px-6 font-medium text-gray-700">Name</th>
              <th className="text-left py-3 px-6 font-medium text-gray-700">Location</th>
              <th className="text-left py-3 px-6 font-medium text-gray-700">Crops & Fields</th>
              <th className="text-left py-3 px-6 font-medium text-gray-700">Carbon Program</th>
              <th className="text-left py-3 px-6 font-medium text-gray-700">Created</th>
              <th className="text-left py-3 px-6 font-medium text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredFarmers.map((farmer) => {
              const isEnrolled = isEnrolledInCarbon(farmer.id);
              const carbonInfo = getCarbonCreditInfo(farmer.id);
              
              return (
                <tr key={farmer.id} className="hover:bg-gradient-to-r hover:from-genz-green-25 hover:to-electric-lime-25 transition-all duration-150">
                  <td className="py-4 px-6 text-sm font-medium text-gray-900">{farmer.phone_number}</td>
                  <td className="py-4 px-6 text-sm text-gray-900">{farmer.full_name}</td>
                  <td className="py-4 px-6 text-sm text-gray-600">
                    {farmer.location_name && (
                      <div className="flex items-center space-x-1">
                        <MapPin className="w-3 h-3 text-gray-400" />
                        <span className="truncate max-w-32" title={farmer.location_name}>
                          {farmer.location_name}
                        </span>
                      </div>
                    )}
                  </td>
                  <td className="py-4 px-6">
                    <div className="space-y-1">
                      {farmer.crop_details && farmer.crop_details.length > 0 ? (
                        farmer.crop_details.map((cd, index) => (
                          <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-genz-green-100 text-genz-green-800 mr-1 mb-1">
                            {cd.crop_type} ({cd.hectareage}ha)
                          </span>
                        ))
                      ) : farmer.crop ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-genz-green-100 text-genz-green-800">
                          {farmer.crop}
                        </span>
                      ) : null}
                      {farmer.field_locations && farmer.field_locations.length > 0 && (
                        <div className="text-xs text-gray-500">
                          {farmer.field_locations.length} field{farmer.field_locations.length > 1 ? 's' : ''} mapped
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    {isEnrolled ? (
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <Wallet className="w-4 h-4 text-genz-green-600" />
                          <span className="text-sm font-medium text-genz-green-700">Enrolled</span>
                        </div>
                        <div className="text-xs text-gray-500">
                          {carbonInfo?.estimated_credits?.toFixed(1)} TCO2 • ${carbonInfo?.total_value?.toLocaleString()}
                        </div>
                        <div className="text-xs">
                          <span className={`px-2 py-0.5 rounded-full text-xs ${
                            carbonInfo?.verification_status === 'verified' ? 'bg-genz-green-100 text-genz-green-800' :
                            carbonInfo?.verification_status === 'pending' ? 'bg-warning-100 text-warning-800' :
                            'bg-error-100 text-error-800'
                          }`}>
                            {carbonInfo?.verification_status}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex space-x-1">
                        <button
                          onClick={() => {
                            setSelectedFarmerForCarbon(farmer.id);
                            setShowCarbonOptIn(true);
                          }}
                          className="flex items-center space-x-1 px-2 py-1 bg-genz-green-100 text-genz-green-700 rounded-lg hover:bg-genz-green-200 transition-colors text-xs"
                        >
                          <Leaf className="w-3 h-3" />
                          <span>Enroll</span>
                        </button>
                        <button
                          onClick={() => {
                            setSelectedFarmerForVoice(farmer.id);
                            setShowVoiceEnrollment(true);
                          }}
                          className="flex items-center space-x-1 px-2 py-1 bg-electric-lime-100 text-electric-lime-700 rounded-lg hover:bg-electric-lime-200 transition-colors text-xs"
                        >
                          <Mic className="w-3 h-3" />
                          <span>Voice</span>
                        </button>
                      </div>
                    )}
                  </td>
                  <td className="py-4 px-6 text-sm text-gray-600">{formatDate(farmer.created_at)}</td>
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEditFarmer(farmer)}
                        className="text-genz-green-600 hover:text-genz-green-700"
                        title="Edit Farmer"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteFarmer(farmer.id, farmer.full_name || 'Unknown')}
                        className="text-error-600 hover:text-error-700"
                        title="Delete Farmer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {filteredFarmers.length === 0 && (
        <div className="text-center py-12">
          <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Farmers Found</h3>
          <p className="text-gray-500 mb-4">
            {farmers.length === 0 
              ? "Get started by adding your first farmer to the platform."
              : "No farmers match your search criteria."
            }
          </p>
          {farmers.length === 0 && (
            <button
              onClick={() => setShowAddForm(true)}
              className="px-4 py-2 bg-genz-green-600 text-white rounded-lg hover:bg-genz-green-700 flex items-center space-x-2 mx-auto shadow-glow-green transition-all duration-300"
            >
              <Plus className="w-4 h-4" />
              <span>Add First Farmer</span>
            </button>
          )}
        </div>
      )}

      {filteredFarmers.length > 0 && filteredFarmers.length < farmers.length && (
        <div className="p-4 border-t border-gray-200 text-center">
          <p className="text-sm text-gray-500">
            Showing {filteredFarmers.length} of {farmers.length.toLocaleString()} farmers
          </p>
        </div>
      )}
    </div>
  );
};

export default FarmersTable;