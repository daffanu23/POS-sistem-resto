import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const MIDTRANS_SERVER_KEY = Deno.env.get('MIDTRANS_SERVER_KEY') || ""; 

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Perbaikan 1: Tambahkan tipe data "Request" pada parameter req
serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { order_id, gross_amount, customer_name } = await req.json()
    const authString = btoa(`${MIDTRANS_SERVER_KEY}:`);

    const midtransResponse = await fetch('https://app.sandbox.midtrans.com/snap/v1/transactions', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Basic ${authString}`
      },
      body: JSON.stringify({
        transaction_details: {
          order_id: order_id,
          gross_amount: Math.round(gross_amount)
        },
        customer_details: {
          first_name: customer_name
        }
      })
    });

    const snapData = await midtransResponse.json();

    return new Response(
      JSON.stringify(snapData),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  // Perbaikan 2: Tambahkan ": any" agar TypeScript tidak menganggapnya 'unknown'
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    })
  }
})