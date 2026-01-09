-- Criar tabela de pipelines customizáveis
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

-- Criar tabela de estágios do pipeline
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

-- Criar tabela de automações por estágio
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

-- Adicionar colunas de pipeline nos leads
ALTER TABLE public.leads
ADD COLUMN pipeline_id UUID REFERENCES public.custom_pipelines(id),
ADD COLUMN pipeline_stage_id UUID REFERENCES public.pipeline_stages(id);

-- Remover coluna lead_score
ALTER TABLE public.leads DROP COLUMN IF EXISTS lead_score;

-- Habilitar RLS
ALTER TABLE public.custom_pipelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pipeline_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stage_automations ENABLE ROW LEVEL SECURITY;

-- Políticas para custom_pipelines
CREATE POLICY "Authenticated users can view pipelines"
ON public.custom_pipelines FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can manage pipelines"
ON public.custom_pipelines FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Políticas para pipeline_stages
CREATE POLICY "Authenticated users can view stages"
ON public.pipeline_stages FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can manage stages"
ON public.pipeline_stages FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Políticas para stage_automations
CREATE POLICY "Authenticated users can view automations"
ON public.stage_automations FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can manage automations"
ON public.stage_automations FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Trigger para updated_at
CREATE TRIGGER update_custom_pipelines_updated_at
BEFORE UPDATE ON public.custom_pipelines
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pipeline_stages_updated_at
BEFORE UPDATE ON public.pipeline_stages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_stage_automations_updated_at
BEFORE UPDATE ON public.stage_automations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();