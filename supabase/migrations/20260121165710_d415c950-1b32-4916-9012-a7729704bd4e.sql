-- Enable Realtime for appointments table
ALTER PUBLICATION supabase_realtime ADD TABLE appointments;

-- Insert seed data for admin user thimancaster@hotmail.com
-- User ID: ab5af0b5-c4c1-4058-b148-e43fed78d6c5

-- 1. Create organization
INSERT INTO public.organizations (id, name, slug, phone, email, opening_time, closing_time, working_days)
VALUES (
  'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  'Barber Prime',
  'barber-prime',
  '(11) 99999-9999',
  'thimancaster@hotmail.com',
  '09:00:00',
  '19:00:00',
  ARRAY[1, 2, 3, 4, 5, 6]
);

-- 2. Create profile for admin
INSERT INTO public.profiles (id, organization_id, full_name, phone, commission_percentage, is_active)
VALUES (
  'ab5af0b5-c4c1-4058-b148-e43fed78d6c5',
  'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  'Thiago Admin',
  '(11) 99999-9999',
  100,
  true
);

-- 3. Assign admin role
INSERT INTO public.user_roles (user_id, organization_id, role)
VALUES (
  'ab5af0b5-c4c1-4058-b148-e43fed78d6c5',
  'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  'admin'
);

-- 4. Create working hours for admin (Mon-Sat 09:00-19:00)
INSERT INTO public.working_hours (profile_id, day_of_week, start_time, end_time, is_working)
SELECT 
  'ab5af0b5-c4c1-4058-b148-e43fed78d6c5',
  d,
  '09:00:00',
  '19:00:00',
  true
FROM generate_series(1, 6) AS d;

-- Sunday off
INSERT INTO public.working_hours (profile_id, day_of_week, start_time, end_time, is_working)
VALUES ('ab5af0b5-c4c1-4058-b148-e43fed78d6c5', 0, '09:00:00', '19:00:00', false);

-- 5. Create sample services
INSERT INTO public.services (organization_id, name, description, price, duration_minutes, commission_percentage, category)
VALUES 
  ('f47ac10b-58cc-4372-a567-0e02b2c3d479', 'Corte Degradê', 'Corte moderno com degradê nas laterais', 45.00, 30, 50, 'cabelo'),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d479', 'Corte Tesoura', 'Corte clássico com tesoura', 40.00, 40, 50, 'cabelo'),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d479', 'Barba Completa', 'Barba com toalha quente e acabamento', 35.00, 25, 50, 'barba'),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d479', 'Combo Corte + Barba', 'Corte degradê com barba completa', 70.00, 50, 50, 'combo'),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d479', 'Sobrancelha', 'Design de sobrancelha masculina', 15.00, 10, 50, 'outros');

-- 6. Create sample clients
INSERT INTO public.clients (organization_id, name, phone, email, notes)
VALUES 
  ('f47ac10b-58cc-4372-a567-0e02b2c3d479', 'João Silva', '(11) 98888-1111', 'joao@email.com', 'Cliente frequente, prefere degradê baixo'),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d479', 'Carlos Oliveira', '(11) 98888-2222', 'carlos@email.com', 'Alérgico a alguns produtos'),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d479', 'Pedro Santos', '(11) 98888-3333', 'pedro@email.com', NULL);

-- 7. Create sample products
INSERT INTO public.products (organization_id, name, description, sale_price, cost_price, quantity, min_quantity)
VALUES 
  ('f47ac10b-58cc-4372-a567-0e02b2c3d479', 'Pomada Matte', 'Pomada modeladora efeito matte 150g', 45.00, 25.00, 15, 5),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d479', 'Óleo para Barba', 'Óleo hidratante para barba 30ml', 35.00, 18.00, 10, 3),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d479', 'Shampoo Barba', 'Shampoo específico para barba 200ml', 28.00, 12.00, 8, 3);