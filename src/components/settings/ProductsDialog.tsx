import * as React from 'react';
import { useProducts, Product } from '@/hooks/useProducts';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Pencil, Trash2, Loader2, Save, X, Package } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface ProductsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProductsDialog({ open, onOpenChange }: ProductsDialogProps) {
  const { products, isLoading, createProduct, updateProduct, deleteProduct } = useProducts();
  const [editingProduct, setEditingProduct] = React.useState<Partial<Product> | null>(null);
  const [isCreating, setIsCreating] = React.useState(false);
  const { toast } = useToast();

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    try {
      if (isCreating) {
        // Remove id and created_at if present
        const { id, ...newProduct } = editingProduct as any; // Cast to avoid TS strictness on omitted fields
        await createProduct.mutateAsync({
             name: newProduct.name,
             price: newProduct.price,
             stock_quantity: newProduct.stock_quantity,
             description: newProduct.description
        });
        toast({ title: "Produto criado com sucesso" });
      } else if (editingProduct.id) {
        await updateProduct.mutateAsync({ id: editingProduct.id, ...editingProduct });
        toast({ title: "Produto atualizado com sucesso" });
      }
      setEditingProduct(null);
      setIsCreating(false);
    } catch (error) {
      console.error(error);
      toast({ title: "Erro ao salvar produto", variant: "destructive" });
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setIsCreating(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja remover este produto?')) {
      await deleteProduct.mutateAsync(id);
      toast({ title: "Produto removido" });
    }
  };

  const handleCreate = () => {
    setEditingProduct({
      name: '',
      stock_quantity: 0,
      price: 0,
    });
    setIsCreating(true);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gerenciar Produtos e Estoque</DialogTitle>
        </DialogHeader>

        {editingProduct ? (
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2">
                <Label>Nome do Produto</Label>
                <Input
                  value={editingProduct.name}
                  onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Preço (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={editingProduct.price}
                  onChange={(e) => setEditingProduct({ ...editingProduct, price: Number(e.target.value) })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Estoque (Qtd)</Label>
                <Input
                  type="number"
                  min="0"
                  value={editingProduct.stock_quantity}
                  onChange={(e) => setEditingProduct({ ...editingProduct, stock_quantity: Number(e.target.value) })}
                  required
                />
              </div>
               <div className="space-y-2 col-span-2">
                <Label>Descrição (Opcional)</Label>
                <Input
                  value={editingProduct.description || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setEditingProduct(null)}>
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
                Novo Produto
              </Button>
            </div>

            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Preço</TableHead>
                    <TableHead>Estoque</TableHead>
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
                  ) : products.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                        Nenhum produto cadastrado
                      </TableCell>
                    </TableRow>
                  ) : (
                    products.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                                <Package className="h-4 w-4 text-muted-foreground" />
                                {product.name}
                            </div>
                        </TableCell>
                        <TableCell>{formatCurrency(product.price)}</TableCell>
                        <TableCell>
                            <span className={product.stock_quantity < 5 ? "text-red-500 font-bold" : ""}>
                                {product.stock_quantity}
                            </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(product)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(product.id)}
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
