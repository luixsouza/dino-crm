import { useState } from "react";
import { format } from "date-fns";
import { Filter, Plus, Clock, User, Scissors, Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AppointmentDialog } from "@/components/appointments/NewAppointmentDialog";
import { useAppointments } from "@/hooks/useAppointments";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
  } from "@/components/ui/alert-dialog";

export default function Appointments() {
  const [isNewAppointmentOpen, setIsNewAppointmentOpen] = useState(false);
  const { appointments, isLoading, updateAppointmentStatus } = useAppointments(); 
  const [filterText, setFilterText] = useState("");

  // Filtering
  const filteredAppointments = (appointments || []).filter(apt => {
    // Basic filter implementation
    if (!filterText) return true;
    const searchString = filterText.toLowerCase();
    const clientName = (apt.lead?.name || "").toLowerCase();
    const barberName = (apt.barber?.name || "").toLowerCase();
    const serviceName = (apt.service?.name || "").toLowerCase();
    
    return clientName.includes(searchString) || 
           barberName.includes(searchString) || 
           serviceName.includes(searchString);
  });

  const getStatusColor = (status: string) => {
    switch(status) {
        case 'scheduled': return 'bg-blue-100 text-blue-800 hover:bg-blue-100';
        case 'confirmed': return 'bg-green-100 text-green-800 hover:bg-green-100';
        case 'completed': return 'bg-gray-100 text-gray-800 hover:bg-gray-100';
        case 'cancelled': return 'bg-red-100 text-red-800 hover:bg-red-100';
        default: return 'bg-gray-100 text-gray-800 hover:bg-gray-100';
    }
  };

  const statusLabels: Record<string, string> = {
      scheduled: 'Agendado',
      confirmed: 'Confirmado',
      completed: 'Concluído',
      cancelled: 'Cancelado',
      no_show: 'Não Compareceu'
  };

  return (
    <div className="container mx-auto p-6 space-y-8 animate-in fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Agendamentos</h1>
          <p className="text-muted-foreground mt-1">Gerencie sua agenda e atendimentos.</p>
        </div>
        <Button onClick={() => setIsNewAppointmentOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Agendamento
        </Button>
      </div>

      <div className="flex gap-4 items-center bg-white p-4 rounded-lg border shadow-sm">
         <div className="relative flex-1 max-w-sm">
            <Filter className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
                placeholder="Filtrar por nome, serviço ou profissional..." 
                className="pl-9" 
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
            />
         </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredAppointments.length === 0 ? (
                <div className="col-span-full text-center py-12 text-muted-foreground bg-white rounded-lg border border-dashed">
                    Nenhum agendamento encontrado para os filtros selecionados.
                </div>
            ) : (
                filteredAppointments.map((apt) => (
                    <Card key={apt.id} className="hover:shadow-md transition-shadow">
                        <CardHeader className="pb-3">
                            <div className="flex justify-between items-start">
                                <div className="space-y-1">
                                    <Badge variant="secondary" className={getStatusColor(apt.status)}>
                                        {statusLabels[apt.status] || apt.status}
                                    </Badge>
                                </div>
                                <div className="text-sm font-medium text-muted-foreground flex items-center gap-1 bg-muted px-2 py-1 rounded">
                                    <Clock className="h-3 w-3" />
                                    {format(new Date(apt.scheduled_at), "dd/MM HH:mm")}
                                </div>
                            </div>
                            <CardTitle className="mt-2 text-lg truncate">
                                {apt.lead?.name || "Cliente Desconhecido"}
                            </CardTitle>
                            <CardDescription className="flex items-center gap-1 truncate">
                                <User className="h-3 w-3" />
                                {apt.barber?.name || "Sem profissional"}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                             <div className="flex items-center justify-between text-sm border-t pt-3 mt-1">
                                <span className="flex items-center gap-2 text-muted-foreground">
                                    <Scissors className="h-4 w-4" />
                                    {apt.service?.name || "Serviço"}
                                </span>
                                <span className="font-semibold">
                                    {apt.service?.price ? `R$ ${apt.service.price}` : '-'}
                                </span>
                             </div>
                        </CardContent>
                        <CardFooter className="pt-0 flex justify-end">
                            {apt.status !== 'cancelled' && (
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700 hover:bg-red-50">
                                            <XCircle className="h-4 w-4 mr-2" />
                                            Cancelar
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Cancelar Agendamento?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Tem certeza que deseja cancelar o agendamento de {apt.lead?.name}? Esta ação não pode ser desfeita.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Voltar</AlertDialogCancel>
                                            <AlertDialogAction 
                                                className="bg-red-500 hover:bg-red-600"
                                                onClick={() => updateAppointmentStatus.mutate({ id: apt.id, status: 'cancelled' })}
                                            >
                                                Confirmar Cancelamento
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            )}
                        </CardFooter>
                    </Card>
                ))
            )}
        </div>
      )}

      <AppointmentDialog 
        open={isNewAppointmentOpen} 
        onOpenChange={setIsNewAppointmentOpen} 
      />
    </div>
  );
}
