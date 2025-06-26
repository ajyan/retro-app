-- Updated RLS policies using auth.uid() and auth.jwt()
-- This approach is more robust than auth.email()

-- First, let's add a user_id column to couples table to link with auth.users
ALTER TABLE couples ADD COLUMN IF NOT EXISTS partner_a_user_id UUID;
ALTER TABLE couples ADD COLUMN IF NOT EXISTS partner_b_user_id UUID;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_couples_partner_a_user_id ON couples(partner_a_user_id);
CREATE INDEX IF NOT EXISTS idx_couples_partner_b_user_id ON couples(partner_b_user_id);

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their couple data" ON couples;
DROP POLICY IF EXISTS "Users can create couples where they are a partner" ON couples;
DROP POLICY IF EXISTS "Users can update their couple data" ON couples;

-- Create new policies using user_id (more reliable than email)
CREATE POLICY "Users can view their couple data" ON couples
  FOR SELECT USING (
    auth.uid() = partner_a_user_id OR 
    auth.uid() = partner_b_user_id OR
    auth.email() = partner_a_email OR 
    auth.email() = partner_b_email
  );

CREATE POLICY "Users can create couples where they are a partner" ON couples
  FOR INSERT WITH CHECK (
    auth.uid() = partner_a_user_id OR 
    auth.uid() = partner_b_user_id OR
    auth.email() = partner_a_email OR 
    auth.email() = partner_b_email
  );

CREATE POLICY "Users can update their couple data" ON couples
  FOR UPDATE USING (
    auth.uid() = partner_a_user_id OR 
    auth.uid() = partner_b_user_id OR
    auth.email() = partner_a_email OR 
    auth.email() = partner_b_email
  );

-- Note: Keep the existing retrospective, conversation_rounds, responses, and ai_insights policies
-- They will work with the updated couples table policies