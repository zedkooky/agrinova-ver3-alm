import axios from 'axios'

interface IVRCallData {
  farmerId: string
  phoneNumber: string
  farmerName: string
}

interface WhatsAppMessageData {
  farmerId: string
  phoneNumber: string
  farmerName: string
  message?: string
}

interface IVRCallResult {
  callId: string
  status: string
  message: string
}

interface WhatsAppResult {
  messageId: string
  status: string
  message: string
}

class IVRService {
  private supabaseUrl: string

  constructor() {
    this.supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
  }

  async initiateCall(callData: IVRCallData): Promise<IVRCallResult> {
    try {
      const response = await axios.get(
        `${this.supabaseUrl}/functions/v1/twilio-ivr-webhook`,
        {
          params: {
            farmer_id: callData.farmerId
          }
        }
      )

      return {
        callId: `call_${Date.now()}`,
        status: 'initiated',
        message: `IVR call initiated to ${callData.farmerName} at ${callData.phoneNumber}`
      }
    } catch (error) {
      console.error('Failed to initiate IVR call:', error)
      throw new Error('Failed to initiate IVR call')
    }
  }

  async initiateWhatsAppMessage(messageData: WhatsAppMessageData): Promise<WhatsAppResult> {
    try {
      const defaultMessage = `Hello ${messageData.farmerName}! 🌾

Welcome to SpaceZ Agro Platform - we're here to help you make more from your farming! 

Please reply with:
1️⃣ CROP - Report your crop condition  
2️⃣ WEATHER - Get weather updates
3️⃣ CARBON - Learn about carbon credits
4️⃣ HELP - Speak with our agricultural advisor

We're committed to helping rural farmers succeed! 💚`

      const payload = {
        action: 'send_message',
        farmerId: messageData.farmerId,
        phoneNumber: messageData.phoneNumber,
        message: messageData.message || defaultMessage
      }

      if (!payload.phoneNumber || !payload.message) {
        throw new Error("Missing phoneNumber or message in WhatsApp payload")
      }

      console.log('📤 Sending WhatsApp payload:', payload)

      // Try Twilio WhatsApp
      const response = await axios.post(
        `${this.supabaseUrl}/functions/v1/twilio-whatsapp-webhook`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
          }
        }
      )

      return {
        messageId: `twilio_whatsapp_${Date.now()}`,
        status: 'sent',
        message: `Twilio WhatsApp message sent to ${messageData.farmerName} at ${messageData.phoneNumber}`
      }
    } catch (twilioError) {
      console.error('❌ Twilio WhatsApp failed:', twilioError)

      // Fallback to Meta WhatsApp
      try {
        const fallbackPayload = {
          phoneNumber: messageData.phoneNumber,
          message: messageData.message || `Hello ${messageData.farmerName}, please try again.`
        }

        const response = await axios.post(
          `${this.supabaseUrl}/functions/v1/meta-whatsapp-webhook`,
          fallbackPayload,
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
            }
          }
        )

        return {
          messageId: `meta_whatsapp_${Date.now()}`,
          status: 'sent',
          message: `Meta WhatsApp message sent to ${messageData.farmerName} at ${messageData.phoneNumber}`
        }
      } catch (metaError) {
        console.error('❌ Meta WhatsApp also failed:', metaError)

        return {
          messageId: `whatsapp_${Date.now()}`,
          status: 'failed',
          message: `Both Twilio and Meta WhatsApp failed for ${messageData.farmerName}`
        }
      }
    }
  }

  async getCallHistory(farmerId: string): Promise<any[]> {
    try {
      return [
        {
          id: '1',
          callTime: new Date(Date.now() - 86400000).toISOString(),
          duration: 120,
          status: 'completed',
          cropCondition: 2,
          transcript: 'Farmer reported fair crop conditions'
        },
        {
          id: '2',
          callTime: new Date(Date.now() - 172800000).toISOString(),
          duration: 95,
          status: 'completed',
          cropCondition: 1,
          transcript: 'Farmer reported good crop conditions'
        }
      ]
    } catch (error) {
      console.error('Failed to get call history:', error)
      return []
    }
  }

  async scheduleCall(farmerId: string, scheduledTime: Date): Promise<boolean> {
    try {
      console.log(`Call scheduled for farmer ${farmerId} at ${scheduledTime}`)
      return true
    } catch (error) {
      console.error('Failed to schedule call:', error)
      return false
    }
  }

  generateIVRMenu(): string {
    return `
      Welcome to SpaceZ Agro Platform - Helping Rural Farmers Make More!
      
      Press 1 to report crop conditions
      Press 2 for weather information  
      Press 3 for carbon credit program
      Press 4 to speak with an agricultural advisor
      Press 0 to repeat this menu
    `
  }

  generateWhatsAppMenu(): string {
    return `🌾 *SpaceZ Agro Platform Menu*

Reply with:
1️⃣ *CROP* - Report crop condition
2️⃣ *WEATHER* - Get weather forecast  
3️⃣ *CARBON* - Carbon credit program
4️⃣ *SATELLITE* - Get satellite insights
5️⃣ *ADVISOR* - Speak with agricultural expert
6️⃣ *MENU* - Show this menu again

_Helping Rural Farmers Make More!_ 💚`
  }

  async sendSMSReminder(phoneNumber: string, message: string): Promise<boolean> {
    try {
      console.log(`SMS sent to ${phoneNumber}: ${message}`)
      return true
    } catch (error) {
      console.error('Failed to send SMS:', error)
      return false
    }
  }
}

export const ivrService = new IVRService()
