export interface Farmer {
  id: number;
  phoneNumber: string;
  fullName: string;
  locationName: string;
  latitude: number;
  longitude: number;
  preferredLanguage: string;
  createdAt: string;
  crop?: string;
  lastContact?: string;
  crop_details?: Array<{ crop_type: string; hectareage: number }>;
  field_locations?: Array<{ 
    field_name: string; 
    latitude: number; 
    longitude: number; 
    bounding_box?: number[][] 
  }>;
}

export interface IVRCall {
  id: number;
  farmerId: number;
  callTime: string;
  cropSelected: string;
  cropCondition: 1 | 2 | 3; // 1 = Good, 2 = Okay, 3 = Poor
  rainRecent: boolean;
  optedInCarbon: boolean;
  transcript?: string;
  callType?: 'traditional_ivr' | 'elevenlabs_voice' | 'whatsapp';
}

export interface SatelliteInsight {
  id: number;
  farmerId: number;
  imageDate: string;
  ndviScore: number;
  soilMoisture: number;
  vegetationIndex: number;
  recommendation: string;
  imageUrl?: string;
  sentinelData?: {
    fieldBoundaries?: Array<{ 
      field_name: string; 
      latitude: number; 
      longitude: number; 
      bounding_box?: number[][] 
    }>;
    enhancedPrecision?: boolean;
    fieldCount?: number;
    managementScore?: string;
  };
}

export interface CarbonCredit {
  id: number;
  farmerId: number;
  optInDate: string;
  practicesReported: string;
  verificationStatus: 'pending' | 'verified' | 'rejected';
  estimatedCredits: number;
}

export interface DashboardStats {
  totalFarmers: number;
  totalIVRCalls: number;
  totalSatelliteInsights: number;
  totalCarbonOptIns: number;
}