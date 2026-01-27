import { describe, it, expect } from 'vitest';
import {
  registerSchema,
  loginSchema,
  consentSchema,
  emergencyContactSchema,
  sendMessageSchema,
} from '../src/lib/validations';

describe('Auth Validations', () => {
  describe('registerSchema', () => {
    it('should validate correct registration data', () => {
      const validData = {
        email: 'test@example.com',
        password: 'securePass123',
        full_name: 'Juan García',
      };

      const result = registerSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid email', () => {
      const invalidData = {
        email: 'invalid-email',
        password: 'securePass123',
        full_name: 'Juan',
      };

      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject short password', () => {
      const invalidData = {
        email: 'test@example.com',
        password: '123',
        full_name: 'Juan',
      };

      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject short name', () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'securePass123',
        full_name: 'J',
      };

      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('loginSchema', () => {
    it('should validate correct login data', () => {
      const validData = {
        email: 'test@example.com',
        password: 'anyPassword',
      };

      const result = loginSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject empty password', () => {
      const invalidData = {
        email: 'test@example.com',
        password: '',
      };

      const result = loginSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });
});

describe('Consent Validation', () => {
  it('should require all consent checkboxes', () => {
    const invalidData = {
      understood_not_medical: true,
      understood_not_emergency: true,
      understood_data_treatment: false, // Must be true
    };

    const result = consentSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('should accept valid consent with location', () => {
    const validData = {
      understood_not_medical: true,
      understood_not_emergency: true,
      understood_data_treatment: true,
      country: 'Colombia',
      city: 'Bogotá',
    };

    const result = consentSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });
});

describe('Emergency Contact Validation', () => {
  it('should validate correct emergency contact', () => {
    const validData = {
      name: 'María García',
      phone: '+57 300 123 4567',
      relation: 'Madre',
      consent_notify: true,
    };

    const result = emergencyContactSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('should reject invalid phone format', () => {
    const invalidData = {
      name: 'María García',
      phone: 'abc123',
      relation: 'Madre',
      consent_notify: true,
    };

    const result = emergencyContactSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('should accept phone without consent', () => {
    const validData = {
      name: 'María García',
      phone: '3001234567',
      relation: 'Amiga',
      consent_notify: false,
    };

    const result = emergencyContactSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });
});

describe('Send Message Validation', () => {
  it('should validate message with conversation_id', () => {
    const validData = {
      conversation_id: '550e8400-e29b-41d4-a716-446655440000',
      content: 'Hola, necesito ayuda',
    };

    const result = sendMessageSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('should validate message without conversation_id (new conversation)', () => {
    const validData = {
      content: 'Hola, quiero comenzar una conversación',
    };

    const result = sendMessageSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('should reject empty message', () => {
    const invalidData = {
      content: '',
    };

    const result = sendMessageSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('should reject too long message', () => {
    const invalidData = {
      content: 'a'.repeat(5001), // Max is 5000
    };

    const result = sendMessageSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });
});
