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

    const { credentials } = await req.json()

    if (!credentials) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Credentials are required"
        }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      )
    }

    // Check if credentials record exists
    const { data: existingData } = await supabase
      .from('api_credentials')
      .select('*')
      .eq('id', 'main')
      .maybeSingle()

    let result
    if (existingData) {
      // Update existing record
      result = await supabase
        .from('api_credentials')
        .update({
          credentials,
          updated_at: new Date().toISOString()
        })
        .eq('id', 'main')
    } else {
      // Insert new record
      result = await supabase
        .from('api_credentials')
        .insert({
          id: 'main',
          credentials,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
    }

    if (result.error) {
      console.error('Error saving credentials:', result.error)
      return new Response(
        JSON.stringify({
          success: false,
          message: result.error.message
        }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      )
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Credentials saved successfully"
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    )

  } catch (error) {
    console.error('Error in save-api-credentials:', error)
    return new Response(
      JSON.stringify({
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error'
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