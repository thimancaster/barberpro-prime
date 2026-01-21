-- =============================================
-- BARBERPRO PRIME - COMPLETE DATABASE SCHEMA
-- =============================================

-- 1. ENUM TYPES
CREATE TYPE public.app_role AS ENUM ('admin', 'barber');
CREATE TYPE public.appointment_status AS ENUM ('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show');
CREATE TYPE public.service_category AS ENUM ('cabelo', 'barba', 'combo', 'outros');
CREATE TYPE public.expense_status AS ENUM ('pending', 'paid');
CREATE TYPE public.stock_movement_type AS ENUM ('entry', 'exit', 'sale', 'adjustment');

-- 2. ORGANIZATIONS TABLE
CREATE TABLE public.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    logo_url TEXT,
    address TEXT,
    phone TEXT,
    email TEXT,
    opening_time TIME DEFAULT '09:00',
    closing_time TIME DEFAULT '19:00',
    working_days INTEGER[] DEFAULT ARRAY[1,2,3,4,5,6],
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. PROFILES TABLE (linked to auth.users)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
    full_name TEXT NOT NULL,
    avatar_url TEXT,
    phone TEXT,
    commission_percentage NUMERIC(5,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. USER_ROLES TABLE (separate from profiles for security)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'barber',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, organization_id)
);

-- 5. WORKING_HOURS TABLE
CREATE TABLE public.working_hours (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_working BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (profile_id, day_of_week)
);

-- 6. SERVICES TABLE
CREATE TABLE public.services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC(10,2) NOT NULL,
    duration_minutes INTEGER NOT NULL DEFAULT 30,
    commission_percentage NUMERIC(5,2) DEFAULT 0,
    category service_category DEFAULT 'outros',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. CLIENTS TABLE
CREATE TABLE public.clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    notes TEXT,
    total_spent NUMERIC(10,2) DEFAULT 0,
    total_visits INTEGER DEFAULT 0,
    last_visit_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. APPOINTMENTS TABLE
CREATE TABLE public.appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
    client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
    barber_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    status appointment_status DEFAULT 'scheduled',
    price NUMERIC(10,2) NOT NULL,
    commission_amount NUMERIC(10,2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 9. PRODUCTS TABLE
CREATE TABLE public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    sale_price NUMERIC(10,2) NOT NULL,
    cost_price NUMERIC(10,2) DEFAULT 0,
    quantity INTEGER DEFAULT 0,
    min_quantity INTEGER DEFAULT 5,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 10. STOCK_MOVEMENTS TABLE
CREATE TABLE public.stock_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
    type stock_movement_type NOT NULL,
    quantity INTEGER NOT NULL,
    previous_quantity INTEGER NOT NULL,
    new_quantity INTEGER NOT NULL,
    reason TEXT,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 11. EXPENSES TABLE
CREATE TABLE public.expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    amount NUMERIC(10,2) NOT NULL,
    category TEXT,
    due_date DATE,
    paid_at TIMESTAMPTZ,
    status expense_status DEFAULT 'pending',
    is_recurring BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 12. N8N_INTEGRATIONS TABLE
CREATE TABLE public.n8n_integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL UNIQUE,
    webhook_url TEXT,
    whatsapp_instance_id TEXT,
    is_active BOOLEAN DEFAULT false,
    last_test_at TIMESTAMPTZ,
    last_test_success BOOLEAN,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 13. INVITES TABLE
CREATE TABLE public.invites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
    email TEXT,
    role app_role DEFAULT 'barber',
    token TEXT UNIQUE NOT NULL DEFAULT gen_random_uuid()::text,
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
    accepted_at TIMESTAMPTZ,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- SECURITY DEFINER FUNCTIONS
-- =============================================

-- Function to check if user has a specific role in an organization
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = _user_id
          AND role = _role
    )
$$;

-- Function to check if user is admin in any organization
CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = _user_id
          AND role = 'admin'
    )
$$;

-- Function to get user's organization_id
CREATE OR REPLACE FUNCTION public.get_user_organization_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT organization_id
    FROM public.profiles
    WHERE id = _user_id
    LIMIT 1
$$;

-- Function to check if user belongs to organization
CREATE OR REPLACE FUNCTION public.user_belongs_to_org(_user_id UUID, _org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = _user_id
          AND organization_id = _org_id
    )
$$;

-- =============================================
-- ROW LEVEL SECURITY POLICIES
-- =============================================

-- Enable RLS on all tables
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.working_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.n8n_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invites ENABLE ROW LEVEL SECURITY;

-- ORGANIZATIONS POLICIES
CREATE POLICY "Users can view their organization"
ON public.organizations FOR SELECT
TO authenticated
USING (id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "Admins can update their organization"
ON public.organizations FOR UPDATE
TO authenticated
USING (id = public.get_user_organization_id(auth.uid()) AND public.is_admin(auth.uid()));

-- PROFILES POLICIES
CREATE POLICY "Users can view profiles in their organization"
ON public.profiles FOR SELECT
TO authenticated
USING (organization_id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (id = auth.uid());

CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (id = auth.uid());

-- USER_ROLES POLICIES
CREATE POLICY "Users can view roles in their organization"
ON public.user_roles FOR SELECT
TO authenticated
USING (organization_id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "Admins can manage roles in their organization"
ON public.user_roles FOR ALL
TO authenticated
USING (organization_id = public.get_user_organization_id(auth.uid()) AND public.is_admin(auth.uid()));

-- WORKING_HOURS POLICIES
CREATE POLICY "Users can view working hours in their organization"
ON public.working_hours FOR SELECT
TO authenticated
USING (profile_id IN (
    SELECT id FROM public.profiles 
    WHERE organization_id = public.get_user_organization_id(auth.uid())
));

CREATE POLICY "Users can manage their own working hours"
ON public.working_hours FOR ALL
TO authenticated
USING (profile_id = auth.uid());

CREATE POLICY "Admins can manage all working hours"
ON public.working_hours FOR ALL
TO authenticated
USING (public.is_admin(auth.uid()));

-- SERVICES POLICIES
CREATE POLICY "Users can view services in their organization"
ON public.services FOR SELECT
TO authenticated
USING (organization_id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "Admins can manage services"
ON public.services FOR ALL
TO authenticated
USING (organization_id = public.get_user_organization_id(auth.uid()) AND public.is_admin(auth.uid()));

-- CLIENTS POLICIES
CREATE POLICY "Users can view clients in their organization"
ON public.clients FOR SELECT
TO authenticated
USING (organization_id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "Users can manage clients in their organization"
ON public.clients FOR ALL
TO authenticated
USING (organization_id = public.get_user_organization_id(auth.uid()));

-- APPOINTMENTS POLICIES
CREATE POLICY "Users can view appointments in their organization"
ON public.appointments FOR SELECT
TO authenticated
USING (organization_id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "Users can create appointments"
ON public.appointments FOR INSERT
TO authenticated
WITH CHECK (organization_id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "Barbers can update their own appointments"
ON public.appointments FOR UPDATE
TO authenticated
USING (
    organization_id = public.get_user_organization_id(auth.uid()) 
    AND (barber_id = auth.uid() OR public.is_admin(auth.uid()))
);

CREATE POLICY "Admins can delete appointments"
ON public.appointments FOR DELETE
TO authenticated
USING (organization_id = public.get_user_organization_id(auth.uid()) AND public.is_admin(auth.uid()));

-- PRODUCTS POLICIES
CREATE POLICY "Users can view products in their organization"
ON public.products FOR SELECT
TO authenticated
USING (organization_id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "Admins can manage products"
ON public.products FOR ALL
TO authenticated
USING (organization_id = public.get_user_organization_id(auth.uid()) AND public.is_admin(auth.uid()));

-- STOCK_MOVEMENTS POLICIES
CREATE POLICY "Users can view stock movements in their organization"
ON public.stock_movements FOR SELECT
TO authenticated
USING (organization_id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "Users can create stock movements"
ON public.stock_movements FOR INSERT
TO authenticated
WITH CHECK (organization_id = public.get_user_organization_id(auth.uid()));

-- EXPENSES POLICIES
CREATE POLICY "Users can view expenses in their organization"
ON public.expenses FOR SELECT
TO authenticated
USING (organization_id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "Admins can manage expenses"
ON public.expenses FOR ALL
TO authenticated
USING (organization_id = public.get_user_organization_id(auth.uid()) AND public.is_admin(auth.uid()));

-- N8N_INTEGRATIONS POLICIES
CREATE POLICY "Users can view n8n config in their organization"
ON public.n8n_integrations FOR SELECT
TO authenticated
USING (organization_id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "Admins can manage n8n config"
ON public.n8n_integrations FOR ALL
TO authenticated
USING (organization_id = public.get_user_organization_id(auth.uid()) AND public.is_admin(auth.uid()));

-- INVITES POLICIES
CREATE POLICY "Admins can view invites in their organization"
ON public.invites FOR SELECT
TO authenticated
USING (organization_id = public.get_user_organization_id(auth.uid()) AND public.is_admin(auth.uid()));

CREATE POLICY "Admins can manage invites"
ON public.invites FOR ALL
TO authenticated
USING (organization_id = public.get_user_organization_id(auth.uid()) AND public.is_admin(auth.uid()));

CREATE POLICY "Anyone can view invite by token"
ON public.invites FOR SELECT
TO anon, authenticated
USING (token IS NOT NULL AND expires_at > now() AND accepted_at IS NULL);

-- =============================================
-- TRIGGERS & FUNCTIONS
-- =============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_organizations_updated_at
    BEFORE UPDATE ON public.organizations
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_services_updated_at
    BEFORE UPDATE ON public.services
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_clients_updated_at
    BEFORE UPDATE ON public.clients
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at
    BEFORE UPDATE ON public.appointments
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON public.products
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_expenses_updated_at
    BEFORE UPDATE ON public.expenses
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_n8n_integrations_updated_at
    BEFORE UPDATE ON public.n8n_integrations
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Update client stats after appointment completion
CREATE OR REPLACE FUNCTION public.update_client_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
        UPDATE public.clients
        SET 
            total_spent = total_spent + NEW.price,
            total_visits = total_visits + 1,
            last_visit_at = NEW.end_time
        WHERE id = NEW.client_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_client_stats_on_appointment
    AFTER INSERT OR UPDATE ON public.appointments
    FOR EACH ROW EXECUTE FUNCTION public.update_client_stats();

-- Update product quantity on stock movement
CREATE OR REPLACE FUNCTION public.update_product_quantity()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.products
    SET quantity = NEW.new_quantity
    WHERE id = NEW.product_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_product_quantity_on_movement
    AFTER INSERT ON public.stock_movements
    FOR EACH ROW EXECUTE FUNCTION public.update_product_quantity();

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

CREATE INDEX idx_profiles_organization ON public.profiles(organization_id);
CREATE INDEX idx_user_roles_user ON public.user_roles(user_id);
CREATE INDEX idx_user_roles_org ON public.user_roles(organization_id);
CREATE INDEX idx_services_organization ON public.services(organization_id);
CREATE INDEX idx_clients_organization ON public.clients(organization_id);
CREATE INDEX idx_appointments_organization ON public.appointments(organization_id);
CREATE INDEX idx_appointments_barber ON public.appointments(barber_id);
CREATE INDEX idx_appointments_client ON public.appointments(client_id);
CREATE INDEX idx_appointments_start_time ON public.appointments(start_time);
CREATE INDEX idx_products_organization ON public.products(organization_id);
CREATE INDEX idx_stock_movements_product ON public.stock_movements(product_id);
CREATE INDEX idx_expenses_organization ON public.expenses(organization_id);
CREATE INDEX idx_invites_token ON public.invites(token);
CREATE INDEX idx_invites_organization ON public.invites(organization_id);