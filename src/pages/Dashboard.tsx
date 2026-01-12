import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useLeads } from '@/hooks/useLeads';
import { useTasks } from '@/hooks/useTasks';
import { useAppointments, useSubscribers, useServices } from '@/hooks/useAppointments';
import { Users, Calendar, AlertCircle, CheckCircle2, Scissors, CreditCard, TrendingUp, Clock, Pencil } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useState } from 'react';
import { ServicesDialog } from '@/components/settings/ServicesDialog';
import { CommissionsDialog } from '@/components/finance/CommissionsDialog';

export default function Dashboard() {
  const { leads, isLoading: leadsLoading } = useLeads();
  const { pendingTasks, overdueTasks, isLoading: tasksLoading } = useTasks();
  const { todayAppointments, weekAppointments, pendingConfirmations, isLoading: appointmentsLoading } = useAppointments();
  const { subscribers, mrr, isLoading: subscribersLoading } = useSubscribers();
  const { services } = useServices();
  const [showServicesDialog, setShowServicesDialog] = useState(false);
  const [showCommissionsDialog, setShowCommissionsDialog] = useState(false);

  const isLoading = leadsLoading || tasksLoading || appointmentsLoading || subscribersLoading;

  // Métricas
  const totalLeads = leads.length;
  const leadsWithoutTasks = leads.filter(l => !l.tasks || l.tasks.length === 0).length;
  const activeSubscribers = subscribers.length;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <img src="/dino-logo.png" alt="Dino" className="h-8 w-8 object-contain" />
              Dino CRM
            </h1>
            <p className="text-muted-foreground">Dashboard - {format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}</p>
          </div>
          <Button variant="outline" onClick={() => setShowCommissionsDialog(true)}>
            <CreditCard className="mr-2 h-4 w-4" />
            Comissões
          </Button>
        </div>

        {/* Agendamentos do Dia - Destaque */}
        <Card className="border-primary/50 bg-primary/5">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Agendamentos de Hoje
              </CardTitle>
              <Badge variant="default" className="text-lg px-3">
                {isLoading ? '-' : todayAppointments.length}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-muted-foreground">Carregando...</p>
            ) : todayAppointments.length === 0 ? (
              <p className="text-muted-foreground">Nenhum agendamento para hoje</p>
            ) : (
              <div className="space-y-2">
                {todayAppointments.slice(0, 5).map((apt) => (
                  <div key={apt.id} className="flex items-center justify-between p-2 rounded-lg bg-background">
                    <div className="flex items-center gap-3">
                      <div className="text-sm font-medium">
                        {format(new Date(apt.scheduled_at), 'HH:mm')}
                      </div>
                      <div>
                        <p className="font-medium">{apt.lead?.name || 'Cliente'}</p>
                        <p className="text-xs text-muted-foreground">{apt.service?.name}</p>
                      </div>
                    </div>
                    <Badge variant={apt.status === 'confirmed' ? 'default' : 'secondary'}>
                      {apt.status === 'confirmed' ? 'Confirmado' : 'Aguardando'}
                    </Badge>
                  </div>
                ))}
                {todayAppointments.length > 5 && (
                  <Button variant="ghost" size="sm" className="w-full" asChild>
                    <Link to="/pipeline">Ver todos ({todayAppointments.length})</Link>
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Metrics Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Agendamentos Semana</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{isLoading ? '-' : weekAppointments.length}</div>
              <p className="text-xs text-muted-foreground">
                {pendingConfirmations.length} aguardando confirmação
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Assinantes Ativos</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{isLoading ? '-' : activeSubscribers}</div>
              <p className="text-xs text-muted-foreground">
                clientes com plano ativo
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Receita Recorrente</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                {isLoading ? '-' : formatCurrency(mrr)}
              </div>
              <p className="text-xs text-muted-foreground">
                MRR mensal
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Clientes Cadastrados</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{isLoading ? '-' : totalLeads}</div>
              <p className="text-xs text-muted-foreground">
                {leadsWithoutTasks} sem follow-up
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Two Column Layout */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Serviços Oferecidos */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="space-y-1.5">
                <CardTitle className="flex items-center gap-2">
                  <Scissors className="h-5 w-5" />
                  Serviços
                </CardTitle>
                <CardDescription>Tabela de preços</CardDescription>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setShowServicesDialog(true)}>
                <Pencil className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {services.slice(0, 6).map((service) => (
                  <div key={service.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div>
                      <p className="font-medium text-sm">{service.name}</p>
                      <p className="text-xs text-muted-foreground">{service.duration_minutes} min</p>
                    </div>
                    <Badge variant="secondary">{formatCurrency(service.price)}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Tarefas e Alertas */}
          <Card className={overdueTasks.length > 0 ? 'border-destructive/50' : ''}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {overdueTasks.length > 0 ? (
                  <AlertCircle className="h-5 w-5 text-destructive" />
                ) : (
                  <CheckCircle2 className="h-5 w-5" />
                )}
                Tarefas Pendentes
              </CardTitle>
              <CardDescription>
                {overdueTasks.length} atrasadas | {pendingTasks.length} pendentes
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p className="text-muted-foreground">Carregando...</p>
              ) : pendingTasks.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">🎉 Todas as tarefas em dia!</p>
              ) : (
                <div className="space-y-2">
                  {[...overdueTasks, ...pendingTasks.filter(t => !overdueTasks.includes(t))].slice(0, 5).map((task) => (
                    <div 
                      key={task.id} 
                      className={`flex items-center justify-between p-2 rounded-lg ${
                        overdueTasks.includes(task) ? 'bg-destructive/10' : 'bg-muted/50'
                      }`}
                    >
                      <div>
                        <p className="font-medium text-sm">{task.title}</p>
                        <p className="text-xs text-muted-foreground">{task.lead?.name}</p>
                      </div>
                      {task.due_at && (
                        <Badge variant={overdueTasks.includes(task) ? 'destructive' : 'outline'}>
                          <Clock className="h-3 w-3 mr-1" />
                          {format(new Date(task.due_at), 'dd/MM HH:mm')}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}
              <Button variant="outline" className="w-full mt-4" asChild>
                <Link to="/tasks">Ver Todas as Tarefas</Link>
              </Button>
      <CommissionsDialog open={showCommissionsDialog} onOpenChange={setShowCommissionsDialog} />
            </CardContent>
          </Card>
        </div>

      </div>
      <ServicesDialog open={showServicesDialog} onOpenChange={setShowServicesDialog} />
    </AppLayout>
  );
}
