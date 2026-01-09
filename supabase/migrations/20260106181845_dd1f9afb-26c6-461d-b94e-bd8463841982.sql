-- Adicionar campos específicos de barbearia na tabela leads
ALTER TABLE public.leads 
  ADD COLUMN IF NOT EXISTS preferred_barber text,
  ADD COLUMN IF NOT EXISTS subscription_plan text,
  ADD COLUMN IF NOT EXISTS subscription_status text DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS subscription_started_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS subscription_expires_at timestamp with time zone;

-- Criar tabela de serviços da barbearia
CREATE TABLE IF NOT EXISTS public.services (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  duration_minutes integer NOT NULL DEFAULT 30,
  price numeric NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active services" ON public.services 
  FOR SELECT USING (is_active = true);

CREATE POLICY "Authenticated users can manage services" ON public.services 
  FOR ALL USING (true) WITH CHECK (true);

-- Criar tabela de agendamentos
CREATE TABLE IF NOT EXISTS public.appointments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  service_id uuid NOT NULL REFERENCES public.services(id),
  barber_id uuid REFERENCES public.profiles(id),
  scheduled_at timestamp with time zone NOT NULL,
  status text NOT NULL DEFAULT 'scheduled',
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view appointments" ON public.appointments 
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage appointments" ON public.appointments 
  FOR ALL USING (true) WITH CHECK (true);

-- Trigger para updated_at
CREATE TRIGGER update_appointments_updated_at
  BEFORE UPDATE ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Criar tabela de planos de assinatura
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  price numeric NOT NULL,
  duration_days integer NOT NULL DEFAULT 30,
  services_included text[] DEFAULT '{}',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active plans" ON public.subscription_plans 
  FOR SELECT USING (is_active = true);

CREATE POLICY "Authenticated users can manage plans" ON public.subscription_plans 
  FOR ALL USING (true) WITH CHECK (true);

-- Inserir serviços padrão
INSERT INTO public.services (name, description, duration_minutes, price) VALUES
  ('Corte Masculino', 'Corte de cabelo tradicional', 30, 35.00),
  ('Barba', 'Aparo e modelagem de barba', 20, 25.00),
  ('Corte + Barba', 'Combo corte e barba', 45, 55.00),
  ('Corte Infantil', 'Corte para crianças até 12 anos', 25, 30.00),
  ('Pigmentação', 'Coloração e disfarce', 40, 45.00),
  ('Hidratação', 'Tratamento capilar', 30, 35.00);

-- Inserir planos de assinatura padrão
INSERT INTO public.subscription_plans (name, description, price, duration_days, services_included) VALUES
  ('Plano Básico', '2 cortes por mês', 60.00, 30, ARRAY['Corte Masculino']),
  ('Plano Premium', '4 cortes + 2 barbas por mês', 120.00, 30, ARRAY['Corte Masculino', 'Barba']),
  ('Plano VIP', 'Serviços ilimitados', 200.00, 30, ARRAY['Corte Masculino', 'Barba', 'Corte + Barba', 'Hidratação']);