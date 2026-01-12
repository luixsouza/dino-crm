-- Migration to add avatar_url to leads
-- Date: 2026-01-12

ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Update RLS to allow reading/writing this column (implicitly handled by existing policies if they select *)
-- But good practice to verify. Existing policies use (true), so we are good.
