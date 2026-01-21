import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Scissors, Building2, Phone, Mail, MapPin, Clock, Loader2 } from 'lucide-react';

export default function Onboarding() {
  const navigate = useNavigate();
  const { user, refreshProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    phone: '',
    email: user?.email || '',
    address: '',
    openingTime: '09:00',
    closingTime: '19:00',
    fullName: '',
  });

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setFormData(prev => ({
      ...prev,
      name,
      slug: generateSlug(name),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Usuário não autenticado');
      return;
    }

    if (!formData.name || !formData.slug || !formData.fullName) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    setIsLoading(true);

    try {
      // 1. Check if slug is unique
      const { data: existingOrg } = await supabase
        .from('organizations')
        .select('id')
        .eq('slug', formData.slug)
        .single();

      if (existingOrg) {
        toast.error('Este slug já está em uso. Escolha outro nome.');
        setIsLoading(false);
        return;
      }

      // 2. Create organization
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .insert({
          name: formData.name,
          slug: formData.slug,
          phone: formData.phone || null,
          email: formData.email || null,
          address: formData.address || null,
          opening_time: formData.openingTime,
          closing_time: formData.closingTime,
          working_days: [1, 2, 3, 4, 5, 6],
        })
        .select()
        .single();

      if (orgError) throw orgError;

      // 3. Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          organization_id: org.id,
          full_name: formData.fullName,
          phone: formData.phone || null,
          commission_percentage: 100,
          is_active: true,
        });

      if (profileError) throw profileError;

      // 4. Assign admin role
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: user.id,
          organization_id: org.id,
          role: 'admin',
        });

      if (roleError) throw roleError;

      // 5. Create default working hours (Mon-Sat)
      const workingHoursData = [];
      for (let day = 1; day <= 6; day++) {
        workingHoursData.push({
          profile_id: user.id,
          day_of_week: day,
          start_time: formData.openingTime,
          end_time: formData.closingTime,
          is_working: true,
        });
      }
      // Sunday off
      workingHoursData.push({
        profile_id: user.id,
        day_of_week: 0,
        start_time: formData.openingTime,
        end_time: formData.closingTime,
        is_working: false,
      });

      await supabase.from('working_hours').insert(workingHoursData);

      toast.success('Barbearia criada com sucesso!');
      
      // Refresh profile data and redirect
      await refreshProfile();
      navigate('/dashboard');
      
    } catch (error: any) {
      console.error('Error creating organization:', error);
      toast.error(error.message || 'Erro ao criar barbearia');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl border-primary/20">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Scissors className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-3xl font-display text-primary">
            Configure sua Barbearia
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Preencha as informações abaixo para começar a usar o BarberPro Prime
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Info */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm">1</span>
                Seus Dados
              </h3>
              
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Seu Nome Completo *</Label>
                  <Input
                    id="fullName"
                    placeholder="João da Silva"
                    value={formData.fullName}
                    onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Business Info */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm">2</span>
                Dados da Barbearia
              </h3>
              
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name" className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Nome da Barbearia *
                  </Label>
                  <Input
                    id="name"
                    placeholder="Barber Prime"
                    value={formData.name}
                    onChange={handleNameChange}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="slug">URL Amigável</Label>
                  <div className="flex items-center">
                    <span className="text-sm text-muted-foreground mr-1">barberpro.app/</span>
                    <Input
                      id="slug"
                      placeholder="barber-prime"
                      value={formData.slug}
                      onChange={(e) => setFormData(prev => ({ ...prev, slug: generateSlug(e.target.value) }))}
                      className="flex-1"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Telefone
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="(11) 99999-9999"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    E-mail
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="contato@barbearia.com"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address" className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Endereço
                </Label>
                <Textarea
                  id="address"
                  placeholder="Rua das Flores, 123 - Centro, São Paulo - SP"
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  rows={2}
                />
              </div>
            </div>

            {/* Schedule */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm">3</span>
                Horário de Funcionamento
              </h3>
              
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="openingTime" className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Abertura
                  </Label>
                  <Input
                    id="openingTime"
                    type="time"
                    value={formData.openingTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, openingTime: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="closingTime" className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Fechamento
                  </Label>
                  <Input
                    id="closingTime"
                    type="time"
                    value={formData.closingTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, closingTime: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              size="lg"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando...
                </>
              ) : (
                'Criar Barbearia'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
