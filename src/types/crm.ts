// Tipos do CRM Conversacional - Dino CRM

// Pipeline de Agendamento (cíclico)
export type AppointmentStage = 'new_contact' | 'scheduling' | 'confirmed' | 'completed' | 'no_show';

// Pipeline de Vendas de Planos
export type SubscriptionStage = 'interested' | 'negotiating' | 'closed' | 'churned';

// Stage geral do lead (combinação)
export type LeadStage = 'lead' | 'qualification' | 'proposal' | 'won' | 'lost';

export type TaskType = 'followup' | 'call' | 'meeting' | 'proposal' | 'appointment' | 'other';
export type TaskStatus = 'pending' | 'completed' | 'cancelled';
export type MessageRole = 'user' | 'assistant' | 'system';
export type ConversationStatus = 'active' | 'closed' | 'archived';
export type AppointmentStatus = 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
export type SubscriptionStatus = 'none' | 'active' | 'expired' | 'cancelled';

export interface Profile {
  id: string;
  user_id: string;
  name: string;
  email: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
  description?: string;
  created_at: string;
}

export interface Service {
  id: string;
  name: string;
  description?: string;
  duration_minutes: number;
  price: number;
  commission_percentage?: number;
  is_active: boolean;
  created_at: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  description?: string;
  price: number;
  duration_days: number;
  services_included: string[];
  is_active: boolean;
  created_at: string;
}

// Custom Pipeline
export interface CustomPipeline {
  id: string;
  name: string;
  description?: string;
  icon: string;
  color: string;
  is_active: boolean;
  display_order: number;
  on_completion_action: 'restart' | 'move_to_pipeline' | 'archive';
  on_completion_target_pipeline?: string;
  created_at: string;
  updated_at: string;
  stages?: PipelineStage[];
}

export interface PipelineStage {
  id: string;
  pipeline_id: string;
  name: string;
  description?: string;
  color: string;
  display_order: number;
  is_final: boolean;
  final_type?: 'success' | 'failure';
  ai_prompt?: string;
  created_at: string;
  updated_at: string;
  automations?: StageAutomation[];
}

export interface StageAutomation {
  id: string;
  stage_id: string;
  name: string;
  is_active: boolean;
  trigger_type: 'on_enter' | 'on_exit' | 'on_time' | 'on_tag';
  trigger_config: Record<string, unknown>;
  action_type: 'create_task' | 'send_message' | 'apply_tag' | 'move_stage' | 'notify_team';
  action_config: Record<string, unknown>;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface Lead {
  id: string;
  name?: string;
  whatsapp?: string;
  email?: string;
  estimated_budget?: number;
  main_pain?: string;
  stage: LeadStage;
  assigned_to?: string;
  source: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  last_contact_at?: string;
  // Pipeline customizado
  pipeline_id?: string;
  pipeline_stage_id?: string;
  // Campos de barbearia
  preferred_barber?: string;
  subscription_plan?: string;
  subscription_status?: SubscriptionStatus;
  subscription_started_at?: string;
  subscription_expires_at?: string;
  // Relações
  tags?: Tag[];
  assigned_profile?: Profile;
  tasks?: Task[];
  appointments?: Appointment[];
  pipeline?: CustomPipeline;
  pipeline_stage?: PipelineStage;
}

export interface Appointment {
  id: string;
  lead_id?: string;
  client_name?: string;
  service_id: string;
  barber_id?: string;
  scheduled_at: string;
  status: AppointmentStatus;
  notes?: string;
  created_at: string;
  updated_at: string;
  // Relações
  lead?: Lead;
  service?: Service;
  barber?: Profile;
}

export interface LeadTag {
  id: string;
  lead_id: string;
  tag_id: string;
  created_at: string;
}

export interface Conversation {
  id: string;
  lead_id: string;
  channel: string;
  external_id?: string;
  status: ConversationStatus;
  created_at: string;
  updated_at: string;
  // Relações
  lead?: Lead;
  messages?: Message[];
}

export interface Message {
  id: string;
  conversation_id: string;
  role: MessageRole;
  content: string;
  metadata?: Record<string, unknown>;
  backend_log?: BackendLog;
  created_at: string;
}

export interface Task {
  id: string;
  lead_id: string;
  assigned_to?: string;
  title: string;
  description?: string;
  type: TaskType;
  status: TaskStatus;
  due_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
  // Relações
  lead?: Lead;
  assigned_profile?: Profile;
}

// Backend Log estruturado (saída da IA)
export interface BackendLog {
  current_stage: LeadStage;
  updated_fields: Record<string, unknown>;
  tags_to_apply: string[];
  automation_trigger?: string;
  suggested_task?: {
    title: string;
    type: TaskType;
    due_in_hours?: number;
  };
  suggested_appointment?: {
    service: string;
    preferred_time?: string;
  };
}

// Estágios do pipeline de AGENDAMENTO
export const APPOINTMENT_PIPELINE_STAGES: { key: AppointmentStage; label: string; color: string }[] = [
  { key: 'new_contact', label: 'Novo Contato', color: 'hsl(var(--chart-1))' },
  { key: 'scheduling', label: 'Agendando', color: 'hsl(var(--chart-2))' },
  { key: 'confirmed', label: 'Confirmado', color: 'hsl(var(--chart-3))' },
  { key: 'completed', label: 'Atendido', color: 'hsl(142 76% 36%)' },
  { key: 'no_show', label: 'Não Compareceu', color: 'hsl(var(--destructive))' },
];

// Estágios do pipeline de ASSINATURAS
export const SUBSCRIPTION_PIPELINE_STAGES: { key: SubscriptionStage; label: string; color: string }[] = [
  { key: 'interested', label: 'Interessado', color: 'hsl(var(--chart-1))' },
  { key: 'negotiating', label: 'Negociando', color: 'hsl(var(--chart-2))' },
  { key: 'closed', label: 'Fechado', color: 'hsl(142 76% 36%)' },
  { key: 'churned', label: 'Cancelado', color: 'hsl(var(--destructive))' },
];

// Estágios genéricos (manter compatibilidade)
export const PIPELINE_STAGES: { key: LeadStage; label: string; color: string }[] = [
  { key: 'lead', label: 'Entrada', color: 'hsl(var(--chart-1))' },
  { key: 'qualification', label: 'Qualificação', color: 'hsl(var(--chart-2))' },
  { key: 'proposal', label: 'Proposta', color: 'hsl(var(--chart-3))' },
  { key: 'won', label: 'Ganho', color: 'hsl(142 76% 36%)' },
  { key: 'lost', label: 'Perdido', color: 'hsl(var(--destructive))' },
];

// Tag colors padrão
export const TAG_COLORS: Record<string, string> = {
  novo_cliente: '#22c55e',
  cliente_fiel: '#3b82f6',
  assinante: '#8b5cf6',
  followup_pendente: '#f59e0b',
  transbordo_humano: '#ef4444',
  agendamento_pendente: '#06b6d4',
};
