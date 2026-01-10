-- 
-- Migration: Create Schedule Blocks (Bloqueio de Horários)
-- 

CREATE TABLE IF NOT EXISTS public.schedule_blocks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    CONSTRAINT check_times CHECK (end_time > start_time)
);

-- Enable RLS
ALTER TABLE public.schedule_blocks ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Authenticated users can view schedule blocks" 
    ON public.schedule_blocks FOR SELECT 
    TO authenticated 
    USING (true);

CREATE POLICY "Authenticated users can manage schedule blocks" 
    ON public.schedule_blocks FOR ALL 
    TO authenticated 
    USING (true) 
    WITH CHECK (true);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_schedule_blocks_updated_at ON public.schedule_blocks;
CREATE TRIGGER update_schedule_blocks_updated_at 
    BEFORE UPDATE ON public.schedule_blocks 
    FOR EACH ROW 
    EXECUTE FUNCTION public.update_updated_at_column();
