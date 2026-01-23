-- =====================================================
-- Fix 1: Enhanced organization slug validation
-- =====================================================

-- Drop and recreate create_organization with proper validation
CREATE OR REPLACE FUNCTION public.create_organization(
  _org_name text, 
  _org_slug text, 
  _org_phone text DEFAULT NULL::text, 
  _org_email text DEFAULT NULL::text, 
  _org_address text DEFAULT NULL::text, 
  _opening_time time without time zone DEFAULT '09:00:00'::time without time zone, 
  _closing_time time without time zone DEFAULT '19:00:00'::time without time zone, 
  _user_full_name text DEFAULT NULL::text, 
  _user_phone text DEFAULT NULL::text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id UUID;
  v_org_id UUID;
  v_existing_org UUID;
  v_reserved_slugs TEXT[] := ARRAY[
    'admin', 'api', 'auth', 'public', 'dashboard', 'login', 'signup', 
    'register', 'invite', 'book', 'agendar', 'assets', 'static', 'health', 'metrics',
    'settings', 'profile', 'help', 'support', 'about', 'contact',
    'terms', 'privacy', 'docs', 'blog', 'pricing', 'convite',
    'agenda', 'clientes', 'servicos', 'equipe', 'produtos', 'vendas',
    'caixa', 'comissoes', 'relatorios', 'despesas', 'configuracoes', 'integracoes'
  ];
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  -- Validate slug is not null or empty
  IF _org_slug IS NULL OR LENGTH(TRIM(_org_slug)) = 0 THEN
    RAISE EXCEPTION 'slug_required';
  END IF;

  -- Validate slug length (min 3, max 50)
  IF LENGTH(_org_slug) < 3 THEN
    RAISE EXCEPTION 'slug_too_short';
  END IF;
  
  IF LENGTH(_org_slug) > 50 THEN
    RAISE EXCEPTION 'slug_too_long';
  END IF;
  
  -- Validate slug format (lowercase alphanumeric and hyphens only, must start/end with alphanumeric)
  IF _org_slug !~ '^[a-z0-9]([a-z0-9-]*[a-z0-9])?$' THEN
    RAISE EXCEPTION 'slug_invalid_format';
  END IF;
  
  -- Prevent consecutive hyphens
  IF _org_slug ~ '--' THEN
    RAISE EXCEPTION 'slug_consecutive_hyphens';
  END IF;
  
  -- Check against reserved words
  IF _org_slug = ANY(v_reserved_slugs) THEN
    RAISE EXCEPTION 'slug_reserved';
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

-- =====================================================
-- Fix 2: Server-side commission validation triggers
-- =====================================================

-- Trigger function for appointment commission validation
CREATE OR REPLACE FUNCTION public.validate_appointment_commission()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  v_service RECORD;
  v_barber RECORD;
BEGIN
  -- Only validate if service_id is provided
  IF NEW.service_id IS NOT NULL THEN
    -- Get service details
    SELECT id, price, commission_percentage INTO v_service
    FROM public.services WHERE id = NEW.service_id;
    
    IF v_service.id IS NULL THEN
      RAISE EXCEPTION 'service_not_found';
    END IF;
    
    -- Override price with authoritative service price
    NEW.price := v_service.price;
    
    -- Get barber's commission percentage (if barber assigned)
    IF NEW.barber_id IS NOT NULL THEN
      SELECT commission_percentage INTO v_barber
      FROM public.profiles WHERE id = NEW.barber_id;
      
      -- Use barber's commission percentage, fallback to service's
      NEW.commission_amount := (NEW.price * COALESCE(v_barber.commission_percentage, v_service.commission_percentage, 0)) / 100;
    ELSE
      NEW.commission_amount := (NEW.price * COALESCE(v_service.commission_percentage, 0)) / 100;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for appointments
DROP TRIGGER IF EXISTS validate_appointment_commission_trigger ON public.appointments;
CREATE TRIGGER validate_appointment_commission_trigger
BEFORE INSERT OR UPDATE ON public.appointments
FOR EACH ROW
EXECUTE FUNCTION public.validate_appointment_commission();

-- Trigger function for product sale commission validation
CREATE OR REPLACE FUNCTION public.validate_product_sale_commission()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  v_product RECORD;
  v_barber RECORD;
  v_expected_total NUMERIC;
BEGIN
  -- Get product details
  SELECT id, sale_price INTO v_product
  FROM public.products WHERE id = NEW.product_id;
  
  IF v_product.id IS NULL THEN
    RAISE EXCEPTION 'product_not_found';
  END IF;
  
  -- Override unit_price with authoritative product price
  NEW.unit_price := v_product.sale_price;
  
  -- Calculate correct total price
  v_expected_total := v_product.sale_price * NEW.quantity;
  NEW.total_price := v_expected_total;
  
  -- Get barber commission percentage if barber assigned
  IF NEW.barber_id IS NOT NULL THEN
    SELECT 
      COALESCE(product_commission_percentage, commission_percentage, 0) AS comm_pct
    INTO v_barber
    FROM public.profiles WHERE id = NEW.barber_id;
    
    NEW.commission_percentage := COALESCE(v_barber.comm_pct, 0);
    NEW.commission_amount := (NEW.total_price * NEW.commission_percentage) / 100;
  ELSE
    NEW.commission_percentage := 0;
    NEW.commission_amount := 0;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for product_sales
DROP TRIGGER IF EXISTS validate_product_sale_commission_trigger ON public.product_sales;
CREATE TRIGGER validate_product_sale_commission_trigger
BEFORE INSERT OR UPDATE ON public.product_sales
FOR EACH ROW
EXECUTE FUNCTION public.validate_product_sale_commission();