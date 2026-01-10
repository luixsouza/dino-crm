-- 
-- Migration: Create Work Schedules (Expedientes Individuais)
-- 

CREATE TABLE IF NOT EXISTS public.work_schedules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sunday, 6=Saturday
    start_time TIME NOT NULL DEFAULT '09:00',
    end_time TIME NOT NULL DEFAULT '18:00',
    break_start TIME,
    break_end TIME,
    is_active BOOLEAN DEFAULT true, -- Active means it is a working day
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(profile_id, day_of_week)
);

-- Enable RLS
ALTER TABLE public.work_schedules ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Authenticated users can view work schedules" 
    ON public.work_schedules FOR SELECT 
    TO authenticated 
    USING (true);

CREATE POLICY "Authenticated users can manage work schedules" 
    ON public.work_schedules FOR ALL 
    TO authenticated 
    USING (true) 
    WITH CHECK (true);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_work_schedules_updated_at ON public.work_schedules;
CREATE TRIGGER update_work_schedules_updated_at 
    BEFORE UPDATE ON public.work_schedules 
    FOR EACH ROW 
    EXECUTE FUNCTION public.update_updated_at_column();

-- Function to initialize default schedule for a user (Optional helper)
CREATE OR REPLACE FUNCTION public.initialize_work_schedule(target_profile_id UUID)
RETURNS VOID AS $$
DECLARE
    i INTEGER;
BEGIN
    FOR i IN 0..6 LOOP
        INSERT INTO public.work_schedules (profile_id, day_of_week, start_time, end_time, is_active)
        VALUES (
            target_profile_id, 
            i, 
            '09:00', 
            '18:00', 
            CASE WHEN i = 0 THEN false ELSE true END -- Default Sunday off
        )
        ON CONFLICT (profile_id, day_of_week) DO NOTHING;
    END LOOP;
END;
$$ LANGUAGE plpgsql;
