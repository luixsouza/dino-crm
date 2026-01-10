import { useState } from 'react';
import { useLeads } from '@/hooks/useLeads';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';

interface CreateLeadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pipelineId?: string;
  initialStage?: string;
}

export function CreateLeadDialog({ open, onOpenChange, pipelineId, initialStage }: CreateLeadDialogProps) {
  const { createLead } = useLeads();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    setLoading(true);
    try {
      await createLead.mutateAsync({
        name: formData.get('name') as string || undefined,
        whatsapp: formData.get('whatsapp') as string || undefined,
        email: formData.get('email') as string || undefined,
        estimated_budget: formData.get('budget') ? parseFloat(formData.get('budget') as string) : undefined,
        main_pain: formData.get('pain') as string || undefined,
        source: 'manual',
        pipeline_id: pipelineId,
        stage: initialStage,
      });
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo Lead</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome</Label>
            <Input id="name" name="name" placeholder="Nome do lead" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="whatsapp">WhatsApp</Label>
              <Input id="whatsapp" name="whatsapp" placeholder="+55 11 99999-9999" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" placeholder="email@exemplo.com" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="budget">Orçamento Estimado (R$)</Label>
            <Input id="budget" name="budget" type="number" step="0.01" placeholder="0.00" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pain">Dor Principal</Label>
            <Textarea id="pain" name="pain" placeholder="Qual o principal problema ou necessidade?" />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Criar Lead
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
