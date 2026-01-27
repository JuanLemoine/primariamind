import { z } from 'zod';

// Auth validations
export const registerSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  full_name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
});

export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'La contraseña es requerida'),
});

// Consent validation (simplified - single acceptance)
export const consentSchema = z.object({
  country: z.string().optional(),
  city: z.string().optional(),
});

// Emergency contact validation
export const emergencyContactSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  phone: z.string()
    .min(7, 'El teléfono debe tener al menos 7 dígitos')
    .regex(/^[+]?[\d\s-]+$/, 'Formato de teléfono inválido'),
  relation: z.string().min(2, 'La relación debe tener al menos 2 caracteres'),
  consent_notify: z.boolean(),
});

// Chat validation
export const sendMessageSchema = z.object({
  conversation_id: z.string().uuid().nullish(), // Allow null, undefined, or valid UUID
  content: z.string()
    .min(1, 'El mensaje no puede estar vacío')
    .max(5000, 'El mensaje es demasiado largo'),
});

// Appointment validation
export const createAppointmentSchema = z.object({
  slot_id: z.string().uuid('ID de slot inválido'),
  referral_id: z.string().uuid().optional(),
});

// Therapist availability query
export const availabilityQuerySchema = z.object({
  specialty: z.string().optional(),
  from: z.string().datetime({ message: 'Fecha de inicio inválida' }),
  to: z.string().datetime({ message: 'Fecha de fin inválida' }),
});

// Update case validation (therapist panel)
export const updateCaseSchema = z.object({
  status: z.enum(['assigned', 'closed']).optional(),
  therapist_notes: z.string().max(5000).optional(),
});

// Triage result schema (for parsing AI response)
export const triageResultSchema = z.object({
  risk_level: z.enum(['low', 'moderate', 'high', 'critical']),
  needs_human: z.boolean(),
  emergency_flag: z.boolean(),
  recommended_specialty: z.string().nullable(),
  urgency: z.number().min(1).max(10),
  reasons: z.array(z.string()),
  suggested_next_steps: z.array(z.string()),
});

// Insight result schema (for parsing AI response)
export const insightResultSchema = z.object({
  summary: z.string(),
  tags: z.array(z.string()),
});

// Type exports
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ConsentInput = z.infer<typeof consentSchema>;
export type EmergencyContactInput = z.infer<typeof emergencyContactSchema>;
export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;
export type AvailabilityQueryInput = z.infer<typeof availabilityQuerySchema>;
export type UpdateCaseInput = z.infer<typeof updateCaseSchema>;
export type TriageResultInput = z.infer<typeof triageResultSchema>;
export type InsightResultInput = z.infer<typeof insightResultSchema>;
