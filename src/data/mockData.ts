import { Farmer, IVRCall, SatelliteInsight, CarbonCredit } from '../types';

export const mockFarmers: Farmer[] = [
  {
    id: 1,
    phoneNumber: '123-456-7890',
    fullName: 'John Smith',
    locationName: 'North Valley Farm',
    latitude: 40.7128,
    longitude: -74.0060,
    preferredLanguage: 'English',
    createdAt: '2024-04-20T10:00:00Z',
    crop: 'Maize',
    lastContact: '04/20'
  },
  {
    id: 2,
    phoneNumber: '234-567-8801',
    fullName: 'Maria Garcia',
    locationName: 'Sunrise Agriculture',
    latitude: 41.8781,
    longitude: -87.6298,
    preferredLanguage: 'Spanish',
    createdAt: '2024-04-19T09:30:00Z',
    crop: 'Sorghum',
    lastContact: '04/19'
  },
  {
    id: 3,
    phoneNumber: '345-678-9012',
    fullName: 'Raj Patel',
    locationName: 'Golden Fields',
    latitude: 39.7392,
    longitude: -104.9903,
    preferredLanguage: 'Hindi',
    createdAt: '2024-04-18T14:15:00Z',
    crop: 'Rice',
    lastContact: '04/18'
  },
  {
    id: 4,
    phoneNumber: '456-789-0123',
    fullName: 'Sarah Johnson',
    locationName: 'Green Acres',
    latitude: 34.0522,
    longitude: -118.2437,
    preferredLanguage: 'English',
    createdAt: '2024-04-17T11:45:00Z',
    crop: 'Maize',
    lastContact: '04/17'
  },
  // Add more farmers to reach ~920 total for realistic demo
  ...Array.from({ length: 916 }, (_, i) => ({
    id: i + 5,
    phoneNumber: `${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
    fullName: `Farmer ${i + 5}`,
    locationName: `Farm Location ${i + 5}`,
    latitude: 30 + Math.random() * 20,
    longitude: -120 + Math.random() * 40,
    preferredLanguage: ['English', 'Spanish', 'Hindi', 'French'][Math.floor(Math.random() * 4)],
    createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
    crop: ['Maize', 'Rice', 'Wheat', 'Sorghum', 'Barley'][Math.floor(Math.random() * 5)],
    lastContact: `${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}/${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`
  }))
];

export const mockIVRCalls: IVRCall[] = Array.from({ length: 1250 }, (_, i) => ({
  id: i + 1,
  farmerId: Math.floor(Math.random() * 920) + 1,
  callTime: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
  cropSelected: ['Maize', 'Rice', 'Wheat', 'Sorghum', 'Barley'][Math.floor(Math.random() * 5)],
  cropCondition: [1, 2, 3][Math.floor(Math.random() * 3)] as 1 | 2 | 3,
  rainRecent: Math.random() > 0.5,
  optedInCarbon: Math.random() > 0.7,
  transcript: `Farmer reported ${['good', 'average', 'poor'][Math.floor(Math.random() * 3)]} crop conditions.`
}));

export const mockSatelliteInsights: SatelliteInsight[] = Array.from({ length: 370 }, (_, i) => ({
  id: i + 1,
  farmerId: Math.floor(Math.random() * 920) + 1,
  imageDate: new Date(Date.now() - Math.random() * 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  ndviScore: Math.random() * 0.8 + 0.2,
  soilMoisture: Math.random() * 80 + 20,
  vegetationIndex: Math.random() * 100,
  recommendation: [
    'Optimal growing conditions detected',
    'Consider irrigation in north field',
    'Vegetation stress detected - check for pests',
    'Excellent crop health indicators'
  ][Math.floor(Math.random() * 4)]
}));

export const mockCarbonCredits: CarbonCredit[] = Array.from({ length: 145 }, (_, i) => ({
  id: i + 1,
  farmerId: Math.floor(Math.random() * 920) + 1,
  optInDate: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  practicesReported: ['No-till farming', 'Cover cropping', 'Rotational grazing', 'Agroforestry'][Math.floor(Math.random() * 4)],
  verificationStatus: ['pending', 'verified', 'rejected'][Math.floor(Math.random() * 3)] as 'pending' | 'verified' | 'rejected',
  estimatedCredits: Math.random() * 50 + 10
}));