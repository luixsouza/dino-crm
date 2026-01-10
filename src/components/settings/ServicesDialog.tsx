import * as React from 'react';
import { useServices } from '@/hooks/useAppointments';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Pencil, Trash2, Loader2, Save, X } from 'lucide-react';
import { Service } from '@/types/crm';

interface ServicesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ServicesDialog({ open, onOpenChange }: ServicesDialogProps) {
  const { services, isLoading, createService, updateService, deleteService } = useServices();
  const [editingService, setEditingService] = React.useState<Partial<Service> | null>(null);
  const [isCreating, setIsCreating] = React.useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingService) return;

    try {
      if (isCreating) {
        // Remove id and created_at if present, though they shouldn't be for new items
        const { id, created_at, ...newService } = editingService;
        await createService.mutateAsync(newService);
      } else if (editingService.id) {
        await updateService.mutateAsync({ id: editingService.id, ...editingService });
      }
      setEditingService(null);
      setIsCreating(false);
    } catch (error) {
      console.error(error);
    }
  };

  const handleEdit = (service: Service) => {
    setEditingService(service);
    setIsCreating(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja remover este serviço?')) {
      await deleteService.mutateAsync(id);
    }
  };

  const handleCreate = () => {
    setEditingService({
      name: '',
      duration_minutes: 30,
      price: 0,
      commission_percentage: 0,
    });
    setIsCreating(true);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gerenciar Serviços</DialogTitle>
        </DialogHeader>

        {editingService ? (
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nome do Serviço</Label>
                <Input
                  value={editingService.name}
                  onChange={(e) => setEditingService({ ...editingService, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Duração (minutos)</Label>
                <Input
                  type="number"
                  value={editingService.duration_minutes}
                  onChange={(e) => setEditingService({ ...editingService, duration_minutes: Number(e.target.value) })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Preço (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={editingService.price}
                  onChange={(e) => setEditingService({ ...editingService, price: Number(e.target.value) })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Comissão (%)</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={editingService.commission_percentage || 0}
                  onChange={(e) => setEditingService({ ...editingService, commission_percentage: Number(e.target.value) })}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setEditingService(null)}>
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
              <Button type="submit">
                <Save className="h-4 w-4 mr-2" />
                Salvar
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={handleCreate}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Serviço
              </Button>
            </div>

            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Duração</TableHead>
                    <TableHead>Preço</TableHead>
                    <TableHead>Comissão</TableHead>
                    <TableHead className="w-[100px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-4">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                      </TableCell>
                    </TableRow>
                  ) : services.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                        Nenhum serviço cadastrado
                      </TableCell>
                    </TableRow>
                  ) : (
                    services.map((service) => (
                      <TableRow key={service.id}>
                        <TableCell className="font-medium">{service.name}</TableCell>
                        <TableCell>{service.duration_minutes} min</TableCell>
                        <TableCell>{formatCurrency(service.price)}</TableCell>
                        <TableCell>{service.commission_percentage || 0}%</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(service)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(service.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
