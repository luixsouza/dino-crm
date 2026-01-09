import * as React from 'react';
import { useTags } from '@/hooks/useLeads';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Pencil, Trash2, Loader2, Save, X } from 'lucide-react';
import { Tag } from '@/types/crm';
import { Badge } from '@/components/ui/badge';

interface TagsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TagsDialog({ open, onOpenChange }: TagsDialogProps) {
  const { tags, isLoading, createTag, updateTag, deleteTag } = useTags();
  const [editingTag, setEditingTag] = React.useState<Partial<Tag> | null>(null);
  const [isCreating, setIsCreating] = React.useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTag) return;

    try {
      if (isCreating) {
        const { id, created_at, ...newTag } = editingTag;
        await createTag.mutateAsync(newTag);
      } else if (editingTag.id) {
        await updateTag.mutateAsync({ id: editingTag.id, ...editingTag });
      }
      setEditingTag(null);
      setIsCreating(false);
    } catch (error) {
      console.error(error);
    }
  };

  const handleEdit = (tag: Tag) => {
    setEditingTag(tag);
    setIsCreating(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja remover esta tag?')) {
      await deleteTag.mutateAsync(id);
    }
  };

  const handleCreate = () => {
    setEditingTag({
      name: '',
      color: '#000000',
    });
    setIsCreating(true);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gerenciar Tags</DialogTitle>
        </DialogHeader>

        {editingTag ? (
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nome da Tag</Label>
                <Input
                  value={editingTag.name}
                  onChange={(e) => setEditingTag({ ...editingTag, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Cor (Hex/Nome)</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    className="w-12 p-1"
                    value={editingTag.color}
                    onChange={(e) => setEditingTag({ ...editingTag, color: e.target.value })}
                  />
                  <Input
                    value={editingTag.color}
                    onChange={(e) => setEditingTag({ ...editingTag, color: e.target.value })}
                    required
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setEditingTag(null)}>
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
                Nova Tag
              </Button>
            </div>

            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tag</TableHead>
                    <TableHead>Cor</TableHead>
                    <TableHead className="w-[100px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-4">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                      </TableCell>
                    </TableRow>
                  ) : tags.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-4 text-muted-foreground">
                        Nenhuma tag cadastrada
                      </TableCell>
                    </TableRow>
                  ) : (
                    tags.map((tag) => (
                      <TableRow key={tag.id}>
                        <TableCell>
                          <Badge
                            variant="outline"
                            style={{ borderColor: tag.color, color: tag.color }}
                          >
                            #{tag.name}
                          </Badge>
                        </TableCell>
                        <TableCell>{tag.color}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(tag)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(tag.id)}
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
