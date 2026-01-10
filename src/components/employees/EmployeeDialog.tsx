import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Employee, useEmployees } from "@/hooks/useEmployees";
import { useRoles } from "@/hooks/useRoles";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  email: z.string().email("Email inválido"),
  role: z.string().min(1, "Função é obrigatória"),
});

interface EmployeeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employeeToEdit?: Employee;
}

export function EmployeeDialog({ open, onOpenChange, employeeToEdit }: EmployeeDialogProps) {
  const { createEmployee, updateEmployee } = useEmployees();
  const { roles } = useRoles();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      role: "barber",
    },
  });

  useEffect(() => {
    if (employeeToEdit) {
      form.reset({
        name: employeeToEdit.name,
        email: employeeToEdit.email,
        role: employeeToEdit.role || "barber",
      });
    } else {
      form.reset({
        name: "",
        email: "",
        role: "barber",
      });
    }
  }, [employeeToEdit, open, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      if (employeeToEdit) {
        await updateEmployee.mutateAsync({
          id: employeeToEdit.id,
          ...values,
        });
        toast({ title: "Funcionário atualizado com sucesso!" });
      } else {
        await createEmployee.mutateAsync({
          name: values.name,
          email: values.email,
          role: values.role,
        });
        toast({ 
            title: "Funcionário cadastrado!",
            description: "Nota: Isso cria apenas o perfil. O usuário real precisa ser criado via Autenticação." 
        });
      }
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Erro ao salvar funcionário",
        description: "Verifique se o email já existe ou tente novamente.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {employeeToEdit ? "Editar Funcionário" : "Novo Funcionário"}
          </DialogTitle>
          {!employeeToEdit && (
              <DialogDescription>
                  Cadastre um novo membro da equipe.
              </DialogDescription>
          )}
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome Completo</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Ana Souza" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="email@exemplo.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Função</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a função" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {roles?.map((role) => (
                        <SelectItem key={role.id} value={role.name}>
                          {role.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                {employeeToEdit ? "Salvar Alterações" : "Cadastrar"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
