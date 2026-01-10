-- Create Roles table for dynamic role management
CREATE TABLE IF NOT EXISTS public.roles (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE, -- internal key, e.g. 'barber'
    label TEXT NOT NULL, -- display name, e.g. 'Barbeiro'
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Authenticated users can view roles" ON public.roles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage roles" ON public.roles FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_roles_updated_at ON public.roles;
CREATE TRIGGER update_roles_updated_at BEFORE UPDATE ON public.roles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default roles (ignore if conflict)
INSERT INTO public.roles (name, label, description) VALUES
('admin', 'Administrador', 'Acesso total ao sistema'),
('manager', 'Gerente', 'Gerencia equipe e relatórios'),
('receptionist', 'Recepcionista', 'Agendamentos e atendimento básico'),
('barber', 'Barbeiro', 'Profissional que realiza os serviços'),
('assistant', 'Assistente', 'Auxiliar geral')
ON CONFLICT (name) DO NOTHING;
