import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, Users, UserCircle, CalendarClock } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useEmployees, Employee } from "@/hooks/useEmployees";
import { EmployeeDialog } from "@/components/employees/EmployeeDialog";
import { WorkScheduleDialog } from "@/components/employees/WorkScheduleDialog";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function Employees() {
  const { employees, isLoading, deleteEmployee } = useEmployees();
  const { toast } = useToast();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [employeeToEdit, setEmployeeToEdit] = useState<Employee | undefined>(undefined);
  const [employeeToSchedule, setEmployeeToSchedule] = useState<Employee | null>(null);
  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null);

  const handleEdit = (employee: Employee) => {
    setEmployeeToEdit(employee);
    setIsDialogOpen(true);
  };

  const handleSchedule = (employee: Employee) => {
      setEmployeeToSchedule(employee);
      setIsScheduleOpen(true);
  };

  const handleDelete = async () => {
    if (employeeToDelete) {
      try {
        await deleteEmployee.mutateAsync(employeeToDelete.id);
        toast({ title: "Funcionário excluído com sucesso" });
      } catch (error) {
        toast({
          title: "Erro ao excluir funcionário",
          variant: "destructive",
        });
      } finally {
        setEmployeeToDelete(null);
      }
    }
  };

  const handleCreate = () => {
    setEmployeeToEdit(undefined);
    setIsDialogOpen(true);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Funcionários</h1>
            <p className="text-muted-foreground">
              Gerencie a equipe e os profissionais da barbearia.
            </p>
          </div>
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Funcionário
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Membros</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{employees?.length || 0}</div>
            </CardContent>
          </Card>
        </div>

        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Avatar</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Função</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Data de Cadastro</TableHead>
                <TableHead className="w-[100px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-4">
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : employees?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                    Nenhum funcionário cadastrado.
                  </TableCell>
                </TableRow>
              ) : (
                employees?.map((employee) => (
                  <TableRow key={employee.id}>
                    <TableCell>
                        <Avatar>
                            <AvatarImage src={employee.avatar_url || ''} />
                            <AvatarFallback>{getInitials(employee.name)}</AvatarFallback>
                        </Avatar>
                    </TableCell>
                    <TableCell className="font-medium">{employee.name}</TableCell>
                    <TableCell className="capitalize">
                        {employee.role === 'barber' ? 'Barbeiro' : 
                         employee.role === 'manager' ? 'Gerente' : 
                         employee.role === 'receptionist' ? 'Recepcionista' :
                         employee.role || 'Barbeiro'}
                    </TableCell>
                    <TableCell>{employee.email}</TableCell>
                    <TableCell>
                        {new Date(employee.created_at).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                         <Button
                          variant="ghost"
                          size="icon"
                          title="Expediente"
                          onClick={() => handleSchedule(employee)}
                        >
                          <CalendarClock className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(employee)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-500 hover:text-red-600"
                          onClick={() => setEmployeeToDelete(employee)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <EmployeeDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          employeeToEdit={employeeToEdit}
        />
        
        <WorkScheduleDialog 
            open={isScheduleOpen}
            onOpenChange={setIsScheduleOpen}
            employee={employeeToSchedule}
        />

        <AlertDialog open={!!employeeToDelete} onOpenChange={() => setEmployeeToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir Funcionário?</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja remover "{employeeToDelete?.name}"? 
                Isso pode afetar históricos de comissões e agendamentos.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                className="bg-red-500 hover:bg-red-600"
                onClick={handleDelete}
              >
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AppLayout>
  );
}
