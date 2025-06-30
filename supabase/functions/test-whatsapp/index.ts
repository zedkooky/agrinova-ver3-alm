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
    const { accessToken, appId, phoneNumberId } = await req.json()

    if (!accessToken || !appId || !phoneNumberId) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Access Token, App ID, and Phone Number ID are required"
        }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      )
    }

    // Test WhatsApp Business API by fetching phone number info
    const whatsappResponse = await fetch(
      `https://graph.facebook.com/v18.0/${phoneNumberId}?fields=id,display_phone_number,verified_name,status`,
      {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
        },
      }
    )

    if (!whatsappResponse.ok) {
      const errorData = await whatsappResponse.text()
      return new Response(
        JSON.stringify({
          success: false,
          message: `WhatsApp API test failed: ${whatsappResponse.status} - Invalid credentials or phone number`
        }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      )
    }

    const phoneData = await whatsappResponse.json()
    
    // Also test if we can access the app info
    const appResponse = await fetch(
      `https://graph.facebook.com/v18.0/${appId}?fields=id,name`,
      {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
        },
      }
    )

    let appInfo = null
    if (appResponse.ok) {
      appInfo = await appResponse.json()
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully connected to WhatsApp Business API. Phone: ${phoneData.display_phone_number || phoneData.id}${appInfo ? `, App: ${appInfo.name}` : ''}`
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    )

  } catch (error) {
    console.error("Error testing WhatsApp:", error)
    return new Response(
      JSON.stringify({
        success: false,
        message: `Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      }),
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