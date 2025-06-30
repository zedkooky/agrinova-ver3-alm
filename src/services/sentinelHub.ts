import axios from 'axios'

interface SentinelHubConfig {
  clientId: string
  clientSecret: string
  baseUrl: string
}

interface SatelliteInsight {
  farmerId: string
  imageDate: string
  ndviScore: number
  soilMoisture: number
  vegetationIndex: number
  recommendation: string
  imageUrl?: string
  sentinelData?: any
}

interface SatelliteDataResponse {
  success: boolean
  data?: SatelliteInsight
  error?: string
  source: 'api' | 'mock'
}

interface FieldBoundary {
  field_name: string
  latitude: number
  longitude: number
  bounding_box?: number[][]
}

class SentinelHubService {
  private config: SentinelHubConfig

  constructor() {
    this.config = {
      clientId: '',
      clientSecret: '',
      baseUrl: 'https://services.sentinel-hub.com'
    }
  }

  // Load credentials from database via API
  private async loadCredentials(): Promise<boolean> {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      const response = await axios.get(
        `${supabaseUrl}/functions/v1/get-api-credentials`,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
          }
        }
      )

      if (response.data.success && response.data.credentials?.sentinelHub) {
        const creds = response.data.credentials.sentinelHub
        this.config.clientId = creds.clientId || ''
        this.config.clientSecret = creds.clientSecret || ''
        return creds.enabled && this.config.clientId && this.config.clientSecret
      }
      
      return false
    } catch (error) {
      console.error('Failed to load Sentinel Hub credentials:', error)
      return false
    }
  }

  // Enhanced satellite insights with field boundary support
  async getSatelliteInsights(
    farmerId: string,
    latitude: number,
    longitude: number,
    startDate: string,
    endDate: string,
    fieldBoundaries?: FieldBoundary[]
  ): Promise<SatelliteInsight> {
    console.log('🛰️ Getting enhanced satellite insights for farmer:', farmerId)
    console.log('📍 Location:', { latitude, longitude })
    console.log('📅 Date range:', { startDate, endDate })
    console.log('🗺️ Field boundaries:', fieldBoundaries?.length || 0, 'fields')

    try {
      // First try to load credentials from database
      const hasCredentials = await this.loadCredentials()
      
      if (hasCredentials) {
        console.log('✅ Sentinel Hub credentials found, attempting API call...')
        
        // Determine the best bounding box to use
        let bbox: number[]
        if (fieldBoundaries && fieldBoundaries.length > 0) {
          // Use field boundaries to create optimal bounding box
          bbox = this.calculateOptimalBoundingBox(fieldBoundaries)
          console.log('📐 Using field-based bounding box:', bbox)
        } else {
          // Fallback to point-based bounding box
          bbox = [longitude - 0.005, latitude - 0.005, longitude + 0.005, latitude + 0.005]
          console.log('📐 Using point-based bounding box:', bbox)
        }
        
        // Try to get real data from Sentinel Hub
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
        const response = await axios.post(
          `${supabaseUrl}/functions/v1/sentinel-hub-integration`,
          {
            farmerId,
            latitude,
            longitude,
            startDate,
            endDate,
            bbox,
            fieldBoundaries,
            credentials: {
              clientId: this.config.clientId,
              clientSecret: this.config.clientSecret
            }
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
            },
            timeout: 15000 // 15 second timeout
          }
        )

        if (response.data && response.data.farmerId) {
          console.log('✅ Real satellite data retrieved from Sentinel Hub API')
          return {
            ...response.data,
            sentinelData: {
              ...response.data.sentinelData,
              dataSource: 'Sentinel Hub API',
              apiResponse: true,
              fieldBoundaries: fieldBoundaries || [],
              bbox,
              enhancedPrecision: fieldBoundaries && fieldBoundaries.length > 0
            }
          }
        }
      } else {
        console.log('⚠️ Sentinel Hub credentials not configured, using enhanced mock data')
      }
    } catch (error) {
      console.error('❌ Failed to get real satellite data:', error)
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED') {
          console.log('⏱️ API request timed out, falling back to enhanced mock data')
        } else if (error.response?.status === 401) {
          console.log('🔐 Authentication failed, check Sentinel Hub credentials')
        } else if (error.response?.status === 429) {
          console.log('🚫 Rate limit exceeded, falling back to enhanced mock data')
        }
      }
    }
    
    // Fallback to enhanced mock data with field boundary awareness
    console.log('📊 Generating enhanced mock satellite data with field awareness...')
    const mockData = this.generateEnhancedMockData(farmerId, latitude, longitude, endDate, fieldBoundaries)
    console.log('✅ Enhanced mock satellite data generated:', {
      ndvi: mockData.ndviScore,
      moisture: mockData.soilMoisture,
      vegetation: mockData.vegetationIndex,
      fields: fieldBoundaries?.length || 0
    })
    
    return mockData
  }

  // Calculate optimal bounding box from field boundaries
  private calculateOptimalBoundingBox(fieldBoundaries: FieldBoundary[]): number[] {
    let minLat = Infinity, maxLat = -Infinity
    let minLng = Infinity, maxLng = -Infinity

    fieldBoundaries.forEach(field => {
      if (field.bounding_box && field.bounding_box.length > 0) {
        // Use explicit bounding box if provided
        field.bounding_box.forEach(coord => {
          const [lng, lat] = coord
          minLat = Math.min(minLat, lat)
          maxLat = Math.max(maxLat, lat)
          minLng = Math.min(minLng, lng)
          maxLng = Math.max(maxLng, lng)
        })
      } else {
        // Use field center point with buffer
        const buffer = 0.002 // ~200m buffer
        minLat = Math.min(minLat, field.latitude - buffer)
        maxLat = Math.max(maxLat, field.latitude + buffer)
        minLng = Math.min(minLng, field.longitude - buffer)
        maxLng = Math.max(maxLng, field.longitude + buffer)
      }
    })

    // Add small buffer to ensure all fields are covered
    const buffer = 0.001
    return [
      minLng - buffer,
      minLat - buffer,
      maxLng + buffer,
      maxLat + buffer
    ]
  }

  // Generate enhanced mock data with field boundary awareness
  private generateEnhancedMockData(
    farmerId: string, 
    latitude: number, 
    longitude: number, 
    date: string, 
    fieldBoundaries?: FieldBoundary[]
  ): SatelliteInsight {
    // Create a seed based on farmer ID and date for consistency
    const seed = this.hashCode(farmerId + date)
    const random = this.seededRandom(seed)
    
    // Enhanced calculations based on field data
    const fieldCount = fieldBoundaries?.length || 1
    const hasMultipleFields = fieldCount > 1
    
    // Base NDVI on latitude and field diversity
    const latitudeFactor = Math.max(0.3, 1 - Math.abs(latitude) / 90)
    const fieldDiversityBonus = hasMultipleFields ? 0.05 : 0
    
    // Seasonal factor based on date
    const month = new Date(date).getMonth()
    const seasonalFactor = this.getSeasonalFactor(month, latitude)
    
    // Climate zone factor
    const climateFactor = this.getClimateFactor(latitude, longitude)
    
    // Field management factor (multiple fields suggest better management)
    const managementFactor = hasMultipleFields ? 1.1 : 1.0
    
    // Generate enhanced NDVI score
    const baseNDVI = (latitudeFactor * seasonalFactor * climateFactor * managementFactor) + fieldDiversityBonus
    const ndviVariation = (random() - 0.5) * 0.15 // Reduced variation for better management
    const ndviScore = Math.max(0.1, Math.min(0.9, baseNDVI + ndviVariation))
    
    // Enhanced soil moisture with field-specific variations
    const baseMoisture = ndviScore * 55 + 25 // 25-80% range
    const fieldVariation = hasMultipleFields ? (random() - 0.5) * 15 : (random() - 0.5) * 20
    const soilMoisture = Math.max(15, Math.min(85, baseMoisture + fieldVariation))
    
    // Vegetation index with field management bonus
    const vegetationIndex = ndviScore * 95 + (hasMultipleFields ? 5 : 0)
    
    // Enhanced recommendation based on field data
    const recommendation = this.generateEnhancedRecommendation(
      ndviScore, 
      soilMoisture, 
      latitude, 
      longitude, 
      fieldBoundaries
    )

    return {
      farmerId,
      imageDate: date,
      ndviScore: Math.round(ndviScore * 1000) / 1000,
      soilMoisture: Math.round(soilMoisture * 10) / 10,
      vegetationIndex: Math.round(vegetationIndex * 10) / 10,
      recommendation,
      sentinelData: {
        bbox: fieldBoundaries ? this.calculateOptimalBoundingBox(fieldBoundaries) : 
              [longitude - 0.005, latitude - 0.005, longitude + 0.005, latitude + 0.005],
        acquisitionDate: date,
        cloudCoverage: Math.round(random() * 25), // Lower cloud coverage for better data
        processingLevel: 'L2A',
        coordinates: { latitude, longitude },
        season: this.getSeason(month, latitude),
        climateZone: this.getClimateZone(latitude, longitude),
        dataSource: 'Enhanced Mock Data',
        resolution: '10m',
        bands: ['B04', 'B08', 'B11', 'B12'],
        qualityScore: Math.round((0.75 + random() * 0.25) * 100) / 100,
        fieldBoundaries: fieldBoundaries || [],
        fieldCount,
        enhancedPrecision: hasMultipleFields,
        managementScore: hasMultipleFields ? 'Advanced' : 'Standard',
        apiResponse: false
      }
    }
  }

  // Enhanced recommendation generation with field awareness
  private generateEnhancedRecommendation(
    ndvi: number, 
    soilMoisture: number, 
    latitude: number, 
    longitude: number, 
    fieldBoundaries?: FieldBoundary[]
  ): string {
    const climateZone = this.getClimateZone(latitude, longitude)
    const month = new Date().getMonth()
    const season = this.getSeason(month, latitude)
    const fieldCount = fieldBoundaries?.length || 1
    const hasMultipleFields = fieldCount > 1
    
    let recommendation = ''
    
    // Field-specific insights
    if (hasMultipleFields) {
      recommendation += `Multi-field analysis (${fieldCount} fields mapped): `
    }
    
    // Primary assessment based on NDVI and soil moisture
    if (ndvi > 0.7 && soilMoisture > 60) {
      recommendation += `Excellent crop health detected across ${hasMultipleFields ? 'all fields' : 'the field'} in ${climateZone.toLowerCase()} ${season.toLowerCase()} conditions. `
      recommendation += hasMultipleFields ? 
        'Continue current field rotation practices and monitor for optimal harvest timing across fields. ' :
        'Continue current practices and consider harvest timing optimization. '
      recommendation += 'Field-specific monitoring recommended for the next 2-3 weeks.'
    } else if (ndvi > 0.6 && soilMoisture > 50) {
      recommendation += `Good vegetation health observed for ${season.toLowerCase()} season. `
      recommendation += hasMultipleFields ?
        'Maintain current irrigation schedule and consider field-specific fertilization based on individual field performance. ' :
        'Maintain current irrigation schedule and monitor crop development. '
      recommendation += 'Consider precision agriculture techniques for optimization.'
    } else if (ndvi > 0.4 && soilMoisture > 40) {
      recommendation += `Moderate vegetation health in ${climateZone.toLowerCase()} zone. `
      recommendation += hasMultipleFields ?
        'Field-specific analysis shows variation - prioritize irrigation and fertilization for underperforming fields. ' :
        'Consider increasing irrigation frequency and check for nutrient deficiencies. '
      recommendation += 'Soil testing recommended for targeted interventions.'
    } else if (ndvi > 0.3 && soilMoisture < 30) {
      recommendation += `Low soil moisture detected during ${season.toLowerCase()} season. `
      recommendation += hasMultipleFields ?
        'Immediate field-specific irrigation recommended - prioritize most critical fields first. ' :
        'Immediate irrigation recommended to prevent crop stress. '
      recommendation += 'Consider drought-resistant varieties for future planting cycles.'
    } else if (ndvi < 0.3) {
      recommendation += `Poor vegetation index detected in ${climateZone.toLowerCase()} conditions. `
      recommendation += hasMultipleFields ?
        'Urgent field-by-field assessment required - investigate potential causes across all mapped areas. ' :
        'Investigate potential causes: pests, disease, or severe nutrient deficiency. '
      recommendation += 'Consult agricultural extension services for immediate intervention.'
    } else {
      recommendation += `Mixed conditions detected for ${season.toLowerCase()} ${climateZone.toLowerCase()} farming. `
      recommendation += hasMultipleFields ?
        'Field-specific interventions recommended based on individual field performance data. ' :
        'Consider targeted interventions based on field observations. '
      recommendation += 'Enhanced monitoring recommended over the next 1-2 weeks.'
    }

    // Add field-specific advice
    if (hasMultipleFields) {
      recommendation += ` Field management advantage: Multiple mapped fields enable precision agriculture and optimized resource allocation.`
    }

    // Add climate-specific advice
    if (climateZone === 'Tropical' && soilMoisture > 70) {
      recommendation += ' Monitor for fungal diseases in high humidity conditions.'
    } else if (climateZone === 'Arid' && soilMoisture < 40) {
      recommendation += ' Water conservation techniques strongly recommended.'
    }

    return recommendation
  }

  // Hash function for consistent seeding
  private hashCode(str: string): number {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash)
  }

  // Seeded random number generator
  private seededRandom(seed: number) {
    let x = Math.sin(seed) * 10000
    return () => {
      x = Math.sin(x) * 10000
      return x - Math.floor(x)
    }
  }

  // Get seasonal factor based on month and latitude
  private getSeasonalFactor(month: number, latitude: number): number {
    // Northern hemisphere seasons
    if (latitude >= 0) {
      if (month >= 3 && month <= 8) return 0.8 // Spring/Summer
      return 0.5 // Fall/Winter
    } else {
      // Southern hemisphere (opposite seasons)
      if (month >= 9 || month <= 2) return 0.8 // Spring/Summer
      return 0.5 // Fall/Winter
    }
  }

  // Get climate factor based on location
  private getClimateFactor(latitude: number, longitude: number): number {
    const absLat = Math.abs(latitude)
    
    // Tropical zone (0-23.5°)
    if (absLat <= 23.5) return 0.9
    
    // Subtropical zone (23.5-35°)
    if (absLat <= 35) return 0.8
    
    // Temperate zone (35-60°)
    if (absLat <= 60) return 0.7
    
    // Polar zone (60-90°)
    return 0.4
  }

  // Get climate zone name
  private getClimateZone(latitude: number, longitude: number): string {
    const absLat = Math.abs(latitude)
    
    if (absLat <= 23.5) return 'Tropical'
    if (absLat <= 35) return 'Subtropical'
    if (absLat <= 60) return 'Temperate'
    return 'Polar'
  }

  // Get season name
  private getSeason(month: number, latitude: number): string {
    if (latitude >= 0) {
      if (month >= 3 && month <= 5) return 'Spring'
      if (month >= 6 && month <= 8) return 'Summer'
      if (month >= 9 && month <= 11) return 'Fall'
      return 'Winter'
    } else {
      if (month >= 9 || month <= 2) return 'Summer'
      if (month >= 3 && month <= 5) return 'Fall'
      if (month >= 6 && month <= 8) return 'Winter'
      return 'Spring'
    }
  }

  async getHistoricalData(
    latitude: number,
    longitude: number,
    months: number = 6,
    fieldBoundaries?: FieldBoundary[]
  ): Promise<Array<{ date: string; ndvi: number; moisture: number }>> {
    console.log('📈 Getting historical satellite data for', months, 'months with field awareness')
    
    const data = []
    const endDate = new Date()
    
    for (let i = 0; i < months; i++) {
      const date = new Date(endDate)
      date.setMonth(date.getMonth() - i)
      const dateString = date.toISOString().split('T')[0]
      
      // Generate consistent historical data with field awareness
      const insight = this.generateEnhancedMockData('historical', latitude, longitude, dateString, fieldBoundaries)
      
      data.push({
        date: dateString,
        ndvi: insight.ndviScore,
        moisture: insight.soilMoisture
      })
    }
    
    console.log('✅ Enhanced historical data generated for', data.length, 'data points')
    return data.reverse()
  }

  // Test connection to Sentinel Hub via Edge Function
  async testConnection(): Promise<{ success: boolean; message: string }> {
    console.log('🔧 Testing Sentinel Hub connection...')
    
    try {
      const hasCredentials = await this.loadCredentials()
      
      if (!hasCredentials) {
        return {
          success: false,
          message: 'Sentinel Hub credentials not configured. Please configure them in Settings.'
        }
      }

      console.log('✅ Credentials loaded, testing API connection...')

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      const response = await axios.post(
        `${supabaseUrl}/functions/v1/test-sentinel-hub`,
        {
          clientId: this.config.clientId,
          clientSecret: this.config.clientSecret
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
          },
          timeout: 10000
        }
      )

      console.log('✅ Sentinel Hub connection test completed')
      return response.data
    } catch (error) {
      console.error('❌ Sentinel Hub connection test failed:', error)
      return {
        success: false,
        message: `Failed to connect to Sentinel Hub: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  // Get API status and usage information
  async getApiStatus(): Promise<{
    configured: boolean
    connected: boolean
    usage?: {
      requestsThisMonth: number
      requestLimit: number
      remainingRequests: number
    }
    lastUpdate?: string
  }> {
    try {
      console.log('📊 Checking Sentinel Hub API status...')
      
      // First check if credentials are configured
      const hasCredentials = await this.loadCredentials()
      
      if (!hasCredentials) {
        console.log('⚠️ Sentinel Hub credentials not configured')
        return {
          configured: false,
          connected: false
        }
      }

      console.log('✅ Credentials found, testing connection...')
      
      // Test connection using the existing test method
      const connectionTest = await this.testConnection()
      
      const status = {
        configured: true,
        connected: connectionTest.success,
        usage: {
          requestsThisMonth: Math.floor(Math.random() * 500), // Mock data
          requestLimit: 1000,
          remainingRequests: Math.floor(Math.random() * 500) + 500
        },
        lastUpdate: new Date().toISOString()
      }
      
      console.log('📊 API Status:', status)
      return status
      
    } catch (error) {
      console.error('❌ Error checking API status:', error)
      return {
        configured: false,
        connected: false
      }
    }
  }
}

export const sentinelHubService = new SentinelHubService()