import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Profile, UserRole } from '@/types/database';
import { Search, UserCircle, Phone, Loader2, Edit, Copy, Plus, Check, Clock, HelpCircle } from 'lucide-react';
import { toast } from 'sonner';
import WorkingHoursDialog from '@/components/equipe/WorkingHoursDialog';

interface TeamMember extends Profile {
  role?: UserRole;
}

export default function Equipe() {
  const { organization, isAdmin } = useAuth();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [isWorkingHoursOpen, setIsWorkingHoursOpen] = useState(false);
  const [selectedMemberForHours, setSelectedMemberForHours] = useState<TeamMember | null>(null);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [inviteLink, setInviteLink] = useState('');
  const [copied, setCopied] = useState(false);

  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    commission_percentage: '0',
    product_commission_percentage: '0',
    is_active: true,
  });

  useEffect(() => {
    if (organization?.id) {
      fetchMembers();
    }
  }, [organization?.id]);

  const fetchMembers = async () => {
    if (!organization?.id) return;
    setIsLoading(true);

    try {
      const { data: profilesData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('organization_id', organization.id)
        .order('full_name');

      if (error) throw error;

      // Fetch roles for each member
      const membersWithRoles = await Promise.all(
        (profilesData || []).map(async (profile) => {
          const { data: roleData } = await supabase
            .from('user_roles')
            .select('*')
            .eq('user_id', profile.id)
            .eq('organization_id', organization.id)
            .single();

          return {
            ...profile,
            role: roleData || undefined,
          };
        })
      );

      setMembers(membersWithRoles);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error fetching members:', error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!editingMember) return;

    setIsSaving(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          phone: formData.phone || null,
          commission_percentage: parseFloat(formData.commission_percentage),
          product_commission_percentage: parseFloat(formData.product_commission_percentage),
          is_active: formData.is_active,
        })
        .eq('id', editingMember.id);

      if (error) throw error;

      toast.success('Membro atualizado!');
      setIsDialogOpen(false);
      fetchMembers();
    } catch (error: any) {
      toast.error('Erro ao salvar', { description: error.message });
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (member: TeamMember) => {
    setEditingMember(member);
    setFormData({
      full_name: member.full_name,
      phone: member.phone || '',
      commission_percentage: (member.commission_percentage ?? 0).toString(),
      product_commission_percentage: (member.product_commission_percentage ?? 0).toString(),
      is_active: member.is_active,
    });
    setIsDialogOpen(true);
  };

  const handleOpenWorkingHours = (member: TeamMember) => {
    setSelectedMemberForHours(member);
    setIsWorkingHoursOpen(true);
  };

  const handleGenerateInvite = async () => {
    if (!organization?.id) return;

    try {
      const { data, error } = await supabase
        .from('invites')
        .insert({
          organization_id: organization.id,
          role: 'barber',
        })
        .select()
        .single();

      if (error) throw error;

      const link = `${window.location.origin}/convite/${data.token}`;
      setInviteLink(link);
      setIsInviteDialogOpen(true);
    } catch (error: any) {
      toast.error('Erro ao gerar convite', { description: error.message });
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    toast.success('Link copiado!');
    setTimeout(() => setCopied(false), 2000);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const filteredMembers = members.filter((member) =>
    member.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar membros..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {isAdmin && (
            <Button className="gap-2" onClick={handleGenerateInvite}>
              <Plus className="w-4 h-4" />
              Convidar Membro
            </Button>
          )}
        </div>

        {/* Team Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="text-center py-20">
            <UserCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">
              {searchQuery ? 'Nenhum membro encontrado' : 'Nenhum membro na equipe'}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredMembers.map((member) => (
              <Card key={member.id} className="card-gradient border-border/50 hover:border-primary/30 transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <Avatar className="w-14 h-14 border-2 border-border">
                        <AvatarImage src={member.avatar_url || undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {getInitials(member.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold">{member.full_name}</h3>
                        <Badge variant={member.role?.role === 'admin' ? 'default' : 'outline'}>
                          {member.role?.role === 'admin' ? 'Administrador' : 'Barbeiro'}
                        </Badge>
                      </div>
                    </div>
                    {isAdmin && (
                      <div className="flex gap-1">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={() => handleOpenWorkingHours(member)}>
                              <Clock className="w-4 h-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Horários de trabalho</TooltipContent>
                        </Tooltip>
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(member)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 text-sm">
                    {isAdmin && member.phone && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="w-4 h-4" />
                        {member.phone}
                      </div>
                    )}
                    {isAdmin && (
                      <>
                        <div className="flex items-center justify-between pt-2 border-t border-border">
                          <span className="text-muted-foreground">Comissão Serviços</span>
                          <span className="font-medium text-primary">{member.commission_percentage ?? 0}%</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Comissão Produtos</span>
                          <span className="font-medium text-primary">{member.product_commission_percentage ?? 0}%</span>
                        </div>
                      </>
                    )}
                    <div className={`flex items-center justify-between ${isAdmin ? '' : 'pt-2 border-t border-border'}`}>
                      <span className="text-muted-foreground">Status</span>
                      <Badge variant={member.is_active ? 'default' : 'secondary'}>
                        {member.is_active ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-display">Editar Membro</DialogTitle>
              <DialogDescription>Atualize as informações do membro da equipe</DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Nome completo</Label>
                <Input
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Telefone</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="(00) 00000-0000"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-1">
                    Comissão Serviços (%)
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        Percentual de comissão sobre o valor dos serviços prestados
                      </TooltipContent>
                    </Tooltip>
                  </Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={formData.commission_percentage}
                    onChange={(e) => setFormData({ ...formData, commission_percentage: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-1">
                    Comissão Produtos (%)
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        Percentual de comissão sobre vendas de produtos
                      </TooltipContent>
                    </Tooltip>
                  </Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={formData.product_commission_percentage}
                    onChange={(e) => setFormData({ ...formData, product_commission_percentage: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Label>Membro ativo</Label>
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
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

        {/* Invite Dialog */}
        <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-display">Link de Convite</DialogTitle>
              <DialogDescription>
                Compartilhe este link com o novo membro da equipe
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="flex items-center gap-2">
                <Input value={inviteLink} readOnly className="bg-secondary/50" />
                <Button variant="outline" size="icon" onClick={handleCopyLink}>
                  {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Este link expira em 7 dias. O membro terá acesso como <strong>Barbeiro</strong>.
              </p>
            </div>

            <DialogFooter>
              <Button onClick={() => setIsInviteDialogOpen(false)}>Fechar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Working Hours Dialog */}
        {selectedMemberForHours && (
          <WorkingHoursDialog
            open={isWorkingHoursOpen}
            onOpenChange={setIsWorkingHoursOpen}
            profileId={selectedMemberForHours.id}
            profileName={selectedMemberForHours.full_name}
          />
        )}
      </div>
    </div>
  );
}
