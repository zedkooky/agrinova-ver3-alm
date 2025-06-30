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
    const { provider, googleMapsApiKey, mapboxAccessToken, hereApiKey } = await req.json()

    if (!provider) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Map provider is required"
        }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      )
    }

    let testResult
    
    switch (provider) {
      case 'google':
        if (!googleMapsApiKey) {
          return new Response(
            JSON.stringify({
              success: false,
              message: "Google Maps API Key is required"
            }),
            {
              headers: {
                ...corsHeaders,
                "Content-Type": "application/json",
              },
            }
          )
        }
        
        testResult = await testGoogleMaps(googleMapsApiKey)
        break
        
      case 'mapbox':
        if (!mapboxAccessToken) {
          return new Response(
            JSON.stringify({
              success: false,
              message: "Mapbox Access Token is required"
            }),
            {
              headers: {
                ...corsHeaders,
                "Content-Type": "application/json",
              },
            }
          )
        }
        
        testResult = await testMapbox(mapboxAccessToken)
        break
        
      case 'here':
        if (!hereApiKey) {
          return new Response(
            JSON.stringify({
              success: false,
              message: "HERE API Key is required"
            }),
            {
              headers: {
                ...corsHeaders,
                "Content-Type": "application/json",
              },
            }
          )
        }
        
        testResult = await testHereMaps(hereApiKey)
        break
        
      default:
        return new Response(
          JSON.stringify({
            success: false,
            message: "Unknown map provider"
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
      JSON.stringify(testResult),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    )

  } catch (error) {
    console.error("Error testing Maps API:", error)
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

async function testGoogleMaps(apiKey: string) {
  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=1600+Amphitheatre+Parkway,+Mountain+View,+CA&key=${apiKey}`
    )

    if (!response.ok) {
      return {
        success: false,
        message: `Google Maps API test failed: ${response.status}`
      }
    }

    const data = await response.json()
    
    if (data.status === 'REQUEST_DENIED') {
      return {
        success: false,
        message: `Google Maps API access denied: ${data.error_message || 'Invalid API key'}`
      }
    }

    if (data.status === 'OK' && data.results && data.results.length > 0) {
      return {
        success: true,
        message: "Successfully connected to Google Maps API"
      }
    }

    return {
      success: false,
      message: `Google Maps API test failed: ${data.status}`
    }
  } catch (error) {
    return {
      success: false,
      message: `Google Maps test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

async function testMapbox(accessToken: string) {
  try {
    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/Los%20Angeles.json?access_token=${accessToken}`
    )

    if (!response.ok) {
      return {
        success: false,
        message: `Mapbox API test failed: ${response.status}`
      }
    }

    const data = await response.json()
    
    if (data.message) {
      return {
        success: false,
        message: `Mapbox API error: ${data.message}`
      }
    }

    if (data.features && data.features.length > 0) {
      return {
        success: true,
        message: "Successfully connected to Mapbox API"
      }
    }

    return {
      success: false,
      message: "Mapbox API test failed: No results returned"
    }
  } catch (error) {
    return {
      success: false,
      message: `Mapbox test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

async function testHereMaps(apiKey: string) {
  try {
    const response = await fetch(
      `https://geocode.search.hereapi.com/v1/geocode?q=Berlin&apikey=${apiKey}`
    )

    if (!response.ok) {
      return {
        success: false,
        message: `HERE Maps API test failed: ${response.status}`
      }
    }

    const data = await response.json()
    
    if (data.error) {
      return {
        success: false,
        message: `HERE Maps API error: ${data.error.title || 'Invalid API key'}`
      }
    }

    if (data.items && data.items.length > 0) {
      return {
        success: true,
        message: "Successfully connected to HERE Maps API"
      }
    }

    return {
      success: false,
      message: "HERE Maps API test failed: No results returned"
    }
  } catch (error) {
    return {
      success: false,
      message: `HERE Maps test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}