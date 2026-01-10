import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "./use-toast";

export interface ScheduleBlock {
  id: string;
  profile_id: string;
  start_time: string;
  end_time: string;
  reason?: string | null;
  created_at: string;
  updated_at: string;
}

export type ScheduleBlockInput = Pick<ScheduleBlock, "profile_id" | "start_time" | "end_time" | "reason">;

export function useScheduleBlocks(profileId?: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: blocks, isLoading } = useQuery({
    queryKey: ["schedule_blocks", profileId],
    queryFn: async () => {
      let query = supabase
        .from("schedule_blocks")
        .select("*")
        .order("start_time", { ascending: true });
        
      if (profileId) {
        query = query.eq("profile_id", profileId);
      }
      
      const { data, error } = await query;
      
      if (error) {
        toast({
          variant: "destructive",
          title: "Erro ao carregar bloqueios",
          description: error.message,
        });
        throw error;
      }
      
      return data as ScheduleBlock[];
    },
    enabled: !!profileId
  });

  const createBlock = useMutation({
    mutationFn: async (block: ScheduleBlockInput) => {
      const { data, error } = await supabase
        .from("schedule_blocks")
        .insert([block])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedule_blocks", profileId] });
      toast({
        title: "Bloqueio criado",
        description: "Horário bloqueado com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Erro ao criar bloqueio",
        description: error.message,
      });
    },
  });

  const deleteBlock = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("schedule_blocks")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedule_blocks", profileId] });
      toast({
        title: "Bloqueio removido",
        description: "Horário liberado com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Erro ao remover bloqueio",
        description: error.message,
      });
    },
  });

  return {
    blocks,
    isLoading,
    createBlock: createBlock.mutate,
    deleteBlock: deleteBlock.mutate,
  };
}
