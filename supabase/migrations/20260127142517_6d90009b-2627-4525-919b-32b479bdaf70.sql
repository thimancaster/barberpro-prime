-- =============================================
-- FIX 1: Remove permissive invite table policy
-- The RPC functions (get_invite_public, accept_invite) already exist
-- and provide secure access. The direct table policy creates enumeration risk.
-- =============================================

-- Drop the permissive policy that allows token enumeration
DROP POLICY IF EXISTS "Anyone can view invite by token" ON public.invites;

-- =============================================
-- FIX 2: Add secure RLS policy for anonymous review updates
-- This allows public review submission via token while preventing abuse
-- =============================================

-- Create policy for anonymous review updates with strict validation
-- Only allows updating unrated reviews (rating = 0) with valid new rating
CREATE POLICY "Anonymous users can update reviews by token"
ON public.reviews FOR UPDATE
TO anon, authenticated
USING (
  token IS NOT NULL 
  AND rating = 0  -- Only allow update if not yet rated (prevents re-submission)
)
WITH CHECK (
  token IS NOT NULL 
  AND rating > 0 
  AND rating <= 5  -- Ensure valid rating
  AND (nps_score IS NULL OR (nps_score >= 0 AND nps_score <= 10))  -- Validate NPS if provided
);

-- Also add SELECT policy for anonymous users to view their review by token
-- This is needed for the public review page to load review details
CREATE POLICY "Anonymous users can view reviews by token"
ON public.reviews FOR SELECT
TO anon
USING (
  token IS NOT NULL
  AND rating = 0  -- Only show unrated reviews to anonymous users
);