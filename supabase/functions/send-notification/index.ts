import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { corsHeaders } from '../_shared/cors.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface NotificationPayload {
  trigger: string;
  appointment_id?: string;
  client_id?: string;
  organization_id: string;
  custom_message?: string;
}

interface N8nWebhookPayload {
  type: string;
  trigger: string;
  organization_id: string;
  phone_number: string;
  message: string;
  client_name?: string;
  service_name?: string;
  barber_name?: string;
  appointment_time?: string;
  appointment_date?: string;
  notification_log_id: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
    
    const payload: NotificationPayload = await req.json();
    const { trigger, appointment_id, client_id, organization_id, custom_message } = payload;

    if (!organization_id || !trigger) {
      return new Response(
        JSON.stringify({ error: 'organization_id and trigger are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the notification template for this trigger
    const { data: template, error: templateError } = await supabase
      .from('notification_templates')
      .select('*')
      .eq('organization_id', organization_id)
      .eq('trigger', trigger)
      .eq('is_active', true)
      .single();

    if (templateError || !template) {
      // No active template for this trigger - skip silently
      return new Response(
        JSON.stringify({ success: true, message: 'No active template for this trigger' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if WhatsApp integration is active
    const { data: integration } = await supabase
      .from('n8n_integrations')
      .select('*')
      .eq('organization_id', organization_id)
      .eq('is_active', true)
      .single();

    if (!integration?.webhook_url) {
      return new Response(
        JSON.stringify({ success: true, message: 'No active integration' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get appointment details if appointment_id is provided
    let appointmentData: Record<string, unknown> | null = null;
    let clientData: Record<string, unknown> | null = null;
    let serviceData: Record<string, unknown> | null = null;
    let barberData: Record<string, unknown> | null = null;

    if (appointment_id) {
      const { data: appointment } = await supabase
        .from('appointments')
        .select(`
          *,
          client:clients(*),
          service:services(*),
          barber:profiles(*)
        `)
        .eq('id', appointment_id)
        .single();

      if (appointment) {
        appointmentData = appointment;
        clientData = appointment.client;
        serviceData = appointment.service;
        barberData = appointment.barber;
      }
    } else if (client_id) {
      // Get client directly if no appointment
      const { data: client } = await supabase
        .from('clients')
        .select('*')
        .eq('id', client_id)
        .single();
      
      clientData = client;
    }

    // Validate we have client data with phone
    if (!clientData?.phone) {
      return new Response(
        JSON.stringify({ success: true, message: 'Client has no phone number' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get organization info for templating
    const { data: org } = await supabase
      .from('organizations')
      .select('name, phone')
      .eq('id', organization_id)
      .single();

    // Process message template with variables
    let message = custom_message || template.message_template;
    
    const appointmentTime = appointmentData?.start_time 
      ? new Date(appointmentData.start_time as string).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      : '';
    const appointmentDate = appointmentData?.start_time
      ? new Date(appointmentData.start_time as string).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
      : '';

    // Replace template variables
    const replacements: Record<string, string> = {
      '{{client_name}}': (clientData?.name as string) || 'Cliente',
      '{{service_name}}': (serviceData?.name as string) || 'Serviço',
      '{{barber_name}}': (barberData?.full_name as string) || 'Profissional',
      '{{appointment_time}}': appointmentTime,
      '{{appointment_date}}': appointmentDate,
      '{{organization_name}}': org?.name || 'Barbearia',
      '{{organization_phone}}': org?.phone || '',
      '{{price}}': appointmentData?.price 
        ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(appointmentData.price as number)
        : '',
    };

    for (const [key, value] of Object.entries(replacements)) {
      message = message.replace(new RegExp(key, 'g'), value);
    }

    // Create notification log entry
    const { data: logEntry, error: logError } = await supabase
      .from('notification_logs')
      .insert({
        organization_id,
        template_id: template.id,
        client_id: clientData?.id as string || null,
        appointment_id: appointment_id || null,
        trigger: trigger,
        message_content: message,
        phone_number: clientData.phone as string,
        status: 'pending',
      })
      .select()
      .single();

    if (logError) {
      console.error('Failed to create notification log:', logError);
      return new Response(
        JSON.stringify({ error: 'Failed to create notification log' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Send to n8n webhook
    try {
      const webhookPayload: N8nWebhookPayload = {
        type: 'notification',
        trigger,
        organization_id,
        phone_number: clientData.phone as string,
        message,
        client_name: clientData?.name as string,
        service_name: serviceData?.name as string,
        barber_name: barberData?.full_name as string,
        appointment_time: appointmentTime,
        appointment_date: appointmentDate,
        notification_log_id: logEntry.id,
      };

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(integration.webhook_url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(webhookPayload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        // Update log as sent
        await supabase
          .from('notification_logs')
          .update({
            status: 'sent',
            sent_at: new Date().toISOString(),
          })
          .eq('id', logEntry.id);

        return new Response(
          JSON.stringify({ success: true, notification_log_id: logEntry.id }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } else {
        // Update log as failed
        await supabase
          .from('notification_logs')
          .update({
            status: 'failed',
            error_message: `Webhook returned ${response.status}`,
          })
          .eq('id', logEntry.id);

        return new Response(
          JSON.stringify({ success: false, error: 'Webhook failed' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } catch (webhookError) {
      const errorMessage = webhookError instanceof Error ? webhookError.message : 'Unknown error';
      
      // Update log as failed
      await supabase
        .from('notification_logs')
        .update({
          status: 'failed',
          error_message: errorMessage,
        })
        .eq('id', logEntry.id);

      return new Response(
        JSON.stringify({ success: false, error: errorMessage }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error('Send notification error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
