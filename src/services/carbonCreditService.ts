import axios from 'axios'

interface CarbonCreditData {
  farmerId: string
  practices: string[]
  acreage: number
  cropType: string
}

interface CarbonCreditResult {
  carbonCredit: any
  verification: any
  marketInfo: any
}

interface MarketData {
  currentPrice: number
  volume24h: number
  priceChange: number
  topBuyers: string[]
  averageVerificationTime: string
}

class CarbonCreditService {
  private supabaseUrl: string

  constructor() {
    this.supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
  }

  async submitCarbonCredit(data: CarbonCreditData): Promise<CarbonCreditResult> {
    try {
      const response = await axios.post(
        `${this.supabaseUrl}/functions/v1/carbon-credit-integration`,
        data,
        {
          headers: {
            'Content-Type': 'application/json',
          }
        }
      )

      return response.data
    } catch (error) {
      console.error('Failed to submit carbon credit:', error)
      throw new Error('Failed to submit carbon credit application')
    }
  }

  async getCarbonCreditStatus(farmerId: string): Promise<any> {
    try {
      const response = await axios.get(
        `${this.supabaseUrl}/functions/v1/carbon-credit-integration`,
        {
          params: {
            farmer_id: farmerId
          }
        }
      )

      return response.data
    } catch (error) {
      console.error('Failed to get carbon credit status:', error)
      return null
    }
  }

  async getMarketData(): Promise<MarketData> {
    try {
      // In production, this would call a real carbon credit market API
      return {
        currentPrice: 15 + Math.random() * 10,
        volume24h: 1250 + Math.random() * 500,
        priceChange: (Math.random() - 0.5) * 4,
        topBuyers: ['Microsoft', 'Google', 'Amazon', 'Apple'],
        averageVerificationTime: '18 days'
      }
    } catch (error) {
      console.error('Failed to get market data:', error)
      throw new Error('Failed to fetch market data')
    }
  }

  calculateEstimatedCredits(practices: string[], acreage: number, cropType: string): number {
    const creditRates = {
      'no-till': 0.5,
      'cover-cropping': 0.3,
      'rotational-grazing': 0.4,
      'agroforestry': 0.8,
      'precision-agriculture': 0.2,
      'organic-farming': 0.6
    }

    const cropMultipliers = {
      'corn': 1.0,
      'soy': 1.1,
      'wheat': 0.9,
      'rice': 1.2,
      'cotton': 0.8
    }

    let estimatedCredits = 0
    practices.forEach(practice => {
      const rate = creditRates[practice as keyof typeof creditRates] || 0.1
      estimatedCredits += rate * acreage
    })

    const multiplier = cropMultipliers[cropType.toLowerCase() as keyof typeof cropMultipliers] || 1.0
    return Math.round(estimatedCredits * multiplier * 100) / 100
  }

  getEligiblePractices(): Array<{ id: string; name: string; description: string; creditRate: number }> {
    return [
      {
        id: 'no-till',
        name: 'No-Till Farming',
        description: 'Avoid disturbing soil through tillage',
        creditRate: 0.5
      },
      {
        id: 'cover-cropping',
        name: 'Cover Cropping',
        description: 'Plant cover crops during off-season',
        creditRate: 0.3
      },
      {
        id: 'rotational-grazing',
        name: 'Rotational Grazing',
        description: 'Systematic livestock rotation',
        creditRate: 0.4
      },
      {
        id: 'agroforestry',
        name: 'Agroforestry',
        description: 'Integrate trees with crops/livestock',
        creditRate: 0.8
      },
      {
        id: 'precision-agriculture',
        name: 'Precision Agriculture',
        description: 'Technology-driven farming optimization',
        creditRate: 0.2
      },
      {
        id: 'organic-farming',
        name: 'Organic Farming',
        description: 'Chemical-free agricultural practices',
        creditRate: 0.6
      }
    ]
  }

  async getVerificationRequirements(): Promise<string[]> {
    return [
      'Soil carbon analysis report',
      'Practice implementation photos',
      'Field management records (last 2 years)',
      'Third-party verification visit',
      'Baseline carbon measurement',
      'GPS coordinates of practice areas'
    ]
  }
}

export const carbonCreditService = new CarbonCreditService()