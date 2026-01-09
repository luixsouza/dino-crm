import { Lead, PIPELINE_STAGES } from '@/types/crm';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Phone, Mail, DollarSign, Calendar, FileText, User } from 'lucide-react';
import { useTasks } from '@/hooks/useTasks';
import { Button } from '@/components/ui/button';

interface LeadDetailSheetProps {
  lead: Lead | null;
  onClose: () => void;
}

export function LeadDetailSheet({ lead, onClose }: LeadDetailSheetProps) {
  const { tasks } = useTasks(lead?.id);

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

  const stage = PIPELINE_STAGES.find(s => s.key === lead.stage);

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
                  style={{ backgroundColor: stage?.color }}
                  className="text-primary-foreground"
                >
                  {stage?.label}
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
          {lead.tags && lead.tags.length > 0 && (
            <>
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground mb-2">Tags</h3>
                <div className="flex gap-2 flex-wrap">
                  {lead.tags.map((tag) => (
                    <Badge
                      key={tag.id}
                      variant="outline"
                      style={{ borderColor: tag.color, color: tag.color }}
                    >
                      #{tag.name}
                    </Badge>
                  ))}
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Tasks */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-2">
              Tarefas ({tasks.length})
            </h3>
            {tasks.length === 0 ? (
              <p className="text-sm text-destructive">
                ⚠️ Este lead não tem tarefas. Regra Kommo: todo lead precisa de uma tarefa!
              </p>
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
      </SheetContent>
    </Sheet>
  );
}
