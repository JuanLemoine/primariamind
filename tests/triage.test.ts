import { describe, it, expect } from 'vitest';
import { triageResultSchema } from '../src/lib/validations';

describe('Triage Result Schema', () => {
  it('should validate a correct triage result', () => {
    const validResult = {
      risk_level: 'moderate',
      needs_human: true,
      emergency_flag: false,
      recommended_specialty: 'ansiedad',
      urgency: 6,
      reasons: ['Síntomas de ansiedad moderados', 'Dificultad para dormir'],
      suggested_next_steps: ['Técnicas de respiración', 'Consulta con profesional'],
    };

    const result = triageResultSchema.safeParse(validResult);
    expect(result.success).toBe(true);
  });

  it('should reject invalid risk levels', () => {
    const invalidResult = {
      risk_level: 'extreme', // Invalid
      needs_human: true,
      emergency_flag: false,
      recommended_specialty: null,
      urgency: 5,
      reasons: [],
      suggested_next_steps: [],
    };

    const result = triageResultSchema.safeParse(invalidResult);
    expect(result.success).toBe(false);
  });

  it('should reject urgency out of range', () => {
    const invalidResult = {
      risk_level: 'low',
      needs_human: false,
      emergency_flag: false,
      recommended_specialty: null,
      urgency: 15, // Invalid: must be 1-10
      reasons: [],
      suggested_next_steps: [],
    };

    const result = triageResultSchema.safeParse(invalidResult);
    expect(result.success).toBe(false);
  });

  it('should accept null specialty', () => {
    const validResult = {
      risk_level: 'low',
      needs_human: false,
      emergency_flag: false,
      recommended_specialty: null,
      urgency: 2,
      reasons: ['Consulta informativa'],
      suggested_next_steps: ['Continuar conversación'],
    };

    const result = triageResultSchema.safeParse(validResult);
    expect(result.success).toBe(true);
  });

  it('should validate critical emergency scenarios', () => {
    const criticalResult = {
      risk_level: 'critical',
      needs_human: true,
      emergency_flag: true,
      recommended_specialty: 'general',
      urgency: 10,
      reasons: ['Ideación suicida activa', 'Riesgo inmediato'],
      suggested_next_steps: ['Contactar emergencias', 'Notificar contacto de emergencia'],
    };

    const result = triageResultSchema.safeParse(criticalResult);
    expect(result.success).toBe(true);
    expect(result.data?.emergency_flag).toBe(true);
    expect(result.data?.urgency).toBe(10);
  });
});
