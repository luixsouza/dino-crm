import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { usePipelines } from '@/hooks/usePipelines';
import { useLeads } from '@/hooks/useLeads';
import { Lead } from '@/types/crm';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface MoveLeadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: Lead;
}

export function MoveLeadDialog({ open, onOpenChange, lead }: MoveLeadDialogProps) {
  const { pipelines } = usePipelines();
  const { updateLead } = useLeads();
  const { toast } = useToast();
  
  const [selectedPipelineId, setSelectedPipelineId] = useState<string>(lead.pipeline_id || '');
  const [selectedStageId, setSelectedStageId] = useState<string>(lead.pipeline_stage_id || '');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
        setSelectedPipelineId(lead.pipeline_id || '');
        setSelectedStageId(lead.pipeline_stage_id || '');
    }
  }, [open, lead]);

  const handlePipelineChange = (pipelineId: string) => {
    setSelectedPipelineId(pipelineId);
    // Reset stage when pipeline changes, optionally select first stage
    const pipeline = pipelines.find(p => p.id === pipelineId);
    if (pipeline && pipeline.stages && pipeline.stages.length > 0) {
        setSelectedStageId(pipeline.stages[0].id);
    } else {
        setSelectedStageId('');
    }
  };

  const selectedPipeline = pipelines.find(p => p.id === selectedPipelineId);

  const handleSave = async () => {
    if (!selectedPipelineId || !selectedStageId) {
        toast({ title: "Selecione o funil e a etapa", variant: "destructive" });
        return;
    }

    setLoading(true);
    try {
        await updateLead.mutateAsync({
            id: lead.id,
            pipeline_id: selectedPipelineId,
            pipeline_stage_id: selectedStageId,
            // Clear legacy stage if moving to custom pipeline to avoid confusion
            // although backend might handle it, frontend display logic prioritizes pipeline_stage_id
        });
        toast({ title: "Lead movido com sucesso" });
        onOpenChange(false);
    } catch (error: any) {
        toast({ title: "Erro ao mover lead", description: error.message, variant: "destructive" });
    } finally {
        setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Mover Lead</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="pipeline">Funil</Label>
            <Select value={selectedPipelineId} onValueChange={handlePipelineChange}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o funil" />
              </SelectTrigger>
              <SelectContent>
                {pipelines.map((pipeline) => (
                  <SelectItem key={pipeline.id} value={pipeline.id}>
                    {pipeline.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="stage">Etapa</Label>
            <Select value={selectedStageId} onValueChange={setSelectedStageId} disabled={!selectedPipelineId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a etapa" />
              </SelectTrigger>
              <SelectContent>
                {selectedPipeline?.stages?.map((stage) => (
                  <SelectItem key={stage.id} value={stage.id}>
                    {stage.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar Alterações
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
