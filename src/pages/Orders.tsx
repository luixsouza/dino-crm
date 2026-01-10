import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, ShoppingCart, User, Scissors, Trash2 } from 'lucide-react';
import { useOrders, Order } from '@/hooks/useOrders';
import { useProducts } from '@/hooks/useProducts';
import { useServices } from '@/hooks/useAppointments';
import { useLeads } from '@/hooks/useLeads';
import { useAuth } from '@/hooks/useAuth'; // To get current user as barber default? Or select list
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatCurrency } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

import { AppLayout } from '@/components/layout/AppLayout';

export function OrdersPage() {
    const { orders, isLoading, createOrder, updateOrderStatus } = useOrders();
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    return (
        <AppLayout>
            <div className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Comandas</h1>
                        <p className="text-muted-foreground">Gerencie pedidos e serviços</p>
                    </div>
                    <div className="flex gap-2">
                        <Button onClick={() => setIsCreateOpen(true)}>
                            <Plus className="mr-2 h-4 w-4" />
                            Nova Comanda
                        </Button>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {isLoading ? (
                        <p>Carregando...</p>
                    ) : orders.length === 0 ? (
                        <p className="col-span-3 text-center text-muted-foreground">Nenhuma comanda encontrada.</p>
                    ) : orders.map((order) => (
                        <OrderCard key={order.id} order={order} />
                    ))}
                </div>

                <CreateOrderDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} />
            </div>
        </AppLayout>
    );
}

function OrderCard({ order }: { order: Order }) {
    const { updateOrderStatus, addItem, removeItem } = useOrders();
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const { products } = useProducts();
    const { services } = useServices();
    
    // Fetch barbers for selection
    const { data: barbers } = useQuery({
        queryKey: ['barbers'],
        queryFn: async () => {
            const { data } = await supabase.from('profiles').select('*');
            return data || [];
        }
    });

    const [selectedType, setSelectedType] = useState<'service' | 'product'>('service');
    const [selectedItemId, setSelectedItemId] = useState<string>('');
    const [selectedBarberId, setSelectedBarberId] = useState<string>('');

    const handleAddItem = () => {
        if (!selectedItemId) return;
        
        let price = 0;
        if (selectedType === 'service') {
            const s = services.find(x => x.id === selectedItemId);
            if (s) price = s.price;
        } else {
            const p = products.find(x => x.id === selectedItemId);
            if (p) price = p.price;
        }

        addItem.mutate({
            order_id: order.id,
            [selectedType === 'service' ? 'service_id' : 'product_id']: selectedItemId,
            barber_id: selectedType === 'service' ? selectedBarberId : undefined, // Only service needs barber for commission usually, but maybe product too? Keeping it simple.
            quantity: 1,
            unit_price: price
        });
        
        setSelectedItemId('');
    };

    const handleCloseOrder = () => {
        if(confirm('Deseja fechar e finalizar esta comanda?')) {
            updateOrderStatus.mutate({ id: order.id, status: 'completed' });
        }
    };

    return (
        <div className="border rounded-lg bg-card text-card-foreground shadow-sm flex flex-col">
            <div className="p-6 pb-2">
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="font-semibold leading-none tracking-tight">
                            {order.lead?.name || order.customer_name || 'Cliente sem nome'}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                            {order.status === 'open' ? 'Aberta' : 'Concluída'}
                        </p>
                    </div>
                     <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
                        <DialogTrigger asChild>
                             <Button variant="outline" size="sm">Ver Detalhes</Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-xl">
                            <DialogHeader>
                                <DialogTitle>Detalhes da Comanda</DialogTitle>
                            </DialogHeader>
                            <div className="py-4 space-y-4">
                                {/* Add Item Form */}
                                {order.status === 'open' && (
                                    <div className="flex gap-2 items-end border-b pb-4">
                                        <div className="space-y-2 flex-1">
                                            <Label>Tipo</Label>
                                            <Select value={selectedType} onValueChange={(v: any) => setSelectedType(v)}>
                                                <SelectTrigger><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="service">Serviço</SelectItem>
                                                    <SelectItem value="product">Produto</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2 flex-[2]">
                                            <Label>Item</Label>
                                            <Select value={selectedItemId} onValueChange={setSelectedItemId}>
                                                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                                <SelectContent>
                                                    {selectedType === 'service' ? (
                                                        services.map(s => (
                                                            <SelectItem key={s.id} value={s.id}>{s.name} - {formatCurrency(s.price)}</SelectItem>
                                                        ))
                                                    ) : (
                                                        products.map(p => (
                                                            <SelectItem key={p.id} value={p.id}>{p.name} - {formatCurrency(p.price)}</SelectItem>
                                                        ))
                                                    )}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        {selectedType === 'service' && (
                                            <div className="space-y-2 flex-1">
                                                <Label>Profissional</Label>
                                                <Select value={selectedBarberId} onValueChange={setSelectedBarberId}>
                                                    <SelectTrigger><SelectValue placeholder="Barb." /></SelectTrigger>
                                                    <SelectContent>
                                                        {barbers?.map((b: any) => (
                                                            <SelectItem key={b.id} value={b.id}>{b.name.split(' ')[0]}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        )}
                                        <Button onClick={handleAddItem} disabled={!selectedItemId}><Plus className="h-4 w-4" /></Button>
                                    </div>
                                )}

                                {/* Items List */}
                                <div className="space-y-2">
                                    {order.items?.map(item => (
                                        <div key={item.id} className="flex justify-between items-center bg-muted/50 p-2 rounded">
                                            <div className="flex gap-2 items-center">
                                                {item.service ? <Scissors className="h-4 w-4 text-primary" /> : <ShoppingCart className="h-4 w-4 text-blue-500" />}
                                                <span>{item.service?.name || item.product?.name}</span>
                                                <span className="text-xs text-muted-foreground">
                                                    (x{item.quantity}) {item.barber && `- ${item.barber.name.split(' ')[0]}`}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-mono">{formatCurrency(item.unit_price * item.quantity)}</span>
                                                {order.status === 'open' && (
                                                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeItem.mutate(item.id)}>
                                                        <Trash2 className="h-3 w-3 text-destructive" />
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                    {(!order.items || order.items.length === 0) && <p className="text-center text-muted-foreground text-sm">Nenhum item adicionado.</p>}
                                </div>
                                
                                <div className="flex justify-between items-center border-t pt-4">
                                    <span className="font-bold text-lg">Total</span>
                                    <span className="font-bold text-xl">{formatCurrency(order.total_amount)}</span>
                                </div>

                                {order.status === 'open' && (
                                     <Button className="w-full mt-4" onClick={() => { handleCloseOrder(); setIsDetailsOpen(false); }}>
                                        Fechar e Receber
                                    </Button>
                                )}
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>
            <div className="px-6 py-4 mt-auto border-t bg-muted/20">
                <div className="flex justify-between items-center">
                     <span className="text-2xl font-bold">{formatCurrency(order.total_amount)}</span>
                     {order.status === 'open' ? (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Aberta</span>
                     ) : (
                        <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">Fechada</span>
                     )}
                </div>
            </div>
        </div>
    );
}

function CreateOrderDialog({ open, onOpenChange }: { open: boolean, onOpenChange: (o: boolean) => void }) {
    const { createOrder } = useOrders();
    const { leads } = useLeads();
    const [leadId, setLeadId] = useState<string>('walk-in');
    const [customerName, setCustomerName] = useState('');

    const handleSubmit = async () => {
        await createOrder.mutateAsync({
            lead_id: leadId === 'walk-in' ? undefined : leadId,
            customer_name: leadId === 'walk-in' ? customerName : undefined
        });
        onOpenChange(false);
        setCustomerName('');
        setLeadId('walk-in');
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Nova Comanda</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Cliente</Label>
                        <Select value={leadId} onValueChange={setLeadId}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="walk-in">Cliente Avulso (Sem cadastro)</SelectItem>
                                {leads.map(l => (
                                    <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    {leadId === 'walk-in' && (
                        <div className="space-y-2">
                            <Label>Nome do Cliente</Label>
                            <Input value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Ex: João da Silva" />
                        </div>
                    )}
                    <Button className="w-full" onClick={handleSubmit}>Criar Comanda</Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
