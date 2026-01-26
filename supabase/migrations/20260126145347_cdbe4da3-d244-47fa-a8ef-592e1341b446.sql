-- =====================================================
-- FIX: Restrict barber access to clients with ACTIVE appointments only
-- Status: scheduled, confirmed, or in_progress
-- This prevents data harvesting when barber is leaving
-- =====================================================

-- Drop the existing permanent-access policies for barbers
DROP POLICY IF EXISTS "Barbers can view served clients" ON public.clients;
DROP POLICY IF EXISTS "Barbers can update served clients" ON public.clients;

-- Barbers: Can only view clients with ACTIVE appointments (scheduled, confirmed, in_progress)
CREATE POLICY "Barbers can view active appointment clients"
ON public.clients FOR SELECT
TO authenticated
USING (
  organization_id = get_user_organization_id(auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.appointments
    WHERE appointments.client_id = clients.id
    AND appointments.barber_id = auth.uid()
    AND appointments.status IN ('scheduled', 'confirmed', 'in_progress')
  )
);

-- Barbers: Can only update clients with ACTIVE appointments
CREATE POLICY "Barbers can update active appointment clients"
ON public.clients FOR UPDATE
TO authenticated
USING (
  organization_id = get_user_organization_id(auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.appointments
    WHERE appointments.client_id = clients.id
    AND appointments.barber_id = auth.uid()
    AND appointments.status IN ('scheduled', 'confirmed', 'in_progress')
  )
)
WITH CHECK (organization_id = get_user_organization_id(auth.uid()));