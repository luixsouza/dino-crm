import { AppLayout } from '@/components/layout/AppLayout';
import { useTasks } from '@/hooks/useTasks';
import { useLeads } from '@/hooks/useLeads';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar, Clock, User, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Tasks() {
  const { tasks, pendingTasks, overdueTasks, isLoading, updateTaskStatus } = useTasks();
  const { leads } = useLeads();

  const formatDate = (date?: string) => {
    if (!date) return null;
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isOverdue = (dueAt?: string) => {
    if (!dueAt) return false;
    return new Date(dueAt) < new Date();
  };

  const getLeadName = (leadId: string) => {
    const lead = leads.find(l => l.id === leadId);
    return lead?.name || 'Lead sem nome';
  };

  const getTaskTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      followup: 'Follow-up',
      call: 'Ligação',
      meeting: 'Reunião',
      proposal: 'Proposta',
      other: 'Outro',
    };
    return labels[type] || type;
  };

  const pendingTasksList = tasks.filter(t => t.status === 'pending');
  const completedTasksList = tasks.filter(t => t.status === 'completed');

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Tarefas</h1>
          <p className="text-muted-foreground">
            {pendingTasks.length} pendentes • {overdueTasks.length} atrasadas
          </p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingTasks.length}</div>
            </CardContent>
          </Card>
          <Card className={overdueTasks.length > 0 ? 'border-destructive' : ''}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                Atrasadas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={cn("text-2xl font-bold", overdueTasks.length > 0 && "text-destructive")}>
                {overdueTasks.length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Concluídas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completedTasksList.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Pending Tasks */}
        <Card>
          <CardHeader>
            <CardTitle>Tarefas Pendentes</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-muted-foreground py-4">Carregando...</p>
            ) : pendingTasksList.length === 0 ? (
              <p className="text-muted-foreground py-4">Nenhuma tarefa pendente 🎉</p>
            ) : (
              <div className="space-y-3">
                {pendingTasksList.map((task) => (
                  <div
                    key={task.id}
                    className={cn(
                      "flex items-start gap-3 p-3 rounded-lg border",
                      isOverdue(task.due_at) && "border-destructive bg-destructive/5"
                    )}
                  >
                    <Checkbox
                      checked={task.status === 'completed'}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          updateTaskStatus.mutate({ id: task.id, status: 'completed' });
                        }
                      }}
                      className="mt-1"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">{task.title}</p>
                      {task.description && (
                        <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {getLeadName(task.lead_id)}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {getTaskTypeLabel(task.type)}
                        </Badge>
                        {task.due_at && (
                          <span className={cn(
                            "flex items-center gap-1",
                            isOverdue(task.due_at) && "text-destructive font-medium"
                          )}>
                            <Clock className="h-3 w-3" />
                            {formatDate(task.due_at)}
                            {isOverdue(task.due_at) && ' (atrasada)'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Completed Tasks */}
        {completedTasksList.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-muted-foreground">Concluídas Recentemente</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {completedTasksList.slice(0, 10).map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center gap-3 p-2 rounded-lg text-muted-foreground"
                  >
                    <Checkbox checked disabled className="opacity-50" />
                    <span className="line-through">{task.title}</span>
                    <span className="text-xs ml-auto">{getLeadName(task.lead_id)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
