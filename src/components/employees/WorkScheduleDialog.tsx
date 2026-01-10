import { useEffect, useState } from "react";
import { useWorkSchedule, WorkScheduleInput, WorkSchedule } from "@/hooks/useWorkSchedule";
import { Employee } from "@/hooks/useEmployees";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Clock, Coffee, Save } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";

interface WorkScheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee: Employee | null;
}

const DAYS_OF_WEEK = [
  "Domingo",
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
];

const DEFAULT_SCHEDULE: Omit<WorkScheduleInput, "profile_id" | "day_of_week"> = {
    start_time: "09:00",
    end_time: "18:00",
    break_start: "",
    break_end: "",
    is_active: true
}

export function WorkScheduleDialog({ open, onOpenChange, employee }: WorkScheduleDialogProps) {
  const { schedules, upsertSchedule, isLoading } = useWorkSchedule(employee?.id);
  const [localSchedules, setLocalSchedules] = useState<Map<number, WorkScheduleInput>>(new Map());

  // Initialize local state when scheduled data loads
  useEffect(() => {
    if (employee) {
        const initialMap = new Map<number, WorkScheduleInput>();
        // Pre-fill all days with specific logic
        DAYS_OF_WEEK.forEach((_, index) => {
            const existing = schedules?.find(s => s.day_of_week === index);
            if (existing) {
                initialMap.set(index, {
                    profile_id: employee.id,
                    day_of_week: index,
                    start_time: existing.start_time.slice(0, 5),
                    end_time: existing.end_time.slice(0, 5),
                    break_start: existing.break_start?.slice(0, 5) || "",
                    break_end: existing.break_end?.slice(0, 5) || "",
                    is_active: existing.is_active
                });
            } else {
                 // Default for new days
                initialMap.set(index, {
                    profile_id: employee.id,
                    day_of_week: index,
                    start_time: "09:00",
                    end_time: "18:00",
                    break_start: "",
                    break_end: "",
                    is_active: index !== 0 // Sunday off by default
                });
            }
        });
        setLocalSchedules(initialMap);
    }
  }, [schedules, employee]);

  const handleChange = (day: number, field: keyof WorkScheduleInput, value: any) => {
    const prev = localSchedules.get(day);
    if (prev) {
        const updated = { ...prev, [field]: value };
        // Validar obrigatoriedade de pausa se preenchido parcial
        setLocalSchedules(new Map(localSchedules.set(day, updated)));
    }
  };

  const handleSaveDay = (day: number) => {
    const schedule = localSchedules.get(day);
    if (schedule && employee) {
        upsertSchedule({
            ...schedule,
            break_start: schedule.break_start || null,
            break_end: schedule.break_end || null,
        });
    }
  };

  if (!employee) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Jornada de Trabalho - {employee.name}</DialogTitle>
          <DialogDescription>
            Configure os horários de entrada, saída e intervalos para cada dia da semana.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
             <div className="space-y-6 py-4">
                {DAYS_OF_WEEK.map((dayName, index) => {
                    const schedule = localSchedules.get(index);
                    if (!schedule) return null;

                    return (
                        <div key={index} className={`p-4 rounded-lg border ${!schedule.is_active ? 'bg-muted/50 opacity-70' : 'bg-card'}`}>
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <Switch 
                                        checked={schedule.is_active} 
                                        onCheckedChange={(c) => handleChange(index, 'is_active', c)}
                                    />
                                    <span className="font-semibold">{dayName}</span>
                                    {!schedule.is_active && <span className="text-xs text-muted-foreground ml-2">(Folga)</span>}
                                </div>
                                <Button size="sm" variant="ghost" onClick={() => handleSaveDay(index)}>
                                    <Save className="w-4 h-4 mr-2" />
                                    Salvar
                                </Button>
                            </div>

                            {schedule.is_active && (
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 items-end">
                                    <div className="space-y-2">
                                        <Label className="flex items-center gap-1 text-xs text-muted-foreground">
                                            <Clock className="w-3 h-3" /> Entrada
                                        </Label>
                                        <Input 
                                            type="time" 
                                            value={schedule.start_time} 
                                            onChange={(e) => handleChange(index, 'start_time', e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="flex items-center gap-1 text-xs text-muted-foreground">
                                            <Clock className="w-3 h-3" /> Saída
                                        </Label>
                                        <Input 
                                            type="time" 
                                            value={schedule.end_time} 
                                            onChange={(e) => handleChange(index, 'end_time', e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="flex items-center gap-1 text-xs text-muted-foreground">
                                            <Coffee className="w-3 h-3" /> Início Pausa
                                        </Label>
                                        <Input 
                                            type="time" 
                                            value={schedule.break_start || ""} 
                                            onChange={(e) => handleChange(index, 'break_start', e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="flex items-center gap-1 text-xs text-muted-foreground">
                                            <Coffee className="w-3 h-3" /> Fim Pausa
                                        </Label>
                                        <Input 
                                            type="time" 
                                            value={schedule.break_end || ""} 
                                            onChange={(e) => handleChange(index, 'break_end', e.target.value)}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
             </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
