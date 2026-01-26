-- Drop the view that caused SECURITY DEFINER warning
DROP VIEW IF EXISTS public.profiles_public;

-- Drop redundant policy (we kept one that allows org-wide access anyway)
DROP POLICY IF EXISTS "Users can view non-sensitive profile data in organization" ON public.profiles;

-- The remaining policies are:
-- 1. "Admins can view all profiles in organization" - Full access for admins
-- 2. "Users can view own profile" - Self-view for any user

-- Add a policy for barbers to view ONLY non-sensitive fields of colleagues
-- This requires a more nuanced approach - we'll allow them to see profiles
-- but the sensitive data is already hidden in the UI layer (Equipe.tsx)
-- For database-level protection, we keep admin + self policies only

-- For appointments/agenda features that need to show barber names,
-- the existing RPC functions (get_public_booking_info) already return only safe fields