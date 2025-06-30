import axios from 'axios';

interface ApiCredentials {
  sentinelHub?: {
    enabled: boolean;
    clientId: string;
    clientSecret: string;
  };
  carbonCredit?: {
    enabled: boolean;
    apiKey: string;
    baseUrl: string;
  };
  africasTalking?: {
    enabled: boolean;
    username: string;
    apiKey: string;
    senderId: string;
    sandboxMode: boolean;
  };
  whatsapp?: {
    enabled: boolean;
    accessToken: string;
    appId: string;
    phoneNumberId: string;
    verifyToken: string;
  };
  twilioWhatsapp?: {
    enabled: boolean;
    accountSid: string;
    authToken: string;
    phoneNumber: string;
  };
  elevenLabs?: {
    enabled: boolean;
    apiKey: string;
    agentId: string;
  };
  maps?: {
    provider: 'google' | 'mapbox' | 'here';
    googleMapsApiKey: string;
    mapboxAccessToken: string;
    hereApiKey: string;
  };
}

class ApiCredentialsService {
  private supabaseUrl: string;
  private supabaseKey: string;

  constructor() {
    this.supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
    this.supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
  }

  async getCredentials(): Promise<ApiCredentials | null> {
    try {
      const response = await axios.get(
        `${this.supabaseUrl}/functions/v1/get-api-credentials`,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.supabaseKey}`
          }
        }
      );

      return response.data.credentials;
    } catch (error) {
      console.error('Failed to get credentials:', error);
      return null;
    }
  }

  async saveCredentials(credentials: ApiCredentials): Promise<void> {
    try {
      const response = await axios.post(
        `${this.supabaseUrl}/functions/v1/save-api-credentials`,
        { credentials },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.supabaseKey}`
          }
        }
      );

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to save credentials');
      }
    } catch (error) {
      console.error('Failed to save credentials:', error);
      throw error;
    }
  }

  async testSentinelHub(clientId: string, clientSecret: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await axios.post(
        `${this.supabaseUrl}/functions/v1/test-sentinel-hub`,
        { clientId, clientSecret },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.supabaseKey}`
          }
        }
      );

      return response.data;
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Test failed'
      };
    }
  }

  async testCarbonCredit(apiKey: string, baseUrl: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await axios.post(
        `${this.supabaseUrl}/functions/v1/test-carbon-credit`,
        { apiKey, baseUrl },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.supabaseKey}`
          }
        }
      );

      return response.data;
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Test failed'
      };
    }
  }

  async testAfricasTalking(username: string, apiKey: string, senderId?: string, sandboxMode: boolean = false): Promise<{ success: boolean; message: string }> {
    try {
      const response = await axios.post(
        `${this.supabaseUrl}/functions/v1/test-africastalking`,
        { username, apiKey, senderId, sandboxMode },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.supabaseKey}`
          }
        }
      );

      return response.data;
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Test failed'
      };
    }
  }

  async testWhatsApp(accessToken: string, appId: string, phoneNumberId: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await axios.post(
        `${this.supabaseUrl}/functions/v1/test-whatsapp`,
        { accessToken, appId, phoneNumberId },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.supabaseKey}`
          }
        }
      );

      return response.data;
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Test failed'
      };
    }
  }

  async testTwilioWhatsapp(accountSid: string, authToken: string, phoneNumber: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await axios.post(
        `${this.supabaseUrl}/functions/v1/test-twilio-whatsapp`,
        { accountSid, authToken, phoneNumber },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.supabaseKey}`
          }
        }
      );

      return response.data;
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Test failed'
      };
    }
  }

  async testElevenLabs(apiKey: string, agentId: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await axios.post(
        `${this.supabaseUrl}/functions/v1/test-elevenlabs`,
        { apiKey, agentId },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.supabaseKey}`
          }
        }
      );

      return response.data;
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Test failed'
      };
    }
  }

  async testMaps(
    provider: string,
    googleMapsApiKey: string,
    mapboxAccessToken: string,
    hereApiKey: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const response = await axios.post(
        `${this.supabaseUrl}/functions/v1/test-maps`,
        { provider, googleMapsApiKey, mapboxAccessToken, hereApiKey },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.supabaseKey}`
          }
        }
      );

      return response.data;
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Test failed'
      };
    }
  }
}

export const apiCredentialsService = new ApiCredentialsService();