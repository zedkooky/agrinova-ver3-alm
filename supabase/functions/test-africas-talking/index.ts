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
    const { username, apiKey, senderId } = await req.json();

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

    // Test Africa's Talking API by fetching user data
    const response = await fetch("https://api.africastalking.com/version1/user", {
      method: "GET",
      headers: {
        "apiKey": apiKey,
        "Accept": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      return new Response(
        JSON.stringify({
          success: false,
          message: `Africa's Talking API test failed: ${response.status} - Invalid credentials`
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
    
    // Validate the response structure
    if (!userData.UserData) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Invalid response from Africa's Talking API"
        }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Check account balance
    let balanceInfo = "";
    try {
      const balanceResponse = await fetch("https://api.africastalking.com/version1/user", {
        method: "GET",
        headers: {
          "apiKey": apiKey,
          "Accept": "application/json",
        },
      });

      if (balanceResponse.ok) {
        const balanceData = await balanceResponse.json();
        if (balanceData.UserData && balanceData.UserData.balance) {
          balanceInfo = ` | Balance: ${balanceData.UserData.balance}`;
        }
      }
    } catch (error) {
      // Balance check failed, but main test passed
      console.log("Balance check failed:", error);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully connected to Africa's Talking API | Username: ${username}${balanceInfo}${senderId ? ` | Sender ID: ${senderId}` : ''}`
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