import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
}

interface CarbonCreditRequest {
  farmerId: string;
  practices: string[];
  acreage: number;
  cropType: string;
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
      const { farmerId, practices, acreage, cropType }: CarbonCreditRequest = await req.json()

      // Calculate estimated carbon credits based on practices
      let estimatedCredits = 0
      const creditRates = {
        "no-till": 0.5, // credits per acre
        "cover-cropping": 0.3,
        "rotational-grazing": 0.4,
        "agroforestry": 0.8,
        "precision-agriculture": 0.2,
        "organic-farming": 0.6
      }

      practices.forEach(practice => {
        const rate = creditRates[practice as keyof typeof creditRates] || 0.1
        estimatedCredits += rate * acreage
      })

      // Apply crop-specific multipliers
      const cropMultipliers = {
        "corn": 1.0,
        "soy": 1.1,
        "wheat": 0.9,
        "rice": 1.2,
        "cotton": 0.8
      }

      const multiplier = cropMultipliers[cropType.toLowerCase() as keyof typeof cropMultipliers] || 1.0
      estimatedCredits *= multiplier

      // Current carbon credit price (mock API call)
      const carbonPrice = 15 + Math.random() * 10 // $15-25 per credit

      // Create or update carbon credit record
      const { data: existingCredit } = await supabase
        .from("carbon_credits")
        .select("*")
        .eq("farmer_id", farmerId)
        .single()

      let result
      if (existingCredit) {
        // Update existing record
        result = await supabase
          .from("carbon_credits")
          .update({
            practices_reported: practices.join(", "),
            estimated_credits: Math.round(estimatedCredits * 100) / 100,
            credit_price: Math.round(carbonPrice * 100) / 100,
            total_value: Math.round(estimatedCredits * carbonPrice * 100) / 100,
            updated_at: new Date().toISOString()
          })
          .eq("farmer_id", farmerId)
          .select()
          .single()
      } else {
        // Create new record
        result = await supabase
          .from("carbon_credits")
          .insert({
            farmer_id: farmerId,
            opt_in_date: new Date().toISOString().split('T')[0],
            practices_reported: practices.join(", "),
            verification_status: "pending",
            estimated_credits: Math.round(estimatedCredits * 100) / 100,
            credit_price: Math.round(carbonPrice * 100) / 100,
            total_value: Math.round(estimatedCredits * carbonPrice * 100) / 100,
            registry_id: `AGS-${Date.now()}-${farmerId.slice(-6)}`
          })
          .select()
          .single()
      }

      if (result.error) {
        throw new Error(result.error.message)
      }

      // Mock verification process (in production, would integrate with actual carbon registries)
      const verificationResult = {
        status: "submitted",
        estimatedTimeframe: "14-21 days",
        requiredDocuments: [
          "Soil carbon analysis",
          "Practice implementation photos",
          "Field management records"
        ],
        nextSteps: [
          "Site verification scheduled",
          "Documentation review",
          "Credit issuance upon approval"
        ]
      }

      return new Response(
        JSON.stringify({
          carbonCredit: result.data,
          verification: verificationResult,
          marketInfo: {
            currentPrice: carbonPrice,
            priceRange: "$15-25 per credit",
            marketTrend: "stable",
            projectedValue: Math.round(estimatedCredits * carbonPrice * 100) / 100
          }
        }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      )
    }

    // GET request - fetch carbon credit status
    if (req.method === "GET") {
      const url = new URL(req.url)
      const farmerId = url.searchParams.get("farmer_id")

      if (!farmerId) {
        throw new Error("farmer_id is required")
      }

      const { data: carbonCredit, error } = await supabase
        .from("carbon_credits")
        .select("*")
        .eq("farmer_id", farmerId)
        .single()

      if (error && error.code !== "PGRST116") {
        throw new Error(error.message)
      }

      // Get current market data (mock)
      const marketData = {
        currentPrice: 15 + Math.random() * 10,
        volume24h: 1250 + Math.random() * 500,
        priceChange: (Math.random() - 0.5) * 4, // -2% to +2%
        topBuyers: ["Microsoft", "Google", "Amazon", "Apple"],
        averageVerificationTime: "18 days"
      }

      return new Response(
        JSON.stringify({
          carbonCredit: carbonCredit || null,
          marketData,
          eligiblePractices: Object.keys(creditRates),
          estimatedEarnings: carbonCredit ? 
            Math.round(carbonCredit.estimated_credits * marketData.currentPrice * 100) / 100 : 0
        }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      )
    }

  } catch (error) {
    console.error("Error in carbon-credit-integration:", error)
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