import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Appointment, Service, SubscriptionPlan } from '@/types/crm';
import { toast } from 'sonner';

export function useAppointments() {
  const queryClient = useQueryClient();

  // Fetch all appointments
  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ['appointments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          lead:leads(*),
          service:services(*),
          barber:profiles(*)
        `)
        .order('scheduled_at', { ascending: true });

      if (error) throw error;
      return data as Appointment[];
    },
  });

  // Today's appointments
  const todayAppointments = appointments.filter(apt => {
    const today = new Date();
    const aptDate = new Date(apt.scheduled_at);
    return aptDate.toDateString() === today.toDateString() && apt.status !== 'cancelled';
  });

  // This week's appointments
  const weekAppointments = appointments.filter(apt => {
    const today = new Date();
    const weekEnd = new Date(today);
    weekEnd.setDate(today.getDate() + 7);
    const aptDate = new Date(apt.scheduled_at);
    return aptDate >= today && aptDate <= weekEnd && apt.status !== 'cancelled';
  });

  // Pending confirmations
  const pendingConfirmations = appointments.filter(apt => apt.status === 'scheduled');

  // Create appointment
  const createAppointment = useMutation({
    mutationFn: async (data: { lead_id: string; service_id: string; barber_id?: string; scheduled_at: string; notes?: string }) => {
      const { data: result, error } = await supabase
        .from('appointments')
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast.success('Agendamento criado!');
    },
    onError: (error) => {
      toast.error('Erro ao criar agendamento: ' + error.message);
    },
  });

  // Update appointment status
  const updateAppointmentStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from('appointments')
        .update({ status })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast.success('Status atualizado!');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar: ' + error.message);
    },
  });

  return {
    appointments,
    todayAppointments,
    weekAppointments,
    pendingConfirmations,
    isLoading,
    createAppointment,
    updateAppointmentStatus,
  };
}

export function useServices() {
  const { data: services = [], isLoading } = useQuery({
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

  return { services, isLoading };
}

export function useSubscriptionPlans() {
  const { data: plans = [], isLoading } = useQuery({
    queryKey: ['subscription_plans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('price');

      if (error) throw error;
      return data as SubscriptionPlan[];
    },
  });

  return { plans, isLoading };
}

export function useSubscribers() {
  const queryClient = useQueryClient();

  const { data: subscribers = [], isLoading } = useQuery({
    queryKey: ['subscribers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('subscription_status', 'active');

      if (error) throw error;
      return data;
    },
  });

  // Leads with expired subscriptions
  const { data: expiredSubscribers = [] } = useQuery({
    queryKey: ['expired_subscribers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('subscription_status', 'expired');

      if (error) throw error;
      return data;
    },
  });

  // Calculate MRR (Monthly Recurring Revenue)
  const { data: mrr = 0 } = useQuery({
    queryKey: ['mrr'],
    queryFn: async () => {
      const { data: activeLeads, error: leadsError } = await supabase
        .from('leads')
        .select('subscription_plan')
        .eq('subscription_status', 'active');

      if (leadsError) throw leadsError;

      const { data: plans, error: plansError } = await supabase
        .from('subscription_plans')
        .select('name, price')
        .eq('is_active', true);

      if (plansError) throw plansError;

      // Calculate total MRR
      let total = 0;
      activeLeads?.forEach(lead => {
        const plan = plans?.find(p => p.name === lead.subscription_plan);
        if (plan) {
          total += Number(plan.price);
        }
      });

      return total;
    },
  });

  return {
    subscribers,
    expiredSubscribers,
    mrr,
    isLoading,
  };
}
