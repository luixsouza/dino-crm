import { useState } from "react";
import { useScheduleBlocks, ScheduleBlockInput } from "@/hooks/useScheduleBlocks";
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
import { Label } from "@/components/ui/label";
import { Ban, Trash2, CalendarIcon } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
  } from "@/components/ui/table";

interface ScheduleBlocksDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee: Employee | null;
}

export function ScheduleBlocksDialog({ open, onOpenChange, employee }: ScheduleBlocksDialogProps) {
  const { blocks, isLoading, createBlock, deleteBlock } = useScheduleBlocks(employee?.id);
  
  const [date, setDate] = useState<string>("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [reason, setReason] = useState("");

  const handleAddBlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!employee || !date || !startTime || !endTime) return;

    const startDateTime = new Date(`${date}T${startTime}:00`).toISOString();
    const endDateTime = new Date(`${date}T${endTime}:00`).toISOString();

    createBlock({
        profile_id: employee.id,
        start_time: startDateTime,
        end_time: endDateTime,
        reason
    });

    setReason("");
  };

  const handleDelete = (id: string) => {
      deleteBlock(id);
  }

  if (!employee) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Bloqueio de Agenda - {employee.name}</DialogTitle>
          <DialogDescription>
            Registre imprevistos ou ausências para bloquear agendamentos nestes horários.
          </DialogDescription>
        </DialogHeader>

        <div className="bg-muted/50 p-4 rounded-lg border mb-4">
            <form onSubmit={handleAddBlock} className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                <div className="space-y-2">
                    <Label>Data</Label>
                    <Input 
                        type="date" 
                        value={date} 
                        onChange={(e) => setDate(e.target.value)}
                        required
                    />
                </div>
                <div className="space-y-2">
                    <Label>Motivo</Label>
                    <Input 
                        placeholder="Ex: Consulta Médica" 
                        value={reason} 
                        onChange={(e) => setReason(e.target.value)}
                    />
                </div>
                <div className="space-y-2">
                    <Label>Início</Label>
                    <Input 
                        type="time" 
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        required
                    />
                </div>
                <div className="space-y-2">
                    <Label>Fim</Label>
                    <div className="flex gap-2">
                        <Input 
                            type="time" 
                            value={endTime}
                            onChange={(e) => setEndTime(e.target.value)}
                            required
                        />
                         <Button type="submit">
                            <Ban className="w-4 h-4 mr-2" />
                            Bloquear
                        </Button>
                    </div>
                </div>
            </form>
        </div>

        <ScrollArea className="flex-1 pr-4">
             <div className="border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Data</TableHead>
                            <TableHead>Horário</TableHead>
                            <TableHead>Motivo</TableHead>
                            <TableHead className="w-[80px]">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow><TableCell colSpan={4}>Carregando...</TableCell></TableRow>
                        ) : blocks?.length === 0 ? (
                            <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">Nenhum bloqueio registrado.</TableCell></TableRow>
                        ) : (
                            blocks?.map((block) => (
                                <TableRow key={block.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                                            {format(new Date(block.start_time), "dd/MM/yyyy", { locale: ptBR })}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {format(new Date(block.start_time), "HH:mm")} - {format(new Date(block.end_time), "HH:mm")}
                                    </TableCell>
                                    <TableCell>{block.reason || "-"}</TableCell>
                                    <TableCell>
                                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(block.id)}>
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
             </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
