import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useLeads } from '@/hooks/useLeads';
import { usePipelines } from '@/hooks/usePipelines';
import { PIPELINE_STAGES, Lead, LeadStage, CustomPipeline } from '@/types/crm';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Phone, Mail, DollarSign, GripVertical, Plus, Settings, Pencil, Columns } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LeadDetailSheet } from '@/components/leads/LeadDetailSheet';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { PipelineDialog } from '@/components/pipelines/PipelineDialog';
import { StagesDialog } from '@/components/pipelines/StagesDialog';

export default function Pipeline() {
  const { leads, isLoading, updateLeadStage } = useLeads();
  const { pipelines, isLoading: pipelinesLoading } = usePipelines();
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [draggedLead, setDraggedLead] = useState<Lead | null>(null);
  const [selectedPipelineId, setSelectedPipelineId] = useState<string>('');
  
  // Dialog states
  const [showPipelineDialog, setShowPipelineDialog] = useState(false);
  const [showStagesDialog, setShowStagesDialog] = useState(false);
  const [pipelineToEdit, setPipelineToEdit] = useState<CustomPipeline | null>(null);

  useEffect(() => {
    if (pipelines.length > 0) {
      if (!selectedPipelineId || !pipelines.find(p => p.id === selectedPipelineId)) {
        setSelectedPipelineId(pipelines[0].id);
      }
    } else {
      setSelectedPipelineId('');
    }
  }, [pipelines, selectedPipelineId]);

  const handleDragStart = (lead: Lead) => {
    setDraggedLead(lead);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (stageKey: string) => {
    if (draggedLead && draggedLead.stage !== stageKey) {
      updateLeadStage.mutate({ id: draggedLead.id, stage: stageKey as LeadStage });
    }
    setDraggedLead(null);
  };

  const getLeadsByStage = (stageKey: string) => {
    // Basic filtering, in real scenario filter by pipeline_id too
    return leads.filter(l => l.stage === stageKey);
  };

  const activeStages = pipelines.find(p => p.id === selectedPipelineId)?.stages?.map(s => ({
    key: s.id, 
    label: s.name,
    color: s.color
  })) || [];

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
    if (!value) return null;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const handleEditPipeline = () => {
    const pipeline = pipelines.find(p => p.id === selectedPipelineId);
    if (pipeline) {
      setPipelineToEdit(pipeline);
      setShowPipelineDialog(true);
    }
  };

  const handleCreatePipeline = () => {
    setPipelineToEdit(null);
    setShowPipelineDialog(true);
  };

  const selectedPipeline = pipelines.find(p => p.id === selectedPipelineId);

  return (
    <AppLayout>
      <div className="p-6 h-full flex flex-col">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Funil</h1>
            <p className="text-muted-foreground">Arraste leads entre os estágios</p>
          </div>
          
          <div className="flex gap-2">
            {selectedPipelineId && (
              <>
                <Button variant="outline" onClick={() => setShowStagesDialog(true)}>
                  <Columns className="h-4 w-4 mr-2" />
                  Gerenciar Estágios
                </Button>
                <Button variant="outline" onClick={handleEditPipeline}>
                  <Settings className="h-4 w-4 mr-2" />
                  Configurar Funil
                </Button>
              </>
            )}
            <Button onClick={handleCreatePipeline}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Funil
            </Button>
          </div>
        </div>

        {/* Pipeline Selector */}
        {pipelines.length > 0 && (
          <Tabs value={selectedPipelineId} onValueChange={setSelectedPipelineId} className="w-full mb-4">
            <TabsList>
              {pipelines.map(p => (
                <TabsTrigger key={p.id} value={p.id}>{p.name}</TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        )}

        {/* Empty State or Kanban Board */}
        {pipelines.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-lg border-muted-foreground/25 bg-muted/10">
             <div className="p-4 bg-primary/10 rounded-full mb-4">
               <Settings className="h-8 w-8 text-primary" />
             </div>
             <h3 className="text-xl font-semibold mb-2">Nenhum funil criado</h3>
             <p className="text-muted-foreground mb-6 text-center max-w-md">
               Para começar a gerenciar seus leads, crie seu primeiro funil de vendas.
               Você poderá personalizar as etapas e automações.
             </p>
             <Button onClick={handleCreatePipeline}>
               <Plus className="h-4 w-4 mr-2" />
               Criar Primeiro Funil
             </Button>
          </div>
        ) : (
          <div className="flex-1 overflow-x-auto">
            <div className="flex gap-4 h-full min-w-max">
              {activeStages.map((stage) => {
                const stageLeads = getLeadsByStage(stage.key);
                return (
                  <div
                    key={stage.key}
                    className="w-72 flex flex-col bg-muted/30 rounded-lg"
                    onDragOver={handleDragOver}
                    onDrop={() => handleDrop(stage.key)}
                  >
                    {/* Stage Header */}
                    <div className="p-3 border-b border-border flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: stage.color }}
                      />
                      <h3 className="font-semibold text-foreground">{stage.label}</h3>
                      <Badge variant="secondary" className="ml-auto">
                        {stageLeads.length}
                      </Badge>
                    </div>

                    {/* Cards */}
                    <div className="flex-1 p-2 space-y-2 overflow-y-auto">
                      {isLoading ? (
                        <div className="text-center text-muted-foreground py-4">
                          Carregando...
                        </div>
                      ) : stageLeads.length === 0 ? (
                        <div className="text-center text-muted-foreground py-4 text-sm">
                          Nenhum lead
                        </div>
                      ) : (
                        stageLeads.map((lead) => (
                          <Card
                            key={lead.id}
                            draggable
                            onDragStart={() => handleDragStart(lead)}
                            onClick={() => setSelectedLead(lead)}
                            className={cn(
                              'cursor-pointer hover:shadow-md transition-shadow',
                              draggedLead?.id === lead.id && 'opacity-50'
                            )}
                          >
                            <CardContent className="p-3">
                              <div className="flex items-start gap-2">
                                <GripVertical className="h-4 w-4 text-muted-foreground mt-1 cursor-grab" />
                                <Avatar className="h-8 w-8">
                                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                                    {getInitials(lead.name)}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-sm truncate">
                                    {lead.name || 'Lead sem nome'}
                                  </p>
                                  {lead.whatsapp && (
                                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                                      <Phone className="h-3 w-3" />
                                      {lead.whatsapp}
                                    </p>
                                  )}
                                  {lead.email && (
                                    <p className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                                      <Mail className="h-3 w-3" />
                                      {lead.email}
                                    </p>
                                  )}
                                </div>
                              </div>

                              {/* Tags */}
                              <div className="mt-2 flex items-center justify-between">
                                <div className="flex gap-1 flex-wrap">
                                  {lead.tags?.slice(0, 2).map((tag) => (
                                    <Badge
                                      key={tag.id}
                                      variant="outline"
                                      className="text-xs px-1"
                                      style={{ borderColor: tag.color, color: tag.color }}
                                    >
                                      {tag.name}
                                    </Badge>
                                  ))}
                                </div>
                              </div>

                              {/* Budget */}
                              {lead.estimated_budget && (
                                <div className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
                                  <DollarSign className="h-3 w-3" />
                                  {formatCurrency(lead.estimated_budget)}
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Lead Detail Sheet */}
      <LeadDetailSheet
        lead={selectedLead}
        onClose={() => setSelectedLead(null)}
      />

      <PipelineDialog 
        open={showPipelineDialog} 
        onOpenChange={setShowPipelineDialog}
        pipelineToEdit={pipelineToEdit}
      />
      
      {selectedPipeline && (
        <StagesDialog
          open={showStagesDialog}
          onOpenChange={setShowStagesDialog}
          pipelineId={selectedPipeline.id}
        />
      )}
    </AppLayout>
  );
}
