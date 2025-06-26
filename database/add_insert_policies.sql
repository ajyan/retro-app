-- Add INSERT policies for authenticated users
-- Run this in your Supabase SQL Editor after the main schema

-- Allow authenticated users to create couple records where they are one of the partners
CREATE POLICY "Users can create couples where they are a partner" ON couples
  FOR INSERT WITH CHECK (
    auth.email() = partner_a_email OR auth.email() = partner_b_email
  );

-- Allow authenticated users to update their couple data
CREATE POLICY "Users can update their couple data" ON couples
  FOR UPDATE USING (
    auth.email() = partner_a_email OR auth.email() = partner_b_email
  );

-- Allow authenticated users to create retrospectives for their couples
CREATE POLICY "Users can create retrospectives for their couples" ON retrospectives
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM couples 
      WHERE couples.id = retrospectives.couple_id 
      AND (couples.partner_a_email = auth.email() OR couples.partner_b_email = auth.email())
    )
  );

-- Allow authenticated users to create conversation rounds for their retrospectives
CREATE POLICY "Users can create conversation rounds" ON conversation_rounds
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM retrospectives r
      JOIN couples c ON c.id = r.couple_id
      WHERE r.id = conversation_rounds.retrospective_id 
      AND (c.partner_a_email = auth.email() OR c.partner_b_email = auth.email())
    )
  );

-- Allow authenticated users to create responses
CREATE POLICY "Users can create responses" ON responses
  FOR INSERT WITH CHECK (
    partner_email = auth.email() OR
    EXISTS (
      SELECT 1 FROM conversation_rounds cr
      JOIN retrospectives r ON r.id = cr.retrospective_id
      JOIN couples c ON c.id = r.couple_id
      WHERE cr.id = responses.round_id 
      AND (c.partner_a_email = auth.email() OR c.partner_b_email = auth.email())
    )
  );

-- Allow authenticated users to create AI insights for their retrospectives
CREATE POLICY "Users can create AI insights" ON ai_insights
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM retrospectives r
      JOIN couples c ON c.id = r.couple_id
      WHERE r.id = ai_insights.retrospective_id 
      AND (c.partner_a_email = auth.email() OR c.partner_b_email = auth.email())
    )
  );