-- Make lead_id nullable for quick appointments (walk-ins)
ALTER TABLE public.appointments ALTER COLUMN lead_id DROP NOT NULL;

-- Add client_name for when lead_id is null
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS client_name TEXT;
