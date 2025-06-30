const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { accountSid, authToken, phoneNumber } = await req.json();

    if (!accountSid || !authToken) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Account SID and Auth Token are required"
        }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Test Twilio API by fetching account information
    const credentials = btoa(`${accountSid}:${authToken}`);
    
    const twilioResponse = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}.json`, {
      method: "GET",
      headers: {
        "Authorization": `Basic ${credentials}`,
      },
    });

    if (!twilioResponse.ok) {
      const errorText = await twilioResponse.text();
      return new Response(
        JSON.stringify({
          success: false,
          message: `Twilio API test failed: ${twilioResponse.status} - Invalid credentials`
        }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const accountData = await twilioResponse.json();
    
    // If phone number is provided, validate it
    if (phoneNumber) {
      const phoneResponse = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/IncomingPhoneNumbers.json`, {
        method: "GET",
        headers: {
          "Authorization": `Basic ${credentials}`,
        },
      });

      if (phoneResponse.ok) {
        const phoneData = await phoneResponse.json();
        const hasPhoneNumber = phoneData.incoming_phone_numbers.some((phone: any) => 
          phone.phone_number === phoneNumber
        );

        if (!hasPhoneNumber) {
          return new Response(
            JSON.stringify({
              success: false,
              message: `Phone number ${phoneNumber} not found in your Twilio account`
            }),
            {
              headers: {
                ...corsHeaders,
                "Content-Type": "application/json",
              },
            }
          );
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully connected to Twilio account: ${accountData.friendly_name || accountSid}`
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );

  } catch (error) {
    console.error("Error testing Twilio:", error);
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
    );
  }
});