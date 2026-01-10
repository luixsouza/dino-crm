-- 
-- Migration: Create Holidays (Controle de Feriados)
-- 

CREATE TABLE IF NOT EXISTS public.holidays (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    date DATE NOT NULL UNIQUE,
    description TEXT NOT NULL,
    is_closed BOOLEAN NOT NULL DEFAULT true, -- If true, shop is closed all day
    open_time TIME, -- Optional custom hours if is_closed is false
    close_time TIME,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.holidays ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Authenticated users can view holidays" 
    ON public.holidays FOR SELECT 
    TO authenticated 
    USING (true);

CREATE POLICY "Authenticated users can manage holidays" 
    ON public.holidays FOR ALL 
    TO authenticated 
    USING (true) 
    WITH CHECK (true);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_holidays_updated_at ON public.holidays;
CREATE TRIGGER update_holidays_updated_at 
    BEFORE UPDATE ON public.holidays 
    FOR EACH ROW 
    EXECUTE FUNCTION public.update_updated_at_column();
