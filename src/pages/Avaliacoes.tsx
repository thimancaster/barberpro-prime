import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Star, 
  TrendingUp, 
  TrendingDown,
  MessageSquare,
  Reply,
  Loader2,
  Users,
  BarChart3
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Review, calculateNPS, getNPSCategory, NPS_CATEGORIES } from '@/types/phases';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

export default function Avaliacoes() {
  const { organization, profile } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [responseText, setResponseText] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [filterBarber, setFilterBarber] = useState<string>('all');
  const [barbers, setBarbers] = useState<Array<{ id: string; full_name: string }>>([]);

  useEffect(() => {
    if (organization?.id) {
      fetchData();
    }
  }, [organization?.id]);

  const fetchData = async () => {
    if (!organization?.id) return;

    try {
      // Buscar avaliações
      const { data: reviewsData } = await supabase
        .from('reviews')
        .select(`
          *,
          client:clients(name),
          barber:profiles!reviews_barber_id_fkey(full_name),
          appointment:appointments(start_time, service:services(name))
        `)
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false });

      setReviews((reviewsData as unknown as Review[]) || []);

      // Buscar barbeiros
      const { data: barbersData } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('organization_id', organization.id)
        .eq('is_active', true);

      setBarbers(barbersData || []);
    } catch (error) {
      toast.error('Erro ao carregar avaliações');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRespond = async () => {
    if (!selectedReview || !responseText.trim()) return;

    setIsSaving(true);

    try {
      const { error } = await supabase
        .from('reviews')
        .update({
          response: responseText,
          response_at: new Date().toISOString(),
          response_by: profile?.id,
        })
        .eq('id', selectedReview.id);

      if (error) throw error;

      setReviews(reviews.map(r =>
        r.id === selectedReview.id
          ? { ...r, response: responseText, response_at: new Date().toISOString() }
          : r
      ));

      toast.success('Resposta enviada!');
      setSelectedReview(null);
      setResponseText('');
    } catch (error) {
      toast.error('Erro ao enviar resposta');
    } finally {
      setIsSaving(false);
    }
  };

  const filteredReviews = filterBarber === 'all'
    ? reviews
    : reviews.filter(r => r.barber_id === filterBarber);

  // Calcular estatísticas
  const avgRating = filteredReviews.length > 0
    ? filteredReviews.reduce((sum, r) => sum + r.rating, 0) / filteredReviews.length
    : 0;

  const npsScores = filteredReviews
    .filter(r => r.nps_score !== null && r.nps_score !== undefined)
    .map(r => r.nps_score as number);
  const npsScore = calculateNPS(npsScores);

  const ratingDistribution = [5, 4, 3, 2, 1].map(rating => ({
    rating,
    count: filteredReviews.filter(r => r.rating === rating).length,
    percentage: filteredReviews.length > 0
      ? (filteredReviews.filter(r => r.rating === rating).length / filteredReviews.length) * 100
      : 0,
  }));

  const renderStars = (rating: number, size: 'sm' | 'lg' = 'sm') => {
    const iconSize = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${iconSize} ${
              star <= rating
                ? 'text-amber-400 fill-amber-400'
                : 'text-muted-foreground'
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Avaliações</h1>
          <p className="text-muted-foreground">Feedback e satisfação dos clientes</p>
        </div>
        <Select value={filterBarber} onValueChange={setFilterBarber}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filtrar por barbeiro" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os barbeiros</SelectItem>
            {barbers.map((barber) => (
              <SelectItem key={barber.id} value={barber.id}>
                {barber.full_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="card-gradient border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Star className="w-4 h-4" />
              Nota Média
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="text-3xl font-bold">{avgRating.toFixed(1)}</div>
              {renderStars(Math.round(avgRating), 'lg')}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {filteredReviews.length} avaliações
            </p>
          </CardContent>
        </Card>

        <Card className="card-gradient border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              NPS Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${
              npsScore >= 50 ? 'text-success' : npsScore >= 0 ? 'text-warning' : 'text-destructive'
            }`}>
              {npsScore}
            </div>
            <div className="flex items-center gap-1 mt-1">
              {npsScore >= 0 ? (
                <TrendingUp className="w-3 h-3 text-success" />
              ) : (
                <TrendingDown className="w-3 h-3 text-destructive" />
              )}
              <span className="text-xs text-muted-foreground">
                {npsScores.length} respostas
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="card-gradient border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Com Comentário
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {filteredReviews.filter(r => r.comment).length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {filteredReviews.filter(r => r.response).length} respondidos
            </p>
          </CardContent>
        </Card>

        <Card className="card-gradient border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Distribuição
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {ratingDistribution.map(({ rating, count, percentage }) => (
              <div key={rating} className="flex items-center gap-2 text-xs">
                <span className="w-3">{rating}</span>
                <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-400"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="w-6 text-right text-muted-foreground">{count}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Reviews List */}
      <Card className="card-gradient border-border/50">
        <CardHeader>
          <CardTitle className="text-lg">Avaliações Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : filteredReviews.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Star className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Nenhuma avaliação ainda</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredReviews.map((review: any) => (
                <div
                  key={review.id}
                  className="p-4 rounded-lg border border-border bg-secondary/20"
                >
                  <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>
                        {review.client?.name?.charAt(0) || 'C'}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <div>
                          <span className="font-medium">
                            {review.client?.name || 'Cliente'}
                          </span>
                          <span className="text-sm text-muted-foreground ml-2">
                            para {review.barber?.full_name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {renderStars(review.rating)}
                          {review.nps_score !== null && (
                            <Badge
                              variant="outline"
                              className={NPS_CATEGORIES[getNPSCategory(review.nps_score)].color}
                            >
                              NPS: {review.nps_score}
                            </Badge>
                          )}
                        </div>
                      </div>

                      <p className="text-sm text-muted-foreground mb-2">
                        {review.appointment?.service?.name} • {format(new Date(review.created_at), "dd 'de' MMM 'às' HH:mm", { locale: ptBR })}
                      </p>

                      {review.comment && (
                        <p className="text-sm mb-3">{review.comment}</p>
                      )}

                      {review.response ? (
                        <div className="p-3 rounded bg-primary/10 border border-primary/20 mt-2">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                            <Reply className="w-3 h-3" />
                            Resposta do estabelecimento
                          </div>
                          <p className="text-sm">{review.response}</p>
                        </div>
                      ) : review.comment ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedReview(review)}
                          className="gap-1"
                        >
                          <Reply className="w-3 h-3" />
                          Responder
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Response Dialog */}
      <Dialog open={!!selectedReview} onOpenChange={() => setSelectedReview(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Responder Avaliação</DialogTitle>
            <DialogDescription>
              Responda à avaliação de {selectedReview?.client?.name}
            </DialogDescription>
          </DialogHeader>

          {selectedReview && (
            <div className="space-y-4 py-4">
              <div className="p-3 rounded-lg bg-secondary/30">
                <div className="flex items-center gap-2 mb-2">
                  {renderStars(selectedReview.rating)}
                </div>
                {selectedReview.comment && (
                  <p className="text-sm">{selectedReview.comment}</p>
                )}
              </div>

              <Textarea
                placeholder="Escreva sua resposta..."
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
                rows={4}
              />
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedReview(null)}>
              Cancelar
            </Button>
            <Button onClick={handleRespond} disabled={isSaving || !responseText.trim()}>
              {isSaving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Enviar Resposta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
