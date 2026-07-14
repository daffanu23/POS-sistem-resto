import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { order_id, total_amount, customer_name } = await req.json()
    const MIDTRANS_SERVER_KEY = Deno.env.get('MIDTRANS_SERVER_KEY') || "";
    
    // Encoding base64 untuk Basic Auth Midtrans
    const authString = btoa(`${MIDTRANS_SERVER_KEY}:`);

    const response = await fetch('https://app.sandbox.midtrans.com/snap/v1/transactions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${authString}`
      },
      body: JSON.stringify({
        transaction_details: {
          order_id: order_id,
          gross_amount: Math.round(total_amount)
        },
        customer_details: {
          first_name: customer_name
        },
        enabled_payments: ["qris", "gopay", "shopeepay", "bank_transfer"]
      })
    });

    const data = await response.json();
    
    // Log eror dari Midtrans jika ada
    if (!response.ok) {
      console.error("Midtrans Error:", data);
      throw new Error(data.message || "Gagal menghubungi Midtrans");
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }
})