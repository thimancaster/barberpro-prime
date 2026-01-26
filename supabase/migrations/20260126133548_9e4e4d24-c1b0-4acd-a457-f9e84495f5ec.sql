-- =====================================================
-- FIX 1: clients table - Contextual PII access
-- Admins see all; Barbers see only clients they've served
-- =====================================================

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Users can view clients in their organization" ON public.clients;
DROP POLICY IF EXISTS "Users can manage clients in their organization" ON public.clients;

-- Admin: Full access to all client data in their organization
CREATE POLICY "Admins can view all clients"
ON public.clients FOR SELECT
TO authenticated
USING (
  organization_id = get_user_organization_id(auth.uid())
  AND is_admin(auth.uid())
);

-- Barbers: Can only view clients they have served (via appointments)
CREATE POLICY "Barbers can view served clients"
ON public.clients FOR SELECT
TO authenticated
USING (
  organization_id = get_user_organization_id(auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.appointments
    WHERE appointments.client_id = clients.id
    AND appointments.barber_id = auth.uid()
  )
);

-- Insert policy: All authenticated users in org can create clients
CREATE POLICY "Users can create clients in their organization"
ON public.clients FOR INSERT
TO authenticated
WITH CHECK (organization_id = get_user_organization_id(auth.uid()));

-- Update policy: Admins can update any client, barbers can update their served clients
CREATE POLICY "Admins can update all clients"
ON public.clients FOR UPDATE
TO authenticated
USING (
  organization_id = get_user_organization_id(auth.uid())
  AND is_admin(auth.uid())
)
WITH CHECK (organization_id = get_user_organization_id(auth.uid()));

CREATE POLICY "Barbers can update served clients"
ON public.clients FOR UPDATE
TO authenticated
USING (
  organization_id = get_user_organization_id(auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.appointments
    WHERE appointments.client_id = clients.id
    AND appointments.barber_id = auth.uid()
  )
)
WITH CHECK (organization_id = get_user_organization_id(auth.uid()));

-- Delete policy: Only admins can delete clients
CREATE POLICY "Admins can delete clients"
ON public.clients FOR DELETE
TO authenticated
USING (
  organization_id = get_user_organization_id(auth.uid())
  AND is_admin(auth.uid())
);

-- =====================================================
-- FIX 2: notification_logs table - Contextual access
-- Admins see all; Barbers see only logs for their appointments
-- =====================================================

-- Drop existing overly permissive policy
DROP POLICY IF EXISTS "Users can view notification logs in their organization" ON public.notification_logs;

-- Admin: Full access to all notification logs in their organization
CREATE POLICY "Admins can view all notification logs"
ON public.notification_logs FOR SELECT
TO authenticated
USING (
  organization_id = get_user_organization_id(auth.uid())
  AND is_admin(auth.uid())
);

-- Barbers: Can only view logs related to their appointments
CREATE POLICY "Barbers can view their appointment notification logs"
ON public.notification_logs FOR SELECT
TO authenticated
USING (
  organization_id = get_user_organization_id(auth.uid())
  AND (
    -- Direct appointment reference
    appointment_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.appointments
      WHERE appointments.id = notification_logs.appointment_id
      AND appointments.barber_id = auth.uid()
    )
    -- Or client reference (for clients they've served)
    OR (
      client_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.appointments
        WHERE appointments.client_id = notification_logs.client_id
        AND appointments.barber_id = auth.uid()
      )
    )
  )
);