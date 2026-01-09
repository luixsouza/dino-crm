import { useState, useRef, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useLeads } from '@/hooks/useLeads';
import { useConversations, useMessages } from '@/hooks/useConversations';
import { useTasks } from '@/hooks/useTasks';
import { useTags } from '@/hooks/useLeads';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Send, Bot, User, Loader2, Plus, Phone, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Lead, Conversation, BackendLog, PIPELINE_STAGES } from '@/types/crm';
import { useToast } from '@/hooks/use-toast';
import { Json } from '@/integrations/supabase/types';

export default function Chat() {
  const { leads, createLead, updateLead } = useLeads();
  const { tags } = useTags();
  const { conversations, createConversation } = useConversations();
  const { createTask } = useTasks();
  const { toast } = useToast();

  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [inputMessage, setInputMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showBackendLog, setShowBackendLog] = useState(true);
  const [lastBackendLog, setLastBackendLog] = useState<BackendLog | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { messages, sendMessage } = useMessages(selectedConversation?.id);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Create new simulation
  const handleNewSimulation = async () => {
    try {
      // Create a new lead for simulation
      const { data: newLead } = await supabase
        .from('leads')
        .insert({ source: 'simulacao', stage: 'lead' })
        .select()
        .single();

      if (!newLead) throw new Error('Failed to create lead');

      // Create conversation for this lead
      const { data: newConv } = await supabase
        .from('conversations')
        .insert({ lead_id: newLead.id, channel: 'simulacao' })
        .select()
        .single();

      if (!newConv) throw new Error('Failed to create conversation');

      // Add initial tag
      const novoLeadTag = tags.find(t => t.name === 'novo_lead');
      if (novoLeadTag) {
        await supabase
          .from('lead_tags')
          .insert({ lead_id: newLead.id, tag_id: novoLeadTag.id });
      }

      setSelectedLead(newLead as Lead);
      setSelectedConversation(newConv as Conversation);
      setLastBackendLog(null);

      toast({ title: 'Simulação iniciada', description: 'Comece a conversar como um lead!' });
    } catch (error) {
      toast({ title: 'Erro', description: 'Não foi possível iniciar a simulação', variant: 'destructive' });
    }
  };

  // Send message and get AI response
  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !selectedConversation || !selectedLead) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    setIsProcessing(true);

    try {
      // Save user message
      await sendMessage.mutateAsync({
        conversation_id: selectedConversation.id,
        role: 'user',
        content: userMessage,
      });

      // Get conversation history for context
      const conversationHistory = messages.map(m => ({
        role: m.role,
        content: m.content,
      }));

      // Call AI edge function
      const { data, error } = await supabase.functions.invoke('chat-crm', {
        body: {
          message: userMessage,
          history: conversationHistory,
          lead: selectedLead,
        },
      });

      if (error) throw error;

      const { response, backend_log } = data as { response: string; backend_log: BackendLog };

      // Save assistant message with backend log
      await sendMessage.mutateAsync({
        conversation_id: selectedConversation.id,
        role: 'assistant',
        content: response,
        backend_log: backend_log as unknown as Json,
      });

      setLastBackendLog(backend_log);

      // Apply updates from backend_log
      if (backend_log) {
        // Update lead fields
        if (Object.keys(backend_log.updated_fields).length > 0) {
          await supabase
            .from('leads')
            .update({
              ...backend_log.updated_fields,
              stage: backend_log.current_stage,
              last_contact_at: new Date().toISOString(),
            })
            .eq('id', selectedLead.id);
        }

        // Apply tags
        for (const tagName of backend_log.tags_to_apply) {
          const tag = tags.find(t => t.name === tagName);
          if (tag) {
            await supabase
              .from('lead_tags')
              .upsert({ lead_id: selectedLead.id, tag_id: tag.id });
          }
        }

        // Create suggested task (Regra Kommo)
        if (backend_log.suggested_task) {
          const dueAt = backend_log.suggested_task.due_in_hours
            ? new Date(Date.now() + backend_log.suggested_task.due_in_hours * 60 * 60 * 1000).toISOString()
            : undefined;

          await supabase.from('tasks').insert({
            lead_id: selectedLead.id,
            title: backend_log.suggested_task.title,
            type: backend_log.suggested_task.type,
            due_at: dueAt,
          });
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
      toast({ 
        title: 'Erro ao processar mensagem', 
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive' 
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const getStageLabel = (stage: string) => {
    return PIPELINE_STAGES.find(s => s.key === stage)?.label || stage;
  };

  return (
    <AppLayout>
      <div className="h-[calc(100vh-2rem)] flex gap-4 p-6">
        {/* Chat Panel */}
        <Card className="flex-1 flex flex-col">
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-4">
            <div className="flex items-center gap-3">
              {selectedLead ? (
                <>
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {selectedLead.name?.[0]?.toUpperCase() || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-lg">
                      {selectedLead.name || 'Lead #' + selectedLead.id.slice(0, 8)}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {selectedLead.whatsapp || 'Simulação de Chat'}
                    </p>
                  </div>
                </>
              ) : (
                <CardTitle>Chat de Simulação</CardTitle>
              )}
            </div>
            <Button onClick={handleNewSimulation} variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Nova Simulação
            </Button>
          </CardHeader>

          <Separator />

          {/* Messages */}
          <ScrollArea className="flex-1 p-4">
            {!selectedConversation ? (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                <Bot className="h-12 w-12 mb-4 opacity-50" />
                <p className="text-lg font-medium">Inicie uma simulação</p>
                <p className="text-sm">Teste o chatbot de IA conversando como um lead</p>
                <Button onClick={handleNewSimulation} className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Simulação
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn(
                      'flex gap-3',
                      msg.role === 'user' ? 'justify-end' : 'justify-start'
                    )}
                  >
                    {msg.role === 'assistant' && (
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-secondary text-secondary-foreground">
                          <Bot className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div
                      className={cn(
                        'max-w-[70%] rounded-lg px-4 py-2',
                        msg.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      )}
                    >
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    </div>
                    {msg.role === 'user' && (
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-accent text-accent-foreground">
                          <User className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                ))}
                {isProcessing && (
                  <div className="flex gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-secondary text-secondary-foreground">
                        <Bot className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="bg-muted rounded-lg px-4 py-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </ScrollArea>

          {/* Input */}
          {selectedConversation && (
            <>
              <Separator />
              <div className="p-4">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="flex gap-2"
                >
                  <Input
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="Digite como um lead..."
                    disabled={isProcessing}
                  />
                  <Button type="submit" disabled={isProcessing || !inputMessage.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </>
          )}
        </Card>

        {/* Backend Log Panel */}
        {showBackendLog && selectedLead && (
          <Card className="w-80 flex flex-col">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Backend Log (Debug)
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-auto">
              {lastBackendLog ? (
                <div className="space-y-4 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs mb-1">Estágio</p>
                    <Badge>{getStageLabel(lastBackendLog.current_stage)}</Badge>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs mb-1">Tags Aplicadas</p>
                    <div className="flex gap-1 flex-wrap">
                      {lastBackendLog.tags_to_apply.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs mb-1">Campos Atualizados</p>
                    <pre className="text-xs bg-muted p-2 rounded overflow-auto">
                      {JSON.stringify(lastBackendLog.updated_fields, null, 2)}
                    </pre>
                  </div>
                  {lastBackendLog.suggested_task && (
                    <div>
                      <p className="text-muted-foreground text-xs mb-1">Tarefa Criada</p>
                      <p className="text-xs">{lastBackendLog.suggested_task.title}</p>
                    </div>
                  )}
                  {lastBackendLog.automation_trigger && (
                    <div>
                      <p className="text-muted-foreground text-xs mb-1">Automação</p>
                      <Badge variant="secondary">{lastBackendLog.automation_trigger}</Badge>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">
                  O log de backend aparecerá aqui após cada resposta da IA.
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
