import * as React from 'react';
import { usePipelines } from '@/hooks/usePipelines';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Save, X, Trash2 } from 'lucide-react';
import { CustomPipeline } from '@/types/crm';
import { useToast } from '@/hooks/use-toast';

interface PipelineDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pipelineToEdit?: CustomPipeline | null;
}

export function PipelineDialog({ open, onOpenChange, pipelineToEdit }: PipelineDialogProps) {
  const { createPipeline, updatePipeline, deletePipeline } = usePipelines();
  const [name, setName] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const { toast } = useToast();

  React.useEffect(() => {
    if (pipelineToEdit) {
      setName(pipelineToEdit.name);
      setDescription(pipelineToEdit.description || '');
    } else {
      setName('');
      setDescription('');
    }
  }, [pipelineToEdit, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (pipelineToEdit) {
        await updatePipeline.mutateAsync({
          id: pipelineToEdit.id,
          name,
          description,
        });
      } else {
        await createPipeline.mutateAsync({
          name,
          description,
          icon: 'List',
          color: '#000000',
        });
      }
      onOpenChange(false);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!pipelineToEdit) return;
    
    if (window.confirm('Tem certeza que deseja excluir este funil?')) {
      setIsLoading(true);
      try {
        await deletePipeline.mutateAsync(pipelineToEdit.id);
        onOpenChange(false);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{pipelineToEdit ? 'Editar Funil' : 'Novo Funil'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome do Funil</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Vendas de Consultoria"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Para que serve este funil?"
            />
          </div>
          <div className="flex justify-between items-center pt-4">
            {pipelineToEdit ? (
              <Button 
                type="button" 
                variant="destructive" 
                onClick={handleDelete} 
                disabled={isLoading}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir
              </Button>
            ) : <div />}
            
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                <Save className="h-4 w-4 mr-2" />
                Salvar
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
