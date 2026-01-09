import * as React from 'react';
import { usePipelineStages } from '@/hooks/usePipelines';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Pencil, Trash2, Loader2, Save, X, Bot, Sparkles } from 'lucide-react';
import { PipelineStage } from '@/types/crm';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

interface StagesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pipelineId: string;
}

export function StagesDialog({ open, onOpenChange, pipelineId }: StagesDialogProps) {
  const { stages, isLoading, createStage, updateStage, deleteStage } = usePipelineStages(pipelineId);
  const [editingStage, setEditingStage] = React.useState<Partial<PipelineStage> | null>(null);
  const [isCreating, setIsCreating] = React.useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStage) return;

    try {
      if (isCreating) {
        await createStage.mutateAsync({
          pipeline_id: pipelineId,
          name: editingStage.name!,
          description: editingStage.description,
          color: editingStage.color || '#000000',
          display_order: editingStage.display_order || stages.length + 1,
          ai_prompt: editingStage.ai_prompt,
        });
      } else if (editingStage.id) {
        await updateStage.mutateAsync({
          id: editingStage.id,
          name: editingStage.name,
          description: editingStage.description,
          color: editingStage.color,
          display_order: editingStage.display_order,
          ai_prompt: editingStage.ai_prompt,
        });
      }
      setEditingStage(null);
      setIsCreating(false);
    } catch (error) {
      console.error(error);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja remover este estágio? Os leads nele poderão ficar órfãos.')) {
      await deleteStage.mutateAsync(id);
    }
  };

  const handleCreate = () => {
    setEditingStage({
      name: '',
      color: '#3b82f6',
      display_order: stages.length + 1,
      ai_prompt: '',
    });
    setIsCreating(true);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gerenciar Estágios do Funil</DialogTitle>
          <DialogDescription>Configure as colunas e automações de IA para este funil.</DialogDescription>
        </DialogHeader>

        {editingStage ? (
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nome do Estágio</Label>
                <Input
                  value={editingStage.name}
                  onChange={(e) => setEditingStage({ ...editingStage, name: e.target.value })}
                  placeholder="Ex: Qualificação"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Ordem</Label>
                <Input
                  type="number"
                  value={editingStage.display_order}
                  onChange={(e) => setEditingStage({ ...editingStage, display_order: Number(e.target.value) })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Cor (Hex)</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    className="w-12 p-1"
                    value={editingStage.color}
                    onChange={(e) => setEditingStage({ ...editingStage, color: e.target.value })}
                  />
                  <Input
                    value={editingStage.color}
                    onChange={(e) => setEditingStage({ ...editingStage, color: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Bot className="h-4 w-4 text-purple-500" />
                Prompt da IA / Automação
              </Label>
              <Textarea
                value={editingStage.ai_prompt || ''}
                onChange={(e) => setEditingStage({ ...editingStage, ai_prompt: e.target.value })}
                placeholder="Descreva o que a IA deve fazer quando um lead entrar neste estágio. Ex: 'Envie uma mensagem de boas vindas perguntando o nome'."
                rows={4}
              />
              <p className="text-xs text-muted-foreground">
                Este prompt será usado para instruir o chatbot quando o lead for movido para esta coluna.
              </p>
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setEditingStage(null)}>
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
                Novo Estágio
              </Button>
            </div>

            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">Ordem</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Cor</TableHead>
                    <TableHead>Automação IA</TableHead>
                    <TableHead className="w-[100px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-4">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                      </TableCell>
                    </TableRow>
                  ) : stages.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                        Nenhum estágio configurado
                      </TableCell>
                    </TableRow>
                  ) : (
                    stages.map((stage) => (
                      <TableRow key={stage.id}>
                        <TableCell className="font-medium text-center">{stage.display_order}</TableCell>
                        <TableCell>{stage.name}</TableCell>
                        <TableCell>
                          <div
                            className="w-6 h-6 rounded-full border"
                            style={{ backgroundColor: stage.color }}
                          />
                        </TableCell>
                        <TableCell>
                          {stage.ai_prompt ? (
                            <div className="flex items-center gap-2 text-purple-600">
                              <Sparkles className="h-4 w-4" />
                              <span className="text-xs truncate max-w-[200px]">{stage.ai_prompt}</span>
                            </div>
                          ) : (
                             <span className="text-xs text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setEditingStage(stage);
                                setIsCreating(false);
                              }}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(stage.id)}
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
