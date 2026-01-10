import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Lead, LeadStage, Tag } from '@/types/crm';
import { useToast } from '@/hooks/use-toast';
import { useEffect } from 'react';

export function useLeads() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: leads = [], isLoading, error } = useQuery({
    queryKey: ['leads'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leads')
        .select(`
          *,
          assigned_profile:profiles!leads_assigned_to_fkey(*),
          lead_tags(
            tag:tags(*)
          ),
          tasks(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform to match our type
      return (data || []).map(lead => ({
        ...lead,
        tags: lead.lead_tags?.map((lt: { tag: Tag }) => lt.tag) || [],
      })) as Lead[];
    },
  });

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('leads-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'leads' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['leads'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const createLead = useMutation({
    mutationFn: async (lead: Partial<Lead>) => {
      const { data, error } = await supabase
        .from('leads')
        .insert(lead)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast({ title: 'Lead criado com sucesso' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao criar lead', description: error.message, variant: 'destructive' });
    },
  });

  const updateLead = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Lead> & { id: string }) => {
      const { tags, ...cleanUpdates } = updates as any;
      const { data, error } = await supabase
        .from('leads')
        .update(cleanUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
    onError: (error) => {
      toast({ title: 'Erro ao atualizar lead', description: error.message, variant: 'destructive' });
    },
  });

  const updateLeadStage = useMutation({
    mutationFn: async ({ id, stage }: { id: string; stage: LeadStage }) => {
      const { data, error } = await supabase
        .from('leads')
        .update({ stage })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
  });

  const deleteLead = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('leads').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast({ title: 'Lead removido' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao remover lead', description: error.message, variant: 'destructive' });
    },
  });

  return {
    leads,
    isLoading,
    error,
    createLead,
    updateLead,
    updateLeadStage,
    deleteLead,
  };
}

export function useTags() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: tags = [], isLoading } = useQuery({
    queryKey: ['tags'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tags')
        .select('*')
        .order('name');

      if (error) throw error;
      return data as Tag[];
    },
  });

  const createTag = useMutation({
    mutationFn: async (tag: Partial<Tag>) => {
      const { data, error } = await supabase
        .from('tags')
        .insert(tag)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      toast({ title: 'Tag criada com sucesso' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao criar tag', description: error.message, variant: 'destructive' });
    }
  });

  const updateTag = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Tag> & { id: string }) => {
      const { data, error } = await supabase
        .from('tags')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      toast({ title: 'Tag atualizada com sucesso' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao atualizar tag', description: error.message, variant: 'destructive' });
    }
  });

  const deleteTag = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('tags').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      toast({ title: 'Tag removida' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao remover tag', description: error.message, variant: 'destructive' });
    }
  });

  return { 
    tags, 
    isLoading,
    createTag,
    updateTag,
    deleteTag
  };
}
