import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Task, TaskStatus, TaskType } from '@/types/crm';
import { useToast } from '@/hooks/use-toast';

export function useTasks(leadId?: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['tasks', leadId],
    queryFn: async () => {
      let query = supabase
        .from('tasks')
        .select(`
          *,
          lead:leads(*),
          assigned_profile:profiles!tasks_assigned_to_fkey(*)
        `)
        .order('due_at', { ascending: true, nullsFirst: false });

      if (leadId) {
        query = query.eq('lead_id', leadId);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      return (data || []).map(task => ({
        ...task,
        type: task.type as TaskType,
        status: task.status as TaskStatus,
      })) as Task[];
    },
  });

  const createTask = useMutation({
    mutationFn: async (task: { lead_id: string; title: string; description?: string; type?: TaskType; due_at?: string; assigned_to?: string }) => {
      const { data, error } = await supabase
        .from('tasks')
        .insert(task)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast({ title: 'Tarefa criada' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao criar tarefa', description: error.message, variant: 'destructive' });
    },
  });

  const updateTaskStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: TaskStatus }) => {
      const updates: { status: TaskStatus; completed_at?: string } = { status };
      if (status === 'completed') {
        updates.completed_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const deleteTask = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('tasks').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast({ title: 'Tarefa removida' });
    },
  });

  // Tarefas pendentes (para métricas)
  const pendingTasks = tasks.filter(t => t.status === 'pending');
  const overdueTasks = pendingTasks.filter(t => t.due_at && new Date(t.due_at) < new Date());

  return {
    tasks,
    pendingTasks,
    overdueTasks,
    isLoading,
    createTask,
    updateTaskStatus,
    deleteTask,
  };
}
