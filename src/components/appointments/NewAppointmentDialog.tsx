import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar as CalendarIcon, UserPlus, Zap, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useEmployees } from "@/hooks/useEmployees";
import { useServices } from "@/hooks/useServices";
import { useLeads } from "@/hooks/useLeads";
import { supabase } from "@/integrations/supabase/client";
import { useAppointments } from "@/hooks/useAppointments";

interface AppointmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AppointmentDialog({ open, onOpenChange }: AppointmentDialogProps) {
  const { toast } = useToast();
  const { employees, isLoading: loadingEmployees } = useEmployees();
  const { services, isLoading: loadingServices } = useServices();
  const { leads, isLoading: loadingLeads } = useLeads();
  const { createAppointment, appointments } = useAppointments(); 
  
  const [activeTab, setActiveTab] = useState("normal");
  const [date, setDate] = useState<Date>();
  const [selectedProfessional, setSelectedProfessional] = useState<string>("");
  const [selectedService, setSelectedService] = useState<string>("");
  const [selectedClient, setSelectedClient] = useState<string>("");
  const [quickClientName, setQuickClientName] = useState("");
  const [isFitIn, setIsFitIn] = useState(false);
  const [selectedTime, setSelectedTime] = useState<string>("");

  const timeSlots = [];
  for (let i = 7; i <= 22; i++) {
    timeSlots.push(`${i.toString().padStart(2, '0')}:00`);
    if (i !== 22) timeSlots.push(`${i.toString().padStart(2, '0')}:30`);
  }

  const handleSchedule = async () => {
    const isQuick = activeTab === 'quick';
    
    if (!date || !selectedProfessional || !selectedService || !selectedTime) {
      toast({ title: "Erro", description: "Preencha data, hora, profissional e serviço.", variant: "destructive" });
      return;
    }
    
    if (isQuick && !quickClientName) {
        toast({ title: "Erro", description: "Informe o nome do cliente.", variant: "destructive" });
        return;
    }

    if (!isQuick && !selectedClient) {
        toast({ title: "Erro", description: "Selecione um cliente.", variant: "destructive" });
        return;
    }

    try {
      const [hours, minutes] = selectedTime.split(":").map(Number);
      const scheduledAt = new Date(date);
      scheduledAt.setHours(hours, minutes, 0, 0);

      if (scheduledAt < new Date()) {
        toast({
          title: "Erro",
          description: "Não é possível agendar em uma data/hora passada.",
          variant: "destructive"
        });
        return;
      }

      await createAppointment.mutateAsync({
        lead_id: isQuick ? undefined : selectedClient,
        client_name: isQuick ? quickClientName : undefined,
        barber_id: selectedProfessional,
        service_id: selectedService,
        scheduled_at: scheduledAt.toISOString(),
        is_fit_in: isFitIn
      });
      
      setSelectedTime("");
      setSelectedClient("");
      setQuickClientName("");
      setSelectedService("");
      setSelectedProfessional("");
      onOpenChange(false);

    } catch (error) {
      console.error(error);
      toast({
        title: "Erro ao agendar",
        description: "Não foi possível criar o agendamento.",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo Agendamento</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="normal" className="w-full" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="normal">Agendamento Normal</TabsTrigger>
            <TabsTrigger value="quick">⚡ Agendamento Rápido</TabsTrigger>
            </TabsList>

            <TabsContent value="normal" className="space-y-6">
                <div className="space-y-4">
                    <Label>Cliente</Label>
                    <div className="flex gap-2">
                        <Select value={selectedClient} onValueChange={setSelectedClient}>
                            <SelectTrigger className="flex-1">
                                <SelectValue placeholder={loadingLeads ? "Carregando clientes..." : "Selecione um cliente"} />
                            </SelectTrigger>
                            <SelectContent>
                                {leads?.length === 0 && <div className="p-2 text-sm text-muted-foreground">Nenhum cliente encontrado</div>}
                                {leads?.map((lead) => (
                                    <SelectItem key={lead.id} value={lead.id}>{lead.name || `Cliente #${lead.id.slice(0,4)}`} ({lead.whatsapp})</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Button variant="outline" size="icon" onClick={() => toast({ title: "TODO", description: "Abrir modal de novo lead" })}>
                            <UserPlus className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Profissional</Label>
                        <Select value={selectedProfessional} onValueChange={setSelectedProfessional}>
                            <SelectTrigger>
                                <SelectValue placeholder={loadingEmployees ? "Carregando..." : "Selecione..."} />
                            </SelectTrigger>
                            <SelectContent>
                                {employees?.map((emp) => (
                                    <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Serviço</Label>
                        <Select value={selectedService} onValueChange={setSelectedService}>
                            <SelectTrigger>
                                <SelectValue placeholder={loadingServices ? "Carregando..." : "Selecione..."} />
                            </SelectTrigger>
                            <SelectContent>
                                {services?.map((svc) => (
                                    <SelectItem key={svc.id} value={svc.id}>
                                        {svc.name} (R$ {svc.price})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="flex items-center space-x-2 py-2">
                    <Switch id="fit-in" checked={isFitIn} onCheckedChange={setIsFitIn} />
                    <Label htmlFor="fit-in">Marcar como encaixe</Label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label>Data</Label>
                        <div className="border rounded-md p-2 flex justify-center">
                             <Calendar
                                mode="single"
                                selected={date}
                                onSelect={setDate}
                                initialFocus
                                locale={ptBR}
                                disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Horário</Label>
                        {isFitIn ? (
                             <div className="flex items-center gap-2">
                                <Input 
                                    type="time" 
                                    value={selectedTime}
                                    onChange={(e) => setSelectedTime(e.target.value)}
                                    className="w-full"
                                />
                             </div>
                        ) : (
                            <div className="grid grid-cols-3 gap-2 h-64 overflow-y-auto pr-2">
                                {timeSlots.map((time) => {
                                    const isOccupied = appointments?.some(apt => {
                                        if (apt.status === 'cancelled') return false;
                                        if (apt.barber_id !== selectedProfessional) return false;
                                        if (!date) return false;

                                        const aptDate = new Date(apt.scheduled_at);
                                        const slotDate = new Date(date);
                                        const [h, m] = time.split(':').map(Number);
                                        slotDate.setHours(h, m, 0, 0);

                                        if (aptDate.toDateString() !== slotDate.toDateString()) return false;

                                        const aptTime = aptDate.getHours() * 60 + aptDate.getMinutes();
                                        const slotTime = h * 60 + m;
                                        const aptDuration = apt.service?.duration_minutes || 30;
                                        
                                        return slotTime >= aptTime && slotTime < (aptTime + aptDuration);
                                    });

                                    return (
                                        <Button
                                            key={time}
                                            variant={selectedTime === time ? "default" : isOccupied ? "ghost" : "outline"}
                                            size="sm"
                                            onClick={() => setSelectedTime(time)}
                                            disabled={isOccupied}
                                            className={isOccupied ? "opacity-50 cursor-not-allowed bg-red-50 hover:bg-red-50 hover:text-red-500 text-red-300" : ""}
                                        >
                                            {time}
                                        </Button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                <Button size="lg" className="w-full mt-4" onClick={handleSchedule} disabled={!date || !selectedTime || !selectedService || !selectedClient}>
                    Confirmar Agendamento
                </Button>
            </TabsContent>

            <TabsContent value="quick" className="space-y-6">
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3">
                    <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
                    <div className="text-sm text-amber-800">
                        <p className="font-semibold mb-1">Atenção: Modo Simplificado</p>
                        Este agendamento <strong>não será contabilizado</strong> nos relatórios financeiros, cálculo de comissões ou histórico do cliente. Use apenas para atendimentos avulsos.
                    </div>
                </div>

                <div className="space-y-4">
                    <Label htmlFor="quickName">Nome do Cliente</Label>
                    <Input 
                        id="quickName"
                        placeholder="Nome do cliente avulso..." 
                        value={quickClientName}
                        onChange={(e) => setQuickClientName(e.target.value)}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Profissional</Label>
                        <Select value={selectedProfessional} onValueChange={setSelectedProfessional}>
                            <SelectTrigger>
                                <SelectValue placeholder={loadingEmployees ? "Carregando..." : "Selecione..."} />
                            </SelectTrigger>
                            <SelectContent>
                                {employees?.map((emp) => (
                                    <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Serviço</Label>
                        <Select value={selectedService} onValueChange={setSelectedService}>
                            <SelectTrigger>
                                <SelectValue placeholder={loadingServices ? "Carregando..." : "Selecione..."} />
                            </SelectTrigger>
                            <SelectContent>
                                {services?.map((svc) => (
                                    <SelectItem key={svc.id} value={svc.id}>
                                        {svc.name} (R$ {svc.price})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="flex items-center space-x-2 py-2">
                    <Switch id="fit-in-quick" checked={isFitIn} onCheckedChange={setIsFitIn} />
                    <Label htmlFor="fit-in-quick">Marcar como encaixe</Label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label>Data</Label>
                        <div className="border rounded-md p-2 flex justify-center">
                             <Calendar
                                mode="single"
                                selected={date}
                                onSelect={setDate}
                                initialFocus
                                locale={ptBR}
                                disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Horário</Label>
                        {isFitIn ? (
                             <div className="flex items-center gap-2">
                                <Input 
                                    type="time" 
                                    value={selectedTime}
                                    onChange={(e) => setSelectedTime(e.target.value)}
                                    className="w-full"
                                />
                             </div>
                        ) : (
                            <div className="grid grid-cols-3 gap-2 h-64 overflow-y-auto pr-2">
                                {timeSlots.map((time) => {
                                    const isOccupied = appointments?.some(apt => {
                                        if (apt.status === 'cancelled') return false;
                                        if (apt.barber_id !== selectedProfessional) return false;
                                        if (!date) return false;
                                        
                                        const aptDate = new Date(apt.scheduled_at);
                                        const slotDate = new Date(date);
                                        if (aptDate.toDateString() !== slotDate.toDateString()) return false;

                                        const [h, m] = time.split(':').map(Number);
                                        const aptTime = aptDate.getHours() * 60 + aptDate.getMinutes();
                                        const slotTime = h * 60 + m;
                                        const aptDuration = apt.service?.duration_minutes || 30;
                                        return slotTime >= aptTime && slotTime < (aptTime + aptDuration);
                                    });

                                    return (
                                        <Button
                                            key={time}
                                            variant={selectedTime === time ? "default" : isOccupied ? "ghost" : "outline"}
                                            size="sm"
                                            onClick={() => setSelectedTime(time)}
                                            disabled={isOccupied}
                                            className={isOccupied ? "opacity-50 cursor-not-allowed bg-red-50 hover:bg-red-50 hover:text-red-500 text-red-300" : ""}
                                        >
                                            {time}
                                        </Button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                <Button size="lg" className="w-full mt-4" onClick={handleSchedule} disabled={!date || !selectedTime || !selectedService || !quickClientName}>
                    Confirmar Agendamento Rápido
                </Button>
            </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
