import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { Textarea } from "@/components/ui/textarea";
import { Product, useProducts } from "@/hooks/useProducts";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  description: z.string().optional(),
  price: z.coerce.number().min(0, "Preço deve ser positivo"),
  stock_quantity: z.coerce.number().int().min(0, "Estoque deve ser positivo"),
});

interface ProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productToEdit?: Product;
}

export function ProductDialog({ open, onOpenChange, productToEdit }: ProductDialogProps) {
  const { createProduct, updateProduct } = useProducts();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      stock_quantity: 0,
    },
  });

  useEffect(() => {
    if (productToEdit) {
      form.reset({
        name: productToEdit.name,
        description: productToEdit.description || "",
        price: productToEdit.price,
        stock_quantity: productToEdit.stock_quantity,
      });
    } else {
      form.reset({
        name: "",
        description: "",
        price: 0,
        stock_quantity: 0,
      });
    }
  }, [productToEdit, open, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      if (productToEdit) {
        await updateProduct.mutateAsync({
          id: productToEdit.id,
          ...values,
        });
        toast({ title: "Produto atualizado com sucesso!" });
      } else {
        await createProduct.mutateAsync({
          name: values.name,
          description: values.description,
          price: values.price,
          stock_quantity: values.stock_quantity,
        });
        toast({ title: "Produto criado com sucesso!" });
      }
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Erro ao salvar produto",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {productToEdit ? "Editar Produto" : "Novo Produto"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Shampoo" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Detalhes do produto" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preço (R$)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="stock_quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estoque</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                {productToEdit ? "Salvar Alterações" : "Criar Produto"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
