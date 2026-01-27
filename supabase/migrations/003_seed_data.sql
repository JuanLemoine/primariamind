-- PrimariaMind Seed Data
-- Initial data for specialties and demo therapists

-- =============================================================================
-- SPECIALTIES (10 specialties for MVP)
-- =============================================================================
INSERT INTO specialties (id, slug, name, description) VALUES
  (uuid_generate_v4(), 'ansiedad', 'Ansiedad', 'Trastornos de ansiedad, ataques de pánico, fobias, ansiedad generalizada'),
  (uuid_generate_v4(), 'depresion', 'Depresión', 'Trastornos depresivos, estado de ánimo bajo, pérdida de motivación'),
  (uuid_generate_v4(), 'duelo', 'Duelo', 'Procesamiento de pérdidas, duelo complicado, acompañamiento en el luto'),
  (uuid_generate_v4(), 'estres_laboral', 'Estrés Laboral', 'Burnout, agotamiento profesional, equilibrio vida-trabajo'),
  (uuid_generate_v4(), 'parejas_familia', 'Parejas y Familia', 'Terapia de pareja, conflictos familiares, comunicación'),
  (uuid_generate_v4(), 'adicciones', 'Adicciones', 'Dependencias químicas y conductuales, recuperación'),
  (uuid_generate_v4(), 'trauma', 'Trauma', 'TEPT, trauma complejo, experiencias traumáticas'),
  (uuid_generate_v4(), 'trastornos_sueno', 'Trastornos del Sueño', 'Insomnio, problemas para dormir, higiene del sueño'),
  (uuid_generate_v4(), 'autoestima', 'Autoestima', 'Autoconcepto, confianza personal, desarrollo personal'),
  (uuid_generate_v4(), 'general', 'Psicología General', 'Orientación general, bienestar emocional, desarrollo personal');

-- =============================================================================
-- DEMO THERAPISTS
-- Note: In production, therapists register through the normal auth flow
-- These are created manually for testing purposes
--
-- To create demo therapists:
-- 1. First create users in Supabase Auth (Dashboard > Authentication > Users)
-- 2. Then run the SQL below with the actual user IDs
-- =============================================================================

-- Instructions for manual setup:
--
-- After creating auth users with emails like:
-- - therapist1@primariamind.test
-- - therapist2@primariamind.test
--
-- Update their profiles:
-- UPDATE profiles SET role = 'therapist', full_name = 'Dra. María García',
--   consent_accepted = true, consent_accepted_at = NOW()
-- WHERE id = '<therapist1_uuid>';
--
-- Then insert therapist records:
-- INSERT INTO therapists (therapist_id, bio, languages, license_id, is_available) VALUES
--   ('<therapist1_uuid>', 'Especialista en ansiedad y depresión con 10 años de experiencia.',
--    ARRAY['es', 'en'], 'PSY-12345', true);
--
-- Link specialties:
-- INSERT INTO therapist_specialties (therapist_id, specialty_id)
-- SELECT '<therapist1_uuid>', id FROM specialties WHERE slug IN ('ansiedad', 'depresion', 'general');

-- =============================================================================
-- Helper function to create availability slots
-- Call this after creating therapists to generate slots for the next 2 weeks
-- =============================================================================
CREATE OR REPLACE FUNCTION generate_availability_slots(
  p_therapist_id UUID,
  p_start_date DATE DEFAULT CURRENT_DATE,
  p_days INTEGER DEFAULT 14
)
RETURNS void AS $$
DECLARE
  current_date DATE;
  slot_time TIME;
BEGIN
  FOR i IN 0..p_days-1 LOOP
    current_date := p_start_date + i;

    -- Skip weekends
    IF EXTRACT(DOW FROM current_date) NOT IN (0, 6) THEN
      -- Morning slots: 9:00, 10:00, 11:00
      FOR slot_time IN SELECT unnest(ARRAY['09:00'::TIME, '10:00'::TIME, '11:00'::TIME]) LOOP
        INSERT INTO availability_slots (therapist_id, start_ts, end_ts, status)
        VALUES (
          p_therapist_id,
          current_date + slot_time,
          current_date + slot_time + INTERVAL '1 hour',
          'free'
        )
        ON CONFLICT DO NOTHING;
      END LOOP;

      -- Afternoon slots: 14:00, 15:00, 16:00, 17:00
      FOR slot_time IN SELECT unnest(ARRAY['14:00'::TIME, '15:00'::TIME, '16:00'::TIME, '17:00'::TIME]) LOOP
        INSERT INTO availability_slots (therapist_id, start_ts, end_ts, status)
        VALUES (
          p_therapist_id,
          current_date + slot_time,
          current_date + slot_time + INTERVAL '1 hour',
          'free'
        )
        ON CONFLICT DO NOTHING;
      END LOOP;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Usage after creating therapist:
-- SELECT generate_availability_slots('<therapist_uuid>');
