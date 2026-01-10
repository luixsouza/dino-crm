-- 
-- DinoCRM Full Consolidated Schema
-- Date: 2026-01-10
-- 

-- ========================================
-- 1. BASE SCHEMA (Leads, Profiles, Base Config)
-- ========================================

-- Tabela de Perfis (Equipe)
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE, -- Made nullable in section 4, but defining structurally here
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Tabela de Tags
CREATE TABLE public.tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  color TEXT NOT NULL DEFAULT '#6366f1',
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view tags" ON public.tags FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage tags" ON public.tags FOR ALL TO authenticated USING (true) WITH CHECK (true);

INSERT INTO public.tags (name, color, description) VALUES
  ('novo_lead', '#22c55e', 'Lead acabou de entrar'),
  ('qualificado', '#3b82f6', 'Passou pelos filtros de perfil'),
  ('followup_pendente', '#f59e0b', 'Bot enviou pergunta e aguarda resposta'),
  ('transbordo_humano', '#ef4444', 'Requisitou suporte ou está pronto para fechar');

-- Tabela de Leads (Principal)
CREATE TABLE public.leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT,
  whatsapp TEXT,
  email TEXT,
  estimated_budget DECIMAL(10,2),
  main_pain TEXT,
  stage TEXT NOT NULL DEFAULT 'lead' CHECK (stage IN ('lead', 'qualification', 'proposal', 'won', 'lost')),
  lead_score INTEGER NOT NULL DEFAULT 1 CHECK (lead_score >= 1 AND lead_score <= 10),
  assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  source TEXT DEFAULT 'whatsapp',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_contact_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view leads" ON public.leads FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can create leads" ON public.leads FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update leads" ON public.leads FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete leads" ON public.leads FOR DELETE TO authenticated USING (true);

-- Tabela de Lead-Tags (Many-to-Many)
CREATE TABLE public.lead_tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(lead_id, tag_id)
);

ALTER TABLE public.lead_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage lead_tags" ON public.lead_tags FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Tabela de Conversas
CREATE TABLE public.conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  channel TEXT NOT NULL DEFAULT 'whatsapp',
  external_id TEXT, 
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed', 'archived')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view conversations" ON public.conversations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage conversations" ON public.conversations FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Tabela de Mensagens
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  backend_log JSONB, 
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view messages" ON public.messages FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can create messages" ON public.messages FOR INSERT TO authenticated WITH CHECK (true);

-- Tabela de Tarefas
CREATE TABLE public.tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL DEFAULT 'followup' CHECK (type IN ('followup', 'call', 'meeting', 'proposal', 'other')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
  due_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view tasks" ON public.tasks FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage tasks" ON public.tasks FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON public.leads FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON public.conversations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data ->> 'name', NEW.email), NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.leads;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;

-- ========================================
-- 2. BARBERSHOP SERVICES & SCHEDULING
-- ========================================

ALTER TABLE public.leads 
  ADD COLUMN IF NOT EXISTS preferred_barber text,
  ADD COLUMN IF NOT EXISTS subscription_plan text,
  ADD COLUMN IF NOT EXISTS subscription_status text DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS subscription_started_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS subscription_expires_at timestamp with time zone;

CREATE TABLE IF NOT EXISTS public.services (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  duration_minutes integer NOT NULL DEFAULT 30,
  price numeric NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active services" ON public.services FOR SELECT USING (is_active = true);
CREATE POLICY "Authenticated users can manage services" ON public.services FOR ALL USING (true) WITH CHECK (true);

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

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view appointments" ON public.appointments FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage appointments" ON public.appointments FOR ALL USING (true) WITH CHECK (true);

CREATE TRIGGER update_appointments_updated_at
  BEFORE UPDATE ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

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

ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active plans" ON public.subscription_plans FOR SELECT USING (is_active = true);
CREATE POLICY "Authenticated users can manage plans" ON public.subscription_plans FOR ALL USING (true) WITH CHECK (true);

INSERT INTO public.services (name, description, duration_minutes, price) VALUES
  ('Corte Masculino', 'Corte de cabelo tradicional', 30, 35.00),
  ('Barba', 'Aparo e modelagem de barba', 20, 25.00),
  ('Corte + Barba', 'Combo corte e barba', 45, 55.00),
  ('Corte Infantil', 'Corte para crianças até 12 anos', 25, 30.00),
  ('Pigmentação', 'Coloração e disfarce', 40, 45.00),
  ('Hidratação', 'Tratamento capilar', 30, 35.00);

INSERT INTO public.subscription_plans (name, description, price, duration_days, services_included) VALUES
  ('Plano Básico', '2 cortes por mês', 60.00, 30, ARRAY['Corte Masculino']),
  ('Plano Premium', '4 cortes + 2 barbas por mês', 120.00, 30, ARRAY['Corte Masculino', 'Barba']),
  ('Plano VIP', 'Serviços ilimitados', 200.00, 30, ARRAY['Corte Masculino', 'Barba', 'Corte + Barba', 'Hidratação']);

-- ========================================
-- 3. CUSTOM PIPELINES
-- ========================================

CREATE TABLE public.custom_pipelines (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT 'layers',
  color TEXT DEFAULT '#6366f1',
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  on_completion_action TEXT NOT NULL DEFAULT 'restart',
  on_completion_target_pipeline UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.pipeline_stages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pipeline_id UUID NOT NULL REFERENCES public.custom_pipelines(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#6366f1',
  display_order INTEGER NOT NULL DEFAULT 0,
  is_final BOOLEAN NOT NULL DEFAULT false,
  final_type TEXT,
  ai_prompt TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.stage_automations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  stage_id UUID NOT NULL REFERENCES public.pipeline_stages(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  trigger_type TEXT NOT NULL,
  trigger_config JSONB DEFAULT '{}',
  action_type TEXT NOT NULL,
  action_config JSONB DEFAULT '{}',
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.leads
ADD COLUMN pipeline_id UUID REFERENCES public.custom_pipelines(id),
ADD COLUMN pipeline_stage_id UUID REFERENCES public.pipeline_stages(id);

ALTER TABLE public.leads DROP COLUMN IF EXISTS lead_score;

ALTER TABLE public.custom_pipelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pipeline_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stage_automations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view pipelines" ON public.custom_pipelines FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage pipelines" ON public.custom_pipelines FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can view stages" ON public.pipeline_stages FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage stages" ON public.pipeline_stages FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can view automations" ON public.stage_automations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage automations" ON public.stage_automations FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TRIGGER update_custom_pipelines_updated_at BEFORE UPDATE ON public.custom_pipelines FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_pipeline_stages_updated_at BEFORE UPDATE ON public.pipeline_stages FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_stage_automations_updated_at BEFORE UPDATE ON public.stage_automations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ========================================
-- 4. PRODUCTS, COMMISSIONS, ORDERS, EXPENSES
-- ========================================

-- Add commission percentage to Services
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS commission_percentage NUMERIC DEFAULT 0;

-- Update Profiles (Employees) - Ensure user_id is nullable (Fix) and add Role
ALTER TABLE public.profiles ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'barber';

-- RLS Update for Profiles (Allow management)
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can manage profiles" ON public.profiles;
CREATE POLICY "Authenticated users can manage profiles" ON public.profiles FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Commissions System
CREATE TABLE IF NOT EXISTS public.commissions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    appointment_id UUID REFERENCES public.appointments(id) ON DELETE CASCADE,
    barber_id UUID REFERENCES public.profiles(id),
    service_id UUID REFERENCES public.services(id),
    amount DECIMAL(10, 2) NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.commissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage commissions" ON public.commissions FOR ALL USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.calculate_commission()
RETURNS TRIGGER AS $$
DECLARE
    v_service_price NUMERIC;
    v_commission_pct NUMERIC;
    v_commission_amount NUMERIC;
BEGIN
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        SELECT price, COALESCE(commission_percentage, 0) INTO v_service_price, v_commission_pct
        FROM public.services WHERE id = NEW.service_id;
        v_commission_amount := (v_service_price * v_commission_pct) / 100;
        IF v_commission_amount > 0 AND NEW.barber_id IS NOT NULL THEN
            INSERT INTO public.commissions (appointment_id, barber_id, service_id, amount, status)
            VALUES (NEW.id, NEW.barber_id, NEW.service_id, v_commission_amount, 'pending');
        END IF;
    ELSIF NEW.status != 'completed' AND OLD.status = 'completed' THEN
         DELETE FROM public.commissions WHERE appointment_id = NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_appointment_completion ON public.appointments;
CREATE TRIGGER on_appointment_completion AFTER UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.calculate_commission();

-- Products & Orders
CREATE TABLE IF NOT EXISTS public.products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  stock_quantity INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage products" ON public.products FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID REFERENCES public.leads(id),
  customer_name TEXT,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'completed', 'cancelled')),
  total_amount DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage orders" ON public.orders FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  service_id UUID REFERENCES public.services(id),
  product_id UUID REFERENCES public.products(id),
  barber_id UUID REFERENCES public.profiles(id),
  quantity INTEGER DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage order items" ON public.order_items FOR ALL USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.update_order_total()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    UPDATE public.orders
    SET total_amount = (SELECT COALESCE(SUM(quantity * unit_price), 0) FROM public.order_items WHERE order_id = OLD.order_id)
    WHERE id = OLD.order_id;
    RETURN OLD;
  ELSE
    UPDATE public.orders
    SET total_amount = (SELECT COALESCE(SUM(quantity * unit_price), 0) FROM public.order_items WHERE order_id = NEW.order_id)
    WHERE id = NEW.order_id;
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_order_total ON public.order_items;
CREATE TRIGGER trg_update_order_total
AFTER INSERT OR UPDATE OR DELETE ON public.order_items
FOR EACH ROW EXECUTE FUNCTION public.update_order_total();

-- Expenses
CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    description TEXT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    category TEXT,
    due_date DATE,
    paid_at TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage expenses" ON public.expenses FOR ALL USING (true) WITH CHECK (true);

CREATE TRIGGER on_expense_update BEFORE UPDATE ON public.expenses FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at(); 
-- Wait, handle_updated_at was not defined but update_updated_at_column was. 
-- Section 5 in previous file called it handle_updated_at but I already have update_updated_at_column which does the same.
-- I'll use update_updated_at_column.
DROP TRIGGER IF EXISTS on_expense_update ON public.expenses;
CREATE TRIGGER on_expense_update BEFORE UPDATE ON public.expenses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
