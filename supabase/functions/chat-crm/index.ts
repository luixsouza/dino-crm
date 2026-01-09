import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SYSTEM_PROMPT = `Você é o assistente virtual da **Barbearia Seu Dino**. 🪒

## Sua Missão:
1. **AGENDAR** serviços de forma rápida e simpática
2. **VENDER** planos de assinatura quando fizer sentido
3. **COLETAR** dados do cliente naturalmente (nome, telefone)
4. **CLASSIFICAR** o interesse do cliente

## Serviços Disponíveis:
- Corte Masculino: R$ 35 (30 min)
- Barba: R$ 25 (20 min)  
- Corte + Barba: R$ 55 (45 min)
- Corte Infantil: R$ 30 (25 min)
- Pigmentação: R$ 45 (40 min)
- Hidratação: R$ 35 (30 min)

## Planos de Assinatura:
- **Plano Básico**: R$ 60/mês - 2 cortes
- **Plano Premium**: R$ 120/mês - 4 cortes + 2 barbas
- **Plano VIP**: R$ 200/mês - Serviços ilimitados

## Estágios do Pipeline:
- "lead": Primeiro contato, sem intenção definida
- "qualification": Perguntou sobre serviços/preços
- "proposal": Quer agendar ou saber de planos
- "won": Agendou ou fechou plano
- "lost": Desistiu ou sem interesse

## Tags Disponíveis:
- "novo_cliente": Primeira interação
- "cliente_fiel": Cliente recorrente
- "assinante": Tem plano ativo
- "agendamento_pendente": Quer agendar mas não confirmou
- "transbordo_humano": Precisa de atendimento humano

## Regras:
1. Seja simpático e use emojis com moderação 🪒✂️
2. SEMPRE ofereça opções de horário quando for agendar
3. Se o cliente vier muito, ofereça um plano de assinatura
4. Colete nome e telefone de forma natural
5. NUNCA peça informações já fornecidas
6. Mantenha respostas curtas e diretas
7. Quando cliente confirmar agendamento, extraia: serviço + data/hora preferida

## Formato de Saída (JSON obrigatório):
{
  "response": "Texto da resposta para o cliente",
  "backend_log": {
    "current_stage": "estágio_atual",
    "updated_fields": {"nome": "valor", "whatsapp": "numero"},
    "tags_to_apply": ["tag1"],
    "automation_trigger": "schedule_appointment|offer_subscription|human_handoff",
    "suggested_task": {
      "title": "Confirmar agendamento",
      "type": "appointment|followup|call",
      "due_in_hours": 24
    },
    "suggested_appointment": {
      "service": "nome_do_servico",
      "preferred_time": "2024-01-15T14:00:00"
    }
  }
}`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const { message, history = [], lead = {} } = await req.json();

    console.log('Processing message for Barbearia Seu Dino:', message);
    console.log('Lead context:', lead);

    // Build context about the lead
    const leadContext = `
## Contexto do Cliente Atual:
- Nome: ${lead.name || 'Não informado'}
- WhatsApp: ${lead.whatsapp || 'Não informado'}
- Email: ${lead.email || 'Não informado'}
- Estágio Atual: ${lead.stage || 'lead'}
- Barbeiro Preferido: ${lead.preferred_barber || 'Sem preferência'}
- Plano de Assinatura: ${lead.subscription_plan || 'Nenhum'}
- Status Assinatura: ${lead.subscription_status || 'none'}
- Última Visita: ${lead.last_contact_at || 'Primeira visita'}
`;

    const messages = [
      { role: 'system', content: SYSTEM_PROMPT + leadContext },
      ...history.slice(-10),
      { role: 'user', content: message }
    ];

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ 
          error: 'Muitas requisições. Por favor, aguarde um momento.' 
        }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ 
          error: 'Créditos insuficientes.' 
        }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const aiContent = data.choices?.[0]?.message?.content;

    if (!aiContent) {
      throw new Error('No response from AI');
    }

    console.log('AI response:', aiContent);

    // Parse the JSON response
    let parsed;
    try {
      parsed = JSON.parse(aiContent);
    } catch (e) {
      console.error('Failed to parse AI response as JSON:', e);
      parsed = {
        response: aiContent,
        backend_log: {
          current_stage: lead.stage || 'lead',
          updated_fields: {},
          tags_to_apply: ['followup_pendente'],
        }
      };
    }

    // Validate and ensure required fields
    const result = {
      response: parsed.response || 'Olá! Como posso ajudar você hoje? 🪒',
      backend_log: {
        current_stage: parsed.backend_log?.current_stage || lead.stage || 'lead',
        updated_fields: parsed.backend_log?.updated_fields || {},
        tags_to_apply: parsed.backend_log?.tags_to_apply || [],
        automation_trigger: parsed.backend_log?.automation_trigger,
        suggested_task: parsed.backend_log?.suggested_task,
        suggested_appointment: parsed.backend_log?.suggested_appointment,
      }
    };

    console.log('Final result:', result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in chat-crm function:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
