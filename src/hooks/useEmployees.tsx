import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Employee {
    id: string;
    name: string;
    email: string;
    avatar_url?: string | null;
    created_at: string;
    user_id: string | null; // The link to auth
    role?: string | null;
    // Add other fields if you extend the table later, e.g. role, phone
}

export function useEmployees() {
    const queryClient = useQueryClient();

    const { data: employees, isLoading } = useQuery({
        queryKey: ['profiles'], // 'profiles' are employees/users
        queryFn: async () => {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .order('name');
            if (error) throw error;
            return data as Employee[];
        },
    });

    const createEmployee = useMutation({
        mutationFn: async (employee: Pick<Employee, 'name' | 'email' | 'role'>) => {
            // We insert the profile without a user_id for now.
            // This creates a "system employee" not linked to a login yet.
            const { data, error } = await supabase.from('profiles').insert([{
                ...employee,
                updated_at: new Date().toISOString()
            }]).select().single();
            
            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['profiles'] });
        },
    });

    const updateEmployee = useMutation({
        mutationFn: async ({ id, ...updates }: Partial<Employee> & { id: string }) => {
            const { error } = await supabase.from('profiles').update(updates).eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['profiles'] });
        },
    });

    const deleteEmployee = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from('profiles').delete().eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['profiles'] });
        },
    });

    return {
        employees: employees || [],
        isLoading,
        createEmployee,
        updateEmployee,
        deleteEmployee
    };
}
