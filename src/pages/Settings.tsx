import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useState } from 'react';
import { Loader2, Webhook, Key, Users, User, CalendarDays } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RolesManager } from "@/components/settings/RolesManager";
import { HolidaysManager } from "@/components/settings/HolidaysManager";

export default function Settings() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState('');

  const handleUpdateProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!profile) return;

    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;

    setLoading(true);
    const { error } = await supabase
      .from('profiles')
      .update({ name })
      .eq('id', profile.id);
    setLoading(false);

    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Perfil atualizado' });
    }
  };

  const webhookEndpoint = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/webhook-whatsapp`;

  return (
    <AppLayout>
      <div className="p-6 space-y-6 max-w-4xl">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Configurações</h1>
          <p className="text-muted-foreground">Gerencie seu perfil, equipe e integrações</p>
        </div>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="general">Geral</TabsTrigger>
            <TabsTrigger value="roles">Funções</TabsTrigger>
            <TabsTrigger value="holidays">Feriados</TabsTrigger>
            <TabsTrigger value="integrations">Integrações</TabsTrigger>
          </TabsList>
          
          <TabsContent value="general" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Perfil
                </CardTitle>
                <CardDescription>Atualize suas informações</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome</Label>
                    <Input
                      id="name"
                      name="name"
                      defaultValue={profile?.name}
                      placeholder="Seu nome"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input value={profile?.email} disabled className="bg-muted" />
                  </div>
                  <Button type="submit" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Salvar
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="roles" className="space-y-4">
             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Funções do Sistema
                    </CardTitle>
                    <CardDescription>
                        Defina os cargos e funções disponíveis para sua equipe.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <RolesManager />
                </CardContent>
             </Card>
          </TabsContent>

          <TabsContent value="holidays" className="space-y-4">
             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <CalendarDays className="h-5 w-5" />
                        Feriados e Datas Especiais
                    </CardTitle>
                    <CardDescription>
                        Configure os dias em que a barbearia estará fechada ou terá horário reduzido.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <HolidaysManager />
                </CardContent>
             </Card>
          </TabsContent>

          <TabsContent value="integrations" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Webhook className="h-5 w-5" />
                  Integração WhatsApp
                </CardTitle>
                <CardDescription>
                  Configure sua API de WhatsApp para receber mensagens
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>URL do Webhook (receber mensagens)</Label>
                  <div className="flex gap-2">
                    <Input
                      value={webhookEndpoint}
                      readOnly
                      className="font-mono text-sm"
                    />
                    <Button
                      variant="outline"
                      onClick={() => {
                        navigator.clipboard.writeText(webhookEndpoint);
                        toast({ title: 'URL copiada!' });
                      }}
                    >
                      Copiar
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Configure esta URL na sua API de WhatsApp para enviar mensagens recebidas.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="webhook-send">URL da sua API (enviar mensagens)</Label>
                  <Input
                    id="webhook-send"
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                    placeholder="https://sua-api.com/send"
                  />
                  <p className="text-xs text-muted-foreground">
                    URL que o CRM usará para enviar mensagens de volta ao WhatsApp.
                  </p>
                </div>

                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-medium text-sm mb-2">Formato esperado (Webhook de entrada)</h4>
                  <pre className="text-xs overflow-auto">
{`POST ${webhookEndpoint}
{
  "from": "+5511999999999",
  "message": "Olá, quero saber mais!",
  "external_id": "whatsapp_message_id"
}`}
                  </pre>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  Motor de IA
                </CardTitle>
                <CardDescription>
                  O CRM usa IA para processar mensagens automaticamente
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  O motor de IA está configurado e pronto para uso. Ele extrai dados automaticamente 
                  das conversas, classifica leads no pipeline e sugere tarefas de acompanhamento.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
