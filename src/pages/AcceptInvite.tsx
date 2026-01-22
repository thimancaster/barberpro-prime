import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Scissors, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';

interface InviteData {
  id: string;
  organization_id: string;
  role: 'admin' | 'barber';
  expires_at: string;
  accepted_at: string | null;
  organization_name: string;
}

export default function AcceptInvite() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { user, signUp } = useAuth();
  const [invite, setInvite] = useState<InviteData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExpired, setIsExpired] = useState(false);
  const [isAccepted, setIsAccepted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
  });

  useEffect(() => {
    if (token) {
      fetchInvite();
    }
  }, [token]);

  const fetchInvite = async () => {
    try {
      // Use secure RPC function instead of direct table access
      const { data, error } = await supabase.rpc('get_invite_public', { 
        _token: token 
      });

      if (error) throw error;

      // RPC returns an array, get first result
      const inviteData = Array.isArray(data) ? data[0] : data;

      if (!inviteData) {
        setIsExpired(true);
        return;
      }

      if (inviteData.accepted_at) {
        setIsAccepted(true);
      } else if (new Date(inviteData.expires_at) < new Date()) {
        setIsExpired(true);
      } else {
        setInvite(inviteData as InviteData);
      }
    } catch (error) {
      console.error('Error fetching invite:', error);
      setIsExpired(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    if (!invite) return;

    setIsSubmitting(true);

    try {
      // Create user account
      const { error: signUpError } = await signUp(
        formData.email,
        formData.password,
        formData.fullName
      );

      if (signUpError) throw signUpError;

      // Wait a bit for the user to be created and session to be established
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Get the new user session
      const { data: { user: newUser } } = await supabase.auth.getUser();

      if (!newUser) throw new Error('Erro ao criar usuário');

      // Use secure RPC to atomically accept invite, create profile, and assign role
      const { error: acceptError } = await supabase.rpc('accept_invite', {
        _token: token!,
        _full_name: formData.fullName
      });

      if (acceptError) {
        // Handle specific RPC errors
        if (acceptError.message.includes('invite_not_found')) {
          throw new Error('Convite não encontrado');
        } else if (acceptError.message.includes('invite_already_accepted')) {
          throw new Error('Este convite já foi utilizado');
        } else if (acceptError.message.includes('invite_expired')) {
          throw new Error('Este convite expirou');
        }
        throw acceptError;
      }

      toast.success('Conta criada com sucesso!', {
        description: 'Verifique seu email para confirmar a conta.',
      });

      navigate('/login');
    } catch (error: any) {
      toast.error('Erro ao criar conta', { description: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isExpired || isAccepted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <XCircle className="w-16 h-16 mx-auto mb-4 text-destructive" />
            <h2 className="text-xl font-display font-semibold mb-2">
              {isAccepted ? 'Convite já utilizado' : 'Convite expirado'}
            </h2>
            <p className="text-muted-foreground mb-4">
              {isAccepted
                ? 'Este convite já foi aceito anteriormente.'
                : 'Este convite não é mais válido. Solicite um novo ao administrador.'}
            </p>
            <Button onClick={() => navigate('/login')}>
              Ir para Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-32 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
      </div>

      <Card className="w-full max-w-md relative animate-fade-in border-border/50 bg-card/80 backdrop-blur-sm">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center gold-glow">
            <Scissors className="w-8 h-8 text-primary" />
          </div>
          <div>
            <CardTitle className="text-2xl font-display">
              Bem-vindo à equipe!
            </CardTitle>
            <CardDescription className="mt-2">
              Você foi convidado para fazer parte da{' '}
              <span className="text-primary font-medium">
                {invite?.organization_name || 'barbearia'}
              </span>
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Nome completo</Label>
              <Input
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="Seu nome"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="seu@email.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Senha</Label>
              <Input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>

            <div className="space-y-2">
              <Label>Confirmar senha</Label>
              <Input
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                placeholder="••••••••"
                required
              />
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Criando conta...
                </>
              ) : (
                'Criar minha conta'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
