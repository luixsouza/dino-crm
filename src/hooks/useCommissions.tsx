import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Commission {
  id: string;
  appointment_id: string;
  barber_id: string;
  service_id: string;
  amount: number;
  status: 'pending' | 'paid' | 'cancelled';
  created_at: string;
  service: {
    name: string;
  } | null;
  barber: {
    name: string;
  } | null;
}

export function useCommissions() {
  const { data: commissions, isLoading } = useQuery({
    queryKey: ['commissions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('commissions')
        .select(`
          *,
          service:service_id (name),
          barber:barber_id (name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Commission[];
    },
  });

  return { commissions, isLoading };
}
