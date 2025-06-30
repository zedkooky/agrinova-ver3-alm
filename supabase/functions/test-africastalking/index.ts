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
    const { username, apiKey, senderId, sandboxMode } = await req.json();

    if (!username || !apiKey) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Username and API Key are required"
        }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Determine the correct API endpoint based on sandbox mode
    const baseUrl = sandboxMode 
      ? "https://api.sandbox.africastalking.com" 
      : "https://api.africastalking.com";
    
    const apiEndpoint = `${baseUrl}/version1/user`;

    console.log(`Testing Africa's Talking API in ${sandboxMode ? 'SANDBOX' : 'PRODUCTION'} mode`);
    console.log(`Using endpoint: ${apiEndpoint}`);
    console.log(`Username: ${username}`);

    // Test Africa's Talking API by fetching user data
    const response = await fetch(apiEndpoint, {
      method: "GET",
      headers: {
        "apiKey": apiKey,
        "Accept": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API Error: ${response.status} - ${errorText}`);
      
      return new Response(
        JSON.stringify({
          success: false,
          message: `Africa's Talking API test failed: ${response.status} - Invalid credentials or API endpoint unreachable`
        }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const userData = await response.json();
    console.log('API Response:', userData);
    
    // Validate the response structure
    if (!userData.UserData) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Invalid response from Africa's Talking API - UserData not found"
        }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Extract user information
    const userInfo = userData.UserData;
    let balanceInfo = "";
    
    // Try to get balance information
    if (userInfo.balance) {
      balanceInfo = ` | Balance: ${userInfo.balance}`;
    }

    const environmentInfo = sandboxMode ? " (Sandbox)" : " (Production)";
    const senderInfo = senderId ? ` | Sender ID: ${senderId}` : "";

    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully connected to Africa's Talking API${environmentInfo} | Username: ${username}${balanceInfo}${senderInfo}`
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );

  } catch (error) {
    console.error("Error testing Africa's Talking:", error);
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