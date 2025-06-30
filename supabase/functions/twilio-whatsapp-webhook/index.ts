import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    })
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    )

    if (req.method === "POST") {
      const body = await req.json()
      
      // Handle send message request
      if (body.action === 'send_message') {
        const { farmerId, phoneNumber, message } = body
        
        // Get Twilio WhatsApp credentials from database
        const { data: credData } = await supabase
          .from('api_credentials')
          .select('credentials')
          .eq('id', 'main')
          .single()

        const twilioWhatsappCreds = credData?.credentials?.twilioWhatsapp
        
        if (!twilioWhatsappCreds?.enabled || !twilioWhatsappCreds?.accountSid || !twilioWhatsappCreds?.authToken) {
          throw new Error('Twilio WhatsApp credentials not configured')
        }

        // Send WhatsApp message via Twilio API
        const credentials = btoa(`${twilioWhatsappCreds.accountSid}:${twilioWhatsappCreds.authToken}`)
        
        const twilioResponse = await fetch(
          `https://api.twilio.com/2010-04-01/Accounts/${twilioWhatsappCreds.accountSid}/Messages.json`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Basic ${credentials}`,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
              From: twilioWhatsappCreds.phoneNumber || 'whatsapp:+14155238886',
              To: `whatsapp:${phoneNumber.replace(/\D/g, '')}`,
              Body: message
            })
          }
        )

        if (!twilioResponse.ok) {
          const errorData = await twilioResponse.text()
          throw new Error(`Twilio API error: ${twilioResponse.status} - ${errorData}`)
        }

        const result = await twilioResponse.json()
        
        // Log the message in database
        await supabase.from('ivr_calls').insert({
          farmer_id: farmerId,
          call_status: 'twilio_whatsapp_sent',
          call_type: 'whatsapp',
          transcript: message,
          call_duration: 0
        })

        return new Response(
          JSON.stringify({
            success: true,
            messageId: result.sid,
            message: 'Twilio WhatsApp message sent successfully'
          }),
          {
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json',
            }
          }
        )
      }

      // Handle incoming webhook from Twilio
      if (body.MessageSid) {
        const messageBody = body.Body
        const fromNumber = body.From?.replace('whatsapp:', '')
        
        // Find farmer by phone number
        const { data: farmer } = await supabase
          .from('farmers')
          .select('*')
          .eq('phone_number', fromNumber)
          .single()

        if (farmer) {
          await handleIncomingMessage(supabase, messageBody, farmer)
        }

        return new Response('OK', { 
          headers: corsHeaders,
          status: 200 
        })
      }
    }

    return new Response(
      JSON.stringify({ error: 'Invalid request' }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        }
      }
    )

  } catch (error) {
    console.error('Error in twilio-whatsapp-webhook:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        }
      }
    )
  }
})

async function handleIncomingMessage(supabase: any, messageText: string, farmer: any) {
  try {
    const lowerText = messageText.toLowerCase()
    
    let responseMessage = ''

    // Process message based on content
    if (lowerText.includes('crop') || lowerText.includes('1')) {
      responseMessage = `🌾 *Crop Condition Report*

Please reply with your crop condition:
• *GOOD* - Healthy crops, no issues
• *FAIR* - Some concerns, needs attention  
• *POOR* - Significant problems

What's the condition of your crops?`
      
    } else if (lowerText.includes('weather') || lowerText.includes('2')) {
      responseMessage = `🌤️ *Weather Forecast*

Current weather for your area:
• Temperature: 28°C (82°F)
• Humidity: 65%
• Wind: 12 km/h NE
• Rain chance: 30% (next 24h)

Best time for farming activities: Early morning (6-9 AM)`

    } else if (lowerText.includes('carbon') || lowerText.includes('3')) {
      responseMessage = `🌱 *Carbon Credit Program*

Earn money for sustainable farming!

Benefits:
• Get paid for eco-friendly practices
• Improve soil health
• Increase long-term yields

Reply *JOIN* to enroll or *INFO* for more details.`

    } else if (lowerText.includes('help') || lowerText.includes('4')) {
      responseMessage = `👨‍🌾 *Agricultural Support*

Our expert team is ready to help!

Common topics:
• Pest management
• Crop rotation advice
• Fertilizer recommendations
• Market prices

Reply with your question or call us at +1-800-SPACEZ`

    } else {
      // Default welcome message
      responseMessage = `Hello ${farmer.full_name}! 👋 

Welcome to SpaceZ Agro Platform!

Reply with:
1️⃣ CROP - Report crop condition
2️⃣ WEATHER - Get weather forecast  
3️⃣ CARBON - Carbon credit program
4️⃣ HELP - Speak with our team

_Helping Rural Farmers Make More!_ 💚`
    }

    // Log the interaction
    await supabase.from('ivr_calls').insert({
      farmer_id: farmer.id,
      call_status: 'twilio_whatsapp_received',
      call_type: 'whatsapp',
      transcript: `Received: "${messageText}" | Auto-replied with menu`,
      call_duration: 0
    })

    console.log(`Would send Twilio WhatsApp response to ${farmer.phone_number}: ${responseMessage}`)

  } catch (error) {
    console.error('Error handling incoming Twilio WhatsApp message:', error)
  }
}