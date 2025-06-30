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
        
        // Get WhatsApp credentials from database
        const { data: credData } = await supabase
          .from('api_credentials')
          .select('credentials')
          .eq('id', 'main')
          .single()

        const whatsappCreds = credData?.credentials?.whatsapp
        
        if (!whatsappCreds?.enabled || !whatsappCreds?.accessToken) {
          throw new Error('WhatsApp credentials not configured')
        }

        // Send WhatsApp message via Meta API
        const whatsappResponse = await fetch(
          `https://graph.facebook.com/v18.0/${whatsappCreds.phoneNumberId}/messages`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${whatsappCreds.accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              messaging_product: 'whatsapp',
              to: phoneNumber.replace(/\D/g, ''), // Remove non-digits
              type: 'text',
              text: {
                body: message
              }
            })
          }
        )

        if (!whatsappResponse.ok) {
          throw new Error(`WhatsApp API error: ${whatsappResponse.status}`)
        }

        const result = await whatsappResponse.json()
        
        // Log the message in database
        await supabase.from('ivr_calls').insert({
          farmer_id: farmerId,
          call_status: 'whatsapp_sent',
          transcript: message,
          call_duration: 0
        })

        return new Response(
          JSON.stringify({
            success: true,
            messageId: result.messages?.[0]?.id,
            message: 'WhatsApp message sent successfully'
          }),
          {
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json',
            }
          }
        )
      }

      // Handle incoming webhook from WhatsApp
      if (body.object === 'whatsapp_business_account') {
        for (const entry of body.entry) {
          for (const change of entry.changes) {
            if (change.field === 'messages') {
              const messages = change.value.messages
              const contacts = change.value.contacts
              
              if (messages) {
                for (const message of messages) {
                  await handleIncomingMessage(supabase, message, contacts)
                }
              }
            }
          }
        }

        return new Response('OK', { 
          headers: corsHeaders,
          status: 200 
        })
      }
    }

    // Handle webhook verification
    if (req.method === "GET") {
      const url = new URL(req.url)
      const mode = url.searchParams.get('hub.mode')
      const token = url.searchParams.get('hub.verify_token')
      const challenge = url.searchParams.get('hub.challenge')

      // Get verify token from database
      const { data: credData } = await supabase
        .from('api_credentials')
        .select('credentials')
        .eq('id', 'main')
        .single()

      const verifyToken = credData?.credentials?.whatsapp?.verifyToken

      if (mode === 'subscribe' && token === verifyToken) {
        return new Response(challenge, {
          headers: corsHeaders,
          status: 200
        })
      } else {
        return new Response('Forbidden', {
          headers: corsHeaders,
          status: 403
        })
      }
    }

  } catch (error) {
    console.error('Error in whatsapp-webhook:', error)
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

async function handleIncomingMessage(supabase: any, message: any, contacts: any[]) {
  try {
    const phoneNumber = message.from
    const messageText = message.text?.body?.toLowerCase()
    
    // Find farmer by phone number
    const { data: farmer } = await supabase
      .from('farmers')
      .select('*')
      .eq('phone_number', phoneNumber)
      .single()

    if (!farmer) {
      // Register new farmer
      const contact = contacts?.find(c => c.wa_id === phoneNumber)
      const name = contact?.profile?.name || 'Unknown Farmer'
      
      await supabase.from('farmers').insert({
        phone_number: phoneNumber,
        full_name: name,
        preferred_language: 'English'
      })
    }

    let responseMessage = ''

    // Process message based on content
    if (messageText?.includes('crop') || messageText?.includes('1')) {
      responseMessage = `🌾 *Crop Condition Report*

Please reply with your crop condition:
• *GOOD* - Healthy crops, no issues
• *FAIR* - Some concerns, needs attention  
• *POOR* - Significant problems

What's the condition of your crops?`
      
    } else if (messageText?.includes('weather') || messageText?.includes('2')) {
      responseMessage = `🌤️ *Weather Forecast*

Current weather for your area:
• Temperature: 28°C (82°F)
• Humidity: 65%
• Wind: 12 km/h NE
• Rain chance: 30% (next 24h)

Best time for farming activities: Early morning (6-9 AM)`

    } else if (messageText?.includes('carbon') || messageText?.includes('3')) {
      responseMessage = `🌱 *Carbon Credit Program*

Earn money for sustainable farming!

Benefits:
• Get paid for eco-friendly practices
• Improve soil health
• Increase long-term yields

Reply *JOIN* to enroll or *INFO* for more details.`

    } else if (messageText?.includes('satellite') || messageText?.includes('4')) {
      responseMessage = `🛰️ *Satellite Insights*

Based on latest satellite data:
• Vegetation Index: Good (0.65)
• Soil Moisture: Moderate (45%)
• Recommended action: Continue current practices

Full report available on SpaceZ platform.`

    } else if (messageText?.includes('advisor') || messageText?.includes('5')) {
      responseMessage = `👨‍🌾 *Agricultural Advisor*

Our expert team is ready to help!

Common topics:
• Pest management
• Crop rotation advice
• Fertilizer recommendations
• Market prices

Reply with your question or call us at +1-800-SPACEZ`

    } else if (messageText?.includes('menu') || messageText?.includes('6')) {
      responseMessage = `🌾 *SpaceZ Agro Platform Menu*

Reply with:
1️⃣ *CROP* - Report crop condition
2️⃣ *WEATHER* - Get weather forecast  
3️⃣ *CARBON* - Carbon credit program
4️⃣ *SATELLITE* - Get satellite insights
5️⃣ *ADVISOR* - Speak with agricultural expert
6️⃣ *MENU* - Show this menu again

_Helping Rural Farmers Make More!_ 💚`

    } else {
      // Default welcome message
      responseMessage = `Hello! 👋 Welcome to SpaceZ Agro Platform!

We're here to help you make more from your farming! 🌾

Reply *MENU* to see all available options, or ask any farming question.

_Your success is our mission!_ 💚`
    }

    // Send response (in production, you would send via WhatsApp API)
    console.log(`Would send to ${phoneNumber}: ${responseMessage}`)
    
    // Log the interaction
    await supabase.from('ivr_calls').insert({
      farmer_id: farmer?.id,
      call_status: 'whatsapp_received',
      transcript: `Received: "${messageText}" | Replied: "${responseMessage.substring(0, 100)}..."`,
      call_duration: 0
    })

  } catch (error) {
    console.error('Error handling incoming message:', error)
  }
}