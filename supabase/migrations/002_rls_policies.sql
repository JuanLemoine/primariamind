-- PrimariaMind Row Level Security Policies
-- These policies control data access at the database level

-- =============================================================================
-- Enable RLS on all tables
-- =============================================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE specialties ENABLE ROW LEVEL SECURITY;
ALTER TABLE therapists ENABLE ROW LEVEL SECURITY;
ALTER TABLE therapist_specialties ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_notifications ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- PROFILES POLICIES
-- =============================================================================
-- Users can read their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Therapists can view basic info of users they have referrals for
CREATE POLICY "Therapists can view referred users"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM referrals r
      JOIN therapists t ON t.therapist_id = r.assigned_therapist_id
      WHERE r.user_id = profiles.id
      AND t.therapist_id = auth.uid()
    )
    OR
    -- Or if the referral is in pool (open status)
    EXISTS (
      SELECT 1 FROM referrals r
      JOIN profiles p ON p.id = auth.uid()
      WHERE r.user_id = profiles.id
      AND r.status = 'open'
      AND p.role = 'therapist'
    )
  );

-- =============================================================================
-- EMERGENCY CONTACTS POLICIES
-- =============================================================================
-- Users can only view their own emergency contact
CREATE POLICY "Users can view own emergency contact"
  ON emergency_contacts FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own emergency contact
CREATE POLICY "Users can insert own emergency contact"
  ON emergency_contacts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own emergency contact
CREATE POLICY "Users can update own emergency contact"
  ON emergency_contacts FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own emergency contact
CREATE POLICY "Users can delete own emergency contact"
  ON emergency_contacts FOR DELETE
  USING (auth.uid() = user_id);

-- =============================================================================
-- SPECIALTIES POLICIES (Public read)
-- =============================================================================
CREATE POLICY "Anyone can view specialties"
  ON specialties FOR SELECT
  TO authenticated
  USING (true);

-- =============================================================================
-- THERAPISTS POLICIES
-- =============================================================================
-- Therapists can view their own record
CREATE POLICY "Therapists can view own record"
  ON therapists FOR SELECT
  USING (auth.uid() = therapist_id);

-- Anyone can view available therapists (for booking)
CREATE POLICY "Anyone can view available therapists"
  ON therapists FOR SELECT
  TO authenticated
  USING (is_available = true);

-- Therapists can update their own record
CREATE POLICY "Therapists can update own record"
  ON therapists FOR UPDATE
  USING (auth.uid() = therapist_id);

-- =============================================================================
-- THERAPIST SPECIALTIES POLICIES
-- =============================================================================
CREATE POLICY "Anyone can view therapist specialties"
  ON therapist_specialties FOR SELECT
  TO authenticated
  USING (true);

-- =============================================================================
-- AVAILABILITY SLOTS POLICIES
-- =============================================================================
-- Anyone can view free slots
CREATE POLICY "Anyone can view available slots"
  ON availability_slots FOR SELECT
  TO authenticated
  USING (status = 'free' OR therapist_id = auth.uid());

-- Therapists can manage their own slots
CREATE POLICY "Therapists can insert own slots"
  ON availability_slots FOR INSERT
  WITH CHECK (auth.uid() = therapist_id);

CREATE POLICY "Therapists can update own slots"
  ON availability_slots FOR UPDATE
  USING (auth.uid() = therapist_id);

CREATE POLICY "Therapists can delete own slots"
  ON availability_slots FOR DELETE
  USING (auth.uid() = therapist_id);

-- =============================================================================
-- CONVERSATIONS POLICIES
-- =============================================================================
-- Users can view their own conversations
CREATE POLICY "Users can view own conversations"
  ON conversations FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create conversations
CREATE POLICY "Users can create conversations"
  ON conversations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own conversations
CREATE POLICY "Users can update own conversations"
  ON conversations FOR UPDATE
  USING (auth.uid() = user_id);

-- Therapists can view conversations of assigned/pool referrals
CREATE POLICY "Therapists can view referred conversations"
  ON conversations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM referrals r
      JOIN profiles p ON p.id = auth.uid()
      WHERE r.conversation_id = conversations.id
      AND p.role = 'therapist'
      AND (
        r.assigned_therapist_id = auth.uid()
        OR r.status = 'open' -- Pool cases
      )
    )
  );

-- =============================================================================
-- MESSAGES POLICIES
-- =============================================================================
-- Users can view messages from their conversations
CREATE POLICY "Users can view own messages"
  ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = messages.conversation_id
      AND c.user_id = auth.uid()
    )
  );

-- Users can insert messages to their conversations
CREATE POLICY "Users can insert own messages"
  ON messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = messages.conversation_id
      AND c.user_id = auth.uid()
    )
  );

-- Therapists can view messages from assigned/pool referrals
CREATE POLICY "Therapists can view referred messages"
  ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM referrals r
      JOIN profiles p ON p.id = auth.uid()
      WHERE r.conversation_id = messages.conversation_id
      AND p.role = 'therapist'
      AND (
        r.assigned_therapist_id = auth.uid()
        OR r.status = 'open'
      )
    )
  );

-- =============================================================================
-- CONVERSATION INSIGHTS POLICIES
-- =============================================================================
-- Users cannot view insights (therapist-only)
-- Therapists can view insights for assigned/pool referrals
CREATE POLICY "Therapists can view insights"
  ON conversation_insights FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM referrals r
      JOIN profiles p ON p.id = auth.uid()
      WHERE r.conversation_id = conversation_insights.conversation_id
      AND p.role = 'therapist'
      AND (
        r.assigned_therapist_id = auth.uid()
        OR r.status = 'open'
      )
    )
  );

-- =============================================================================
-- REFERRALS POLICIES
-- =============================================================================
-- Users can view their own referrals (limited info)
CREATE POLICY "Users can view own referrals"
  ON referrals FOR SELECT
  USING (auth.uid() = user_id);

-- Therapists can view assigned referrals or pool
CREATE POLICY "Therapists can view referrals"
  ON referrals FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'therapist'
    )
    AND (
      assigned_therapist_id = auth.uid()
      OR status = 'open' -- Pool
    )
  );

-- Therapists can update assigned referrals
CREATE POLICY "Therapists can update assigned referrals"
  ON referrals FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'therapist'
    )
    AND (
      assigned_therapist_id = auth.uid()
      OR status = 'open' -- Can take from pool
    )
  );

-- =============================================================================
-- APPOINTMENTS POLICIES
-- =============================================================================
-- Users can view their own appointments
CREATE POLICY "Users can view own appointments"
  ON appointments FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create appointments (booking)
CREATE POLICY "Users can create appointments"
  ON appointments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own appointments (cancel)
CREATE POLICY "Users can update own appointments"
  ON appointments FOR UPDATE
  USING (auth.uid() = user_id);

-- Therapists can view their appointments
CREATE POLICY "Therapists can view own appointments"
  ON appointments FOR SELECT
  USING (auth.uid() = therapist_id);

-- Therapists can update their appointments
CREATE POLICY "Therapists can update own appointments"
  ON appointments FOR UPDATE
  USING (auth.uid() = therapist_id);

-- =============================================================================
-- RISK NOTIFICATIONS POLICIES
-- =============================================================================
-- Users can view notifications about them (audit)
CREATE POLICY "Users can view own notifications"
  ON risk_notifications FOR SELECT
  USING (auth.uid() = user_id);

-- No direct insert/update from clients - handled by service role
