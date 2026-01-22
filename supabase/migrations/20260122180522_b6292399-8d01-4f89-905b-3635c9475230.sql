-- Fix 1: DEFINER_OR_RPC_BYPASS - Make helper functions only check the current user
-- This prevents information leakage about other users' roles/orgs

-- Update is_admin to only return true for the caller
CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    -- Only allow checking if the passed user_id matches the authenticated user
    WHEN _user_id = auth.uid() THEN (
      SELECT EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = _user_id AND role = 'admin'
      )
    )
    -- For RLS policy evaluation where caller matches, still allow
    WHEN auth.uid() IS NULL THEN false
    -- For any other case, check if caller is querying themselves in org context
    ELSE (
      -- Allow same-org admins to check other users in their org
      SELECT EXISTS (
        SELECT 1 FROM public.user_roles ur
        JOIN public.profiles p ON p.id = ur.user_id
        WHERE ur.user_id = auth.uid() 
        AND ur.role = 'admin'
        AND p.organization_id = (
          SELECT organization_id FROM public.profiles WHERE id = _user_id
        )
      )
    )
  END;
$$;

-- Update has_role to restrict checking other users
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    -- Only allow checking if the passed user_id matches the authenticated user
    WHEN _user_id = auth.uid() THEN (
      SELECT EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = _user_id AND role = _role
      )
    )
    WHEN auth.uid() IS NULL THEN false
    -- Allow same-org admins to check other users in their org
    ELSE (
      SELECT EXISTS (
        SELECT 1 FROM public.user_roles ur
        JOIN public.profiles p ON p.id = ur.user_id
        WHERE ur.user_id = auth.uid() 
        AND ur.role = 'admin'
        AND p.organization_id = (
          SELECT organization_id FROM public.profiles WHERE id = _user_id
        )
      ) AND EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = _user_id AND role = _role
      )
    )
  END;
$$;

-- Update get_user_organization_id to only return for the caller or same-org members
CREATE OR REPLACE FUNCTION public.get_user_organization_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    -- Always allow checking own org
    WHEN _user_id = auth.uid() THEN (
      SELECT organization_id FROM public.profiles WHERE id = _user_id LIMIT 1
    )
    -- Allow same-org members to get org_id of others in their org
    ELSE (
      SELECT p.organization_id 
      FROM public.profiles p
      WHERE p.id = _user_id
      AND p.organization_id = (
        SELECT organization_id FROM public.profiles WHERE id = auth.uid()
      )
      LIMIT 1
    )
  END;
$$;

-- Update user_belongs_to_org to restrict checking other users
CREATE OR REPLACE FUNCTION public.user_belongs_to_org(_user_id UUID, _org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    -- Always allow checking self
    WHEN _user_id = auth.uid() THEN (
      SELECT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = _user_id AND organization_id = _org_id
      )
    )
    -- Allow same-org members to check others in their org
    ELSE (
      SELECT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND organization_id = _org_id
      ) AND EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = _user_id AND organization_id = _org_id
      )
    )
  END;
$$;

-- Fix 4: CLIENT_SIDE_AUTH - Create secure onboarding RPC function
-- This prevents users from self-assigning admin roles outside intended flows

CREATE OR REPLACE FUNCTION public.create_organization(
  _org_name TEXT,
  _org_slug TEXT,
  _org_phone TEXT DEFAULT NULL,
  _org_email TEXT DEFAULT NULL,
  _org_address TEXT DEFAULT NULL,
  _opening_time TIME DEFAULT '09:00',
  _closing_time TIME DEFAULT '19:00',
  _user_full_name TEXT DEFAULT NULL,
  _user_phone TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_org_id UUID;
  v_existing_org UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  -- Check if user already has an organization
  SELECT organization_id INTO v_existing_org
  FROM public.profiles WHERE id = v_user_id;
  
  IF v_existing_org IS NOT NULL THEN
    RAISE EXCEPTION 'user_already_has_organization';
  END IF;

  -- Check slug uniqueness
  IF EXISTS (SELECT 1 FROM public.organizations WHERE slug = _org_slug) THEN
    RAISE EXCEPTION 'slug_already_exists';
  END IF;

  -- Create organization
  INSERT INTO public.organizations (name, slug, phone, email, address, opening_time, closing_time, working_days)
  VALUES (_org_name, _org_slug, _org_phone, _org_email, _org_address, _opening_time, _closing_time, ARRAY[1,2,3,4,5,6])
  RETURNING id INTO v_org_id;

  -- Create profile
  INSERT INTO public.profiles (id, organization_id, full_name, phone, commission_percentage, is_active)
  VALUES (v_user_id, v_org_id, COALESCE(_user_full_name, 'Admin'), _user_phone, 100, true)
  ON CONFLICT (id) DO UPDATE
    SET organization_id = EXCLUDED.organization_id,
        full_name = EXCLUDED.full_name,
        phone = EXCLUDED.phone;

  -- Assign admin role (only allowed for org creator via this function)
  INSERT INTO public.user_roles (user_id, organization_id, role)
  VALUES (v_user_id, v_org_id, 'admin')
  ON CONFLICT (user_id, organization_id) DO NOTHING;

  -- Create default working hours (Mon-Sat active, Sunday off)
  INSERT INTO public.working_hours (profile_id, day_of_week, start_time, end_time, is_working)
  SELECT 
    v_user_id,
    day,
    _opening_time,
    _closing_time,
    day != 0 -- Sunday is not working by default
  FROM generate_series(0, 6) AS day
  ON CONFLICT DO NOTHING;

  RETURN v_org_id;
END;
$$;