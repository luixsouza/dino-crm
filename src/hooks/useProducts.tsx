import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Product {
    id: string;
    name: string;
    description?: string;
    price: number;
    stock_quantity: number;
    is_active: boolean;
}

export function useProducts() {
    const queryClient = useQueryClient();

    const { data: products, isLoading } = useQuery({
        queryKey: ['products'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .order('name');
            if (error) throw error;
            return data as Product[];
        },
    });

    const createProduct = useMutation({
        mutationFn: async (product: Omit<Product, 'id' | 'is_active'>) => {
            const { data, error } = await supabase.from('products').insert([product]).select().single();
            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
        },
    });

    const updateProduct = useMutation({
        mutationFn: async ({ id, ...updates }: Partial<Product> & { id: string }) => {
            const { error } = await supabase.from('products').update(updates).eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
        },
    });

    const deleteProduct = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from('products').delete().eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
             queryClient.invalidateQueries({ queryKey: ['products'] });
        },
    });

    return { products: products || [], isLoading, createProduct, updateProduct, deleteProduct };
}
