import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Bell, 
  MessageSquare, 
  CheckCircle2, 
  XCircle,
  Clock,
  Send,
  RefreshCw,
  Loader2,
  Plus,
  Edit,
  Info
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { 
  NotificationTemplate, 
  NotificationLog, 
  NotificationTrigger,
  NOTIFICATION_TRIGGER_LABELS,
  NOTIFICATION_STATUS_LABELS 
} from '@/types/phases';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

const DEFAULT_TEMPLATES: Record<NotificationTrigger, { name: string; message: string }> = {
  appointment_created: {
    name: 'Agendamento Criado',
    message: 'Olá {{client_name}}! Seu agendamento para {{service_name}} foi confirmado para {{appointment_date}} às {{appointment_time}} com {{barber_name}}. {{organization_name}} aguarda você!',
  },
  appointment_confirmed: {
    name: 'Agendamento Confirmado',
    message: 'Oi {{client_name}}! Confirmamos seu agendamento para {{service_name}} dia {{appointment_date}} às {{appointment_time}}. Até lá!',
  },
  appointment_reminder_1h: {
    name: 'Lembrete 1h Antes',
    message: '⏰ {{client_name}}, seu agendamento é em 1 hora! {{service_name}} às {{appointment_time}} com {{barber_name}}. Até já!',
  },
  appointment_reminder_24h: {
    name: 'Lembrete 24h Antes',
    message: '📅 Olá {{client_name}}! Amanhã você tem {{service_name}} às {{appointment_time}} com {{barber_name}} na {{organization_name}}. Confirma presença?',
  },
  appointment_completed: {
    name: 'Atendimento Concluído',
    message: 'Obrigado pela visita, {{client_name}}! Esperamos que tenha gostado. Volte sempre à {{organization_name}}! 💈',
  },
  review_request: {
    name: 'Solicitação de Avaliação',
    message: '⭐ {{client_name}}, como foi sua experiência com {{barber_name}}? Avalie-nos e ajude outros clientes!',
  },
  loyalty_points_earned: {
    name: 'Pontos de Fidelidade',
    message: '🎉 {{client_name}}, você ganhou pontos de fidelidade! Continue acumulando e troque por prêmios na {{organization_name}}!',
  },
  birthday: {
    name: 'Aniversário',
    message: '🎂 Feliz Aniversário, {{client_name}}! A {{organization_name}} deseja um dia incrível. Venha comemorar com a gente e ganhe um desconto especial!',
  },
};

const TEMPLATE_VARIABLES = [
  { variable: '{{client_name}}', description: 'Nome do cliente' },
  { variable: '{{service_name}}', description: 'Nome do serviço' },
  { variable: '{{barber_name}}', description: 'Nome do profissional' },
  { variable: '{{appointment_time}}', description: 'Horário do agendamento' },
  { variable: '{{appointment_date}}', description: 'Data do agendamento' },
  { variable: '{{organization_name}}', description: 'Nome da barbearia' },
  { variable: '{{organization_phone}}', description: 'Telefone da barbearia' },
  { variable: '{{price}}', description: 'Valor do serviço' },
];

export default function Notificacoes() {
  const { organization } = useAuth();
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<NotificationTemplate | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isCreatingDefaults, setIsCreatingDefaults] = useState(false);

  const [formData, setFormData] = useState({
    trigger: '' as NotificationTrigger | '',
    name: '',
    message_template: '',
    is_active: true,
    send_via_whatsapp: true,
  });

  useEffect(() => {
    if (organization?.id) {
      fetchData();
    }
  }, [organization?.id]);

  const fetchData = async () => {
    if (!organization?.id) return;

    try {
      // Buscar templates
      const { data: templatesData } = await supabase
        .from('notification_templates')
        .select('*')
        .eq('organization_id', organization.id)
        .order('trigger');

      setTemplates(templatesData as NotificationTemplate[] || []);

      // Buscar logs
      const { data: logsData } = await supabase
        .from('notification_logs')
        .select('*')
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false })
        .limit(100);

      setLogs(logsData as NotificationLog[] || []);
    } catch (error) {
      toast.error('Erro ao carregar notificações');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateDefaultTemplates = async () => {
    if (!organization?.id) return;

    setIsCreatingDefaults(true);

    try {
      const existingTriggers = templates.map(t => t.trigger);
      const newTemplates = Object.entries(DEFAULT_TEMPLATES)
        .filter(([trigger]) => !existingTriggers.includes(trigger as NotificationTrigger))
        .map(([trigger, data]) => ({
          organization_id: organization.id,
          trigger: trigger as NotificationTrigger,
          name: data.name,
          message_template: data.message,
          is_active: true,
          send_via_whatsapp: true,
        }));

      if (newTemplates.length === 0) {
        toast.info('Todos os templates já existem');
        return;
      }

      const { error } = await supabase
        .from('notification_templates')
        .insert(newTemplates);

      if (error) throw error;

      toast.success(`${newTemplates.length} templates criados!`);
      fetchData();
    } catch (error) {
      toast.error('Erro ao criar templates');
    } finally {
      setIsCreatingDefaults(false);
    }
  };

  const handleToggleTemplate = async (template: NotificationTemplate) => {
    try {
      const { error } = await supabase
        .from('notification_templates')
        .update({ is_active: !template.is_active })
        .eq('id', template.id);

      if (error) throw error;

      setTemplates(templates.map(t =>
        t.id === template.id ? { ...t, is_active: !t.is_active } : t
      ));

      toast.success(template.is_active ? 'Template desativado' : 'Template ativado');
    } catch (error) {
      toast.error('Erro ao atualizar template');
    }
  };

  const handleEditTemplate = (template: NotificationTemplate) => {
    setEditingTemplate(template);
    setFormData({
      trigger: template.trigger as NotificationTrigger,
      name: template.name,
      message_template: template.message_template,
      is_active: template.is_active,
      send_via_whatsapp: template.send_via_whatsapp,
    });
    setIsDialogOpen(true);
  };

  const handleNewTemplate = () => {
    setEditingTemplate(null);
    setFormData({
      trigger: '',
      name: '',
      message_template: '',
      is_active: true,
      send_via_whatsapp: true,
    });
    setIsDialogOpen(true);
  };

  const handleSaveTemplate = async () => {
    if (!organization?.id || !formData.trigger || !formData.name || !formData.message_template) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    setIsSaving(true);

    try {
      const templateData = {
        trigger: formData.trigger as NotificationTrigger,
        name: formData.name,
        message_template: formData.message_template,
        is_active: formData.is_active,
        send_via_whatsapp: formData.send_via_whatsapp,
      };

      if (editingTemplate) {
        const { error } = await supabase
          .from('notification_templates')
          .update(templateData)
          .eq('id', editingTemplate.id);

        if (error) throw error;
        toast.success('Template atualizado!');
      } else {
        // Check if trigger already exists
        const existingTrigger = templates.find(t => t.trigger === formData.trigger);
        if (existingTrigger) {
          toast.error('Já existe um template para este gatilho');
          setIsSaving(false);
          return;
        }

        const { error } = await supabase
          .from('notification_templates')
          .insert({
            ...templateData,
            organization_id: organization.id,
          });

        if (error) throw error;
        toast.success('Template criado!');
      }

      setIsDialogOpen(false);
      fetchData();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      toast.error('Erro ao salvar template', { description: errorMessage });
    } finally {
      setIsSaving(false);
    }
  };

  const insertVariable = (variable: string) => {
    setFormData(prev => ({
      ...prev,
      message_template: prev.message_template + variable,
    }));
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ComponentType<{ className?: string }> }> = {
      pending: { variant: 'secondary', icon: Clock },
      sent: { variant: 'default', icon: Send },
      delivered: { variant: 'default', icon: CheckCircle2 },
      failed: { variant: 'destructive', icon: XCircle },
      read: { variant: 'outline', icon: CheckCircle2 },
    };
    const conf = config[status] || config.pending;
    const Icon = conf.icon;

    return (
      <Badge variant={conf.variant} className="gap-1">
        <Icon className="w-3 h-3" />
        {NOTIFICATION_STATUS_LABELS[status as keyof typeof NOTIFICATION_STATUS_LABELS] || status}
      </Badge>
    );
  };

  const filteredLogs = selectedStatus === 'all'
    ? logs
    : logs.filter(log => log.status === selectedStatus);

  const stats = {
    total: logs.length,
    sent: logs.filter(l => l.status === 'sent' || l.status === 'delivered').length,
    failed: logs.filter(l => l.status === 'failed').length,
    pending: logs.filter(l => l.status === 'pending').length,
  };

  // Get available triggers (not yet used)
  const availableTriggers = Object.keys(NOTIFICATION_TRIGGER_LABELS).filter(
    trigger => !templates.some(t => t.trigger === trigger) || editingTemplate?.trigger === trigger
  ) as NotificationTrigger[];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Central de Notificações</h1>
          <p className="text-muted-foreground">Gerencie templates e histórico de mensagens WhatsApp</p>
        </div>
        <Button variant="outline" onClick={fetchData} className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Atualizar
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="card-gradient border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Enviadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card className="card-gradient border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Entregues
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{stats.sent}</div>
          </CardContent>
        </Card>
        <Card className="card-gradient border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Falhas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats.failed}</div>
          </CardContent>
        </Card>
        <Card className="card-gradient border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pendentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{stats.pending}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="templates">
        <TabsList>
          <TabsTrigger value="templates" className="gap-2">
            <Bell className="w-4 h-4" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <MessageSquare className="w-4 h-4" />
            Histórico
          </TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="mt-4 space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              Configure as mensagens automáticas para cada evento
            </p>
            <div className="flex gap-2">
              {templates.length < Object.keys(DEFAULT_TEMPLATES).length && (
                <Button 
                  variant="outline" 
                  onClick={handleCreateDefaultTemplates}
                  disabled={isCreatingDefaults}
                  className="gap-2"
                >
                  {isCreatingDefaults ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  Criar Templates Padrão
                </Button>
              )}
              <Button onClick={handleNewTemplate} className="gap-2">
                <Plus className="w-4 h-4" />
                Novo Template
              </Button>
            </div>
          </div>

          <Card className="card-gradient border-border/50">
            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : templates.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Bell className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Nenhum template configurado</p>
                  <Button
                    variant="link"
                    className="mt-2 text-primary"
                    onClick={handleCreateDefaultTemplates}
                  >
                    Criar templates padrão
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Gatilho</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>WhatsApp</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {templates.map((template) => (
                      <TableRow key={template.id}>
                        <TableCell>
                          <Badge variant="outline">
                            {NOTIFICATION_TRIGGER_LABELS[template.trigger as NotificationTrigger] || template.trigger}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">{template.name}</TableCell>
                        <TableCell>
                          {template.send_via_whatsapp ? (
                            <CheckCircle2 className="w-4 h-4 text-success" />
                          ) : (
                            <XCircle className="w-4 h-4 text-muted-foreground" />
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={template.is_active ? 'default' : 'secondary'}>
                            {template.is_active ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditTemplate(template)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleToggleTemplate(template)}
                            >
                              {template.is_active ? 'Desativar' : 'Ativar'}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="mt-4 space-y-4">
          <div className="flex items-center gap-4">
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pending">Pendentes</SelectItem>
                <SelectItem value="sent">Enviados</SelectItem>
                <SelectItem value="delivered">Entregues</SelectItem>
                <SelectItem value="failed">Falhas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Card className="card-gradient border-border/50">
            <CardContent className="p-0">
              {filteredLogs.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Nenhuma notificação encontrada</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Telefone</TableHead>
                      <TableHead>Mensagem</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="text-sm text-muted-foreground">
                          {format(new Date(log.created_at), "dd/MM HH:mm", { locale: ptBR })}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {NOTIFICATION_TRIGGER_LABELS[log.trigger as NotificationTrigger] || log.trigger}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {log.phone_number || '-'}
                        </TableCell>
                        <TableCell className="max-w-[300px] truncate text-sm">
                          {log.message_content}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(log.status)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Template Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-display">
              {editingTemplate ? 'Editar Template' : 'Novo Template'}
            </DialogTitle>
            <DialogDescription>
              Configure a mensagem que será enviada automaticamente
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Gatilho *</Label>
                <Select
                  value={formData.trigger}
                  onValueChange={(v) => {
                    setFormData({ 
                      ...formData, 
                      trigger: v as NotificationTrigger,
                      name: formData.name || DEFAULT_TEMPLATES[v as NotificationTrigger]?.name || '',
                      message_template: formData.message_template || DEFAULT_TEMPLATES[v as NotificationTrigger]?.message || '',
                    });
                  }}
                  disabled={!!editingTemplate}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o evento" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTriggers.map((trigger) => (
                      <SelectItem key={trigger} value={trigger}>
                        {NOTIFICATION_TRIGGER_LABELS[trigger]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Nome *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Confirmação de Agendamento"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Mensagem *</Label>
              <Textarea
                value={formData.message_template}
                onChange={(e) => setFormData({ ...formData, message_template: e.target.value })}
                placeholder="Digite a mensagem..."
                rows={4}
              />
            </div>

            {/* Variables Helper */}
            <Card className="bg-muted/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Info className="w-4 h-4" />
                  Variáveis Disponíveis
                </CardTitle>
                <CardDescription className="text-xs">
                  Clique para inserir na mensagem
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex flex-wrap gap-2">
                  {TEMPLATE_VARIABLES.map((v) => (
                    <Button
                      key={v.variable}
                      type="button"
                      variant="outline"
                      size="sm"
                      className="text-xs"
                      onClick={() => insertVariable(v.variable)}
                    >
                      {v.variable}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="flex items-center justify-between pt-2 border-t border-border">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.send_via_whatsapp}
                    onCheckedChange={(checked) => setFormData({ ...formData, send_via_whatsapp: checked })}
                  />
                  <Label className="text-sm">Enviar via WhatsApp</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label className="text-sm">Ativo</Label>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveTemplate} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
