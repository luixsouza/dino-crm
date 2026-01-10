import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "./use-toast";

export interface WorkSchedule {
  id: string;
  profile_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  break_start?: string | null;
  break_end?: string | null;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export type WorkScheduleInput = Omit<WorkSchedule, "id" | "created_at" | "updated_at">;

export function useWorkSchedule(profileId?: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: schedules, isLoading } = useQuery({
    queryKey: ["work_schedules", profileId],
    queryFn: async () => {
      if (!profileId) return [];
      
      const { data, error } = await supabase
        .from("work_schedules")
        .select("*")
        .eq("profile_id", profileId)
        .order("day_of_week");
      
      if (error) {
        toast({
          variant: "destructive",
          title: "Erro ao carregar horários",
          description: error.message,
        });
        throw error;
      }
      
      return data as WorkSchedule[];
    },
    enabled: !!profileId,
  });

  const upsertSchedule = useMutation({
    mutationFn: async (schedule: WorkScheduleInput) => {
      // Check if exists
      const { data: existing } = await supabase
        .from("work_schedules")
        .select("id")
        .eq("profile_id", schedule.profile_id)
        .eq("day_of_week", schedule.day_of_week)
        .single();

      if (existing) {
        const { data, error } = await supabase
          .from("work_schedules")
          .update(schedule)
          .eq("id", existing.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
            .from("work_schedules")
            .insert([schedule])
            .select()
            .single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["work_schedules", profileId] });
      toast({
        title: "Horário salvo",
        description: "As alterações foram salvas com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Erro ao salvar horário",
        description: error.message,
      });
    },
  });

  return {
    schedules,
    isLoading,
    upsertSchedule: upsertSchedule.mutate,
  };
}
