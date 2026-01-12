import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

declare const Deno: any;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SYSTEM_PROMPT = `Você é o ASSISTENTE VIRTUAL OFICIAL da **Barbearia Seu Dino**. 🦕🪒
"Na Barbearia Seu Dino, o estilo é pré-histórico, mas o corte é moderno!"

## 🦖 Sua Personalidade:
- **Cordial e Profissional**: Você é educado, prestativo e usa uma linguagem acolhedora.
- **Identidade da Marca**: Sempre reforçe que você fala em nome da "Barbearia Seu Dino".
- **Objetivo**: Resolver a vida do cliente (agendar, vender plano, tirar dúvida).

## 🚀 Missão Crítica:
1. **AGENDAMENTO OBRIGATÓRIO COM PROFISSIONAL**: Para agendar, você DEVE confirmar: Serviço + Data/Hora + **PROFISSIONAL**.
   - Se o cliente não citar o barbeiro, pergunte: "Tem preferência por algum profissional ou posso ver quem está livre?"
   - Se for "qualquer um", escolha um disponível no contexto e CONFIRME com o cliente: "Posso marcar com o [Nome] às [Hora]?"
2. **VENDA DE PLANOS (Clube Dino)**: Identifique oportunidades para oferecer assinaturas (ex: cliente que corta todo mês).
3. **RELACIONAMENTO**: Colete nome e whatsapp se não tiver.

## 🎯 Gerenciamento de Intenção (Tags e Estágios):
Analise a intenção e aplique as tags/estágios corretos no JSON:

- **Dúvida/Curiosidade** -> Estágio: "lead" | Tag: "frio"
- **Pergunta Preço/Serviço** -> Estágio: "qualification" | Tag: "interessado"
- **Quer Agendar (Data Específica)** -> Estágio: "proposal" | Tag: "quente"
- **Confirmou Agendamento** -> Estágio: "won" | Tag: "novo_cliente" (se for novo)
- **Quer assinar Plano** -> Estágio: "proposal" | Tag: "potencial_assinante"
- **Reclamação/Complexo** -> Trigger: "human_handoff" | Tag: "transbordo_humano"

## 📋 Regras de Ouro:
1. **Check-in de Disponibilidade**: NUNCA confirme um horário sem verificar a lista de 'Horários OCUPADOS' e 'Escalas' no contexto.
2. **Sem Alucinações**: Use apenas serviços/preços/barbeiros da lista "DADOS REAIS".
3. **Proatividade**: Se o horário pedido estiver ocupado, ofereça IMEDIATAMENTE 2 opções próximas.
4. **Fechamento**: Ao final de um agendamento, sempre recapitule: "Confirmado: [Serviço] com [Barbeiro] dia [Data] às [Hora]. Te espero na Seu Dino!"

## Validação Rigorosa de Agendamento:
Antes de confirmar, você DEVE verificar no contexto 'Escalas de Trabalho' e 'Horários OCUPADOS':
1. O barbeiro escolhido atende nesse dia da semana?
2. O horário está dentro do horário de início/fim dele?
3. O horário colide com algum 'Horário OCUPADO'?
SE FALHAR A VALIDAÇÃO: Não agende. Informe o cliente o motivo (ex: "O João não atende segundas" ou "14:00 já está ocupado") e sugira outro.
SE PASSAR A VALIDAÇÃO: Envie "automation_trigger": "schedule_appointment".

## Formato de Saída (JSON obrigatório):
{
  "response": "Texto da resposta para o cliente",
  "backend_log": {
    "current_stage": "estágio_atual",
    "updated_fields": {"name": "valor", "whatsapp": "numero", "email": "email"},
    "tags_to_apply": ["tag1"],
    "automation_trigger": "schedule_appointment|offer_subscription|human_handoff",
    "suggested_task": {
      "title": "Confirmar agendamento",
      "type": "appointment|followup|call",
      "due_in_hours": 24
    },
    "suggested_appointment": {
      "service": "nome_do_servico",
      "barber": "nome_do_barbeiro_ou_qualquer",
      "preferred_time": "2024-01-15T14:00:00"
    }
  }
}
IMPORTANTE SOBRE DATAS: Envie sempre data/hora local (ISO 8601 sem Z ou offset). Ex: "2024-10-10T14:30:00". Eu adicionarei o timezone -03:00 automaticamente.
ATENÇÃO: Use apenas "name" para o nome do cliente no campo updated_fields. NÃO use "nome". Exemplo: {"name": "João"} e não {"nome": "João"}.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, history = [], lead = {} } = await req.json();
    
    // Configuração exclusiva para OpenRouter
    const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY');
    const OPENROUTER_MODEL = Deno.env.get('OPENROUTER_MODEL') || "google/gemini-2.0-flash-lite-001"; // Default sensato

    // Validação de chave
    if (!OPENROUTER_API_KEY) {
      console.error('OPENROUTER_API_KEY ausente.');
      
      // Resposta de erro/mock amigável para setup inicial
      const mockResponse = `(Sistema Offline) A chave da IA (OpenRouter) não está configurada. Por favor, adicione OPENROUTER_API_KEY no arquivo .env`;
      
      return new Response(JSON.stringify({
         response: mockResponse,
         backend_log: { current_stage: 'lead', updated_fields: {}, tags_to_apply: ['erro_config'], suggested_task: null }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Inicializar cliente Supabase para buscar dados reais
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Buscar dados do sistema em paralelo
    const [servicesRes, productsRes, profilesRes, schedulesRes, appointmentsRes] = await Promise.all([
      supabaseClient.from('services').select('*').eq('is_active', true),
      supabaseClient.from('products').select('*').gt('stock_quantity', 0),
      supabaseClient.from('profiles').select('id, name').order('name'),
      supabaseClient.from('work_schedules').select('*').eq('is_active', true),
      supabaseClient.from('appointments').select('scheduled_at, barber_id, service:services(name)').gte('scheduled_at', new Date().toISOString()).lt('scheduled_at', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString())
    ]);

    // Formatar dados para o context da IA
    const servicesList = servicesRes.data?.map((s:any) => `- ${s.name}: R$ ${Number(s.price).toFixed(2)} (${s.duration_minutes} min)`).join('\n') || "Nenhum serviço disponível no momento.";
    const productsList = productsRes.data?.map((p:any) => `- ${p.name}: R$ ${Number(p.price).toFixed(2)}`).join('\n') || "Nenhum produto em estoque.";
    const professionalsList = profilesRes.data?.map((p:any) => `- ${p.name}`).join('\n') || "Equipe geral.";
    
    const daysMap = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    const schedulesList = schedulesRes.data?.map((s:any) => {
        const profName = profilesRes.data?.find((p:any) => p.id === s.profile_id)?.name || 'Profissional';
        return `- ${profName} (${daysMap[s.day_of_week]}): ${s.start_time.slice(0,5)} às ${s.end_time.slice(0,5)}`;
    }).join('\n') || "Segunda a Sexta: 09:00 às 18:00";

    const busySlotsList = appointmentsRes.data?.map((a:any) => {
        const profName = profilesRes.data?.find((p:any) => p.id === a.barber_id)?.name || 'Profissional';
        const date = new Date(a.scheduled_at);
        const dateString = date.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
        const timeString = date.toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' });
        return `- ${profName}: ${dateString} ${timeString} (Ocupado)`;
    }).join('\n') || "Nenhum horário ocupado nos próximos 7 dias.";

    const businessContext = `
## DADOS REAIS DO SISTEMA (LEITURA APENAS):
Hoje é: ${new Date().toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })} (Dia da semana: ${daysMap[new Date().getDay()]})
Nunca invente preços ou serviços. Use estritamente esta lista:

### 💇 Serviços e Preços:
${servicesList}

### 🛍️ Produtos à Venda:
${productsList}

### 👨‍💼 Profissionais e Horários:
${professionalsList}

### 📅 Escalas de Trabalho:
${schedulesList}

### 🚫 Horários OCUPADOS (Não agendar nestes horários):
${busySlotsList}
`;

    // console.log('Processing message with OpenRouter. Model:', OPENROUTER_MODEL);

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

    let aiContent = null;
    let lastError = null;

    // --- CHAMADA OPENROUTER ---
    console.log(`Enviando requisição via OpenRouter para modelo: ${OPENROUTER_MODEL}`);

    const messages = [
        { role: "system", content: SYSTEM_PROMPT + "\n" + businessContext + "\n" + leadContext },
        ...history.map((msg: any) => ({ 
            role: (msg.role === 'assistant' || msg.role === 'model') ? 'assistant' : 'user', 
            content: msg.content 
        }))
    ];

    // Verificar se a última mensagem do histórico já é a mensagem atual para evitar duplicação
    const lastMsg = messages[messages.length - 1];
    if (!lastMsg || lastMsg.content !== message) {
        messages.push({ role: "user", content: message });
    } else {
        console.log("Mensagem atual já presente no histórico. Não duplicando.");
    }

    try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
                "Content-Type": "application/json",
                "HTTP-Referer": "https://dino-crm.com", 
                "X-Title": "Dino CRM"
            },
            body: JSON.stringify({
                "model": OPENROUTER_MODEL,
                "messages": messages,
                "response_format": { "type": "json_object" }
            })
        });
        
        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`OpenRouter API Error: ${response.status} - ${errText}`);
        }

        const data = await response.json();
        aiContent = data.choices?.[0]?.message?.content;

    } catch (error) {
        console.error("Erro crítico na comunicação com OpenRouter:", error);
        lastError = error;
    }

    if (!aiContent) {
        console.log("⚠️ Falha na IA (OpenRouter). Usando Mock de Emergência.");
        
        const lowerMsg = (message || "").toLowerCase();
        let fallbackResponse = "Olá! Meus circuitos de IA estão temporariamente indisponíveis (Erro no provedor). Posso anotar seu pedido manualmente.";
        
        if (lowerMsg.includes('horario') || lowerMsg.includes('agendar')) {
             fallbackResponse = "Claro! (Modo Fallback Offline) Como estou sem conexão com meu cérebro digital agora, poderia me dizer qual serviço deseja?";
        }
        
        return new Response(JSON.stringify({
             response: `[OFFLINE/ERRO] ${fallbackResponse} \n(Detalhe: ${lastError})`,
             backend_log: { current_stage: lead.stage || 'lead', updated_fields: {}, tags_to_apply: ['erro_ia'], suggested_task: null }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    console.log('AI response success');

    // Parse the JSON response
    let parsed;
    try {
      parsed = JSON.parse(aiContent);
    } catch (e) {
      console.error('Failed to parse AI response as JSON:', e);
      // Fallback if AI didn't return valid JSON
      parsed = {
        response: aiContent, // Treat the whole text as response
        backend_log: {
          current_stage: lead.stage || 'lead',
          updated_fields: {},
          tags_to_apply: [],
        }
      };
    }

    // Validate and ensure required fields
    const result = {
      response: parsed.response || 'Desculpe, não entendi.',
      backend_log: {
        current_stage: parsed.backend_log?.current_stage || lead.stage || 'lead',
        updated_fields: parsed.backend_log?.updated_fields || {},
        tags_to_apply: parsed.backend_log?.tags_to_apply || [],
        automation_trigger: parsed.backend_log?.automation_trigger,
        suggested_task: parsed.backend_log?.suggested_task,
        suggested_appointment: parsed.backend_log?.suggested_appointment,
      }
    };

    // AUTOMATION: Schedule Appointment
    if (result.backend_log.automation_trigger === 'schedule_appointment' && 
        result.backend_log.suggested_appointment && 
        lead.id &&
        result.backend_log.suggested_appointment.service &&
        result.backend_log.suggested_appointment.preferred_time) {
        
        console.log("Triggering auto-schedule for lead:", lead.id);

        try {
            const appointment = result.backend_log.suggested_appointment;
            
            // Find Service ID
            const serviceData = servicesRes.data?.find((s:any) => 
                s.name.toLowerCase() === appointment.service?.toLowerCase() || 
                s.name.toLowerCase().includes(appointment.service?.toLowerCase())
            );

            // Find Barber ID
            let barberId = null;
            if (appointment.barber) {
                 const barberData = profilesRes.data?.find((p:any) => 
                    p.name.toLowerCase().includes(appointment.barber?.toLowerCase())
                );
                if (barberData) barberId = barberData.id;
            }

            if (serviceData) {
                // CORREÇÃO DE TIMEZONE PARA BRASIL (-03:00)
                // Se a data vier sem offset (ex: 2024-01-15T10:00:00), assumimos que é horário local e adicionamos -03:00.
                // Se não fizermos isso, o banco assume UTC e "10:00" vira "07:00" ao converter para horário local.
                let finalScheduledAt = appointment.preferred_time;
                if (!finalScheduledAt.match(/([+-]\d{2}:?\d{2}|Z)$/)) {
                    finalScheduledAt = `${finalScheduledAt}-03:00`;
                    console.log(`Ajustando Timezone: ${appointment.preferred_time} -> ${finalScheduledAt}`);
                }

                const { error: insertError } = await supabaseClient.from('appointments').insert({
                    lead_id: lead.id,
                    service_id: serviceData.id,
                    barber_id: barberId, // Can be null if not found/specified
                    scheduled_at: finalScheduledAt,
                    status: 'scheduled',
                    notes: 'Agendado via IA WhatsApp'
                });
                
                if (!insertError) {
                    result.response += "\n✅ (Agendamento confirmado no sistema com sucesso!)";
                    console.log("Appointment created successfully");
                } else {
                    console.error("Failed to persist appointment:", insertError);
                    result.response += "\n⚠️ (Confirmado no chat, mas houve um erro ao salvar na agenda. Por favor avise a recepção.)";
                }
            } else {
                 console.log("Service not found for auto-schedule:", appointment.service);
                 result.response += "\n⚠️ (Não consegui identificar o serviço exato para salvar no sistema, mas anotei seu pedido.)";
            }

        } catch (err) {
            console.error('Auto-schedule logic error:', err);
        }
    }

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
