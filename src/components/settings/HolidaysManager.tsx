import { useState } from "react";
import { useHolidays, HolidayFormData } from "@/hooks/useHolidays";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Plus, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

export function HolidaysManager() {
  const { holidays, isLoading, createHoliday, deleteHoliday } = useHolidays();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [description, setDescription] = useState("");
  const [isClosed, setIsClosed] = useState(true);
  const [openTime, setOpenTime] = useState("09:00");
  const [closeTime, setCloseTime] = useState("13:00");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!date) return;
    
    // Format date as YYYY-MM-DD for database
    const dateStr = format(date, 'yyyy-MM-dd');
    
    createHoliday({
        date: dateStr,
        description,
        is_closed: isClosed,
        open_time: isClosed ? null : openTime,
        close_time: isClosed ? null : closeTime
    });

    setIsDialogOpen(false);
    // Reset form
    setDescription("");
    setIsClosed(true);
  };

  if (isLoading) return <div>Carregando...</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Datas Comemorativas e Feriados</h2>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Adicionar Data
        </Button>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Funcionamento</TableHead>
              <TableHead className="w-[100px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {holidays?.length === 0 ? (
                <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-4">Nenhuma data cadastrada</TableCell>
                </TableRow>
            ) : (
                holidays?.map((holiday) => (
                <TableRow key={holiday.id}>
                    <TableCell className="font-medium">
                        {format(new Date(holiday.date), "dd 'de' MMMM, yyyy", { locale: ptBR })}
                    </TableCell>
                    <TableCell>{holiday.description}</TableCell>
                    <TableCell>
                        {holiday.is_closed ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                Fechado
                            </span>
                        ) : (
                            <span className="text-sm">
                                Aberto: {holiday.open_time?.slice(0, 5)} - {holiday.close_time?.slice(0, 5)}
                            </span>
                        )}
                    </TableCell>
                    <TableCell>
                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteHoliday(holiday.id)}>
                        <Trash2 className="h-4 w-4" />
                    </Button>
                    </TableCell>
                </TableRow>
                ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Data Especial</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            
            <div className="space-y-2 flex flex-col">
              <Label>Data</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP", { locale: ptBR }) : <span>Selecione uma data</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Descrição</Label>
              <Input 
                value={description} 
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ex: Natal, Ano Novo, Folga Coletiva"
                required
              />
            </div>

            <div className="flex items-center space-x-2 py-2">
                <Switch 
                    id="is-closed" 
                    checked={isClosed} 
                    onCheckedChange={setIsClosed} 
                />
                <Label htmlFor="is-closed">Loja Fechada?</Label>
            </div>

            {!isClosed && (
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Abertura</Label>
                        <Input 
                            type="time" 
                            value={openTime}
                            onChange={(e) => setOpenTime(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Fechamento</Label>
                        <Input 
                            type="time" 
                            value={closeTime}
                            onChange={(e) => setCloseTime(e.target.value)}
                        />
                    </div>
                </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
              <Button type="submit">Salvar</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
