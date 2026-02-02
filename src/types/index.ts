export * from './database';

// Form types for client-side validation
export interface RegisterForm {
  email: string;
  password: string;
  full_name: string;
}

export interface LoginForm {
  email: string;
  password: string;
}

export interface EmergencyContactForm {
  name: string;
  phone: string;
  relation: string;
  consent_notify: boolean;
}

export interface ConsentForm {
  understood_not_medical: boolean;
  understood_not_emergency: boolean;
  understood_data_treatment: boolean;
  country?: string;
  city?: string;
}

// Session/Auth types
export interface SessionUser {
  id: string;
  email: string;
  role: 'user' | 'therapist' | 'admin';
  full_name: string | null;
  consent_accepted: boolean;
  has_emergency_contact: boolean;
}

// API request/response types
export interface SendMessageRequest {
  conversation_id?: string;
  content: string;
}

export interface SendMessageResponse {
  conversation_id: string;
  message: {
    id: string;
    role: 'assistant';
    content: string;
    created_at: string;
  };
  action: 'normal' | 'crisis_mode' | 'offer_appointment';
  crisis_info?: {
    message: string;
    emergency_lines: Array<{
      name: string;
      number: string;
      description: string;
    }>;
    contact_notified: boolean;
  };
  appointment_slots?: Array<{
    id: string;
    therapist_id: string;
    therapist_name: string;
    start_ts: string;
    end_ts: string;
  }>;
  specialty?: string;
}

export interface TherapistAvailabilityRequest {
  specialty?: string;
  from: string;
  to: string;
}

export interface CreateAppointmentRequest {
  slot_id: string;
  referral_id?: string;
}

// Therapist panel types
export interface CaseListFilters {
  priority?: 'normal' | 'high' | 'all';
  specialty?: string;
  status?: 'open' | 'assigned' | 'waiting' | 'closed' | 'all';
}

export interface UpdateCaseRequest {
  status?: 'assigned' | 'closed';
  therapist_notes?: string;
}
