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
      const contentType = req.headers.get("content-type") || ""
      let body: any

      if (contentType.includes("application/json")) {
        body = await req.json()
      } else if (contentType.includes("application/x-www-form-urlencoded")) {
        const formData = await req.text()
        body = Object.fromEntries(new URLSearchParams(formData))
      } else {
        throw new Error("Unsupported content type")
      }

      // === Send Message Handler ===
      if (body.action === 'send_message') {
        const { farmerId, phoneNumber, message } = body

        const { data: credData } = await supabase.from('api_credentials').select('credentials').eq('id', 'main').single()
        const whatsappCreds = credData?.credentials?.whatsapp

        if (!whatsappCreds?.enabled || !whatsappCreds?.accessToken) {
          throw new Error('Meta WhatsApp credentials not configured')
        }

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
              to: phoneNumber.replace(/\D/g, ''),
              type: 'text',
              text: { body: message }
            })
          }
        )

        if (!whatsappResponse.ok) {
          throw new Error(`Meta WhatsApp API error: ${whatsappResponse.status}`)
        }

        const result = await whatsappResponse.json()

        await supabase.from('ivr_calls').insert({
          farmer_id: farmerId,
          call_status: 'meta_whatsapp_sent',
          call_type: 'whatsapp',
          transcript: message,
          call_duration: 0
        })

        return new Response(JSON.stringify({
          success: true,
          messageId: result.messages?.[0]?.id,
          message: 'Meta WhatsApp message sent successfully'
        }), {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          }
        })
      }

      // === Inbound Webhook Handler ===
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

        return new Response('OK', { headers: corsHeaders, status: 200 })
      }
    }

    // === Webhook Verification Handler ===
    if (req.method === "GET") {
      const url = new URL(req.url)
      const mode = url.searchParams.get('hub.mode')
      const token = url.searchParams.get('hub.verify_token')
      const challenge = url.searchParams.get('hub.challenge')

      const { data: credData } = await supabase.from('api_credentials').select('credentials').eq('id', 'main').single()
      const verifyToken = credData?.credentials?.whatsapp?.verifyToken

      if (mode === 'subscribe' && token === verifyToken) {
        return new Response(challenge, { headers: corsHeaders, status: 200 })
      } else {
        return new Response('Forbidden', { headers: corsHeaders, status: 403 })
      }
    }

  } catch (error) {
    console.error('Error in meta-whatsapp-webhook:', error)
    return new Response(JSON.stringify({ error: error.message, success: false }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      }
    })
  }
})

async function handleIncomingMessage(supabase: any, message: any, contacts: any[]) {
  try {
    const phoneNumber = message.from
    const messageText = message.text?.body?.toLowerCase()

    const { data: farmer } = await supabase.from('farmers').select('*').eq('phone_number', phoneNumber).single()

    if (!farmer) {
      const contact = contacts?.find(c => c.wa_id === phoneNumber)
      const name = contact?.profile?.name || 'Unknown Farmer'
      await supabase.from('farmers').insert({
        phone_number: phoneNumber,
        full_name: name,
        preferred_language: 'English'
      })
    }

    let responseMessage = ''

    if (messageText?.includes('crop') || messageText?.includes('1')) {
      responseMessage = `🌾 *Crop Condition Report*
\nPlease reply with your crop condition:
• *GOOD* - Healthy crops, no issues
• *FAIR* - Some concerns, needs attention  
• *POOR* - Significant problems`
    } else if (messageText?.includes('weather') || messageText?.includes('2')) {
      responseMessage = `🌤️ *Weather Forecast*
\nCurrent weather for your area:
• Temperature: 28°C (82°F)
• Humidity: 65%
• Wind: 12 km/h NE
• Rain chance: 30% (next 24h)
\nBest time for farming activities: Early morning (6-9 AM)`
    } else if (messageText?.includes('carbon') || messageText?.includes('3')) {
      responseMessage = `🌱 *Carbon Credit Program*
\nEarn money for sustainable farming!
\nBenefits:
• Get paid for eco-friendly practices
• Improve soil health
• Increase long-term yields
\nReply *JOIN* to enroll or *INFO* for more details.`
    } else if (messageText?.includes('satellite') || messageText?.includes('4')) {
      responseMessage = `🛰️ *Satellite Insights*
\nBased on latest satellite data:
• Vegetation Index: Good (0.65)
• Soil Moisture: Moderate (45%)
• Recommended action: Continue current practices
\nFull report available on SpaceZ platform.`
    } else if (messageText?.includes('advisor') || messageText?.includes('5')) {
      responseMessage = `👨‍🌾 *Agricultural Advisor*
\nOur expert team is ready to help!
\nCommon topics:
• Pest management
• Crop rotation advice
• Fertilizer recommendations
• Market prices
\nReply with your question or call us at +1-800-SPACEZ`
    } else if (messageText?.includes('menu') || messageText?.includes('6')) {
      responseMessage = `🌾 *SpaceZ Agro Platform Menu*
\nReply with:
1️⃣ *CROP* - Report crop condition
2️⃣ *WEATHER* - Get weather forecast  
3️⃣ *CARBON* - Carbon credit program
4️⃣ *SATELLITE* - Get satellite insights
5️⃣ *ADVISOR* - Speak with agricultural expert
6️⃣ *MENU* - Show this menu again
\n_Helping Rural Farmers Make More!_ 💚`
    } else {
      responseMessage = `Hello! 👋 Welcome to SpaceZ Agro Platform!
\nWe're here to help you make more from your farming! 🌾
\nReply *MENU* to see all available options, or ask any farming question.
\n_Your success is our mission!_ 💚`
    }

    const { data: credData } = await supabase.from('api_credentials').select('credentials').eq('id', 'main').single()
    const whatsappCreds = credData?.credentials?.whatsapp

    await fetch(`https://graph.facebook.com/v18.0/${whatsappCreds.phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${whatsappCreds.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: phoneNumber,
        type: 'text',
        text: { body: responseMessage }
      })
    })

    await supabase.from('ivr_calls').insert({
      farmer_id: farmer?.id,
      call_status: 'meta_whatsapp_received',
      call_type: 'whatsapp',
      transcript: `Received: "${messageText}" | Replied: "${responseMessage.substring(0, 100)}..."`,
      call_duration: 0
    })

  } catch (error) {
    console.error('Error handling incoming message:', error)
  }
}
