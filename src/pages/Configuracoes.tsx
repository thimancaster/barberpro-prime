import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Save, Building2, Calendar, Link2, Copy, Check, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

const DAYS_OF_WEEK = [
  { value: 0, label: 'Dom', fullLabel: 'Domingo' },
  { value: 1, label: 'Seg', fullLabel: 'Segunda' },
  { value: 2, label: 'Ter', fullLabel: 'Terça' },
  { value: 3, label: 'Qua', fullLabel: 'Quarta' },
  { value: 4, label: 'Qui', fullLabel: 'Quinta' },
  { value: 5, label: 'Sex', fullLabel: 'Sexta' },
  { value: 6, label: 'Sáb', fullLabel: 'Sábado' },
];

export default function Configuracoes() {
  const { organization, refreshProfile } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    opening_time: '09:00',
    closing_time: '19:00',
    working_days: [1, 2, 3, 4, 5, 6] as number[],
  });

  useEffect(() => {
    if (organization) {
      setFormData({
        name: organization.name || '',
        address: organization.address || '',
        phone: organization.phone || '',
        email: organization.email || '',
        opening_time: organization.opening_time || '09:00',
        closing_time: organization.closing_time || '19:00',
        working_days: organization.working_days || [1, 2, 3, 4, 5, 6],
      });
    }
  }, [organization]);

  const handleSave = async () => {
    if (!organization?.id) return;

    setIsSaving(true);

    try {
      const { error } = await supabase
        .from('organizations')
        .update({
          name: formData.name,
          address: formData.address || null,
          phone: formData.phone || null,
          email: formData.email || null,
          opening_time: formData.opening_time,
          closing_time: formData.closing_time,
          working_days: formData.working_days,
        })
        .eq('id', organization.id);

      if (error) throw error;

      toast.success('Configurações salvas!');
      refreshProfile();
    } catch (error: any) {
      toast.error('Erro ao salvar', { description: error.message });
    } finally {
      setIsSaving(false);
    }
  };

  const toggleWorkingDay = (day: number) => {
    setFormData(prev => {
      const newDays = prev.working_days.includes(day)
        ? prev.working_days.filter(d => d !== day)
        : [...prev.working_days, day].sort();
      return { ...prev, working_days: newDays };
    });
  };

  const bookingUrl = organization?.slug
    ? `${window.location.origin}/agendar/${organization.slug}`
    : '';

  const handleCopyLink = () => {
    if (bookingUrl) {
      navigator.clipboard.writeText(bookingUrl);
      setCopied(true);
      toast.success('Link copiado!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="general" className="gap-2">
            <Building2 className="w-4 h-4" />
            <span className="hidden sm:inline">Geral</span>
          </TabsTrigger>
          <TabsTrigger value="schedule" className="gap-2">
            <Calendar className="w-4 h-4" />
            <span className="hidden sm:inline">Horários</span>
          </TabsTrigger>
          <TabsTrigger value="booking" className="gap-2">
            <Link2 className="w-4 h-4" />
            <span className="hidden sm:inline">Agendamento</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab: Geral */}
        <TabsContent value="general">
          <Card className="card-gradient border-border/50">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="font-display">Dados da Barbearia</CardTitle>
                  <CardDescription>Configure as informações básicas</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Nome da Barbearia</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nome do estabelecimento"
                />
              </div>

              <div className="space-y-2">
                <Label>Endereço</Label>
                <Textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Endereço completo"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Telefone</Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="(00) 00000-0000"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="email@barbearia.com"
                  />
                </div>
              </div>

              <div className="pt-4">
                <Button onClick={handleSave} disabled={isSaving} className="gap-2">
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Salvar Alterações
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Horários */}
        <TabsContent value="schedule">
          <Card className="card-gradient border-border/50">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="font-display">Horário de Funcionamento</CardTitle>
                  <CardDescription>Defina os dias e horários de atendimento</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Horários de Abertura/Fechamento */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Horário de Abertura</Label>
                  <Input
                    type="time"
                    value={formData.opening_time}
                    onChange={(e) => setFormData({ ...formData, opening_time: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Horário de Fechamento</Label>
                  <Input
                    type="time"
                    value={formData.closing_time}
                    onChange={(e) => setFormData({ ...formData, closing_time: e.target.value })}
                  />
                </div>
              </div>

              {/* Dias de Funcionamento */}
              <div className="space-y-3">
                <Label>Dias de Funcionamento</Label>
                <div className="flex flex-wrap gap-2">
                  {DAYS_OF_WEEK.map((day) => {
                    const isChecked = formData.working_days.includes(day.value);
                    return (
                      <button
                        key={day.value}
                        type="button"
                        onClick={() => toggleWorkingDay(day.value)}
                        className={`px-4 py-2 rounded-lg border font-medium transition-all ${
                          isChecked
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-secondary/50 text-muted-foreground border-border hover:border-primary/50'
                        }`}
                      >
                        {day.label}
                      </button>
                    );
                  })}
                </div>
                <p className="text-sm text-muted-foreground">
                  {formData.working_days.length === 0
                    ? 'Nenhum dia selecionado'
                    : `Funcionando ${formData.working_days.length} dia(s) por semana`}
                </p>
              </div>

              <div className="pt-4">
                <Button onClick={handleSave} disabled={isSaving} className="gap-2">
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Salvar Horários
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Agendamento */}
        <TabsContent value="booking">
          <Card className="card-gradient border-border/50">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Link2 className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="font-display">Link de Agendamento</CardTitle>
                  <CardDescription>Compartilhe para seus clientes agendarem online</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Sua URL de Agendamento Público</Label>
                <div className="flex gap-2">
                  <Input
                    value={bookingUrl}
                    readOnly
                    className="bg-secondary/50 font-mono text-sm"
                  />
                  <Button variant="outline" size="icon" onClick={handleCopyLink} disabled={!bookingUrl}>
                    {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
                  </Button>
                  <Button variant="outline" size="icon" asChild disabled={!bookingUrl}>
                    <a href={bookingUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </Button>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-muted/50 space-y-2">
                <h4 className="font-medium text-sm">Como usar</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Compartilhe esse link no WhatsApp ou redes sociais</li>
                  <li>• Clientes podem agendar diretamente sem precisar de conta</li>
                  <li>• Agendamentos aparecem automaticamente na sua agenda</li>
                </ul>
              </div>

              {organization?.slug && (
                <div className="p-4 rounded-lg border border-primary/20 bg-primary/5">
                  <p className="text-sm">
                    <strong>Slug da sua barbearia:</strong>{' '}
                    <code className="bg-secondary px-2 py-1 rounded text-primary">{organization.slug}</code>
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
