import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CustomPipeline, PipelineStage, StageAutomation } from '@/types/crm';
import { useToast } from '@/hooks/use-toast';
import { Json } from '@/integrations/supabase/types';

export function usePipelines() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: pipelines = [], isLoading } = useQuery({
    queryKey: ['pipelines'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('custom_pipelines')
        .select(`
          *,
          stages:pipeline_stages(
            *,
            automations:stage_automations(*)
          )
        `)
        .eq('is_active', true)
        .order('display_order');

      if (error) throw error;

      return (data || []).map(pipeline => ({
        ...pipeline,
        on_completion_action: pipeline.on_completion_action as 'restart' | 'move_to_pipeline' | 'archive',
        stages: (pipeline.stages || [])
          .sort((a: { display_order: number }, b: { display_order: number }) => a.display_order - b.display_order)
          .map((stage: Record<string, unknown>) => ({
            ...stage,
            final_type: stage.final_type as 'success' | 'failure' | undefined,
            automations: (stage.automations as Record<string, unknown>[] || []).map((auto: Record<string, unknown>) => ({
              ...auto,
              trigger_type: auto.trigger_type as 'on_enter' | 'on_exit' | 'on_time' | 'on_tag',
              action_type: auto.action_type as 'create_task' | 'send_message' | 'apply_tag' | 'move_stage' | 'notify_team',
              trigger_config: auto.trigger_config as Record<string, unknown>,
              action_config: auto.action_config as Record<string, unknown>,
            })),
          })),
      })) as CustomPipeline[];
    },
  });

  const createPipeline = useMutation({
    mutationFn: async (pipeline: { name: string; description?: string; icon?: string; color?: string }) => {
      const { data, error } = await supabase
        .from('custom_pipelines')
        .insert(pipeline)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pipelines'] });
      toast({ title: 'Pipeline criado com sucesso' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao criar pipeline', description: error.message, variant: 'destructive' });
    },
  });

  const updatePipeline = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; name?: string; description?: string; icon?: string; color?: string; on_completion_action?: string; on_completion_target_pipeline?: string }) => {
      const { data, error } = await supabase
        .from('custom_pipelines')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pipelines'] });
      toast({ title: 'Pipeline atualizado' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao atualizar pipeline', description: error.message, variant: 'destructive' });
    },
  });

  const deletePipeline = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('custom_pipelines')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pipelines'] });
      toast({ title: 'Pipeline removido' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao remover pipeline', description: error.message, variant: 'destructive' });
    },
  });

  return {
    pipelines,
    isLoading,
    createPipeline,
    updatePipeline,
    deletePipeline,
  };
}

export function usePipelineStages(pipelineId?: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: stages = [], isLoading } = useQuery({
    queryKey: ['pipeline-stages', pipelineId],
    queryFn: async () => {
      if (!pipelineId) return [];

      const { data, error } = await supabase
        .from('pipeline_stages')
        .select(`
          *,
          automations:stage_automations(*)
        `)
        .eq('pipeline_id', pipelineId)
        .order('display_order');

      if (error) throw error;
      
      return (data || []).map(stage => ({
        ...stage,
        final_type: stage.final_type as 'success' | 'failure' | undefined,
        automations: (stage.automations || []).map((auto: Record<string, unknown>) => ({
          ...auto,
          trigger_type: auto.trigger_type as 'on_enter' | 'on_exit' | 'on_time' | 'on_tag',
          action_type: auto.action_type as 'create_task' | 'send_message' | 'apply_tag' | 'move_stage' | 'notify_team',
          trigger_config: auto.trigger_config as Record<string, unknown>,
          action_config: auto.action_config as Record<string, unknown>,
        })),
      })) as PipelineStage[];
    },
    enabled: !!pipelineId,
  });

  const createStage = useMutation({
    mutationFn: async (stage: { pipeline_id: string; name: string; description?: string; color?: string; display_order?: number; is_final?: boolean; final_type?: string; ai_prompt?: string }) => {
      const { data, error } = await supabase
        .from('pipeline_stages')
        .insert(stage)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pipeline-stages', pipelineId] });
      queryClient.invalidateQueries({ queryKey: ['pipelines'] });
      toast({ title: 'Estágio criado' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao criar estágio', description: error.message, variant: 'destructive' });
    },
  });

  const updateStage = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; name?: string; description?: string; color?: string; display_order?: number; is_final?: boolean; final_type?: string; ai_prompt?: string }) => {
      const { data, error } = await supabase
        .from('pipeline_stages')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pipeline-stages', pipelineId] });
      queryClient.invalidateQueries({ queryKey: ['pipelines'] });
      toast({ title: 'Estágio atualizado' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao atualizar estágio', description: error.message, variant: 'destructive' });
    },
  });

  const deleteStage = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('pipeline_stages')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pipeline-stages', pipelineId] });
      queryClient.invalidateQueries({ queryKey: ['pipelines'] });
      toast({ title: 'Estágio removido' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao remover estágio', description: error.message, variant: 'destructive' });
    },
  });

  return {
    stages,
    isLoading,
    createStage,
    updateStage,
    deleteStage,
  };
}

export function useStageAutomations(stageId?: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: automations = [], isLoading } = useQuery({
    queryKey: ['stage-automations', stageId],
    queryFn: async () => {
      if (!stageId) return [];

      const { data, error } = await supabase
        .from('stage_automations')
        .select('*')
        .eq('stage_id', stageId)
        .order('display_order');

      if (error) throw error;
      
      return (data || []).map(auto => ({
        ...auto,
        trigger_type: auto.trigger_type as 'on_enter' | 'on_exit' | 'on_time' | 'on_tag',
        action_type: auto.action_type as 'create_task' | 'send_message' | 'apply_tag' | 'move_stage' | 'notify_team',
        trigger_config: auto.trigger_config as Record<string, unknown>,
        action_config: auto.action_config as Record<string, unknown>,
      })) as StageAutomation[];
    },
    enabled: !!stageId,
  });

  const createAutomation = useMutation({
    mutationFn: async (automation: { stage_id: string; name: string; trigger_type: string; action_type: string; trigger_config?: Json; action_config?: Json; is_active?: boolean }) => {
      const { data, error } = await supabase
        .from('stage_automations')
        .insert(automation)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stage-automations', stageId] });
      queryClient.invalidateQueries({ queryKey: ['pipelines'] });
      toast({ title: 'Automação criada' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao criar automação', description: error.message, variant: 'destructive' });
    },
  });

  const updateAutomation = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; name?: string; trigger_type?: string; action_type?: string; trigger_config?: Json; action_config?: Json; is_active?: boolean }) => {
      const { data, error } = await supabase
        .from('stage_automations')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stage-automations', stageId] });
      queryClient.invalidateQueries({ queryKey: ['pipelines'] });
      toast({ title: 'Automação atualizada' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao atualizar automação', description: error.message, variant: 'destructive' });
    },
  });

  const deleteAutomation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('stage_automations')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stage-automations', stageId] });
      queryClient.invalidateQueries({ queryKey: ['pipelines'] });
      toast({ title: 'Automação removida' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao remover automação', description: error.message, variant: 'destructive' });
    },
  });

  return {
    automations,
    isLoading,
    createAutomation,
    updateAutomation,
    deleteAutomation,
  };
}
