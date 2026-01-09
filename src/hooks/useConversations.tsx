import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Conversation, Message, BackendLog, MessageRole, ConversationStatus } from '@/types/crm';
import { useEffect, useState } from 'react';
import { Json } from '@/integrations/supabase/types';

export function useConversations(leadId?: string) {
  const queryClient = useQueryClient();

  const { data: conversations = [], isLoading } = useQuery({
    queryKey: ['conversations', leadId],
    queryFn: async () => {
      let query = supabase
        .from('conversations')
        .select(`
          *,
          lead:leads(*),
          messages(*)
        `)
        .order('updated_at', { ascending: false });

      if (leadId) {
        query = query.eq('lead_id', leadId);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      // Transform to match our types
      return (data || []).map(conv => ({
        ...conv,
        status: conv.status as ConversationStatus,
        messages: conv.messages?.map((msg: Record<string, unknown>) => ({
          ...msg,
          role: msg.role as MessageRole,
          metadata: msg.metadata as Record<string, unknown> | undefined,
          backend_log: msg.backend_log as unknown as BackendLog | undefined,
        })),
      })) as Conversation[];
    },
  });

  const createConversation = useMutation({
    mutationFn: async (conversation: { lead_id: string; channel?: string; external_id?: string }) => {
      const { data, error } = await supabase
        .from('conversations')
        .insert(conversation)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });

  return {
    conversations,
    isLoading,
    createConversation,
  };
}

export function useMessages(conversationId: string | undefined) {
  const queryClient = useQueryClient();
  const [messages, setMessages] = useState<Message[]>([]);

  const { data: initialMessages = [], isLoading } = useQuery({
    queryKey: ['messages', conversationId],
    queryFn: async () => {
      if (!conversationId) return [];

      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      return (data || []).map(msg => ({
        ...msg,
        role: msg.role as MessageRole,
        metadata: msg.metadata as Record<string, unknown> | undefined,
        backend_log: msg.backend_log as unknown as BackendLog | undefined,
      })) as Message[];
    },
    enabled: !!conversationId,
  });

  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  // Realtime subscription for messages
  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`messages-${conversationId}`)
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          const newMsg = payload.new as Record<string, unknown>;
          setMessages(prev => [...prev, {
            ...newMsg,
            role: newMsg.role as MessageRole,
            metadata: newMsg.metadata as Record<string, unknown> | undefined,
            backend_log: newMsg.backend_log as unknown as BackendLog | undefined,
          } as Message]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  const sendMessage = useMutation({
    mutationFn: async (message: { conversation_id: string; role: string; content: string; metadata?: Json; backend_log?: Json }) => {
      const { data, error } = await supabase
        .from('messages')
        .insert(message)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
    },
  });

  return {
    messages,
    isLoading,
    sendMessage,
  };
}
