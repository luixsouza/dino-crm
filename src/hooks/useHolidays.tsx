import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "./use-toast";

export interface Holiday {
  id: string;
  date: string;
  description: string;
  is_closed: boolean;
  open_time?: string | null;
  close_time?: string | null;
  created_at: string;
  updated_at: string;
}

export type HolidayFormData = Pick<Holiday, "date" | "description" | "is_closed" | "open_time" | "close_time">;

export function useHolidays() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: holidays, isLoading } = useQuery({
    queryKey: ["holidays"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("holidays")
        .select("*")
        .order("date", { ascending: true });
      
      if (error) {
        toast({
          variant: "destructive",
          title: "Erro ao carregar feriados",
          description: error.message,
        });
        throw error;
      }
      
      return data as Holiday[];
    },
  });

  const createHoliday = useMutation({
    mutationFn: async (holiday: HolidayFormData) => {
      const { data, error } = await supabase
        .from("holidays")
        .insert([holiday])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["holidays"] });
      toast({
        title: "Feriado criado",
        description: "Data adicionada com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Erro ao criar feriado",
        description: error.message,
      });
    },
  });

  const deleteHoliday = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("holidays")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["holidays"] });
      toast({
        title: "Feriado removido",
        description: "Data excluída com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Erro ao remover feriado",
        description: error.message,
      });
    },
  });

  return {
    holidays,
    isLoading,
    createHoliday: createHoliday.mutate,
    deleteHoliday: deleteHoliday.mutate,
  };
}
