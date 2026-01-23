-- Security: Add deny policies for anon access on sensitive tables

-- Deny anonymous access to clients table (contains PII)
CREATE POLICY "Deny anonymous access to clients"
ON public.clients
FOR SELECT
TO anon
USING (false);

-- Deny anonymous access to profiles table (contains PII)
CREATE POLICY "Deny anonymous access to profiles"
ON public.profiles
FOR SELECT
TO anon
USING (false);

-- Deny anonymous access to appointments table (contains financial data)
CREATE POLICY "Deny anonymous access to appointments"
ON public.appointments
FOR SELECT
TO anon
USING (false);

-- Deny anonymous access to organizations (will use RPC for public booking)
CREATE POLICY "Deny anonymous access to organizations"
ON public.organizations
FOR SELECT
TO anon
USING (false);

-- Deny anonymous access to services (will use RPC for public booking)
CREATE POLICY "Deny anonymous access to services"
ON public.services
FOR SELECT
TO anon
USING (false);

-- Deny anonymous access to working_hours (will use RPC for public booking)
CREATE POLICY "Deny anonymous access to working_hours"
ON public.working_hours
FOR SELECT
TO anon
USING (false);

-- =====================================================
-- Secure RPC function for public booking data
-- =====================================================

-- Function to get public booking info by org slug
CREATE OR REPLACE FUNCTION public.get_public_booking_info(_org_slug TEXT)
RETURNS JSON
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_org_id UUID;
  v_result JSON;
BEGIN
  -- Get org ID from slug
  SELECT id INTO v_org_id
  FROM public.organizations
  WHERE slug = _org_slug;
  
  IF v_org_id IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Return only necessary public data (no sensitive info)
  SELECT json_build_object(
    'organization', json_build_object(
      'id', o.id,
      'name', o.name,
      'slug', o.slug,
      'address', o.address,
      'phone', o.phone,
      'logo_url', o.logo_url,
      'opening_time', o.opening_time,
      'closing_time', o.closing_time,
      'working_days', o.working_days
    ),
    'services', COALESCE((
      SELECT json_agg(json_build_object(
        'id', s.id,
        'name', s.name,
        'description', s.description,
        'price', s.price,
        'duration_minutes', s.duration_minutes,
        'category', s.category
      ))
      FROM public.services s
      WHERE s.organization_id = v_org_id AND s.is_active = true
    ), '[]'::json),
    'barbers', COALESCE((
      SELECT json_agg(json_build_object(
        'id', p.id,
        'full_name', p.full_name,
        'avatar_url', p.avatar_url
      ))
      FROM public.profiles p
      WHERE p.organization_id = v_org_id AND p.is_active = true
    ), '[]'::json)
  ) INTO v_result
  FROM public.organizations o
  WHERE o.id = v_org_id;
  
  RETURN v_result;
END;
$$;

-- Function to get available times for a barber on a specific date
CREATE OR REPLACE FUNCTION public.get_public_available_times(
  _org_slug TEXT,
  _barber_id UUID,
  _date TEXT,
  _duration_minutes INTEGER
)
RETURNS JSON
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_org_id UUID;
  v_working_hours RECORD;
  v_appointments JSON;
BEGIN
  -- Validate org exists
  SELECT id INTO v_org_id
  FROM public.organizations
  WHERE slug = _org_slug;
  
  IF v_org_id IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Validate barber belongs to org
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = _barber_id 
    AND organization_id = v_org_id 
    AND is_active = true
  ) THEN
    RETURN NULL;
  END IF;
  
  -- Get working hours for the day
  SELECT start_time, end_time, is_working INTO v_working_hours
  FROM public.working_hours
  WHERE profile_id = _barber_id
  AND day_of_week = EXTRACT(DOW FROM _date::DATE)::INTEGER;
  
  -- Get existing appointments (only times needed, no sensitive data)
  SELECT json_agg(json_build_object(
    'start_time', a.start_time,
    'end_time', a.end_time
  )) INTO v_appointments
  FROM public.appointments a
  WHERE a.barber_id = _barber_id
  AND a.organization_id = v_org_id
  AND a.start_time::DATE = _date::DATE
  AND a.status NOT IN ('cancelled', 'no_show');
  
  RETURN json_build_object(
    'working_hours', CASE WHEN v_working_hours IS NOT NULL THEN json_build_object(
      'start_time', v_working_hours.start_time,
      'end_time', v_working_hours.end_time,
      'is_working', v_working_hours.is_working
    ) ELSE NULL END,
    'appointments', COALESCE(v_appointments, '[]'::json)
  );
END;
$$;

-- Function to create a public booking
CREATE OR REPLACE FUNCTION public.create_public_booking(
  _org_slug TEXT,
  _service_id UUID,
  _barber_id UUID,
  _start_time TIMESTAMPTZ,
  _end_time TIMESTAMPTZ,
  _client_name TEXT,
  _client_phone TEXT,
  _client_email TEXT DEFAULT NULL,
  _notes TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_org_id UUID;
  v_client_id UUID;
  v_service RECORD;
  v_appointment_id UUID;
BEGIN
  -- Validate org
  SELECT id INTO v_org_id
  FROM public.organizations
  WHERE slug = _org_slug;
  
  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'organization_not_found';
  END IF;
  
  -- Validate service belongs to org
  SELECT id, price, duration_minutes INTO v_service
  FROM public.services
  WHERE id = _service_id
  AND organization_id = v_org_id
  AND is_active = true;
  
  IF v_service.id IS NULL THEN
    RAISE EXCEPTION 'service_not_found';
  END IF;
  
  -- Validate barber belongs to org
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = _barber_id 
    AND organization_id = v_org_id 
    AND is_active = true
  ) THEN
    RAISE EXCEPTION 'barber_not_found';
  END IF;
  
  -- Check for time conflicts
  IF EXISTS (
    SELECT 1 FROM public.appointments
    WHERE barber_id = _barber_id
    AND organization_id = v_org_id
    AND status NOT IN ('cancelled', 'no_show')
    AND (
      (start_time <= _start_time AND end_time > _start_time) OR
      (start_time < _end_time AND end_time >= _end_time) OR
      (start_time >= _start_time AND end_time <= _end_time)
    )
  ) THEN
    RAISE EXCEPTION 'time_slot_unavailable';
  END IF;
  
  -- Validate inputs
  IF _client_name IS NULL OR LENGTH(TRIM(_client_name)) < 2 THEN
    RAISE EXCEPTION 'invalid_client_name';
  END IF;
  
  IF _client_phone IS NULL OR LENGTH(TRIM(_client_phone)) < 8 THEN
    RAISE EXCEPTION 'invalid_client_phone';
  END IF;
  
  -- Find or create client
  SELECT id INTO v_client_id
  FROM public.clients
  WHERE organization_id = v_org_id
  AND phone = _client_phone;
  
  IF v_client_id IS NULL THEN
    INSERT INTO public.clients (organization_id, name, phone, email, notes)
    VALUES (v_org_id, _client_name, _client_phone, _client_email, NULL)
    RETURNING id INTO v_client_id;
  END IF;
  
  -- Create appointment
  INSERT INTO public.appointments (
    organization_id,
    client_id,
    barber_id,
    service_id,
    start_time,
    end_time,
    price,
    status,
    notes
  ) VALUES (
    v_org_id,
    v_client_id,
    _barber_id,
    _service_id,
    _start_time,
    _end_time,
    v_service.price,
    'scheduled',
    _notes
  )
  RETURNING id INTO v_appointment_id;
  
  RETURN json_build_object(
    'success', true,
    'appointment_id', v_appointment_id
  );
END;
$$;

-- Grant execute to anon for public booking functions
GRANT EXECUTE ON FUNCTION public.get_public_booking_info TO anon;
GRANT EXECUTE ON FUNCTION public.get_public_available_times TO anon;
GRANT EXECUTE ON FUNCTION public.create_public_booking TO anon;