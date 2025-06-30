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
    const { apiKey, agentId } = await req.json();

    if (!apiKey || !agentId) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "API Key and Agent ID are required"
        }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Test ElevenLabs API by fetching user info
    const userResponse = await fetch("https://api.elevenlabs.io/v1/user", {
      method: "GET",
      headers: {
        "xi-api-key": apiKey,
      },
    });

    if (!userResponse.ok) {
      const errorText = await userResponse.text();
      return new Response(
        JSON.stringify({
          success: false,
          message: `ElevenLabs API test failed: ${userResponse.status} - Invalid API key`
        }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const userData = await userResponse.json();

    // Test agent access
    const agentResponse = await fetch(`https://api.elevenlabs.io/v1/convai/agents/${agentId}`, {
      method: "GET",
      headers: {
        "xi-api-key": apiKey,
      },
    });

    if (!agentResponse.ok) {
      return new Response(
        JSON.stringify({
          success: false,
          message: `Agent ID ${agentId} not found or not accessible`
        }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const agentData = await agentResponse.json();

    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully connected to ElevenLabs API. User: ${userData.email || 'Unknown'}, Agent: ${agentData.name || agentId}`
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );

  } catch (error) {
    console.error("Error testing ElevenLabs:", error);
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