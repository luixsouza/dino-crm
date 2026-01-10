import { useState } from "react";
import { useRoles, Role } from "@/hooks/useRoles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Pencil, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

export function RolesManager() {
  const { roles, isLoading, createRole, updateRole, deleteRole } = useRoles();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [formData, setFormData] = useState({ name: "", label: "", description: "" });

  const handleOpenDialog = (role?: Role) => {
    if (role) {
      setEditingRole(role);
      setFormData({ 
        name: role.name, 
        label: role.label, 
        description: role.description || "" 
      });
    } else {
      setEditingRole(null);
      setFormData({ name: "", label: "", description: "" });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingRole) {
      updateRole({ id: editingRole.id, ...formData });
    } else {
      createRole(formData);
    }
    setIsDialogOpen(false);
  };

  if (isLoading) return <div>Carregando...</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Gerenciar Funções</h2>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="mr-2 h-4 w-4" /> Nova Função
        </Button>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome (Label)</TableHead>
              <TableHead>Identificador</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead className="w-[100px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {roles?.map((role) => (
              <TableRow key={role.id}>
                <TableCell className="font-medium">{role.label}</TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">{role.name}</TableCell>
                <TableCell>{role.description}</TableCell>
                <TableCell className="flex gap-2">
                  <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(role)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteRole(role.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingRole ? "Editar Função" : "Nova Função"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Nome de Exibição</Label>
              <Input 
                value={formData.label} 
                onChange={(e) => setFormData({...formData, label: e.target.value})}
                placeholder="Ex: Cabeleireiro"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Identificador (Sistema)</Label>
              <Input 
                value={formData.name} 
                onChange={(e) => setFormData({...formData, name: e.target.value.toLowerCase().replace(/\s+/g, '_')})}
                placeholder="Ex: barber"
                required
                disabled={!!editingRole} 
              />
              {editingRole && <p className="text-xs text-muted-foreground">O identificador não pode ser alterado.</p>}
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Input 
                value={formData.description} 
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Opcional"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
              <Button type="submit">Salvar</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
