import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useLeads, useTags } from '@/hooks/useLeads';
import { Lead, PIPELINE_STAGES } from '@/types/crm';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Phone, Mail, Search, Plus, Filter, Trash2, Tag } from 'lucide-react';
import { LeadDetailSheet } from '@/components/leads/LeadDetailSheet';
import { CreateLeadDialog } from '@/components/leads/CreateLeadDialog';
import { TagsDialog } from '@/components/settings/TagsDialog';

export default function Leads() {
  const { leads, isLoading, deleteLead } = useLeads();
  const { tags } = useTags();
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [tagFilter, setTagFilter] = useState<string>('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showTagsDialog, setShowTagsDialog] = useState(false);

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = 
      !search ||
      lead.name?.toLowerCase().includes(search.toLowerCase()) ||
      lead.whatsapp?.includes(search) ||
      lead.email?.toLowerCase().includes(search.toLowerCase());
    
    const matchesStage = stageFilter === 'all' || lead.stage === stageFilter;
    
    const matchesTag = tagFilter === 'all' || lead.tags?.some(t => t.id === tagFilter);

    return matchesSearch && matchesStage && matchesTag;
  });

  const getInitials = (name?: string) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const formatDate = (date?: string) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('pt-BR');
  };

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Leads</h1>
            <p className="text-muted-foreground">{filteredLeads.length} leads encontrados</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowTagsDialog(true)}>
              <Tag className="h-4 w-4 mr-2" />
              Tags
            </Button>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Lead
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex gap-4 flex-wrap">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nome, telefone ou email..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              <Select value={stageFilter} onValueChange={setStageFilter}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Estágio" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os estágios</SelectItem>
                  {PIPELINE_STAGES.map((stage) => (
                    <SelectItem key={stage.key} value={stage.key}>
                      {stage.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={tagFilter} onValueChange={setTagFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Tag" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as tags</SelectItem>
                  {tags.map((tag) => (
                    <SelectItem key={tag.id} value={tag.id}>
                      #{tag.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Lead</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead>Estágio</TableHead>
                <TableHead>Tags</TableHead>
                <TableHead>Criado em</TableHead>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : filteredLeads.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Nenhum lead encontrado
                  </TableCell>
                </TableRow>
              ) : (
                filteredLeads.map((lead) => {
                  const stage = PIPELINE_STAGES.find(s => s.key === lead.stage);
                  return (
                    <TableRow
                      key={lead.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => setSelectedLead(lead)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                              {getInitials(lead.name)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{lead.name || 'Sem nome'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm space-y-1">
                          {lead.whatsapp && (
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Phone className="h-3 w-3" />
                              {lead.whatsapp}
                            </div>
                          )}
                          {lead.email && (
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Mail className="h-3 w-3" />
                              {lead.email}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge style={{ backgroundColor: stage?.color }} className="text-primary-foreground">
                          {stage?.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap">
                          {lead.tags?.slice(0, 2).map((tag) => (
                            <Badge
                              key={tag.id}
                              variant="outline"
                              className="text-xs"
                              style={{ borderColor: tag.color, color: tag.color }}
                            >
                              #{tag.name}
                            </Badge>
                          ))}
                          {lead.tags && lead.tags.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{lead.tags.length - 2}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(lead.created_at)}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm('Tem certeza que deseja remover este lead?')) {
                              deleteLead.mutate(lead.id);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </Card>
      </div>

      <LeadDetailSheet lead={selectedLead} onClose={() => setSelectedLead(null)} />
      <CreateLeadDialog open={showCreateDialog} onOpenChange={setShowCreateDialog} />
      <TagsDialog open={showTagsDialog} onOpenChange={setShowTagsDialog} />
    </AppLayout>
  );
}
