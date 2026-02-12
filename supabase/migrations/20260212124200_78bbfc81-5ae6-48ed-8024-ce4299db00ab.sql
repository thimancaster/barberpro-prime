
-- Create super_admins table (separate from user_roles per security best practices)
CREATE TABLE public.super_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.super_admins ENABLE ROW LEVEL SECURITY;

-- Only super admins can read this table (no public access)
CREATE POLICY "Super admins can view super_admins table"
ON public.super_admins
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- RPC function to check if current user is super admin (SECURITY DEFINER to bypass RLS)
CREATE OR REPLACE FUNCTION public.check_is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.super_admins WHERE user_id = auth.uid()
  );
$$;

-- Insert the master account (thimancaster@hotmail.com) into super_admins
-- We need to look up the user_id from auth.users
INSERT INTO public.super_admins (user_id)
SELECT id FROM auth.users WHERE email = 'thimancaster@hotmail.com'
ON CONFLICT (user_id) DO NOTHING;
