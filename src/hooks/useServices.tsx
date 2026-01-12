
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Service {
    id: string;
    name: string;
    description?: string;
    duration_minutes: number;
    price: number;
    is_active: boolean;
}

export function useServices() {
    const queryClient = useQueryClient();

    const { data: services, isLoading } = useQuery({
        queryKey: ['services'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('services')
                .select('*')
                .eq('is_active', true)
                .order('name');
            if (error) throw error;
            return data as Service[];
        },
    });

    const createService = useMutation({
        mutationFn: async (service: Omit<Service, 'id' | 'is_active'>) => {
            const { data, error } = await supabase.from('services').insert([service]).select().single();
            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['services'] });
        },
    });

    return { services, isLoading, createService };
}
