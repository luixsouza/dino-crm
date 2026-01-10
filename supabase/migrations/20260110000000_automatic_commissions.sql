-- Add commission percentage to services
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS commission_percentage NUMERIC DEFAULT 0;

-- Create commissions table
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

-- Enable RLS
ALTER TABLE public.commissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage commissions" ON public.commissions 
    FOR ALL USING (true) WITH CHECK (true);

-- Trigger to calculate commission on appointment completion
CREATE OR REPLACE FUNCTION public.calculate_commission()
RETURNS TRIGGER AS $$
DECLARE
    v_service_price NUMERIC;
    v_commission_pct NUMERIC;
    v_commission_amount NUMERIC;
BEGIN
    -- Only run if status changed to 'completed'
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        -- Get service price and commission percentage
        SELECT price, COALESCE(commission_percentage, 0) INTO v_service_price, v_commission_pct
        FROM public.services
        WHERE id = NEW.service_id;
        
        -- Calculate amount
        v_commission_amount := (v_service_price * v_commission_pct) / 100;
        
        -- Insert into commissions if amount > 0 and barber is set
        IF v_commission_amount > 0 AND NEW.barber_id IS NOT NULL THEN
            INSERT INTO public.commissions (appointment_id, barber_id, service_id, amount, status)
            VALUES (NEW.id, NEW.barber_id, NEW.service_id, v_commission_amount, 'pending');
        END IF;
    ELSIF NEW.status != 'completed' AND OLD.status = 'completed' THEN
         -- If status changed FROM completed (e.g. mistake), remove commission?
         DELETE FROM public.commissions WHERE appointment_id = NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_appointment_completion
AFTER UPDATE ON public.appointments
FOR EACH ROW
EXECUTE FUNCTION public.calculate_commission();
