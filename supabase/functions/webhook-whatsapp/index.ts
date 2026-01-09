import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { from, message, external_id } = await req.json();

    if (!from || !message) {
      return new Response(JSON.stringify({ error: 'Missing required fields: from, message' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Webhook received:', { from, message, external_id });

    // Find or create lead by WhatsApp number
    let { data: lead } = await supabase
      .from('leads')
      .select('*')
      .eq('whatsapp', from)
      .single();

    if (!lead) {
      // Create new lead
      const { data: newLead, error: leadError } = await supabase
        .from('leads')
        .insert({
          whatsapp: from,
          source: 'whatsapp',
          stage: 'lead',
        })
        .select()
        .single();

      if (leadError) throw leadError;
      lead = newLead;

      // Add novo_lead tag
      const { data: tag } = await supabase
        .from('tags')
        .select('id')
        .eq('name', 'novo_lead')
        .single();

      if (tag) {
        await supabase
          .from('lead_tags')
          .insert({ lead_id: lead.id, tag_id: tag.id });
      }

      console.log('Created new lead:', lead.id);
    }

    // Find or create conversation
    let { data: conversation } = await supabase
      .from('conversations')
      .select('*')
      .eq('lead_id', lead.id)
      .eq('status', 'active')
      .single();

    if (!conversation) {
      const { data: newConv, error: convError } = await supabase
        .from('conversations')
        .insert({
          lead_id: lead.id,
          channel: 'whatsapp',
          external_id,
        })
        .select()
        .single();

      if (convError) throw convError;
      conversation = newConv;
      console.log('Created new conversation:', conversation.id);
    }

    // Save the incoming message
    await supabase.from('messages').insert({
      conversation_id: conversation.id,
      role: 'user',
      content: message,
      metadata: { external_id, from },
    });

    // Get conversation history
    const { data: messages } = await supabase
      .from('messages')
      .select('role, content')
      .eq('conversation_id', conversation.id)
      .order('created_at', { ascending: true })
      .limit(20);

    // Call the chat-crm function to get AI response
    const chatResponse = await fetch(`${supabaseUrl}/functions/v1/chat-crm`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify({
        message,
        history: messages || [],
        lead,
      }),
    });

    if (!chatResponse.ok) {
      const error = await chatResponse.text();
      console.error('Chat function error:', error);
      throw new Error('Failed to get AI response');
    }

    const { response: aiResponse, backend_log } = await chatResponse.json();

    // Save AI response
    await supabase.from('messages').insert({
      conversation_id: conversation.id,
      role: 'assistant',
      content: aiResponse,
      backend_log,
    });

    // Apply updates from backend_log
    if (backend_log) {
      // Update lead
      await supabase
        .from('leads')
        .update({
          ...backend_log.updated_fields,
          stage: backend_log.current_stage,
          last_contact_at: new Date().toISOString(),
        })
        .eq('id', lead.id);

      // Apply tags
      const { data: allTags } = await supabase.from('tags').select('*');
      for (const tagName of backend_log.tags_to_apply || []) {
        const tag = allTags?.find(t => t.name === tagName);
        if (tag) {
          await supabase
            .from('lead_tags')
            .upsert({ lead_id: lead.id, tag_id: tag.id });
        }
      }

      // Create suggested task
      if (backend_log.suggested_task) {
        const dueAt = backend_log.suggested_task.due_in_hours
          ? new Date(Date.now() + backend_log.suggested_task.due_in_hours * 60 * 60 * 1000).toISOString()
          : null;

        await supabase.from('tasks').insert({
          lead_id: lead.id,
          title: backend_log.suggested_task.title,
          type: backend_log.suggested_task.type || 'followup',
          due_at: dueAt,
        });
      }
    }

    console.log('Processed message, AI response:', aiResponse);

    return new Response(JSON.stringify({
      success: true,
      lead_id: lead.id,
      conversation_id: conversation.id,
      response: aiResponse,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
