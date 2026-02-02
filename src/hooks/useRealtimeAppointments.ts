import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { Tables } from '@/integrations/supabase/types';

type Appointment = Tables<'appointments'>;

interface UseRealtimeAppointmentsOptions {
  organizationId: string | undefined;
  onInsert?: (appointment: Appointment) => void;
  onUpdate?: (appointment: Appointment) => void;
  onDelete?: (oldAppointment: Appointment) => void;
  showToasts?: boolean;
}

export function useRealtimeAppointments({
  organizationId,
  onInsert,
  onUpdate,
  onDelete,
  showToasts = true,
}: UseRealtimeAppointmentsOptions) {
  const handleChange = useCallback(
    (payload: RealtimePostgresChangesPayload<Appointment>) => {
      const { eventType, new: newRecord, old: oldRecord } = payload;

      switch (eventType) {
        case 'INSERT':
          if (showToasts) {
            toast.info('Novo agendamento criado!', {
              description: 'A agenda foi atualizada',
              duration: 3000,
            });
          }
          if (onInsert && newRecord) {
            onInsert(newRecord as Appointment);
          }
          break;

        case 'UPDATE':
          if (showToasts) {
            const status = (newRecord as Appointment)?.status;
            const statusMessages: Record<string, string> = {
              confirmed: 'Agendamento confirmado',
              in_progress: 'Atendimento iniciado',
              completed: 'Atendimento concluído',
              cancelled: 'Agendamento cancelado',
              no_show: 'Cliente não compareceu',
            };
            if (status && statusMessages[status]) {
              toast.info(statusMessages[status], { duration: 3000 });
            }
          }
          if (onUpdate && newRecord) {
            onUpdate(newRecord as Appointment);
          }
          break;

        case 'DELETE':
          if (showToasts) {
            toast.info('Agendamento removido', { duration: 3000 });
          }
          if (onDelete && oldRecord) {
            onDelete(oldRecord as Appointment);
          }
          break;
      }
    },
    [onInsert, onUpdate, onDelete, showToasts]
  );

  useEffect(() => {
    if (!organizationId) return;

    const channel = supabase
      .channel(`appointments-${organizationId}`)
      .on<Appointment>(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'appointments',
          filter: `organization_id=eq.${organizationId}`,
        },
        handleChange
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED' && import.meta.env.DEV) {
          console.log('Realtime: Subscribed to appointments');
        }
      });

    return () => {
      if (import.meta.env.DEV) {
        console.log('Realtime: Unsubscribing from appointments');
      }
      supabase.removeChannel(channel);
    };
  }, [organizationId, handleChange]);
}
