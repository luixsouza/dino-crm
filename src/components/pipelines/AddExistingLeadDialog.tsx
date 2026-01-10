import { useState } from 'react';
import { useLeads } from '@/hooks/useLeads';
import { Lead } from '@/types/crm';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from '@/hooks/use-toast';

interface AddExistingLeadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pipelineId: string;
  firstStageId: string;
}

export function AddExistingLeadDialog({ open, onOpenChange, pipelineId, firstStageId }: AddExistingLeadDialogProps) {
  const { leads, updateLead } = useLeads();
  const { toast } = useToast();
  const [selectedLeadId, setSelectedLeadId] = useState<string>('');
  const [openCombobox, setOpenCombobox] = useState(false);

  // Filter leads that are NOT already in this pipeline
  // Note: This logic depends on whether 'stage' in leads is globally unique or just a status string.
  // Assuming 'stage' maps to pipeline_stage_id logic eventually, but for now we might just move them.
  // We will assume that if we add them here, we move them to the first stage of THIS pipeline.

  const handleAdd = () => {
    if (!selectedLeadId) return;

    updateLead.mutate({ 
        id: selectedLeadId, 
        pipeline_id: pipelineId,
        pipeline_stage_id: firstStageId,
    }, {
        onSuccess: () => {
            toast({ title: "Lead adicionado ao pipeline" });
            onOpenChange(false);
            setSelectedLeadId('');
        }
    });
  };

  const selectedLead = leads.find(l => l.id === selectedLeadId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Adicionar Cliente Existente</DialogTitle>
          <DialogDescription>
            Selecione um cliente para mover para o início deste pipeline.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4 space-y-4">
            <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
            <PopoverTrigger asChild>
                <Button
                variant="outline"
                role="combobox"
                aria-expanded={openCombobox}
                className="w-full justify-between"
                >
                {selectedLead
                    ? selectedLead.name
                    : "Selecione um cliente..."}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[400px] p-0">
                <Command>
                <CommandInput placeholder="Buscar cliente..." />
                <CommandList>
                    <CommandEmpty>Nenhum cliente encontrado.</CommandEmpty>
                    <CommandGroup>
                    {leads.map((lead) => (
                        <CommandItem
                        key={lead.id}
                        value={lead.name || ''}
                        onSelect={() => {
                            setSelectedLeadId(lead.id);
                            setOpenCombobox(false);
                        }}
                        >
                        <Check
                            className={cn(
                            "mr-2 h-4 w-4",
                            selectedLeadId === lead.id ? "opacity-100" : "opacity-0"
                            )}
                        />
                        {lead.name}
                        </CommandItem>
                    ))}
                    </CommandGroup>
                </CommandList>
                </Command>
            </PopoverContent>
            </Popover>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleAdd} disabled={!selectedLeadId}>Adicionar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
