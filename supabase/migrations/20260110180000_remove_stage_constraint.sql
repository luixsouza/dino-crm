-- Remove constraint on leads.stage to allow custom pipeline stage IDs
ALTER TABLE public.leads DROP CONSTRAINT IF EXISTS leads_stage_check;

-- Optionally, we might want to make pipeline_id not null if we enforce pipelines, but for now let's just allow flexibility.
