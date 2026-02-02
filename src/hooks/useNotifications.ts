import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

type NotificationTrigger = 
  | 'appointment_created'
  | 'appointment_confirmed'
  | 'appointment_reminder_1h'
  | 'appointment_reminder_24h'
  | 'appointment_completed'
  | 'review_request'
  | 'loyalty_points_earned'
  | 'birthday';

interface SendNotificationParams {
  trigger: NotificationTrigger;
  appointmentId?: string;
  clientId?: string;
  customMessage?: string;
}

export function useNotifications() {
  const { organization } = useAuth();

  const sendNotification = useCallback(async ({
    trigger,
    appointmentId,
    clientId,
    customMessage,
  }: SendNotificationParams) => {
    if (!organization?.id) {
      return { success: false, error: 'No organization' };
    }

    try {
      const { data, error } = await supabase.functions.invoke('send-notification', {
        body: {
          trigger,
          appointment_id: appointmentId,
          client_id: clientId,
          organization_id: organization.id,
          custom_message: customMessage,
        },
      });

      if (error) {
        console.error('Notification error:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (err) {
      console.error('Failed to send notification:', err);
      return { success: false, error: 'Failed to send notification' };
    }
  }, [organization?.id]);

  return { sendNotification };
}
