import React, { useState, useEffect } from 'react';
import {
  Phone, Clock, User, MessageSquare, Play, Calendar,
  MessageCircle, Mic, Activity, Volume2
} from 'lucide-react';
import { ivrService } from '../services/ivrService';
import { supabase } from '../lib/supabase';

interface IVRLogsProps {
  farmers: any[];
}

const IVRLogs: React.FC<IVRLogsProps> = ({ farmers }) => {
  const [calls, setCalls] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedFarmer, setSelectedFarmer] = useState<string>('');
  const [contactMethod, setContactMethod] = useState<'ivr' | 'whatsapp' | 'voice'>('voice');
  const [filterCallType, setFilterCallType] = useState<string>('all');

  useEffect(() => {
    loadCalls();
  }, []);

  const loadCalls = async () => {
    try {
      const { data, error } = await supabase
        .from('ivr_calls')
        .select(`
          *,
          farmers (
            full_name,
            phone_number,
            location_name
          )
        `)
        .order('call_time', { ascending: false })
        .limit(100);

      if (error) throw error;
      setCalls(data || []);
    } catch (error) {
      console.error('Error loading calls:', error);
    }
  };

  const initiateContact = async () => {
    if (!selectedFarmer) return;

    setLoading(true);
    try {
      const farmer = farmers.find(f => f.id === selectedFarmer);
      if (!farmer) return;

      if (contactMethod === 'voice') {
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
          alert(
            `🎙️ Voice call initiated for ${farmer.full_name}!\n\n📞 Call ID: ${result.callId}\n🗣️ Voice Model: ${result.voiceModel}\n📋 Purpose: Enhanced farmer enrollment\n⏱️ Expected Duration: ${result.estimatedDuration}${result.note ? `\n📝 Note: ${result.note}` : ''}`
          );
        } else {
          throw new Error(result.error || 'Failed to initiate voice call');
        }
      } else if (contactMethod === 'whatsapp') {
        const result = await ivrService.initiateWhatsAppMessage({
          farmerId: farmer.id,
          phoneNumber: farmer.phone_number,
          farmerName: farmer.full_name
        });

        const { error } = await supabase
          .from('ivr_calls')
          .insert({
            farmer_id: farmer.id,
            call_status: 'whatsapp_sent',
            call_type: 'whatsapp',
            transcript: `WhatsApp message sent to ${farmer.full_name}`,
            call_duration: 0
          });

        if (error) throw error;
        alert(`📱 WhatsApp message sent successfully to ${farmer.full_name}`);
      } else {
        const result = await ivrService.initiateCall({
          farmerId: farmer.id,
          phoneNumber: farmer.phone_number,
          farmerName: farmer.full_name
        });

        const { error } = await supabase
          .from('ivr_calls')
          .insert({
            farmer_id: farmer.id,
            call_status: 'initiated',
            call_type: 'traditional_ivr',
            transcript: `Traditional IVR call initiated to ${farmer.full_name}`
          });

        if (error) throw error;
        alert(`📞 IVR call initiated successfully to ${farmer.full_name}`);
      }

      await loadCalls();
      setSelectedFarmer('');
    } catch (error: any) {
      console.error('Error initiating contact:', error);
      alert('Failed to initiate contact: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-success-100 text-success-800';
      case 'elevenlabs_completed': return 'bg-genz-green-100 text-genz-green-800';
      case 'elevenlabs_initiated': return 'bg-electric-lime-100 text-electric-lime-800';
      case 'elevenlabs_active': return 'bg-neon-mint-100 text-neon-mint-800';
      case 'whatsapp_sent':
      case 'whatsapp_delivered':
      case 'whatsapp_read': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-error-100 text-error-800';
      case 'initiated': return 'bg-warning-100 text-warning-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCallTypeIcon = (callType: string) => {
    switch (callType) {
      case 'elevenlabs_voice': return <Mic className="w-4 h-4 text-genz-green-600" />;
      case 'whatsapp': return <MessageCircle className="w-4 h-4 text-green-600" />;
      case 'traditional_ivr': return <Phone className="w-4 h-4 text-primary-600" />;
      default: return <Phone className="w-4 h-4 text-gray-600" />;
    }
  };

  const getCallTypeLabel = (callType: string) => {
    switch (callType) {
      case 'elevenlabs_voice': return 'Voice AI';
      case 'whatsapp': return 'WhatsApp';
      case 'traditional_ivr': return 'IVR Call';
      default: return 'Unknown';
    }
  };

  const getConditionText = (condition: number) => {
    switch (condition) {
      case 1: return 'Good';
      case 2: return 'Fair';
      case 3: return 'Poor';
      default: return 'Not reported';
    }
  };

  const getConditionColor = (condition: number) => {
    switch (condition) {
      case 1: return 'text-success-600';
      case 2: return 'text-warning-600';
      case 3: return 'text-error-600';
      default: return 'text-gray-600';
    }
  };

  const filteredCalls = calls.filter(call => {
    if (filterCallType === 'all') return true;
    return call.call_type === filterCallType;
  });

  const voiceCalls = calls.filter(c => c.call_type === 'elevenlabs_voice').length;
  const whatsappMessages = calls.filter(c => c.call_type === 'whatsapp').length;

return (
  <div className="space-y-6">
    {/* Header */}
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Enhanced Communication Logs</h1>
        <p className="text-gray-600 mt-1">
          AgriNova Communication System with voice-first experience
        </p>
      </div>

      <div className="mt-4 sm:mt-0 flex flex-wrap gap-4 items-center">
        {/* Communication Method Selector */}
        <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setContactMethod('voice')}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              contactMethod === 'voice'
                ? 'bg-genz-green-600 text-white shadow-glow-green'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Mic className="w-4 h-4 inline mr-1" />
            Voice AI
          </button>
          <button
            onClick={() => setContactMethod('whatsapp')}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              contactMethod === 'whatsapp'
                ? 'bg-green-600 text-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <MessageCircle className="w-4 h-4 inline mr-1" />
            WhatsApp
          </button>
          <button
            onClick={() => setContactMethod('ivr')}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              contactMethod === 'ivr'
                ? 'bg-primary-600 text-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Phone className="w-4 h-4 inline mr-1" />
            IVR Call
          </button>
        </div>

        {/* Farmer Selector */}
        <select
          value={selectedFarmer}
          onChange={(e) => setSelectedFarmer(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-genz-green-500 focus:border-transparent"
        >
          <option value="">Select Farmer</option>
          {farmers.map((farmer) => (
            <option key={farmer.id} value={farmer.id}>
              {farmer.full_name} - {farmer.phone_number}
            </option>
          ))}
        </select>

        {/* Initiate Contact Button */}
        <button
          onClick={initiateContact}
          disabled={!selectedFarmer || loading}
          className={`px-6 py-2 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 transition-all duration-300 ${
            contactMethod === 'voice'
              ? 'bg-genz-green-600 hover:bg-genz-green-700 shadow-glow-green'
              : contactMethod === 'whatsapp'
              ? 'bg-green-600 hover:bg-green-700'
              : 'bg-primary-600 hover:bg-primary-700'
          }`}
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : contactMethod === 'voice' ? (
            <Mic className="w-4 h-4" />
          ) : contactMethod === 'whatsapp' ? (
            <MessageCircle className="w-4 h-4" />
          ) : (
            <Phone className="w-4 h-4" />
          )}
          <span>
            {loading
              ? 'Initiating...'
              : contactMethod === 'voice'
              ? 'Start Voice Call'
              : contactMethod === 'whatsapp'
              ? 'Send WhatsApp'
              : 'Initiate Call'}
          </span>
        </button>
      </div>
    </div>

    {/* Stats Cards */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <div className="bg-white rounded-xl shadow-card p-6 border border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Total Communications</p>
            <p className="text-3xl font-bold text-gray-900">{calls.length}</p>
          </div>
          <Activity className="w-8 h-8 text-gray-600" />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-card p-6 border border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Voice AI Calls</p>
            <p className="text-3xl font-bold text-genz-green-600">{voiceCalls}</p>
          </div>
          <div className="w-8 h-8 bg-genz-green-100 rounded-lg flex items-center justify-center">
            <Mic className="w-5 h-5 text-genz-green-600" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-card p-6 border border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">WhatsApp Messages</p>
            <p className="text-3xl font-bold text-green-600">{whatsappMessages}</p>
          </div>
          <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
            <MessageCircle className="w-5 h-5 text-green-600" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-card p-6 border border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Carbon Opt-ins</p>
            <p className="text-3xl font-bold text-success-600">
              {calls.filter((c) => c.opted_in_carbon).length}
            </p>
          </div>
          <div className="w-8 h-8 bg-success-100 rounded-lg flex items-center justify-center">
            <User className="w-5 h-5 text-success-600" />
          </div>
        </div>
      </div>
    </div>

    {/* Communication Table Header */}
    <div className="bg-white rounded-xl shadow-card border border-gray-100">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Communication History</h3>
          <select
            value={filterCallType}
            onChange={(e) => setFilterCallType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-genz-green-500 focus:border-transparent text-sm"
          >
            <option value="all">All Types</option>
            <option value="elevenlabs_voice">Voice AI</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="traditional_ivr">Traditional IVR</option>
          </select>
        </div>
      </div>

      {/* Communication Table Body */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gradient-to-r from-genz-green-50 to-electric-lime-50">
            <tr>
              <th className="text-left py-3 px-6 font-medium text-gray-700">Farmer</th>
              <th className="text-left py-3 px-6 font-medium text-gray-700">Phone</th>
              <th className="text-left py-3 px-6 font-medium text-gray-700">Method</th>
              <th className="text-left py-3 px-6 font-medium text-gray-700">Time</th>
              <th className="text-left py-3 px-6 font-medium text-gray-700">Duration</th>
              <th className="text-left py-3 px-6 font-medium text-gray-700">Status</th>
              <th className="text-left py-3 px-6 font-medium text-gray-700">Crop Condition</th>
              <th className="text-left py-3 px-6 font-medium text-gray-700">Carbon Opt-in</th>
              <th className="text-left py-3 px-6 font-medium text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredCalls.map((call) => (
              <tr
                key={call.id}
                className="hover:bg-gradient-to-r hover:from-genz-green-25 hover:to-electric-lime-25 transition-all duration-150"
              >
                <td className="py-4 px-6">
                  <div>
                    <div className="font-medium text-gray-900">{call.farmers?.full_name}</div>
                    <div className="text-sm text-gray-500">{call.farmers?.location_name}</div>
                  </div>
                </td>
                <td className="py-4 px-6 text-sm text-gray-900">
                  {call.farmers?.phone_number}
                </td>
                <td className="py-4 px-6">
                  <div className="flex items-center space-x-2">
                    {getCallTypeIcon(call.call_type)}
                    <span className="text-sm font-medium">{getCallTypeLabel(call.call_type)}</span>
                  </div>
                </td>
                <td className="py-4 px-6 text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(call.call_time).toLocaleString()}</span>
                  </div>
                </td>
                <td className="py-4 px-6 text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <Clock className="w-4 h-4" />
                    <span>{call.call_duration || 0}s</span>
                  </div>
                </td>
                <td className="py-4 px-6">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(call.call_status)}`}>
                    {call.call_status?.replace('_', ' ') || 'unknown'}
                  </span>
                </td>
                <td className="py-4 px-6">
                  <span className={`font-medium ${getConditionColor(call.crop_condition)}`}>
                    {getConditionText(call.crop_condition)}
                  </span>
                </td>
                <td className="py-4 px-6">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    call.opted_in_carbon ? 'bg-genz-green-100 text-genz-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {call.opted_in_carbon ? 'Yes' : 'No'}
                  </span>
                </td>
                <td className="py-4 px-6">
                  <div className="flex items-center space-x-2">
                    {call.transcript && (
                      <button className="text-genz-green-600 hover:text-genz-green-700" title="View Transcript">
                        <MessageSquare className="w-4 h-4" />
                      </button>
                    )}
                    <button className="text-electric-lime-600 hover:text-electric-lime-700" title="Contact Again">
                      {call.call_type === 'elevenlabs_voice' ? (
                        <Mic className="w-4 h-4" />
                      ) : call.call_type === 'whatsapp' ? (
                        <MessageCircle className="w-4 h-4" />
                      ) : (
                        <Play className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Empty State */}
      {filteredCalls.length === 0 && (
        <div className="text-center py-12">
          <Activity className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Communications Yet</h3>
          <p className="text-gray-500 mb-4">
            Start communicating with farmers via Voice AI, WhatsApp, or traditional IVR calls.
          </p>
        </div>
      )}
    </div>
    {/* Footer Section */}
    <div className="bg-gradient-to-r from-genz-green-50 to-electric-lime-50 rounded-xl p-6 border border-genz-green-100">
      <div className="flex items-start space-x-4">
        <div className="w-10 h-10 bg-genz-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
          <Volume2 className="w-5 h-5 text-genz-green-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Enhanced Communication Platform
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-700">
            <div>
              <h4 className="font-medium text-genz-green-700 mb-1">Voice-First Experience</h4>
              <p>
                ElevenLabs Conversational AI enables natural language interactions in multiple
                languages for seamless farmer enrollment.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-electric-lime-700 mb-1">Multi-Channel Support</h4>
              <p>
                Integrated WhatsApp, traditional IVR, and voice AI ensure farmers can communicate
                through their preferred channel.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-neon-mint-700 mb-1">Real-Time Processing</h4>
              <p>
                Advanced voice recognition and natural language processing extract structured data
                from conversations automatically.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  );
};
  
export default IVRLogs;