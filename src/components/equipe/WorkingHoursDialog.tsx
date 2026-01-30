import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Clock } from 'lucide-react';
import { toast } from 'sonner';

interface WorkingHour {
  day_of_week: number;
  is_working: boolean;
  start_time: string;
  end_time: string;
}

interface WorkingHoursDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profileId: string;
  profileName: string;
}

const DAYS_OF_WEEK = [
  { value: 0, label: 'Domingo' },
  { value: 1, label: 'Segunda-feira' },
  { value: 2, label: 'Terça-feira' },
  { value: 3, label: 'Quarta-feira' },
  { value: 4, label: 'Quinta-feira' },
  { value: 5, label: 'Sexta-feira' },
  { value: 6, label: 'Sábado' },
];

const DEFAULT_WORKING_HOURS: WorkingHour[] = DAYS_OF_WEEK.map(day => ({
  day_of_week: day.value,
  is_working: day.value >= 1 && day.value <= 6, // Seg-Sáb por padrão
  start_time: '09:00',
  end_time: '19:00',
}));

export default function WorkingHoursDialog({
  open,
  onOpenChange,
  profileId,
  profileName,
}: WorkingHoursDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [workingHours, setWorkingHours] = useState<WorkingHour[]>(DEFAULT_WORKING_HOURS);

  useEffect(() => {
    if (open && profileId) {
      fetchWorkingHours();
    }
  }, [open, profileId]);

  const fetchWorkingHours = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('working_hours')
        .select('day_of_week, is_working, start_time, end_time')
        .eq('profile_id', profileId);

      if (error) throw error;

      if (data && data.length > 0) {
        // Mesclar com defaults para garantir todos os dias
        const hoursMap = new Map(data.map(h => [h.day_of_week, h]));
        const mergedHours = DEFAULT_WORKING_HOURS.map(defaultHour => {
          const existingHour = hoursMap.get(defaultHour.day_of_week);
          return existingHour ? { ...existingHour } : { ...defaultHour };
        });
        setWorkingHours(mergedHours);
      } else {
        setWorkingHours(DEFAULT_WORKING_HOURS);
      }
    } catch (error) {
      console.error('Error fetching working hours:', error);
      setWorkingHours(DEFAULT_WORKING_HOURS);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Deletar horários existentes
      await supabase
        .from('working_hours')
        .delete()
        .eq('profile_id', profileId);

      // Inserir novos horários
      const { error } = await supabase
        .from('working_hours')
        .insert(
          workingHours.map(h => ({
            profile_id: profileId,
            day_of_week: h.day_of_week,
            is_working: h.is_working,
            start_time: h.start_time,
            end_time: h.end_time,
          }))
        );

      if (error) throw error;

      toast.success('Horários salvos com sucesso!');
      onOpenChange(false);
    } catch (error: any) {
      toast.error('Erro ao salvar horários', { description: error.message });
    } finally {
      setIsSaving(false);
    }
  };

  const updateHour = (dayOfWeek: number, field: keyof WorkingHour, value: any) => {
    setWorkingHours(prev =>
      prev.map(h =>
        h.day_of_week === dayOfWeek ? { ...h, [field]: value } : h
      )
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            Horários de Trabalho
          </DialogTitle>
          <DialogDescription>
            Configure os dias e horários de trabalho de {profileName}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
            {DAYS_OF_WEEK.map(day => {
              const hour = workingHours.find(h => h.day_of_week === day.value);
              if (!hour) return null;

              return (
                <div
                  key={day.value}
                  className={`flex items-center gap-4 p-3 rounded-lg border transition-colors ${
                    hour.is_working
                      ? 'bg-secondary/50 border-primary/20'
                      : 'bg-muted/30 border-border/50 opacity-60'
                  }`}
                >
                  <div className="flex-1 min-w-[100px]">
                    <Label className="font-medium">{day.label}</Label>
                  </div>

                  <Switch
                    checked={hour.is_working}
                    onCheckedChange={(checked) =>
                      updateHour(day.value, 'is_working', checked)
                    }
                  />

                  {hour.is_working && (
                    <div className="flex items-center gap-2">
                      <Input
                        type="time"
                        value={hour.start_time}
                        onChange={(e) =>
                          updateHour(day.value, 'start_time', e.target.value)
                        }
                        className="w-24"
                      />
                      <span className="text-muted-foreground">às</span>
                      <Input
                        type="time"
                        value={hour.end_time}
                        onChange={(e) =>
                          updateHour(day.value, 'end_time', e.target.value)
                        }
                        className="w-24"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isSaving || isLoading}>
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              'Salvar Horários'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
