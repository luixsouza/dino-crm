-- Migration to add new CRM pipeline tags based on user requirements
-- Date: 2026-01-12

INSERT INTO public.tags (name, color, description)
VALUES 
    ('frio', '#94a3b8', 'Cliente com dúvidas ou curiosidade, sem intenção clara'),
    ('interessado', '#facc15', 'Perguntou preço ou detalhes de serviço, em qualificação'),
    ('quente', '#f97316', 'Pede data específica, pronto para agendar'),
    ('novo_cliente', '#22c55e', 'Confirmou primeiro agendamento'),
    ('potencial_assinante', '#8b5cf6', 'Demonstrou interesse no Clube Dino ou corta frequentemente'),
    ('cliente_fiel', '#0d9488', 'Cliente recorrente'),
    ('assinante', '#4f46e5', 'Membro ativo do Clube Dino'),
    ('agendamento_pendente', '#ef4444', 'Interesse claro mas não confirmou finalização')
ON CONFLICT (name) DO NOTHING;
