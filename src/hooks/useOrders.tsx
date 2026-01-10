import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';

export interface Order {
    id: string;
    lead_id?: string;
    customer_name?: string;
    status: 'open' | 'completed' | 'cancelled';
    total_amount: number;
    created_at: string;
    items?: OrderItem[];
    lead?: { name: string };
}

export interface OrderItem {
    id: string;
    order_id: string;
    service_id?: string;
    product_id?: string;
    barber_id?: string;
    quantity: number;
    unit_price: number;
    service?: { name: string };
    product?: { name: string };
    barber?: { name: string };
}

export function useOrders() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    const { data: orders, isLoading } = useQuery({
        queryKey: ['orders'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('orders')
                .select(`
                    *,
                    lead:lead_id (name),
                    items:order_items (
                        *,
                        service:service_id (name),
                        product:product_id (name),
                        barber:barber_id (name)
                    )
                `)
                .order('created_at', { ascending: false });
            if (error) throw error;
            return data as Order[];
        },
    });

    const createOrder = useMutation({
        mutationFn: async (order: { lead_id?: string; customer_name?: string }) => {
            const { data, error } = await supabase.from('orders').insert([order]).select().single();
            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['orders'] });
            toast({ title: 'Comanda criada com sucesso' });
        },
    });

     const updateOrderStatus = useMutation({
        mutationFn: async ({ id, status }: { id: string; status: 'completed' | 'cancelled' }) => {
            const { error } = await supabase.from('orders').update({ status }).eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['orders'] });
            toast({ title: 'Status da comanda atualizado' });
        },
    });

    const addItem = useMutation({
        mutationFn: async (item: { 
            order_id: string; 
            service_id?: string; 
            product_id?: string; 
            barber_id?: string;
            quantity: number; 
            unit_price: number;
        }) => {
            const { error } = await supabase.from('order_items').insert([item]);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['orders'] });
            toast({ title: 'Item adicionado' });
        },
    });

    const removeItem = useMutation({
        mutationFn: async (itemId: string) => {
             const { error } = await supabase.from('order_items').delete().eq('id', itemId);
             if (error) throw error;
        },
        onSuccess: () => {
             queryClient.invalidateQueries({ queryKey: ['orders'] });
             toast({ title: 'Item removido' });
        }
    });

    return { orders: orders || [], isLoading, createOrder, updateOrderStatus, addItem, removeItem };
}
