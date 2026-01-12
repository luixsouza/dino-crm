import { useState, useEffect, useRef } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useLeads, useTags } from '@/hooks/useLeads';
import { useConversations, useMessages } from '@/hooks/useConversations';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Send, Bot, User, Search, MoreVertical, Phone, 
  Video, Paperclip, Smile, Check, CheckCheck, 
  Clock, AlertTriangle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Conversation, Lead, MessageRole } from '@/types/crm';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function Chat() {
  const { conversations, isLoading: loadingConversations } = useConversations();
  const { tags } = useTags();
  const { toast } = useToast();
  
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [inputMessage, setInputMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Derived state
  const selectedConversation = conversations?.find(c => c.id === selectedConversationId);
  const { messages, sendMessage, isLoading: loadingMessages } = useMessages(selectedConversationId || '');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, selectedConversationId]);

  // Filter conversations
  const filteredConversations = conversations?.filter(c => 
    c.lead?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.lead?.whatsapp?.includes(searchTerm)
  );

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputMessage.trim() || !selectedConversation) return;

    const content = inputMessage.trim();
    setInputMessage('');

    try {
      // Send as 'assistant' (Human Agent intervening)
      // Note: In a real integration, this would also trigger the WhatsApp API via a backend function
      await sendMessage.mutateAsync({
        conversation_id: selectedConversation.id,
        role: 'assistant', 
        content: content,
        metadata: { agent_triggered: true }
      });
      
      // Optional: Pause AI if human intervenes?
      // const transbordoTag = tags.find(t => t.name === 'transbordo_humano');
      // if (transbordoTag) { ... apply tag ... }

    } catch (error) {
      console.error('Failed to send message:', error);
      toast({ title: 'Erro ao enviar', description: 'Não foi possível enviar a mensagem.', variant: 'destructive' });
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const formatMessageTime = (dateStr: string) => {
    return format(new Date(dateStr), 'HH:mm', { locale: ptBR });
  };

  return (
    <AppLayout>
      <div className="flex h-[calc(100vh-2rem)] bg-background rounded-lg border overflow-hidden">
        
        {/* LEFT SIDEBAR: Conversations List */}
        <div className="w-80 md:w-96 border-r flex flex-col bg-muted/10">
          {/* Header */}
          <div className="p-4 border-b flex justify-between items-center bg-background/50 backdrop-blur">
            <h2 className="font-semibold text-lg flex items-center gap-2">
               Conversas
               <Badge variant="secondary" className="ml-1 text-xs">
                 {conversations?.length || 0}
               </Badge>
            </h2>
          </div>

          {/* Search */}
          <div className="p-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar ou iniciar nova conversa"
                className="pl-9 bg-background"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* List */}
          <ScrollArea className="flex-1">
            <div className="flex flex-col">
              {filteredConversations?.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => setSelectedConversationId(conv.id)}
                  className={cn(
                    "flex items-center gap-3 p-4 text-left transition-colors hover:bg-accent/50 border-b border-border/50",
                    selectedConversationId === conv.id && "bg-accent"
                  )}
                >
                  <Avatar>
                    <AvatarFallback className={cn(
                      "text-sm font-semibold", 
                      selectedConversationId === conv.id ? "bg-primary text-primary-foreground" : "bg-muted"
                    )}>
                      {getInitials(conv.lead?.name || 'Unknown')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 overflow-hidden">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-medium truncate text-sm">
                        {conv.lead?.name || conv.lead?.whatsapp || 'Lead Desconhecido'}
                      </span>
                      {conv.updated_at && (
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(conv.updated_at), 'dd/MM', { locale: ptBR })}
                        </span>
                      )}
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="text-xs text-muted-foreground truncate max-w-[180px]">
                         {/* Show last message preview if available */}
                         {/* This would require fetching last message in list query, for now placeholder */}
                         {conv.lead?.stage ? `Estágio: ${conv.lead.stage}` : 'Clique para ver'}
                      </p>
                      {/* Unread indicator could go here */}
                    </div>
                  </div>
                </button>
              ))}
              
              {loadingConversations && (
                <div className="p-8 text-center text-muted-foreground text-sm">
                   Carregando conversas...
                </div>
              )}
              
              {!loadingConversations && filteredConversations?.length === 0 && (
                <div className="p-8 text-center text-muted-foreground text-sm">
                   Nenhuma conversa encontrada.
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* RIGHT AREA: Chat Window */}
        <div className="flex-1 flex flex-col bg-[#efeae2] dark:bg-background/95 relative">
          
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="h-16 px-4 py-2 border-b bg-background flex items-center justify-between shadow-sm z-10">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {getInitials(selectedConversation.lead?.name || '?')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-sm">
                      {selectedConversation.lead?.name || selectedConversation.lead?.whatsapp}
                    </h3>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      {selectedConversation.lead?.whatsapp}
                      <span className="mx-1">•</span>
                      {selectedConversation.channel}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                   <Button variant="ghost" size="icon" title="Ver Informações">
                     <Search className="h-4 w-4" />
                   </Button>
                   <Button variant="ghost" size="icon">
                     <MoreVertical className="h-4 w-4" />
                   </Button>
                </div>
              </div>

              {/* Messages Area */}
              <ScrollArea className="flex-1 p-4 bg-opacity-10 bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] dark:bg-none">
                 <div className="space-y-4 pb-2">
                    {messages.map((msg, idx) => {
                      const isUser = msg.role === 'user';
                      const isSystem = msg.role === 'system';
                      
                      if (isSystem) return null; // Hide system prompts

                      return (
                        <div 
                          key={msg.id || idx} 
                          className={cn(
                            "flex w-full",
                            isUser ? "justify-start" : "justify-end"
                          )}
                        >
                          <div className={cn(
                            "max-w-[70%] rounded-lg px-3 py-2 text-sm shadow-sm relative group",
                            isUser ? "bg-white dark:bg-muted text-foreground rounded-tr-lg" : "bg-[#d9fdd3] dark:bg-primary/20 text-foreground rounded-tl-lg"
                          )}>
                             {/* Sender Name/Icon */}
                             {!isUser && (
                               <p className="text-[10px] font-bold text-primary/80 mb-1 uppercase flex items-center gap-1">
                                 <Bot className="h-3 w-3" /> Dino AI
                               </p>
                             )}
                             
                             <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                             
                             <div className="flex justify-end items-center gap-1 mt-1 opacity-70">
                               <span className="text-[10px]">{formatMessageTime(msg.created_at)}</span>
                               {!isUser && <CheckCheck className="h-3 w-3 text-blue-500" />}
                             </div>
                             
                             {/* AI Backend Details (On Hover/Click - could be expanded) */}
                             {msg.backend_log && (
                               <div className="mt-2 pt-2 border-t border-black/5 text-[10px] text-muted-foreground">
                                  <div className="flex gap-1 flex-wrap">
                                    {(msg.backend_log as any).tags_to_apply?.map((t: string) => (
                                       <span key={t} className="bg-black/5 px-1 rounded">#{t}</span>
                                    ))}
                                  </div>
                               </div>
                             )}
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                 </div>
              </ScrollArea>

              {/* Input Area */}
              <div className="p-3 bg-background border-t">
                <form 
                  onSubmit={handleSendMessage}
                  className="flex items-end gap-2 max-w-4xl mx-auto"
                >
                  <Button type="button" variant="ghost" size="icon" className="mb-1">
                    <Smile className="h-5 w-5 text-muted-foreground" />
                  </Button>
                  <Button type="button" variant="ghost" size="icon" className="mb-1">
                    <Paperclip className="h-5 w-5 text-muted-foreground" />
                  </Button>
                  
                  <div className="flex-1 bg-muted/30 rounded-lg border focus-within:ring-1 focus-within:ring-primary">
                    <Input
                      className="border-0 focus-visible:ring-0 bg-transparent min-h-[44px] py-3"
                      placeholder="Digite uma mensagem (Você assumirá o controle)..."
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                    />
                  </div>

                  <Button 
                    type="submit" 
                    disabled={!inputMessage.trim()}
                    className={cn(
                      "h-11 w-11 rounded-full shadow-sm transition-all",
                      inputMessage.trim() ? "bg-green-600 hover:bg-green-700" : "bg-muted text-muted-foreground"
                    )}
                  >
                     <Send className="h-5 w-5 ml-0.5" />
                  </Button>
                </form>
                <div className="text-center mt-2">
                   <p className="text-[10px] text-muted-foreground flex items-center justify-center gap-1">
                     <AlertTriangle className="h-3 w-3" />
                     Ao enviar mensagem manual, a IA não responderá automaticamente neste turno.
                   </p>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground bg-muted/5 p-8 text-center">
              <div className="bg-background p-4 rounded-full shadow-sm mb-4">
                 <Bot className="h-12 w-12 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Dino CRM Web</h3>
              <p className="max-w-md">
                Selecione uma conversa à esquerda para monitorar o atendimento da IA ou intervir manualmente.
              </p>
              <div className="mt-8 flex gap-2 text-sm">
                 <Badge variant="outline" className="gap-1"><CheckCheck className="h-3 w-3"/> Monitoramento em Real-Time</Badge>
                 <Badge variant="outline" className="gap-1"><Bot className="h-3 w-3"/> IA Ativa</Badge>
              </div>
            </div>
          )}
        </div>

      </div>
    </AppLayout>
  );
}
