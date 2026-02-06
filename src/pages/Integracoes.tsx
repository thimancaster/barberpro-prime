import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { N8nIntegration } from '@/types/database';
import { 
  Loader2, 
  Save, 
  Webhook, 
  MessageSquare, 
  CheckCircle, 
  XCircle, 
  Play,
  ExternalLink,
  Copy,
  Info,
  Zap,
  Send
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNotifications } from '@/hooks/useNotifications';

type WhatsAppProvider = 'n8n' | 'zapi' | 'evolution' | 'custom';

const PROVIDER_INFO: Record<WhatsAppProvider, { name: string; description: string; docsUrl: string }> = {
  n8n: {
    name: 'n8n + Evolution API',
    description: 'Automação completa com n8n e Evolution API (gratuito/self-hosted)',
    docsUrl: 'https://docs.n8n.io/',
  },
  zapi: {
    name: 'Z-API',
    description: 'API WhatsApp brasileira, fácil configuração (~R$70/mês)',
    docsUrl: 'https://developer.z-api.io/',
  },
  evolution: {
    name: 'Evolution API Direto',
    description: 'Conexão direta com Evolution API sem n8n',
    docsUrl: 'https://doc.evolution-api.com/',
  },
  custom: {
    name: 'Webhook Customizado',
    description: 'Qualquer endpoint que receba POST com JSON',
    docsUrl: '',
  },
};

export default function Integracoes() {
  const { organization } = useAuth();
  const { sendNotification } = useNotifications();
  const [integration, setIntegration] = useState<N8nIntegration | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<WhatsAppProvider>('n8n');
  const [testPhone, setTestPhone] = useState('');

  const [formData, setFormData] = useState({
    webhook_url: '',
    whatsapp_instance_id: '',
    is_active: false,
  });

  useEffect(() => {
    if (organization?.id) {
      fetchIntegration();
    }
  }, [organization?.id]);

  const fetchIntegration = async () => {
    if (!organization?.id) return;
    setIsLoading(true);

    try {
      const { data, error } = await supabase
        .from('n8n_integrations')
        .select('*')
        .eq('organization_id', organization.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setIntegration(data);
        setFormData({
          webhook_url: data.webhook_url || '',
          whatsapp_instance_id: data.whatsapp_instance_id || '',
          is_active: data.is_active,
        });
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error fetching integration:', error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!organization?.id) return;

    setIsSaving(true);

    try {
      const integrationData = {
        webhook_url: formData.webhook_url || null,
        whatsapp_instance_id: formData.whatsapp_instance_id || null,
        is_active: formData.is_active,
      };

      if (integration) {
        const { error } = await supabase
          .from('n8n_integrations')
          .update(integrationData)
          .eq('id', integration.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from('n8n_integrations').insert({
          ...integrationData,
          organization_id: organization.id,
        });

        if (error) throw error;
      }

      toast.success('Configurações salvas!');
      fetchIntegration();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      toast.error('Erro ao salvar', { description: errorMessage });
    } finally {
      setIsSaving(false);
    }
  };

  const isValidWebhookUrl = (url: string): { valid: boolean; error?: string } => {
    try {
      const parsedUrl = new URL(url);
      
      if (parsedUrl.protocol !== 'https:' && parsedUrl.protocol !== 'http:') {
        return { valid: false, error: 'URL deve usar protocolo HTTP ou HTTPS' };
      }
      
      const hostname = parsedUrl.hostname.toLowerCase();
      
      if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1') {
        return { valid: false, error: 'URLs locais não são permitidas' };
      }
      
      const ipv4Match = hostname.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
      if (ipv4Match) {
        const [, a, b, c] = ipv4Match.map(Number);
        if (a === 10) {
          return { valid: false, error: 'IPs de rede privada não são permitidos' };
        }
        if (a === 172 && b >= 16 && b <= 31) {
          return { valid: false, error: 'IPs de rede privada não são permitidos' };
        }
        if (a === 192 && b === 168) {
          return { valid: false, error: 'IPs de rede privada não são permitidos' };
        }
        if (a === 169 && b === 254) {
          return { valid: false, error: 'IPs link-local não são permitidos' };
        }
      }
      
      if (hostname.endsWith('.local') || hostname.endsWith('.internal') || hostname.endsWith('.lan')) {
        return { valid: false, error: 'Hostnames internos não são permitidos' };
      }
      
      return { valid: true };
    } catch {
      return { valid: false, error: 'URL inválida' };
    }
  };

  const handleTestConnection = async () => {
    if (!formData.webhook_url) {
      toast.error('Configure a URL do Webhook primeiro');
      return;
    }

    const validation = isValidWebhookUrl(formData.webhook_url);
    if (!validation.valid) {
      toast.error('URL inválida', { description: validation.error });
      return;
    }

    setIsTesting(true);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(formData.webhook_url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'test',
          message: 'Teste de conexão BarberPro Prime',
          timestamp: new Date().toISOString(),
          test_id: crypto.randomUUID(),
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const success = response.ok;

      if (integration) {
        await supabase
          .from('n8n_integrations')
          .update({
            last_test_at: new Date().toISOString(),
            last_test_success: success,
          })
          .eq('id', integration.id);
      }

      if (success) {
        toast.success('Conexão testada com sucesso!');
      } else {
        toast.error('Falha no teste de conexão', { 
          description: `Status: ${response.status}` 
        });
      }

      fetchIntegration();
    } catch (error: unknown) {
      if (integration) {
        await supabase
          .from('n8n_integrations')
          .update({
            last_test_at: new Date().toISOString(),
            last_test_success: false,
          })
          .eq('id', integration.id);
      }

      const errorMessage = error instanceof Error 
        ? (error.name === 'AbortError' ? 'Tempo limite excedido (10s)' : error.message)
        : 'Erro desconhecido';

      toast.error('Erro ao testar conexão', { description: errorMessage });
      fetchIntegration();
    } finally {
      setIsTesting(false);
    }
  };

  const handleSendTestMessage = async () => {
    if (!testPhone) {
      toast.error('Digite um número de telefone para teste');
      return;
    }

    if (!formData.is_active) {
      toast.error('Ative a integração primeiro');
      return;
    }

    setIsSendingTest(true);

    try {
      const result = await sendNotification({
        trigger: 'appointment_created',
        customMessage: `🧪 Mensagem de teste do BarberPro Prime!\n\nSe você está recebendo isso, sua integração WhatsApp está funcionando corretamente.\n\nData: ${new Date().toLocaleString('pt-BR')}`,
      });

      if (result.success) {
        toast.success('Mensagem de teste enviada!', {
          description: 'Verifique seu WhatsApp',
        });
      } else {
        toast.error('Falha ao enviar', { description: result.error });
      }
    } catch (error) {
      toast.error('Erro ao enviar mensagem de teste');
    } finally {
      setIsSendingTest(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copiado!');
  };

  const webhookPayloadExample = `{
  "type": "notification",
  "trigger": "appointment_created",
  "organization_id": "uuid",
  "phone_number": "5511999999999",
  "message": "Olá João! Seu agendamento...",
  "client_name": "João Silva",
  "service_name": "Corte de Cabelo",
  "barber_name": "Carlos",
  "appointment_time": "14:00",
  "appointment_date": "15/01/2025",
  "notification_log_id": "uuid"
}`;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">Integrações</h1>
        <p className="text-muted-foreground">Configure WhatsApp e automações para notificações</p>
      </div>

      <Tabs defaultValue="setup" className="space-y-4">
        <TabsList>
          <TabsTrigger value="setup" className="gap-2">
            <Webhook className="w-4 h-4" />
            Configuração
          </TabsTrigger>
          <TabsTrigger value="docs" className="gap-2">
            <Info className="w-4 h-4" />
            Documentação
          </TabsTrigger>
          <TabsTrigger value="test" className="gap-2">
            <Send className="w-4 h-4" />
            Testar
          </TabsTrigger>
        </TabsList>

        <TabsContent value="setup" className="space-y-4">
          {/* Provider Selection */}
          <Card className="card-gradient border-border/50">
            <CardHeader>
              <CardTitle className="font-display">Escolha o Provedor</CardTitle>
              <CardDescription>Selecione como deseja enviar mensagens WhatsApp</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select value={selectedProvider} onValueChange={(v) => setSelectedProvider(v as WhatsAppProvider)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PROVIDER_INFO).map(([key, info]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex flex-col">
                        <span>{info.name}</span>
                        <span className="text-xs text-muted-foreground">{info.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {PROVIDER_INFO[selectedProvider].docsUrl && (
                <Button variant="link" asChild className="p-0 h-auto">
                  <a href={PROVIDER_INFO[selectedProvider].docsUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1">
                    <ExternalLink className="w-3 h-3" />
                    Ver documentação do {PROVIDER_INFO[selectedProvider].name}
                  </a>
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Webhook Configuration */}
          <Card className="card-gradient border-border/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Webhook className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="font-display">Webhook de Notificações</CardTitle>
                    <CardDescription>URL que receberá os eventos de notificação</CardDescription>
                  </div>
                </div>
                {integration?.last_test_at && (
                  <Badge variant={integration.last_test_success ? 'default' : 'destructive'} className="gap-1">
                    {integration.last_test_success ? (
                      <CheckCircle className="w-3 h-3" />
                    ) : (
                      <XCircle className="w-3 h-3" />
                    )}
                    {integration.last_test_success ? 'Conectado' : 'Falha'}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>URL do Webhook</Label>
                <Input
                  value={formData.webhook_url}
                  onChange={(e) => setFormData({ ...formData, webhook_url: e.target.value })}
                  placeholder={
                    selectedProvider === 'n8n' 
                      ? 'https://seu-n8n.com/webhook/barberpro'
                      : selectedProvider === 'zapi'
                      ? 'https://api.z-api.io/instances/{instance}/token/{token}/send-text'
                      : 'https://seu-servidor.com/api/whatsapp'
                  }
                />
              </div>

              {selectedProvider !== 'custom' && (
                <div className="space-y-2">
                  <Label>Instance ID / API Key</Label>
                  <Input
                    value={formData.whatsapp_instance_id}
                    onChange={(e) => setFormData({ ...formData, whatsapp_instance_id: e.target.value })}
                    placeholder="ID da instância ou chave de API"
                    type="password"
                  />
                  <p className="text-xs text-muted-foreground">
                    {selectedProvider === 'zapi' && 'Encontre no painel Z-API > Sua Instância > Token'}
                    {selectedProvider === 'evolution' && 'Chave da API Evolution configurada no servidor'}
                    {selectedProvider === 'n8n' && 'Opcional: ID para identificar a instância WhatsApp no n8n'}
                  </p>
                </div>
              )}

              {integration?.last_test_at && (
                <p className="text-sm text-muted-foreground">
                  Último teste: {format(new Date(integration.last_test_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </p>
              )}

              <div className="flex gap-2">
                <Button variant="outline" onClick={handleTestConnection} disabled={isTesting} className="gap-2">
                  {isTesting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Testando...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" />
                      Testar Conexão
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Activation */}
          <Card className="card-gradient border-border/50">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-success" />
                </div>
                <div>
                  <CardTitle className="font-display">Ativar Notificações</CardTitle>
                  <CardDescription>Habilite o envio automático de mensagens</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Integração Ativa</p>
                  <p className="text-sm text-muted-foreground">
                    Quando ativo, mensagens serão enviadas automaticamente
                  </p>
                </div>
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
              </div>
            </CardContent>
          </Card>

          <Button onClick={handleSave} disabled={isSaving} className="gap-2">
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Salvar Configurações
              </>
            )}
          </Button>
        </TabsContent>

        <TabsContent value="docs" className="space-y-4">
          <Card className="card-gradient border-border/50">
            <CardHeader>
              <CardTitle className="font-display">Como Funciona</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                O BarberPro Prime envia notificações via webhook POST para a URL configurada. 
                Seu servidor (n8n, Z-API, etc.) recebe o payload e envia a mensagem para o WhatsApp do cliente.
              </p>

              <div className="rounded-lg border border-border p-4 bg-muted/50">
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-sm font-medium">Exemplo de Payload</Label>
                  <Button variant="ghost" size="sm" onClick={() => copyToClipboard(webhookPayloadExample)} className="gap-1">
                    <Copy className="w-3 h-3" />
                    Copiar
                  </Button>
                </div>
                <pre className="text-xs overflow-x-auto bg-background rounded p-2">
                  {webhookPayloadExample}
                </pre>
              </div>
            </CardContent>
          </Card>

          <Accordion type="single" collapsible className="space-y-2">
            <AccordionItem value="n8n" className="border rounded-lg px-4">
              <AccordionTrigger>
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-warning" />
                  Configurar com n8n
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-3 text-sm">
                <p><strong>Passo 1:</strong> Crie uma instância n8n (n8n.io cloud ou self-hosted)</p>
                <p><strong>Passo 2:</strong> Instale a Evolution API (para WhatsApp gratuito)</p>
                <p><strong>Passo 3:</strong> No n8n, crie um workflow com:</p>
                <ul className="list-disc list-inside ml-4 space-y-1 text-muted-foreground">
                  <li>Trigger: Webhook (POST)</li>
                  <li>Ação: Evolution API - Send Text Message</li>
                  <li>Configure o número: {'{{$json.phone_number}}'}</li>
                  <li>Configure a mensagem: {'{{$json.message}}'}</li>
                </ul>
                <p><strong>Passo 4:</strong> Copie a URL do Webhook e cole aqui</p>
                <Button variant="outline" size="sm" asChild>
                  <a href="https://n8n.io" target="_blank" rel="noopener noreferrer" className="gap-1">
                    <ExternalLink className="w-3 h-3" />
                    Acessar n8n
                  </a>
                </Button>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="zapi" className="border rounded-lg px-4">
              <AccordionTrigger>
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-success" />
                  Configurar com Z-API
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-3 text-sm">
                <p><strong>Passo 1:</strong> Crie uma conta em z-api.io</p>
                <p><strong>Passo 2:</strong> Crie uma instância e conecte seu WhatsApp</p>
                <p><strong>Passo 3:</strong> Copie o Token da instância</p>
                <p><strong>Passo 4:</strong> Use a URL no formato:</p>
                <code className="block bg-muted p-2 rounded text-xs">
                  https://api.z-api.io/instances/SUA_INSTANCIA/token/SEU_TOKEN/send-text
                </code>
                <p className="text-muted-foreground">
                  <strong>Nota:</strong> A Z-API cobra ~R$70/mês por instância
                </p>
                <Button variant="outline" size="sm" asChild>
                  <a href="https://z-api.io" target="_blank" rel="noopener noreferrer" className="gap-1">
                    <ExternalLink className="w-3 h-3" />
                    Acessar Z-API
                  </a>
                </Button>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="evolution" className="border rounded-lg px-4">
              <AccordionTrigger>
                <div className="flex items-center gap-2">
                  <Webhook className="w-4 h-4 text-primary" />
                  Configurar Evolution API Direto
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-3 text-sm">
                <p><strong>Passo 1:</strong> Instale a Evolution API em um servidor (Docker recomendado)</p>
                <p><strong>Passo 2:</strong> Crie uma instância e conecte seu WhatsApp</p>
                <p><strong>Passo 3:</strong> Use a URL no formato:</p>
                <code className="block bg-muted p-2 rounded text-xs">
                  https://seu-servidor.com/message/sendText/sua-instancia
                </code>
                <p><strong>Passo 4:</strong> Cole a API Key no campo Instance ID</p>
                <p className="text-muted-foreground">
                  <strong>Vantagem:</strong> Gratuito e open-source
                </p>
                <Button variant="outline" size="sm" asChild>
                  <a href="https://doc.evolution-api.com/" target="_blank" rel="noopener noreferrer" className="gap-1">
                    <ExternalLink className="w-3 h-3" />
                    Documentação Evolution
                  </a>
                </Button>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </TabsContent>

        <TabsContent value="test" className="space-y-4">
          <Card className="card-gradient border-border/50">
            <CardHeader>
              <CardTitle className="font-display">Enviar Mensagem de Teste</CardTitle>
              <CardDescription>
                Teste a integração enviando uma mensagem real
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!formData.is_active && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-warning/10 text-warning border border-warning/20">
                  <Info className="w-4 h-4" />
                  <span className="text-sm">Ative a integração na aba "Configuração" primeiro</span>
                </div>
              )}

              <div className="space-y-2">
                <Label>Número de Telefone para Teste</Label>
                <Input
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                  placeholder="5511999999999"
                  disabled={!formData.is_active}
                />
                <p className="text-xs text-muted-foreground">
                  Formato: código do país + DDD + número (sem espaços ou caracteres especiais)
                </p>
              </div>

              <Button 
                onClick={handleSendTestMessage} 
                disabled={isSendingTest || !formData.is_active}
                className="gap-2"
              >
                {isSendingTest ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Enviar Mensagem de Teste
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          <Card className="card-gradient border-border/50">
            <CardHeader>
              <CardTitle className="text-base">Checklist de Verificação</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  {formData.webhook_url ? (
                    <CheckCircle className="w-4 h-4 text-success" />
                  ) : (
                    <XCircle className="w-4 h-4 text-muted-foreground" />
                  )}
                  URL do Webhook configurada
                </li>
                <li className="flex items-center gap-2">
                  {integration?.last_test_success ? (
                    <CheckCircle className="w-4 h-4 text-success" />
                  ) : (
                    <XCircle className="w-4 h-4 text-muted-foreground" />
                  )}
                  Teste de conexão bem-sucedido
                </li>
                <li className="flex items-center gap-2">
                  {formData.is_active ? (
                    <CheckCircle className="w-4 h-4 text-success" />
                  ) : (
                    <XCircle className="w-4 h-4 text-muted-foreground" />
                  )}
                  Integração ativada
                </li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
