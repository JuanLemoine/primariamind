// Database types for Supabase
// These match the SQL schema defined in supabase/migrations

export type UserRole = 'user' | 'therapist';

export type ConversationStatus = 'active' | 'closed' | 'referred';

export type MessageRole = 'user' | 'assistant' | 'system';

export type SlotStatus = 'free' | 'reserved' | 'booked';

export type ReferralPriority = 'normal' | 'high';

export type ReferralStatus = 'open' | 'assigned' | 'waiting' | 'closed';

export type AppointmentStatus = 'scheduled' | 'cancelled' | 'completed';

export type RiskLevel = 'low' | 'moderate' | 'high' | 'critical';

export type NotificationChannel = 'sms' | 'whatsapp' | 'email';

export type NotificationStatus = 'pending' | 'sent' | 'failed';

// Database row types
export interface Profile {
  id: string;
  role: UserRole;
  full_name: string | null;
  country: string | null;
  city: string | null;
  consent_accepted: boolean;
  consent_accepted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface EmergencyContact {
  id: string;
  user_id: string;
  name: string;
  phone: string;
  relation: string;
  consent_notify: boolean;
  created_at: string;
}

export interface Conversation {
  id: string;
  user_id: string;
  status: ConversationStatus;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: MessageRole;
  content: string;
  created_at: string;
}

export interface Specialty {
  id: string;
  slug: string;
  name: string;
  description: string | null;
}

export interface Therapist {
  therapist_id: string;
  bio: string | null;
  languages: string[];
  license_id: string | null;
  is_available: boolean;
  created_at: string;
}

export interface TherapistSpecialty {
  therapist_id: string;
  specialty_id: string;
}

export interface AvailabilitySlot {
  id: string;
  therapist_id: string;
  start_ts: string;
  end_ts: string;
  status: SlotStatus;
}

export interface Referral {
  id: string;
  conversation_id: string;
  user_id: string;
  specialty_id: string | null;
  priority: ReferralPriority;
  status: ReferralStatus;
  assigned_therapist_id: string | null;
  therapist_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ConversationInsight {
  id: string;
  conversation_id: string;
  risk_level: RiskLevel;
  needs_human: boolean;
  emergency_flag: boolean;
  recommended_specialty: string | null;
  urgency: number; // 1-10
  reasons: string[];
  summary: string | null;
  tags: string[];
  suggested_next_steps: string[];
  created_at: string;
}

export interface Appointment {
  id: string;
  user_id: string;
  therapist_id: string;
  slot_id: string;
  start_ts: string;
  end_ts: string;
  status: AppointmentStatus;
  notes: string | null;
  created_at: string;
}

export interface RiskNotification {
  id: string;
  user_id: string;
  conversation_id: string;
  contact_id: string;
  channel: NotificationChannel;
  status: NotificationStatus;
  payload: Record<string, unknown>;
  sent_at: string | null;
  created_at: string;
}

// Join types for queries
export interface TherapistWithProfile extends Therapist {
  profile: Profile;
  specialties: Specialty[];
}

export interface ReferralWithDetails extends Referral {
  conversation: Conversation;
  user_profile: Profile;
  specialty: Specialty | null;
  insights: ConversationInsight[];
}

export interface MessageWithInsight extends Message {
  insight?: ConversationInsight;
}

// API Response types
export interface TriageResult {
  risk_level: RiskLevel;
  needs_human: boolean;
  emergency_flag: boolean;
  recommended_specialty: string | null;
  urgency: number;
  reasons: string[];
  suggested_next_steps: string[];
}

export interface InsightResult {
  summary: string;
  tags: string[];
}

export interface ChatResponse {
  message: string;
  action: 'normal' | 'crisis_mode' | 'offer_appointment';
  crisis_info?: CrisisInfo;
  appointment_slots?: AvailabilitySlot[];
  specialty?: string;
}

export interface CrisisInfo {
  message: string;
  emergency_lines: EmergencyLine[];
  contact_notified: boolean;
}

export interface EmergencyLine {
  name: string;
  number: string;
  description: string;
}
