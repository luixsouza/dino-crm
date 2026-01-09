import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useLeads } from '@/hooks/useLeads';
import { PIPELINE_STAGES, Lead, LeadStage } from '@/types/crm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Phone, Mail, DollarSign, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LeadDetailSheet } from '@/components/leads/LeadDetailSheet';

export default function Pipeline() {
  const { leads, isLoading, updateLeadStage } = useLeads();
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [draggedLead, setDraggedLead] = useState<Lead | null>(null);

  const handleDragStart = (lead: Lead) => {
    setDraggedLead(lead);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (stage: LeadStage) => {
    if (draggedLead && draggedLead.stage !== stage) {
      updateLeadStage.mutate({ id: draggedLead.id, stage });
    }
    setDraggedLead(null);
  };

  const getLeadsByStage = (stage: LeadStage) => {
    return leads.filter(l => l.stage === stage);
  };

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

  return (
    <AppLayout>
      <div className="p-6 h-full flex flex-col">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Pipeline</h1>
          <p className="text-muted-foreground">Arraste leads entre os estágios</p>
        </div>

        {/* Kanban Board */}
        <div className="flex-1 overflow-x-auto">
          <div className="flex gap-4 h-full min-w-max">
            {PIPELINE_STAGES.map((stage) => {
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
      </div>

      {/* Lead Detail Sheet */}
      <LeadDetailSheet
        lead={selectedLead}
        onClose={() => setSelectedLead(null)}
      />
    </AppLayout>
  );
}
