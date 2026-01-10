import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "./use-toast";

export interface Role {
  id: string;
  name: string;
  label: string;
  description?: string | null;
  created_at: string;
  updated_at: string;
}

export type RoleFormData = Pick<Role, "name" | "label" | "description">;

export function useRoles() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: roles, isLoading } = useQuery({
    queryKey: ["roles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("roles")
        .select("*")
        .order("label");
      
      if (error) {
        toast({
          variant: "destructive",
          title: "Erro ao carregar funções",
          description: error.message,
        });
        throw error;
      }
      
      return data as Role[];
    },
  });

  const createRole = useMutation({
    mutationFn: async (newRole: RoleFormData) => {
      const { data, error } = await supabase
        .from("roles")
        .insert([newRole])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      toast({
        title: "Função criada",
        description: "A nova função foi adicionada com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Erro ao criar função",
        description: error.message,
      });
    },
  });

  const updateRole = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<RoleFormData> & { id: string }) => {
      const { data, error } = await supabase
        .from("roles")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      toast({
        title: "Função atualizada",
        description: "As informações foram salvas com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Erro ao atualizar função",
        description: error.message,
      });
    },
  });

  const deleteRole = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("roles")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      toast({
        title: "Função removida",
        description: "A função foi excluída com sucesso.",
      });
    },
    onError: (error: any) => {
      try {
          if (error.code === '23503') { // ForeignKey Violation
               toast({
                variant: "destructive",
                title: "Não é possível excluir",
                description: "Esta função está em uso por um ou mais funcionários.",
              });
              return;
          }
      } catch (e) {}

      toast({
        variant: "destructive",
        title: "Erro ao excluir função",
        description: error.message,
      });
    },
  });

  return {
    roles,
    isLoading,
    createRole: createRole.mutate,
    updateRole: updateRole.mutate,
    deleteRole: deleteRole.mutate,
  };
}
