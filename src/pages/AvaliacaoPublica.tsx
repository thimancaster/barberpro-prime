import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { 
  Star, 
  CheckCircle2, 
  Loader2,
  Scissors
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

interface ReviewData {
  organization: { name: string; logo_url?: string };
  appointment: {
    start_time: string;
    service?: { name: string };
    barber?: { full_name: string };
  };
}

export default function AvaliacaoPublica() {
  const { token } = useParams<{ token: string }>();
  const [reviewData, setReviewData] = useState<ReviewData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [npsScore, setNpsScore] = useState<number | null>(null);
  const [comment, setComment] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (token) {
      fetchReviewData();
    }
  }, [token]);

  const fetchReviewData = async () => {
    try {
      // Buscar review pelo token
      const { data: review, error } = await supabase
        .from('reviews')
        .select(`
          id,
          rating,
          organization:organizations(name, logo_url),
          appointment:appointments(
            start_time,
            service:services(name),
            barber:profiles(full_name)
          )
        `)
        .eq('token', token)
        .single();

      if (error || !review) {
        setError('Link de avaliação inválido ou expirado');
        return;
      }

      // Se já foi avaliado
      if (review.rating > 0) {
        setIsSubmitted(true);
      }

      setReviewData(review as unknown as ReviewData);
    } catch (error) {
      setError('Erro ao carregar dados');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error('Por favor, selecione uma nota');
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('reviews')
        .update({
          rating,
          nps_score: npsScore,
          comment: comment || null,
        })
        .eq('token', token);

      if (error) throw error;

      setIsSubmitted(true);
      toast.success('Avaliação enviada!');
    } catch (error) {
      toast.error('Erro ao enviar avaliação');
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

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardContent className="text-center py-12">
            <div className="text-destructive mb-4">
              <Star className="w-12 h-12 mx-auto opacity-50" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Ops!</h2>
            <p className="text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardContent className="text-center py-12">
            <div className="text-success mb-4">
              <CheckCircle2 className="w-16 h-16 mx-auto" />
            </div>
            <h2 className="text-2xl font-display font-bold mb-2">Obrigado!</h2>
            <p className="text-muted-foreground">
              Sua avaliação foi enviada com sucesso. Agradecemos seu feedback!
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 flex items-center justify-center">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Scissors className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="font-display text-xl">
            {reviewData?.organization?.name}
          </CardTitle>
          <p className="text-muted-foreground text-sm">
            Como foi seu atendimento?
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Detalhes do atendimento */}
          <div className="p-4 rounded-lg bg-secondary/30 text-center">
            <p className="font-medium">{reviewData?.appointment?.service?.name}</p>
            <p className="text-sm text-muted-foreground">
              com {reviewData?.appointment?.barber?.full_name}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {reviewData?.appointment?.start_time && format(
                new Date(reviewData.appointment.start_time),
                "dd 'de' MMMM 'às' HH:mm",
                { locale: ptBR }
              )}
            </p>
          </div>

          {/* Rating */}
          <div className="text-center">
            <p className="text-sm font-medium mb-3">Avalie seu atendimento</p>
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-10 h-10 transition-colors ${
                      star <= (hoverRating || rating)
                        ? 'text-amber-400 fill-amber-400'
                        : 'text-muted-foreground'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* NPS */}
          <div className="text-center">
            <p className="text-sm font-medium mb-3">
              De 0 a 10, qual a chance de nos indicar?
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => (
                <button
                  key={score}
                  onClick={() => setNpsScore(score)}
                  className={`w-9 h-9 rounded-full text-sm font-medium transition-all ${
                    npsScore === score
                      ? score <= 6
                        ? 'bg-destructive text-destructive-foreground'
                        : score <= 8
                        ? 'bg-warning text-warning-foreground'
                        : 'bg-success text-success-foreground'
                      : 'bg-secondary hover:bg-secondary/80'
                  }`}
                >
                  {score}
                </button>
              ))}
            </div>
            <div className="flex justify-between text-xs text-muted-foreground mt-2 px-2">
              <span>Improvável</span>
              <span>Muito provável</span>
            </div>
          </div>

          {/* Comentário */}
          <div>
            <p className="text-sm font-medium mb-2">Deixe um comentário (opcional)</p>
            <Textarea
              placeholder="Conte como foi sua experiência..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
            />
          </div>

          {/* Submit */}
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || rating === 0}
            className="w-full"
            size="lg"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : null}
            Enviar Avaliação
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
