-- PrimariaMind Demo Therapists Setup
-- Run this script AFTER creating users in Supabase Auth
--
-- Steps:
-- 1. Go to Supabase Dashboard > Authentication > Users
-- 2. Create two users:
--    - therapist1@primariamind.test (password: Test1234!)
--    - therapist2@primariamind.test (password: Test1234!)
-- 3. Copy their UUIDs from the dashboard
-- 4. Replace the placeholder UUIDs below with the real ones
-- 5. Run this script in Supabase SQL Editor

-- ============================================================================
-- REPLACE THESE UUIDs WITH THE ACTUAL USER IDs FROM SUPABASE AUTH
-- ============================================================================
DO $$
DECLARE
  therapist1_id UUID := '00000000-0000-0000-0000-000000000001'; -- Replace with real UUID
  therapist2_id UUID := '00000000-0000-0000-0000-000000000002'; -- Replace with real UUID
  specialty_ansiedad UUID;
  specialty_depresion UUID;
  specialty_trauma UUID;
  specialty_duelo UUID;
  specialty_estres UUID;
  specialty_general UUID;
BEGIN
  -- Get specialty IDs
  SELECT id INTO specialty_ansiedad FROM specialties WHERE slug = 'ansiedad';
  SELECT id INTO specialty_depresion FROM specialties WHERE slug = 'depresion';
  SELECT id INTO specialty_trauma FROM specialties WHERE slug = 'trauma';
  SELECT id INTO specialty_duelo FROM specialties WHERE slug = 'duelo';
  SELECT id INTO specialty_estres FROM specialties WHERE slug = 'estres_laboral';
  SELECT id INTO specialty_general FROM specialties WHERE slug = 'general';

  -- ============================================================================
  -- THERAPIST 1: Dra. María García
  -- Specializes in Anxiety, Depression, General
  -- ============================================================================
  UPDATE profiles
  SET
    role = 'therapist',
    full_name = 'Dra. María García',
    country = 'colombia',
    city = 'bogota',
    consent_accepted = true,
    consent_accepted_at = NOW()
  WHERE id = therapist1_id;

  INSERT INTO therapists (therapist_id, bio, languages, license_id, is_available)
  VALUES (
    therapist1_id,
    'Psicóloga clínica con más de 10 años de experiencia. Especialista en trastornos de ansiedad y depresión. Enfoque cognitivo-conductual.',
    ARRAY['es', 'en'],
    'COL-PSY-12345',
    true
  ) ON CONFLICT (therapist_id) DO UPDATE SET
    bio = EXCLUDED.bio,
    languages = EXCLUDED.languages,
    license_id = EXCLUDED.license_id;

  -- Link specialties
  INSERT INTO therapist_specialties (therapist_id, specialty_id)
  VALUES
    (therapist1_id, specialty_ansiedad),
    (therapist1_id, specialty_depresion),
    (therapist1_id, specialty_general)
  ON CONFLICT DO NOTHING;

  -- Generate availability slots for the next 2 weeks
  PERFORM generate_availability_slots(therapist1_id);

  -- ============================================================================
  -- THERAPIST 2: Dr. Carlos Rodríguez
  -- Specializes in Trauma, Grief, Work Stress
  -- ============================================================================
  UPDATE profiles
  SET
    role = 'therapist',
    full_name = 'Dr. Carlos Rodríguez',
    country = 'colombia',
    city = 'medellin',
    consent_accepted = true,
    consent_accepted_at = NOW()
  WHERE id = therapist2_id;

  INSERT INTO therapists (therapist_id, bio, languages, license_id, is_available)
  VALUES (
    therapist2_id,
    'Psicólogo especializado en trauma y duelo. Formación en EMDR y terapia narrativa. 8 años de experiencia clínica.',
    ARRAY['es'],
    'COL-PSY-67890',
    true
  ) ON CONFLICT (therapist_id) DO UPDATE SET
    bio = EXCLUDED.bio,
    languages = EXCLUDED.languages,
    license_id = EXCLUDED.license_id;

  -- Link specialties
  INSERT INTO therapist_specialties (therapist_id, specialty_id)
  VALUES
    (therapist2_id, specialty_trauma),
    (therapist2_id, specialty_duelo),
    (therapist2_id, specialty_estres),
    (therapist2_id, specialty_general)
  ON CONFLICT DO NOTHING;

  -- Generate availability slots for the next 2 weeks
  PERFORM generate_availability_slots(therapist2_id);

  RAISE NOTICE 'Demo therapists created successfully!';
  RAISE NOTICE 'Therapist 1 (María García): %', therapist1_id;
  RAISE NOTICE 'Therapist 2 (Carlos Rodríguez): %', therapist2_id;
END $$;
