import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { N8nIntegration } from '@/types/database';
import { Loader2, Save, Webhook, MessageSquare, CheckCircle, XCircle, Play } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function Integracoes() {
  const { organization } = useAuth();
  const [integration, setIntegration] = useState<N8nIntegration | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

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
      console.error('Error fetching integration:', error);
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
    } catch (error: any) {
      toast.error('Erro ao salvar', { description: error.message });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestConnection = async () => {
    if (!formData.webhook_url) {
      toast.error('Configure a URL do Webhook primeiro');
      return;
    }

    setIsTesting(true);

    try {
      // Simulate a test by sending a test payload
      const response = await fetch(formData.webhook_url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'test',
          message: 'Teste de conexão BarberPro Prime',
          timestamp: new Date().toISOString(),
          organization_id: organization?.id,
        }),
      });

      const success = response.ok;

      // Update the integration with test result
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
        toast.error('Falha no teste de conexão');
      }

      fetchIntegration();
    } catch (error: any) {
      // Update with failed test
      if (integration) {
        await supabase
          .from('n8n_integrations')
          .update({
            last_test_at: new Date().toISOString(),
            last_test_success: false,
          })
          .eq('id', integration.id);
      }

      toast.error('Erro ao testar conexão', { description: error.message });
      fetchIntegration();
    } finally {
      setIsTesting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="max-w-2xl space-y-6">
        {/* n8n Webhook Integration */}
        <Card className="card-gradient border-border/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Webhook className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="font-display">Automação n8n</CardTitle>
                  <CardDescription>Configure webhooks para automações com n8n</CardDescription>
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
                placeholder="https://n8n.exemplo.com/webhook/..."
              />
              <p className="text-xs text-muted-foreground">
                URL do webhook n8n que receberá eventos de agendamentos
              </p>
            </div>

            {integration?.last_test_at && (
              <div className="text-sm text-muted-foreground">
                Último teste: {format(new Date(integration.last_test_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </div>
            )}

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
          </CardContent>
        </Card>

        {/* WhatsApp Integration */}
        <Card className="card-gradient border-border/50">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-success" />
              </div>
              <div>
                <CardTitle className="font-display">WhatsApp</CardTitle>
                <CardDescription>Configure a integração com WhatsApp via n8n</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Instance ID do WhatsApp</Label>
              <Input
                value={formData.whatsapp_instance_id}
                onChange={(e) => setFormData({ ...formData, whatsapp_instance_id: e.target.value })}
                placeholder="Instance ID da sua conexão"
              />
              <p className="text-xs text-muted-foreground">
                ID da instância do WhatsApp configurada no seu servidor de automação
              </p>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-border">
              <div>
                <Label>Integração Ativa</Label>
                <p className="text-xs text-muted-foreground">
                  Ativar envio de notificações automáticas
                </p>
              </div>
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
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
      </div>
    </div>
  );
}
