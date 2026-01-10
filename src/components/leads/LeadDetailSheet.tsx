import { Lead, PIPELINE_STAGES } from '@/types/crm';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Phone, Mail, DollarSign, Calendar, FileText, User, Layers, GitCommit, Pencil } from 'lucide-react';
import { useTasks } from '@/hooks/useTasks';
import { useLeads, useTags } from '@/hooks/useLeads';
import { usePipelines } from '@/hooks/usePipelines';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Check, Tag, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from "@/hooks/use-toast";
import { useState } from 'react';
import { MoveLeadDialog } from './MoveLeadDialog';

interface LeadDetailSheetProps {
  lead: Lead | null;
  onClose: () => void;
}

export function LeadDetailSheet({ lead, onClose }: LeadDetailSheetProps) {
  const { tasks } = useTasks(lead?.id);
  const { tags } = useTags();
  const { pipelines } = usePipelines();
  const { toast } = useToast();
  const [openTagCombobox, setOpenTagCombobox] = useState(false);
  const [showMoveDialog, setShowMoveDialog] = useState(false);

  // Function to add tag to lead
  const addTagToLead = async (tagId: string) => {
    if (!lead) return;
    
    // Check if tag already exists
    if (lead.tags?.some(t => t.id === tagId)) {
        return;
    }

    const { error } = await supabase
        .from('lead_tags')
        .insert({ lead_id: lead.id, tag_id: tagId });

    if (error) {
        toast({ variant: 'destructive', title: 'Erro ao adicionar tag', description: error.message });
    } else {
        toast({ title: 'Tag adicionada' });
        // Force refresh or optimistic update would be better, but react-query invalidation in parent handles it
        // Ideally we would call an invalidate here, but we don't have the queryClient from hook directly exposed easily without props
        // But useTags hook invalidates 'tags', we need to invalidate 'leads'
        // Let's just reload the page for now or wait for background refetch
    }
  };
  
  const removeTagFromLead = async (tagId: string) => {
      if (!lead) return;

      const { error } = await supabase
        .from('lead_tags')
        .delete()
        .eq('lead_id', lead.id)
        .eq('tag_id', tagId);
    
    if (error) {
        toast({ variant: 'destructive', title: 'Erro ao remover tag', description: error.message });
    } else {
        toast({ title: 'Tag removida' });
    }
  }

  if (!lead) return null;

  const getInitials = (name?: string) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatCurrency = (value?: number) => {
    if (!value) return '-';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (date?: string) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getPipelineInfo = () => {
    if (!lead) return { name: '-', stage: '-' };
    
    if (lead.pipeline_id) {
        const pipeline = pipelines.find(p => p.id === lead.pipeline_id);
        const stage = pipeline?.stages?.find(s => s.id === lead.pipeline_stage_id);
        return {
            name: pipeline?.name || 'Pipeline Desconhecido',
            stage: stage?.name || 'Estágio Desconhecido',
            color: stage?.color || pipeline?.color
        };
    }
    
    // Fallback for legacy leads
    const stage = PIPELINE_STAGES.find(s => s.key === lead.stage);
    return {
        name: 'Funil Padrão',
        stage: stage?.label || lead.stage,
        color: stage?.color
    };
  };

  const pipelineInfo = getPipelineInfo();
  const stageLegacy = PIPELINE_STAGES.find(s => s.key === lead.stage);
  const displayColor = pipelineInfo.color || stageLegacy?.color;

  return (
    <Sheet open={!!lead} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
        <SheetHeader>
          <div className="flex items-center gap-4">
            <Avatar className="h-14 w-14">
              <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                {getInitials(lead.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <SheetTitle className="text-xl">{lead.name || 'Lead sem nome'}</SheetTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge
                  style={{ backgroundColor: displayColor }}
                  className="text-primary-foreground cursor-pointer hover:opacity-90 flex items-center gap-1"
                  onClick={() => setShowMoveDialog(true)}
                  title="Clique para alterar a etapa"
                >
                  {pipelineInfo.stage}
                  <Pencil className="h-3 w-3 ml-1 opacity-70" />
                </Badge>
              </div>
            </div>
          </div>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Contact Info */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3">Contato</h3>
            <div className="space-y-2">
              {lead.whatsapp && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{lead.whatsapp}</span>
                </div>
              )}
              {lead.email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{lead.email}</span>
                </div>
              )}
              {lead.estimated_budget && (
                <div className="flex items-center gap-2 text-sm">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span>{formatCurrency(lead.estimated_budget)}</span>
                </div>
              )}
              <div 
                className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted p-1 rounded -ml-1 transition-colors"
                onClick={() => setShowMoveDialog(true)}
                title="Clique para alterar o funil"
              >
                 <Layers className="h-4 w-4 text-muted-foreground" />
                 <span>{pipelineInfo.name}</span>
                 <Pencil className="h-3 w-3 text-muted-foreground opacity-50 ml-auto" />
              </div>
            </div>
          </div>

          <Separator />

          {/* Main Pain */}
          {lead.main_pain && (
            <>
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground mb-2">Dor Principal</h3>
                <p className="text-sm">{lead.main_pain}</p>
              </div>
              <Separator />
            </>
          )}

          {/* Tags */}
          <div>
            <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-muted-foreground">Tags</h3>
                <Popover open={openTagCombobox} onOpenChange={setOpenTagCombobox}>
                    <PopoverTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
                           <Plus className="h-3 w-3 mr-1" /> Adicionar
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[200px] p-0">
                        <Command>
                            <CommandInput placeholder="Buscar tag..." />
                            <CommandList>
                                <CommandEmpty>Nenhuma tag encontrada.</CommandEmpty>
                                <CommandGroup>
                                    {tags.map((tag) => (
                                        <CommandItem
                                            key={tag.id}
                                            value={tag.name}
                                            onSelect={() => {
                                                addTagToLead(tag.id);
                                                setOpenTagCombobox(false);
                                            }}
                                        >
                                            <div 
                                                className="w-3 h-3 rounded-full mr-2" 
                                                style={{ backgroundColor: tag.color }}
                                            />
                                            {tag.name}
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            </CommandList>
                        </Command>
                    </PopoverContent>
                </Popover>
            </div>
            {(!lead.tags || lead.tags.length === 0) ? (
                 <p className="text-sm text-muted-foreground italic">Sem tags.</p>
            ) : (
                <div className="flex gap-2 flex-wrap">
                  {lead.tags.map((tag) => (
                    <Badge
                      key={tag.id}
                      variant="outline"
                      className="cursor-pointer hover:bg-destructive/10"
                      style={{ borderColor: tag.color, color: tag.color }}
                      onClick={() => {
                          if (confirm(`Remover tag ${tag.name}?`)) {
                              removeTagFromLead(tag.id);
                          }
                      }}
                    >
                      #{tag.name}
                    </Badge>
                  ))}
                </div>
            )}
          </div>
          <Separator />

          {/* Tasks */}
          <div>
            <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-muted-foreground">
                Tarefas ({tasks.length})
                </h3>
            </div>
            {tasks.length === 0 ? (
               <p className="text-sm text-muted-foreground italic">Nenhuma tarefa.</p>
            ) : (
              <ul className="space-y-2">
                {tasks.map((task) => (
                  <li key={task.id} className="flex items-center gap-2 text-sm">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        task.status === 'completed'
                          ? 'bg-green-500'
                          : task.status === 'cancelled'
                          ? 'bg-muted'
                          : 'bg-amber-500'
                      }`}
                    />
                    <span className={task.status === 'completed' ? 'line-through text-muted-foreground' : ''}>
                      {task.title}
                    </span>
                    {task.due_at && (
                      <span className="text-xs text-muted-foreground ml-auto">
                        {formatDate(task.due_at)}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <Separator />

          {/* Metadata */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-2">Informações</h3>
            <div className="space-y-1 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>Criado em: {formatDate(lead.created_at)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>Último contato: {formatDate(lead.last_contact_at)}</span>
              </div>
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span>Fonte: {lead.source || 'WhatsApp'}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {lead.notes && (
            <>
              <Separator />
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground mb-2">Anotações</h3>
                <p className="text-sm whitespace-pre-wrap">{lead.notes}</p>
              </div>
            </>
          )}
        </div>
        
        <MoveLeadDialog 
            open={showMoveDialog} 
            onOpenChange={setShowMoveDialog} 
            lead={lead} 
        />
      </SheetContent>
    </Sheet>
  );
}
