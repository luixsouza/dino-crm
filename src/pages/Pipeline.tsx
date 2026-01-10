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
import { AddExistingLeadDialog } from '@/components/pipelines/AddExistingLeadDialog';
import { CreateLeadDialog } from '@/components/leads/CreateLeadDialog';

export default function Pipeline() {
  const { leads, isLoading, updateLeadStage, updateLead } = useLeads();
  const { pipelines, isLoading: pipelinesLoading } = usePipelines();
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [draggedLead, setDraggedLead] = useState<Lead | null>(null);
  const [selectedPipelineId, setSelectedPipelineId] = useState<string>('');
  
  // Dialog states
  const [showPipelineDialog, setShowPipelineDialog] = useState(false);
  const [showStagesDialog, setShowStagesDialog] = useState(false);
  const [showAddExistsDialog, setShowAddExistsDialog] = useState(false);
  const [showCreateLeadDialog, setShowCreateLeadDialog] = useState(false);
  const [activeStageForCreate, setActiveStageForCreate] = useState<string>('');
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
    if (draggedLead) {
        // Support both legacy stage and new pipeline_stage_id
        const needsUpdate = draggedLead.pipeline_stage_id !== stageKey && draggedLead.stage !== stageKey;
        
        if (needsUpdate) {
            // If we are in a custom pipeline (stageKey is likely a UUID), use updateLead
            // to set pipeline_stage_id. 
            // We also try to set 'stage' for legacy compatibility if it's not a UUID, 
            // but for custom pipelines checking stageKey format might be needed.
            // Simplified: just update both or prefer pipeline_stage_id.
            
            updateLead.mutate({
                id: draggedLead.id,
                pipeline_stage_id: stageKey,
                // Only update 'stage' if it matches the legacy enum to avoid constraint errors
                // OR if we know the constraint is removed. 
                // For now, we rely on pipeline_stage_id for custom pipelines.
            });
        }
    }
    setDraggedLead(null);
  };

  const getLeadsByStage = (stageKey: string) => {
    return leads.filter(l => 
        l.pipeline_stage_id === stageKey || l.stage === stageKey
    );
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
          <div className="flex items-center justify-between mb-4">
            <Tabs value={selectedPipelineId} onValueChange={setSelectedPipelineId} className="w-auto">
                <TabsList>
                {pipelines.map(p => (
                    <TabsTrigger key={p.id} value={p.id}>{p.name}</TabsTrigger>
                ))}
                </TabsList>
            </Tabs>
             {selectedPipeline && (
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setShowAddExistsDialog(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Mover Cliente
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setShowStagesDialog(true)}>
                    <Columns className="w-4 h-4 mr-2" />
                    Etapas
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => {
                        setPipelineToEdit(selectedPipeline || null);
                        setShowPipelineDialog(true);
                    }}>
                    <Pencil className="w-4 h-4 mr-2" />
                    Editar
                    </Button>
                </div>
            )}
          </div>
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
                        styles={{ backgroundColor: stage.color }}
                      />
                      <h3 className="font-semibold text-foreground">{stage.label}</h3>
                      <div className="ml-auto flex items-center gap-1">
                          <Badge variant="secondary">
                            {stageLeads.length}
                          </Badge>
                           <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6"
                            onClick={() => {
                                setActiveStageForCreate(stage.key);
                                setShowCreateLeadDialog(true);
                            }}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                      </div>
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

      {selectedPipeline && activeStages.length > 0 && (
          <AddExistingLeadDialog
            open={showAddExistsDialog}
            onOpenChange={setShowAddExistsDialog}
            pipelineId={selectedPipeline.id}
            firstStageId={activeStages[0].key}
          />
      )}

      <CreateLeadDialog 
        open={showCreateLeadDialog} 
        onOpenChange={setShowCreateLeadDialog}
        pipelineId={selectedPipelineId}
        initialStage={activeStageForCreate}
      />
    </AppLayout>
  );
}
