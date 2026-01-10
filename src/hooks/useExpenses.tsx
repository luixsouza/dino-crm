import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';

export interface Expense {
    id: string;
    description: string;
    amount: number;
    category: string;
    due_date?: string;
    paid_at?: string;
    status: 'pending' | 'paid';
    created_at: string;
}

export function useExpenses() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    const { data: expenses, isLoading } = useQuery({
        queryKey: ['expenses'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('expenses')
                .select('*')
                .order('due_date', { ascending: true });
            if (error) throw error;
            return data as Expense[];
        },
    });

    const createExpense = useMutation({
        mutationFn: async (expense: Omit<Expense, 'id' | 'created_at' | 'status' | 'paid_at'>) => {
            const { error } = await supabase.from('expenses').insert([{ ...expense, status: 'pending' }]);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['expenses'] });
            toast({ title: 'Despesa adicionada' });
        },
    });

    const updateExpense = useMutation({
        mutationFn: async ({ id, ...updates }: Partial<Expense> & { id: string }) => {
            const { error } = await supabase.from('expenses').update(updates).eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
             queryClient.invalidateQueries({ queryKey: ['expenses'] });
             toast({ title: 'Despesa atualizada' });
        },
    });

    const deleteExpense = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from('expenses').delete().eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
             queryClient.invalidateQueries({ queryKey: ['expenses'] });
             toast({ title: 'Despesa removida' });
        },
    });

    const markAsPaid = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from('expenses').update({ 
                status: 'paid', 
                paid_at: new Date().toISOString() 
            }).eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['expenses'] });
            toast({ title: 'Conta marcada como paga' });
        }
    });

    return { expenses: expenses || [], isLoading, createExpense, updateExpense, deleteExpense, markAsPaid };
}
