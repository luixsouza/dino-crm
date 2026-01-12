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
    mutationFn: async (data: { lead_id: string; service_id: string; barber_id?: string; scheduled_at: string; notes?: string; is_fit_in?: boolean }) => {
      
      const { data: service, error: serviceError } = await supabase
          .from('services')
          .select('duration_minutes')
          .eq('id', data.service_id)
          .single();

      if (serviceError) throw serviceError;

      const duration = service.duration_minutes || 30;
      const startDate = new Date(data.scheduled_at);
      const endDate = new Date(startDate.getTime() + duration * 60000);

      // Check conflicts if NOT fit-in
      if (data.barber_id && !data.is_fit_in) {
        
        // 1. Check Schedule Blocks
        const { data: blocks, error: blocksError } = await supabase
          .from('schedule_blocks')
          .select('*')
          .eq('profile_id', data.barber_id)
          .lt('start_time', endDate.toISOString())
          .gt('end_time', startDate.toISOString());

        if (blocksError) throw blocksError;

        if (blocks && blocks.length > 0) {
          const reason = blocks[0].reason ? `: ${blocks[0].reason}` : "";
          throw new Error(`O profissional está bloqueado neste horário${reason}`);
        }

        // 2. Check Existing Appointments (Double Booking)
        const dayStart = new Date(startDate); 
        dayStart.setHours(0,0,0,0);
        const dayEnd = new Date(startDate); 
        dayEnd.setHours(23,59,59,999);

        const { data: existingAppts, error: apptError } = await supabase
              .from('appointments')
              .select('scheduled_at, service:services(duration_minutes)')
              .eq('barber_id', data.barber_id)
              .neq('status', 'cancelled')
              .gte('scheduled_at', dayStart.toISOString())
              .lte('scheduled_at', dayEnd.toISOString());

        if (apptError) throw apptError;

        const hasConflict = existingAppts.some((appt: any) => {
             const existStart = new Date(appt.scheduled_at);
             const existDuration = appt.service?.duration_minutes || 30;
             const existEnd = new Date(existStart.getTime() + existDuration * 60000);
             
             // Overlap: (StartA < EndB) and (EndA > StartB)
             return (startDate < existEnd && endDate > existStart);
        });

        if (hasConflict) {
            throw new Error("Horário já reservado. Use 'Encaixe' para permitir.");
        }
      }
      
      // Clean up auxiliary fields before insert
      const { is_fit_in, ...insertData } = data;

      const { data: result, error } = await supabase
        .from('appointments')
        .insert(insertData)
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
  const queryClient = useQueryClient();

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

  const createService = useMutation({
    mutationFn: async (service: Partial<Service>) => {
      const { data, error } = await supabase
        .from('services')
        .insert([{ ...service, is_active: true }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      toast.success('Serviço criado com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao criar serviço: ' + error.message);
    }
  });

  const updateService = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Service> & { id: string }) => {
      const { data, error } = await supabase
        .from('services')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      toast.success('Serviço atualizado com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar serviço: ' + error.message);
    }
  });

  const deleteService = useMutation({
    mutationFn: async (id: string) => {
      // Soft delete
      const { error } = await supabase
        .from('services')
        .update({ is_active: false })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      toast.success('Serviço removido com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao remover serviço: ' + error.message);
    }
  });

  return { 
    services, 
    isLoading,
    createService,
    updateService,
    deleteService
  };
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
