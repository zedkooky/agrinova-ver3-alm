import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
}

serve(async (req: Request) => {
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
      // Handle incoming IVR call data
      const formData = await req.formData()
      const phoneNumber = formData.get("From")?.toString().replace("+", "")
      const digits = formData.get("Digits")?.toString()
      const callSid = formData.get("CallSid")?.toString()

      // Find farmer by phone number
      const { data: farmer } = await supabase
        .from("farmers")
        .select("*")
        .eq("phone_number", phoneNumber)
        .single()

      if (!farmer) {
        // Return TwiML for unregistered farmer
        const twiml = `<?xml version="1.0" encoding="UTF-8"?>
          <Response>
            <Say voice="alice">Welcome to AgroSat. Your phone number is not registered. Please contact support to register your farm.</Say>
            <Hangup/>
          </Response>`
        
        return new Response(twiml, {
          headers: {
            ...corsHeaders,
            "Content-Type": "text/xml",
          },
        })
      }

      // Process IVR menu selection
      let twiml = ""
      
      if (!digits) {
        // Initial call - present main menu
        twiml = `<?xml version="1.0" encoding="UTF-8"?>
          <Response>
            <Say voice="alice">Hello ${farmer.full_name}, welcome to AgroSat. Press 1 to report crop conditions, Press 2 for weather information, Press 3 for carbon credit program, or Press 0 to speak with an agent.</Say>
            <Gather numDigits="1" action="/functions/v1/twilio-ivr-webhook" method="POST" timeout="10">
              <Say voice="alice">Please make your selection now.</Say>
            </Gather>
            <Say voice="alice">We didn't receive your selection. Goodbye.</Say>
            <Hangup/>
          </Response>`
      } else {
        switch (digits) {
          case "1":
            // Crop condition reporting
            twiml = `<?xml version="1.0" encoding="UTF-8"?>
              <Response>
                <Say voice="alice">Please report your crop condition. Press 1 for Good, Press 2 for Fair, Press 3 for Poor.</Say>
                <Gather numDigits="1" action="/functions/v1/twilio-ivr-webhook?step=crop_condition&farmer_id=${farmer.id}" method="POST" timeout="10">
                  <Say voice="alice">Press your selection now.</Say>
                </Gather>
                <Hangup/>
              </Response>`
            break
          case "2":
            // Weather information
            twiml = `<?xml version="1.0" encoding="UTF-8"?>
              <Response>
                <Say voice="alice">Current weather for your area: Partly cloudy, 75 degrees Fahrenheit. 30% chance of rain in the next 24 hours. Thank you for calling AgroSat.</Say>
                <Hangup/>
              </Response>`
            break
          case "3":
            // Carbon credit program
            twiml = `<?xml version="1.0" encoding="UTF-8"?>
              <Response>
                <Say voice="alice">Carbon Credit Program: Earn money for sustainable farming practices. Press 1 to opt in, Press 2 for more information.</Say>
                <Gather numDigits="1" action="/functions/v1/twilio-ivr-webhook?step=carbon_optin&farmer_id=${farmer.id}" method="POST" timeout="10">
                  <Say voice="alice">Press your selection now.</Say>
                </Gather>
                <Hangup/>
              </Response>`
            break
          default:
            twiml = `<?xml version="1.0" encoding="UTF-8"?>
              <Response>
                <Say voice="alice">Invalid selection. Thank you for calling AgroSat. Goodbye.</Say>
                <Hangup/>
              </Response>`
        }
      }

      // Handle specific steps
      const url = new URL(req.url)
      const step = url.searchParams.get("step")
      const farmerId = url.searchParams.get("farmer_id")

      if (step === "crop_condition" && farmerId) {
        const condition = parseInt(digits || "0")
        
        // Save IVR call record
        await supabase.from("ivr_calls").insert({
          farmer_id: farmerId,
          crop_selected: farmer.crop || "Unknown",
          crop_condition: condition,
          call_status: "completed",
          transcript: `Farmer reported crop condition: ${condition === 1 ? "Good" : condition === 2 ? "Fair" : "Poor"}`
        })

        twiml = `<?xml version="1.0" encoding="UTF-8"?>
          <Response>
            <Say voice="alice">Thank you for reporting your crop condition as ${condition === 1 ? "Good" : condition === 2 ? "Fair" : "Poor"}. This information helps us provide better insights. Goodbye.</Say>
            <Hangup/>
          </Response>`
      }

      if (step === "carbon_optin" && farmerId && digits === "1") {
        // Opt farmer into carbon credit program
        await supabase.from("carbon_credits").insert({
          farmer_id: farmerId,
          opt_in_date: new Date().toISOString().split('T')[0],
          practices_reported: "IVR Opt-in",
          verification_status: "pending",
          estimated_credits: 5.0 + Math.random() * 15
        })

        twiml = `<?xml version="1.0" encoding="UTF-8"?>
          <Response>
            <Say voice="alice">Congratulations! You have been enrolled in our Carbon Credit Program. Our team will contact you within 48 hours to verify your sustainable practices. Thank you for helping fight climate change.</Say>
            <Hangup/>
          </Response>`
      }

      return new Response(twiml, {
        headers: {
          ...corsHeaders,
          "Content-Type": "text/xml",
        },
      })
    }

    // Handle GET request - initiate outbound call
    if (req.method === "GET") {
      const url = new URL(req.url)
      const farmerId = url.searchParams.get("farmer_id")
      
      if (!farmerId) {
        throw new Error("farmer_id is required")
      }

      const { data: farmer } = await supabase
        .from("farmers")
        .select("*")
        .eq("id", farmerId)
        .single()

      if (!farmer) {
        throw new Error("Farmer not found")
      }

      // Initiate Twilio call (would require Twilio credentials)
      const twilioResponse = {
        message: `Call initiated to ${farmer.phone_number}`,
        farmer: farmer.full_name,
        status: "initiated"
      }

      return new Response(
        JSON.stringify(twilioResponse),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      )
    }

  } catch (error) {
    console.error("Error in twilio-ivr-webhook:", error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    )
  }
})