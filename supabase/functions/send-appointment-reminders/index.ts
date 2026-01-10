// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const WHATSAPP_API_TOKEN = Deno.env.get('WHATSAPP_API_TOKEN')
const WHATSAPP_PHONE_NUMBER_ID = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID')

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // 1. Get appointments for the next 24 hours that haven't been reminded
    const now = new Date()
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)

    const { data: appointments, error: fetchError } = await supabase
      .from('appointments')
      .select(`
        *,
        lead:leads(*),
        service:services(*),
        barber:profiles(*)
      `)
      .eq('status', 'scheduled')
      .eq('reminder_sent', false)
      .gt('scheduled_at', now.toISOString())
      .lt('scheduled_at', tomorrow.toISOString())

    if (fetchError) throw fetchError

    console.log(`Found ${appointments?.length} appointments to remind.`)

    const results = []

    for (const apt of appointments || []) {
      const leadName = apt.lead?.name || 'Cliente'
      const serviceName = apt.service?.name || 'Serviço'
      const barberName = apt.barber?.name || 'Profissional'
      const date = new Date(apt.scheduled_at).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }) // Adjust timezone as needed

      const message = `Olá ${leadName}, lembrete do seu agendamento: ${serviceName} com ${barberName} em ${date}. Confirmado?`

      const promises = []

      // Send Email
      if (apt.lead?.email && RESEND_API_KEY) {
        promises.push(
          fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${RESEND_API_KEY}`,
            },
            body: JSON.stringify({
              from: 'Dino CRM <onboarding@resend.dev>', // Update with verified domain
              to: [apt.lead.email],
              subject: 'Lembrete de Agendamento',
              html: `<p>${message}</p>`,
            }),
          }).then(res => res.json()).catch(err => ({ error: err }))
        )
      }

      // Send WhatsApp (Meta Graph API)
      if (apt.lead?.whatsapp && WHATSAPP_API_TOKEN && WHATSAPP_PHONE_NUMBER_ID) {
        // Simple text message for now. Templates are required for business initiated conversations usually.
        // Assuming we are within the 24h window or using a template.
        // For simplicity, attempting text message, but in prod would need template.
        promises.push(
            fetch(`https://graph.facebook.com/v17.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${WHATSAPP_API_TOKEN}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    messaging_product: 'whatsapp',
                    to: apt.lead.whatsapp,
                    type: 'text',
                    text: { body: message },
                }),
            }).then(res => res.json()).catch(err => ({ error: err }))
        )
      }

      const sendResults = await Promise.all(promises)
      
      // Update appointment as reminded
      const { error: updateError } = await supabase
        .from('appointments')
        .update({ reminder_sent: true })
        .eq('id', apt.id)

      results.push({
        id: apt.id,
        sendResults,
        updateError
      })
    }

    return new Response(JSON.stringify({ success: true, processed: results.length, details: results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
