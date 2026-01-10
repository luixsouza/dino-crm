import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash2, CheckCircle2, AlertCircle, Calendar as CalendarIcon } from 'lucide-react';
import { useExpenses, Expense } from '@/hooks/useExpenses';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export default function Finance() {
    const { expenses, isLoading, markAsPaid, deleteExpense } = useExpenses();
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    // Filter logic could go here (e.g. by month)

    const pendingTotal = expenses
        .filter(e => e.status === 'pending')
        .reduce((acc, curr) => acc + Number(curr.amount), 0);
        
    const paidTotal = expenses
        .filter(e => e.status === 'paid')
        // simple filter for current month could be added
        .reduce((acc, curr) => acc + Number(curr.amount), 0);

    return (
        <AppLayout>
            <div className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Financeiro</h1>
                        <p className="text-muted-foreground">Gerencie contas a pagar e fluxo de caixa</p>
                    </div>
                    <Button onClick={() => setIsCreateOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Nova Despesa
                    </Button>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                        <CardHeader className="pb-2">
                             <CardTitle className="text-sm font-medium">Contas a Pagar (Pendente)</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-600">{formatCurrency(pendingTotal)}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                             <CardTitle className="text-sm font-medium">Contas Pagas (Total)</CardTitle>
                        </CardHeader>
                        <CardContent>
                             <div className="text-2xl font-bold text-green-600">{formatCurrency(paidTotal)}</div>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Despesas</CardTitle>
                        <CardDescription>Lista de todas as contas registradas</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Vencimento</TableHead>
                                    <TableHead>Descrição</TableHead>
                                    <TableHead>Categoria</TableHead>
                                    <TableHead>Valor</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="w-[100px]">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-4">Carregando...</TableCell>
                                    </TableRow>
                                ) : expenses.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">Nenhuma despesa registrada</TableCell>
                                    </TableRow>
                                ) : (
                                    expenses.map((expense) => (
                                        <TableRow key={expense.id}>
                                            <TableCell>
                                                {expense.due_date ? format(new Date(expense.due_date), 'dd/MM/yyyy') : '-'}
                                            </TableCell>
                                            <TableCell className="font-medium">{expense.description}</TableCell>
                                            <TableCell className="capitalize">{expense.category}</TableCell>
                                            <TableCell>{formatCurrency(expense.amount)}</TableCell>
                                            <TableCell>
                                                <div className={cn(
                                                    "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                                                    expense.status === 'paid' ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                                                )}>
                                                    {expense.status === 'paid' ? 'Pago' : 'Pendente'}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    {expense.status === 'pending' && (
                                                        <Button variant="ghost" size="icon" title="Marcar como pago" onClick={() => markAsPaid.mutate(expense.id)}>
                                                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                                                        </Button>
                                                    )}
                                                    <Button variant="ghost" size="icon" onClick={() => {
                                                        if(confirm('Excluir esta despesa?')) deleteExpense.mutate(expense.id)
                                                    }}>
                                                        <Trash2 className="h-4 w-4 text-destructive" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                <CreateExpenseDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} />
            </div>
        </AppLayout>
    );
}

function CreateExpenseDialog({ open, onOpenChange }: { open: boolean, onOpenChange: (o: boolean) => void }) {
    const { createExpense } = useExpenses();
    const [formData, setFormData] = useState({
        description: '',
        amount: '',
        category: 'outros',
        due_date: format(new Date(), 'yyyy-MM-dd'),
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await createExpense.mutateAsync({
            description: formData.description,
            amount: Number(formData.amount),
            category: formData.category,
            due_date: formData.due_date,
        });
        onOpenChange(false);
        setFormData({
             description: '',
             amount: '',
             category: 'outros',
             due_date: format(new Date(), 'yyyy-MM-dd'),
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Nova Despesa</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Descrição</Label>
                        <Input 
                            value={formData.description} 
                            onChange={e => setFormData({...formData, description: e.target.value})} 
                            placeholder="Ex: Aluguel, Conta de Luz" 
                            required
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Valor (R$)</Label>
                            <Input 
                                type="number" 
                                step="0.01"
                                value={formData.amount} 
                                onChange={e => setFormData({...formData, amount: e.target.value})} 
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Vencimento</Label>
                            <Input 
                                type="date"
                                value={formData.due_date} 
                                onChange={e => setFormData({...formData, due_date: e.target.value})} 
                                required
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>Categoria</Label>
                        <Select value={formData.category} onValueChange={v => setFormData({...formData, category: v})}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="aluguel">Aluguel</SelectItem>
                                <SelectItem value="energia">Energia/Água</SelectItem>
                                <SelectItem value="fornecedores">Fornecedores</SelectItem>
                                <SelectItem value="produtos">Produtos</SelectItem>
                                <SelectItem value="marketing">Marketing</SelectItem>
                                <SelectItem value="equipe">Equipe</SelectItem>
                                <SelectItem value="outros">Outros</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <Button type="submit" className="w-full">Registrar Despesa</Button>
                </form>
            </DialogContent>
        </Dialog>
    )
}
