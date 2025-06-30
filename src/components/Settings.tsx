import React, { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, 
  Key, 
  TestTube, 
  Save, 
  CheckCircle, 
  XCircle, 
  Loader,
  Eye,
  EyeOff,
  Satellite,
  Phone,
  MessageCircle,
  Map,
  Leaf,
  Mic
} from 'lucide-react';
import { apiCredentialsService } from '../services/apiCredentialsService';

interface ApiCredentials {
  sentinelHub: {
    enabled: boolean;
    clientId: string;
    clientSecret: string;
  };
  carbonCredit: {
    enabled: boolean;
    apiKey: string;
    baseUrl: string;
  };
  africasTalking: {
    enabled: boolean;
    username: string;
    apiKey: string;
    senderId: string;
    sandboxMode: boolean;
  };
  whatsapp: {
    enabled: boolean;
    accessToken: string;
    appId: string;
    phoneNumberId: string;
    verifyToken: string;
  };
  twilioWhatsapp: {
    enabled: boolean;
    accountSid: string;
    authToken: string;
    phoneNumber: string;
  };
  elevenLabs: {
    enabled: boolean;
    apiKey: string;
    agentId: string;
  };
  maps: {
    provider: 'google' | 'mapbox' | 'here';
    googleMapsApiKey: string;
    mapboxAccessToken: string;
    hereApiKey: string;
  };
}

const Settings: React.FC = () => {
  const [credentials, setCredentials] = useState<ApiCredentials>({
    sentinelHub: { enabled: false, clientId: '', clientSecret: '' },
    carbonCredit: { enabled: false, apiKey: '', baseUrl: 'https://api.carbonregistry.com/v1' },
    africasTalking: { enabled: false, username: '', apiKey: '', senderId: '', sandboxMode: true },
    whatsapp: { enabled: false, accessToken: '', appId: '', phoneNumberId: '', verifyToken: '' },
    twilioWhatsapp: { enabled: false, accountSid: '', authToken: '', phoneNumber: '' },
    elevenLabs: { enabled: false, apiKey: '', agentId: '' },
    maps: { provider: 'google', googleMapsApiKey: '', mapboxAccessToken: '', hereApiKey: '' }
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testResults, setTestResults] = useState<Record<string, { success: boolean; message: string } | null>>({});
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [activeSection, setActiveSection] = useState<string>('maps');

  useEffect(() => {
    loadCredentials();
  }, []);

  const loadCredentials = async () => {
    try {
      const data = await apiCredentialsService.getCredentials();
      if (data) {
        setCredentials(prev => ({ ...prev, ...data }));
      }
    } catch (error) {
      console.error('Failed to load credentials:', error);
    }
  };

  const saveCredentials = async () => {
    setSaving(true);
    try {
      await apiCredentialsService.saveCredentials(credentials);
      alert('Credentials saved successfully!');
    } catch (error) {
      console.error('Failed to save credentials:', error);
      alert('Failed to save credentials');
    } finally {
      setSaving(false);
    }
  };

  const testApi = async (service: string) => {
    setLoading(true);
    setTestResults(prev => ({ ...prev, [service]: null }));

    try {
      let result;
      switch (service) {
        case 'sentinel':
          result = await apiCredentialsService.testSentinelHub(
            credentials.sentinelHub.clientId,
            credentials.sentinelHub.clientSecret
          );
          break;
        case 'carbon':
          result = await apiCredentialsService.testCarbonCredit(
            credentials.carbonCredit.apiKey,
            credentials.carbonCredit.baseUrl
          );
          break;
        case 'africasTalking':
          result = await apiCredentialsService.testAfricasTalking(
            credentials.africasTalking.username,
            credentials.africasTalking.apiKey,
            credentials.africasTalking.senderId,
            credentials.africasTalking.sandboxMode
          );
          break;
        case 'whatsapp':
          result = await apiCredentialsService.testWhatsApp(
            credentials.whatsapp.accessToken,
            credentials.whatsapp.appId,
            credentials.whatsapp.phoneNumberId
          );
          break;
        case 'twilioWhatsapp':
          result = await apiCredentialsService.testTwilioWhatsapp(
            credentials.twilioWhatsapp.accountSid,
            credentials.twilioWhatsapp.authToken,
            credentials.twilioWhatsapp.phoneNumber
          );
          break;
        case 'elevenLabs':
          result = await apiCredentialsService.testElevenLabs(
            credentials.elevenLabs.apiKey,
            credentials.elevenLabs.agentId
          );
          break;
        case 'maps':
          result = await apiCredentialsService.testMaps(
            credentials.maps.provider,
            credentials.maps.googleMapsApiKey,
            credentials.maps.mapboxAccessToken,
            credentials.maps.hereApiKey
          );
          break;
        default:
          throw new Error('Unknown service');
      }
      setTestResults(prev => ({ ...prev, [service]: result }));
    } catch (error) {
      setTestResults(prev => ({ 
        ...prev, 
        [service]: { 
          success: false, 
          message: error instanceof Error ? error.message : 'Test failed' 
        }
      }));
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = (field: string) => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const updateCredentials = (section: keyof ApiCredentials, field: string, value: any) => {
    setCredentials(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const sections = [
    { id: 'maps', name: 'Maps', icon: Map, color: 'warning' },
    { id: 'elevenLabs', name: 'ElevenLabs Voice', icon: Mic, color: 'genz-green' },
    { id: 'sentinel', name: 'Sentinel Hub', icon: Satellite, color: 'primary' },
    { id: 'carbon', name: 'Carbon Credits', icon: Leaf, color: 'success' },
    { id: 'twilioWhatsapp', name: 'Twilio WhatsApp', icon: MessageCircle, color: 'green' },
    { id: 'whatsapp', name: 'Meta WhatsApp', icon: MessageCircle, color: 'accent' },
    { id: 'africasTalking', name: "Africa's Talking", icon: Phone, color: 'secondary' }
  ];

  const renderTestResult = (service: string) => {
    const result = testResults[service];
    if (!result) return null;

    return (
      <div className={`mt-3 p-3 rounded-lg flex items-start space-x-2 ${
        result.success ? 'bg-success-50 border border-success-200' : 'bg-error-50 border border-error-200'
      }`}>
        {result.success ? (
          <CheckCircle className="w-5 h-5 text-success-600 mt-0.5" />
        ) : (
          <XCircle className="w-5 h-5 text-error-600 mt-0.5" />
        )}
        <div>
          <h4 className={`font-medium ${result.success ? 'text-success-900' : 'text-error-900'}`}>
            {result.success ? 'Success!' : 'Error'}
          </h4>
          <p className={`text-sm ${result.success ? 'text-success-700' : 'text-error-700'}`}>
            {result.message}
          </p>
        </div>
      </div>
    );
  };

  const renderPasswordInput = (
    label: string,
    value: string,
    onChange: (value: string) => void,
    fieldKey: string,
    placeholder?: string
  ) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      <div className="relative">
        <input
          type={showPasswords[fieldKey] ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
        <button
          type="button"
          onClick={() => togglePasswordVisibility(fieldKey)}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          {showPasswords[fieldKey] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Enhanced Settings</h1>
          <p className="text-gray-600 mt-1">Configure API integrations and platform settings</p>
        </div>
        <button
          onClick={saveCredentials}
          disabled={saving}
          className="px-6 py-2 bg-genz-green-600 text-white rounded-lg hover:bg-genz-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 shadow-glow-green transition-all duration-300"
        >
          {saving ? <Loader className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>{saving ? 'Saving...' : 'Save All'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Navigation */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-card p-4 border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">API Services</h3>
            <nav className="space-y-2">
              {sections.map((section) => {
                const Icon = section.icon;
                const isActive = activeSection === section.id;
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                      isActive 
                        ? 'bg-genz-green-50 text-genz-green-700 border-r-2 border-genz-green-500' 
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{section.name}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-xl shadow-card p-6 border border-gray-100">
            
            {/* ElevenLabs Voice */}
            {activeSection === 'elevenLabs' && (
              <div>
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-10 h-10 bg-genz-green-100 rounded-lg flex items-center justify-center">
                    <Mic className="w-5 h-5 text-genz-green-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">ElevenLabs Voice Integration</h3>
                    <p className="text-sm text-gray-500">Configure voice-first farmer enrollment with conversational AI</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="elevenlabs-enabled"
                      checked={credentials.elevenLabs.enabled}
                      onChange={(e) => updateCredentials('elevenLabs', 'enabled', e.target.checked)}
                      className="rounded border-gray-300 text-genz-green-600 focus:ring-genz-green-500"
                    />
                    <label htmlFor="elevenlabs-enabled" className="text-sm font-medium text-gray-700">
                      Enable ElevenLabs Voice Integration
                    </label>
                  </div>

                  {renderPasswordInput(
                    'API Key',
                    credentials.elevenLabs.apiKey,
                    (value) => updateCredentials('elevenLabs', 'apiKey', value),
                    'elevenlabs-key',
                    'Enter your ElevenLabs API key'
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Agent ID</label>
                    <input
                      type="text"
                      value={credentials.elevenLabs.agentId}
                      onChange={(e) => updateCredentials('elevenLabs', 'agentId', e.target.value)}
                      placeholder="Enter your ElevenLabs Agent ID"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-genz-green-500 focus:border-transparent"
                    />
                  </div>

                  <div className="flex space-x-3">
                    <button
                      onClick={() => testApi('elevenLabs')}
                      disabled={loading || !credentials.elevenLabs.apiKey || !credentials.elevenLabs.agentId}
                      className="px-4 py-2 bg-genz-green-600 text-white rounded-lg hover:bg-genz-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 shadow-glow-green transition-all duration-300"
                    >
                      {loading ? <Loader className="w-4 h-4 animate-spin" /> : <TestTube className="w-4 h-4" />}
                      <span>Test Connection</span>
                    </button>
                  </div>

                  {renderTestResult('elevenLabs')}

                  <div className="bg-gradient-to-r from-genz-green-50 to-electric-lime-50 rounded-lg p-4 border border-genz-green-200">
                    <h4 className="font-medium text-genz-green-900 mb-2">Setup Instructions:</h4>
                    <ol className="text-sm text-genz-green-700 space-y-1 list-decimal list-inside">
                      <li>Create account at <a href="https://elevenlabs.io/" target="_blank" rel="noopener noreferrer" className="text-genz-green-600 hover:underline">elevenlabs.io</a></li>
                      <li>Navigate to your API settings and generate an API key</li>
                      <li>Create a Conversational AI agent for farmer enrollment</li>
                      <li>Configure the agent with agricultural knowledge and carbon credit information</li>
                      <li>Copy your Agent ID from the agent settings</li>
                    </ol>
                  </div>
                </div>
              </div>
            )}

            {/* Twilio WhatsApp */}
            {activeSection === 'twilioWhatsapp' && (
              <div>
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <MessageCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Twilio WhatsApp Configuration</h3>
                    <p className="text-sm text-gray-500">Configure WhatsApp messaging via Twilio</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="twilio-whatsapp-enabled"
                      checked={credentials.twilioWhatsapp.enabled}
                      onChange={(e) => updateCredentials('twilioWhatsapp', 'enabled', e.target.checked)}
                      className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                    />
                    <label htmlFor="twilio-whatsapp-enabled" className="text-sm font-medium text-gray-700">
                      Enable Twilio WhatsApp Integration
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Account SID</label>
                    <input
                      type="text"
                      value={credentials.twilioWhatsapp.accountSid}
                      onChange={(e) => updateCredentials('twilioWhatsapp', 'accountSid', e.target.value)}
                      placeholder="Enter your Twilio Account SID"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>

                  {renderPasswordInput(
                    'Auth Token',
                    credentials.twilioWhatsapp.authToken,
                    (value) => updateCredentials('twilioWhatsapp', 'authToken', value),
                    'twilio-whatsapp-token',
                    'Enter your Twilio Auth Token'
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">WhatsApp Phone Number</label>
                    <input
                      type="tel"
                      value={credentials.twilioWhatsapp.phoneNumber}
                      onChange={(e) => updateCredentials('twilioWhatsapp', 'phoneNumber', e.target.value)}
                      placeholder="whatsapp:+14155238886"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>

                  <div className="flex space-x-3">
                    <button
                      onClick={() => testApi('twilioWhatsapp')}
                      disabled={loading || !credentials.twilioWhatsapp.accountSid || !credentials.twilioWhatsapp.authToken}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                    >
                      {loading ? <Loader className="w-4 h-4 animate-spin" /> : <TestTube className="w-4 h-4" />}
                      <span>Test Connection</span>
                    </button>
                  </div>

                  {renderTestResult('twilioWhatsapp')}

                  <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                    <h4 className="font-medium text-green-900 mb-2">Setup Instructions:</h4>
                    <ol className="text-sm text-green-700 space-y-1 list-decimal list-inside">
                      <li>Create account at <a href="https://www.twilio.com/" target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline">twilio.com</a></li>
                      <li>Enable WhatsApp in your Twilio Console</li>
                      <li>Get your Account SID and Auth Token from the dashboard</li>
                      <li>Configure your WhatsApp sender phone number</li>
                      <li>Set up webhook endpoints for message handling</li>
                    </ol>
                  </div>
                </div>
              </div>
            )}

            {/* Maps */}
            {activeSection === 'maps' && (
              <div>
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-10 h-10 bg-warning-100 rounded-lg flex items-center justify-center">
                    <Map className="w-5 h-5 text-warning-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Maps Integration</h3>
                    <p className="text-sm text-gray-500">Configure mapping services for farmer location visualization</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Map Provider</label>
                    <select
                      value={credentials.maps.provider}
                      onChange={(e) => updateCredentials('maps', 'provider', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-warning-500 focus:border-transparent"
                    >
                      <option value="google">Google Maps</option>
                      <option value="mapbox">Mapbox</option>
                      <option value="here">HERE Maps</option>
                    </select>
                  </div>

                  {credentials.maps.provider === 'google' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Google Maps API Key</label>
                      <div className="relative">
                        <input
                          type={showPasswords['google-maps-key'] ? 'text' : 'password'}
                          value={credentials.maps.googleMapsApiKey}
                          onChange={(e) => updateCredentials('maps', 'googleMapsApiKey', e.target.value)}
                          placeholder="Enter your Google Maps API key"
                          className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-warning-500 focus:border-transparent"
                        />
                        <button
                          type="button"
                          onClick={() => togglePasswordVisibility('google-maps-key')}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showPasswords['google-maps-key'] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  )}

                  {credentials.maps.provider === 'mapbox' && (
                    renderPasswordInput(
                      'Mapbox Access Token',
                      credentials.maps.mapboxAccessToken,
                      (value) => updateCredentials('maps', 'mapboxAccessToken', value),
                      'mapbox-token',
                      'Enter your Mapbox access token'
                    )
                  )}

                  {credentials.maps.provider === 'here' && (
                    renderPasswordInput(
                      'HERE API Key',
                      credentials.maps.hereApiKey,
                      (value) => updateCredentials('maps', 'hereApiKey', value),
                      'here-key',
                      'Enter your HERE API key'
                    )
                  )}

                  <div className="flex space-x-3">
                    <button
                      onClick={() => testApi('maps')}
                      disabled={loading || (
                        credentials.maps.provider === 'google' && !credentials.maps.googleMapsApiKey ||
                        credentials.maps.provider === 'mapbox' && !credentials.maps.mapboxAccessToken ||
                        credentials.maps.provider === 'here' && !credentials.maps.hereApiKey
                      )}
                      className="px-4 py-2 bg-warning-600 text-white rounded-lg hover:bg-warning-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                    >
                      {loading ? <Loader className="w-4 h-4 animate-spin" /> : <TestTube className="w-4 h-4" />}
                      <span>Test Connection</span>
                    </button>
                  </div>

                  {renderTestResult('maps')}

                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">Setup Instructions:</h4>
                    <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                      <li>
                        <strong>Google Maps:</strong> Get API key from{' '}
                        <a href="https://developers.google.com/maps" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">
                          Google Cloud Console
                        </a>
                      </li>
                      <li>
                        <strong>Mapbox:</strong> Get access token from{' '}
                        <a href="https://mapbox.com/" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">
                          Mapbox Account
                        </a>
                      </li>
                      <li>
                        <strong>HERE:</strong> Get API key from{' '}
                        <a href="https://developer.here.com/" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">
                          HERE Developer Portal
                        </a>
                      </li>
                    </ul>
                  </div>

                  {/* Current Status */}
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <h4 className="font-medium text-blue-900 mb-2">Current Configuration</h4>
                    <div className="text-sm text-blue-800">
                      <p><strong>Provider:</strong> {credentials.maps.provider.charAt(0).toUpperCase() + credentials.maps.provider.slice(1)}</p>
                      <p><strong>API Key Status:</strong> {
                        credentials.maps.provider === 'google' && credentials.maps.googleMapsApiKey ? 'Configured' :
                        credentials.maps.provider === 'mapbox' && credentials.maps.mapboxAccessToken ? 'Configured' :
                        credentials.maps.provider === 'here' && credentials.maps.hereApiKey ? 'Configured' :
                        'Not configured'
                      }</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Sentinel Hub */}
            {activeSection === 'sentinel' && (
              <div>
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                    <Satellite className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Sentinel Hub Configuration</h3>
                    <p className="text-sm text-gray-500">Configure satellite data access</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="sentinel-enabled"
                      checked={credentials.sentinelHub.enabled}
                      onChange={(e) => updateCredentials('sentinelHub', 'enabled', e.target.checked)}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <label htmlFor="sentinel-enabled" className="text-sm font-medium text-gray-700">
                      Enable Sentinel Hub Integration
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Client ID</label>
                    <input
                      type="text"
                      value={credentials.sentinelHub.clientId}
                      onChange={(e) => updateCredentials('sentinelHub', 'clientId', e.target.value)}
                      placeholder="Enter your Sentinel Hub Client ID"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>

                  {renderPasswordInput(
                    'Client Secret',
                    credentials.sentinelHub.clientSecret,
                    (value) => updateCredentials('sentinelHub', 'clientSecret', value),
                    'sentinel-secret',
                    'Enter your Sentinel Hub Client Secret'
                  )}

                  <div className="flex space-x-3">
                    <button
                      onClick={() => testApi('sentinel')}
                      disabled={loading || !credentials.sentinelHub.clientId || !credentials.sentinelHub.clientSecret}
                      className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                    >
                      {loading ? <Loader className="w-4 h-4 animate-spin" /> : <TestTube className="w-4 h-4" />}
                      <span>Test Connection</span>
                    </button>
                  </div>

                  {renderTestResult('sentinel')}

                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">Setup Instructions:</h4>
                    <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
                      <li>Create account at <a href="https://www.sentinel-hub.com/" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">sentinel-hub.com</a></li>
                      <li>Go to your dashboard and create a new OAuth client</li>
                      <li>Copy your Client ID and Client Secret</li>
                      <li>Enable the required APIs for your use case</li>
                    </ol>
                  </div>
                </div>
              </div>
            )}

            {/* Carbon Credits */}
            {activeSection === 'carbon' && (
              <div>
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-10 h-10 bg-success-100 rounded-lg flex items-center justify-center">
                    <Leaf className="w-5 h-5 text-success-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Carbon Credit API</h3>
                    <p className="text-sm text-gray-500">Configure carbon credit marketplace integration</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="carbon-enabled"
                      checked={credentials.carbonCredit.enabled}
                      onChange={(e) => updateCredentials('carbonCredit', 'enabled', e.target.checked)}
                      className="rounded border-gray-300 text-success-600 focus:ring-success-500"
                    />
                    <label htmlFor="carbon-enabled" className="text-sm font-medium text-gray-700">
                      Enable Carbon Credit Integration
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Base URL</label>
                    <input
                      type="url"
                      value={credentials.carbonCredit.baseUrl}
                      onChange={(e) => updateCredentials('carbonCredit', 'baseUrl', e.target.value)}
                      placeholder="https://api.carbonregistry.com/v1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-success-500 focus:border-transparent"
                    />
                  </div>

                  {renderPasswordInput(
                    'API Key',
                    credentials.carbonCredit.apiKey,
                    (value) => updateCredentials('carbonCredit', 'apiKey', value),
                    'carbon-key',
                    'Enter your Carbon Credit API key'
                  )}

                  <div className="flex space-x-3">
                    <button
                      onClick={() => testApi('carbon')}
                      disabled={loading || !credentials.carbonCredit.apiKey}
                      className="px-4 py-2 bg-success-600 text-white rounded-lg hover:bg-success-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                    >
                      {loading ? <Loader className="w-4 h-4 animate-spin" /> : <TestTube className="w-4 h-4" />}
                      <span>Test Connection</span>
                    </button>
                  </div>

                  {renderTestResult('carbon')}
                </div>
              </div>
            )}

            {/* Meta WhatsApp */}
            {activeSection === 'whatsapp' && (
              <div>
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <MessageCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Meta WhatsApp Business API</h3>
                    <p className="text-sm text-gray-500">Configure WhatsApp messaging via Meta</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="whatsapp-enabled"
                      checked={credentials.whatsapp.enabled}
                      onChange={(e) => updateCredentials('whatsapp', 'enabled', e.target.checked)}
                      className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                    />
                    <label htmlFor="whatsapp-enabled" className="text-sm font-medium text-gray-700">
                      Enable Meta WhatsApp Integration
                    </label>
                  </div>

                  {renderPasswordInput(
                    'Access Token',
                    credentials.whatsapp.accessToken,
                    (value) => updateCredentials('whatsapp', 'accessToken', value),
                    'whatsapp-token',
                    'Enter your WhatsApp Access Token'
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">App ID</label>
                    <input
                      type="text"
                      value={credentials.whatsapp.appId}
                      onChange={(e) => updateCredentials('whatsapp', 'appId', e.target.value)}
                      placeholder="Enter your WhatsApp App ID"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number ID</label>
                    <input
                      type="text"
                      value={credentials.whatsapp.phoneNumberId}
                      onChange={(e) => updateCredentials('whatsapp', 'phoneNumberId', e.target.value)}
                      placeholder="Enter your WhatsApp Phone Number ID"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Verify Token</label>
                    <input
                      type="text"
                      value={credentials.whatsapp.verifyToken}
                      onChange={(e) => updateCredentials('whatsapp', 'verifyToken', e.target.value)}
                      placeholder="Enter your webhook verify token"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>

                  <div className="flex space-x-3">
                    <button
                      onClick={() => testApi('whatsapp')}
                      disabled={loading || !credentials.whatsapp.accessToken || !credentials.whatsapp.appId}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                    >
                      {loading ? <Loader className="w-4 h-4 animate-spin" /> : <TestTube className="w-4 h-4" />}
                      <span>Test Connection</span>
                    </button>
                  </div>

                  {renderTestResult('whatsapp')}
                </div>
              </div>
            )}

            {/* Africa's Talking */}
            {activeSection === 'africasTalking' && (
              <div>
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Phone className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Africa's Talking Configuration</h3>
                    <p className="text-sm text-gray-500">Configure SMS and voice services for Africa</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="africasTalking-enabled"
                      checked={credentials.africasTalking.enabled}
                      onChange={(e) => updateCredentials('africasTalking', 'enabled', e.target.checked)}
                      className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                    />
                    <label htmlFor="africasTalking-enabled" className="text-sm font-medium text-gray-700">
                      Enable Africa's Talking Integration
                    </label>
                  </div>

                  {/* Sandbox Mode Toggle */}
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <input
                        type="checkbox"
                        id="africasTalking-sandbox"
                        checked={credentials.africasTalking.sandboxMode}
                        onChange={(e) => updateCredentials('africasTalking', 'sandboxMode', e.target.checked)}
                        className="rounded border-gray-300 text-yellow-600 focus:ring-yellow-500"
                      />
                      <label htmlFor="africasTalking-sandbox" className="text-sm font-medium text-yellow-900">
                        Sandbox Mode
                      </label>
                    </div>
                    <p className="text-xs text-yellow-800">
                      {credentials.africasTalking.sandboxMode 
                        ? '🧪 Using sandbox environment for testing (messages go to simulator)'
                        : '🚀 Using production environment (real SMS/calls will be sent)'
                      }
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Username {credentials.africasTalking.sandboxMode && <span className="text-yellow-600">(always "sandbox" in sandbox mode)</span>}
                    </label>
                    <input
                      type="text"
                      value={credentials.africasTalking.sandboxMode ? 'sandbox' : credentials.africasTalking.username}
                      onChange={(e) => updateCredentials('africasTalking', 'username', e.target.value)}
                      placeholder={credentials.africasTalking.sandboxMode ? 'sandbox (fixed)' : 'Enter your Africa\'s Talking username'}
                      disabled={credentials.africasTalking.sandboxMode}
                      className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                        credentials.africasTalking.sandboxMode ? 'bg-gray-100 text-gray-500' : ''
                      }`}
                    />
                  </div>

                  {renderPasswordInput(
                    'API Key',
                    credentials.africasTalking.apiKey,
                    (value) => updateCredentials('africasTalking', 'apiKey', value),
                    'africasTalking-key',
                    'Enter your Africa\'s Talking API Key'
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Sender ID (Optional)</label>
                    <input
                      type="text"
                      value={credentials.africasTalking.senderId}
                      onChange={(e) => updateCredentials('africasTalking', 'senderId', e.target.value)}
                      placeholder="Enter your registered Sender ID"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>

                  <div className="flex space-x-3">
                    <button
                      onClick={() => testApi('africasTalking')}
                      disabled={loading || !credentials.africasTalking.username || !credentials.africasTalking.apiKey}
                      className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                    >
                      {loading ? <Loader className="w-4 h-4 animate-spin" /> : <TestTube className="w-4 h-4" />}
                      <span>Test Connection</span>
                    </button>
                  </div>

                  {renderTestResult('africasTalking')}

                  <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                    <h4 className="font-medium text-orange-900 mb-2">Setup Instructions:</h4>
                    <div className="space-y-3">
                      <div>
                        <h5 className="font-medium text-orange-800 text-sm">For Sandbox Testing:</h5>
                        <ol className="text-sm text-orange-700 space-y-1 list-decimal list-inside ml-2">
                          <li>Log into your account and click the orange "Go To Sandbox App" button</li>
                          <li>Click on Settings in the left menu</li>
                          <li>Click on API Key</li>
                          <li>Enter your password and click Generate</li>
                          <li>Wait about 3 minutes before testing the new key</li>
                          <li>Enable "Sandbox Mode" above</li>
                        </ol>
                      </div>
                      <div>
                        <h5 className="font-medium text-orange-800 text-sm">For Production:</h5>
                        <ol className="text-sm text-orange-700 space-y-1 list-decimal list-inside ml-2">
                          <li>Get your production username and API key from the main dashboard</li>
                          <li>Register a Sender ID for SMS services</li>
                          <li>Top up your account with credits</li>
                          <li>Disable "Sandbox Mode" above</li>
                        </ol>
                      </div>
                    </div>
                    <div className="mt-3 p-3 bg-orange-100 rounded border border-orange-300">
                      <p className="text-sm text-orange-800">
                        <strong>API Endpoints:</strong><br />
                        • Sandbox: api.sandbox.africastalking.com<br />
                        • Production: api.africastalking.com
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;