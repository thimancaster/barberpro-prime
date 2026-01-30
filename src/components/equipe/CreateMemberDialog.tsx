import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, HelpCircle, UserPlus } from 'lucide-react';
import { toast } from 'sonner';

interface CreateMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function CreateMemberDialog({ open, onOpenChange, onSuccess }: CreateMemberDialogProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    phone: '',
    role: 'barber' as 'admin' | 'barber',
    commission_percentage: '50',
    product_commission_percentage: '10',
  });

  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      full_name: '',
      phone: '',
      role: 'barber',
      commission_percentage: '50',
      product_commission_percentage: '10',
    });
  };

  const handleSubmit = async () => {
    if (!formData.email || !formData.password || !formData.full_name) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('A senha deve ter no mínimo 6 caracteres');
      return;
    }

    setIsSaving(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        toast.error('Sessão expirada. Faça login novamente.');
        return;
      }

      const response = await fetch(
        `https://wgdeakaftkjjcnsmsfap.supabase.co/functions/v1/create-team-member`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
            full_name: formData.full_name,
            phone: formData.phone || undefined,
            role: formData.role,
            commission_percentage: parseFloat(formData.commission_percentage),
            product_commission_percentage: parseFloat(formData.product_commission_percentage),
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        const errorMessages: Record<string, string> = {
          not_authenticated: 'Você precisa estar logado',
          not_authorized: 'Apenas administradores podem cadastrar membros',
          missing_required_fields: 'Preencha todos os campos obrigatórios',
          password_too_short: 'A senha deve ter no mínimo 6 caracteres',
          email_already_exists: 'Este email já está cadastrado',
          failed_to_create_user: 'Erro ao criar usuário',
          failed_to_create_profile: 'Erro ao criar perfil',
        };

        throw new Error(errorMessages[result.error] || result.error || 'Erro desconhecido');
      }

      toast.success('Membro cadastrado com sucesso!', {
        description: 'O novo membro pode fazer login com o email e senha cadastrados.',
      });
      
      resetForm();
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      toast.error('Erro ao cadastrar membro', { description: error.message });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      onOpenChange(isOpen);
      if (!isOpen) resetForm();
    }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            Cadastrar Membro
          </DialogTitle>
          <DialogDescription>
            Crie uma conta de acesso para o novo membro da equipe
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Email *</Label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="email@exemplo.com"
            />
          </div>

          <div className="space-y-2">
            <Label>Senha Temporária *</Label>
            <Input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="Mínimo 6 caracteres"
            />
            <p className="text-xs text-muted-foreground">
              O membro poderá alterar a senha após o primeiro login
            </p>
          </div>

          <div className="space-y-2">
            <Label>Nome Completo *</Label>
            <Input
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              placeholder="Nome do membro"
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

          <div className="space-y-3">
            <Label>Cargo</Label>
            <RadioGroup
              value={formData.role}
              onValueChange={(value: 'admin' | 'barber') => setFormData({ ...formData, role: value })}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="barber" id="barber" />
                <Label htmlFor="barber" className="cursor-pointer font-normal">Barbeiro</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="admin" id="admin" />
                <Label htmlFor="admin" className="cursor-pointer font-normal">Administrador</Label>
              </div>
            </RadioGroup>
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
                    Percentual de comissão sobre o valor dos serviços
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
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Cadastrando...
              </>
            ) : (
              'Cadastrar Membro'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
