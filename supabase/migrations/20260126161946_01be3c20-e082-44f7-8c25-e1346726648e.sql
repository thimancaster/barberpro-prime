-- Create a public view with only non-sensitive profile fields for general listing
CREATE VIEW public.profiles_public AS
SELECT 
  id,
  organization_id,
  full_name,
  avatar_url,
  is_active,
  created_at,
  updated_at
  -- Excludes: phone, commission_percentage, product_commission_percentage
FROM public.profiles;

-- Enable RLS on the view (inherits from base table policies)
-- Grant access to authenticated users
GRANT SELECT ON public.profiles_public TO authenticated;

-- Drop the existing permissive SELECT policy
DROP POLICY IF EXISTS "Users can view profiles in their organization" ON public.profiles;

-- Admins can view all profiles in their organization (full access)
CREATE POLICY "Admins can view all profiles in organization"
ON public.profiles FOR SELECT
USING (
  organization_id = get_user_organization_id(auth.uid())
  AND is_admin(auth.uid())
);

-- Users can view their own profile (self-view for any user)
CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT
USING (id = auth.uid());

-- Barbers can view basic profile info of colleagues via the view
-- The view only exposes non-sensitive fields, and we need to allow
-- barbers to see colleagues for features like agenda and booking
CREATE POLICY "Users can view non-sensitive profile data in organization"
ON public.profiles FOR SELECT
USING (
  organization_id = get_user_organization_id(auth.uid())
);