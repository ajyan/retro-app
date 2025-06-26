-- AI Conversation Multi-Round Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Couples table (if not exists)
CREATE TABLE IF NOT EXISTS couples (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  partner_a_email VARCHAR(255) NOT NULL,
  partner_b_email VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enhanced retrospectives table for multi-round conversations
CREATE TABLE IF NOT EXISTS retrospectives (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  couple_id UUID REFERENCES couples(id) ON DELETE CASCADE,
  theme VARCHAR(100) NOT NULL,
  status VARCHAR(20) DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'paused')),
  round_count INTEGER DEFAULT 3 CHECK (round_count > 0),
  current_round INTEGER DEFAULT 1 CHECK (current_round > 0),
  ai_summary JSONB,
  emotional_themes TEXT[],
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Conversation rounds table (new for multi-round system)
CREATE TABLE IF NOT EXISTS conversation_rounds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  retrospective_id UUID REFERENCES retrospectives(id) ON DELETE CASCADE,
  round_number INTEGER NOT NULL CHECK (round_number > 0),
  question TEXT NOT NULL,
  partner_a_response TEXT,
  partner_b_response TEXT,
  partner_a_voice_url TEXT,
  partner_b_voice_url TEXT,
  ai_analysis JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(retrospective_id, round_number)
);

-- Individual responses table (for detailed tracking)
CREATE TABLE IF NOT EXISTS responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  round_id UUID REFERENCES conversation_rounds(id) ON DELETE CASCADE,
  partner_email VARCHAR(255) NOT NULL,
  response_text TEXT,
  voice_recording_url TEXT,
  transcription_text TEXT,
  sentiment_score DECIMAL(3,2), -- -1.00 to 1.00
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI insights table (for storing AI analysis results)
CREATE TABLE IF NOT EXISTS ai_insights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  retrospective_id UUID REFERENCES retrospectives(id) ON DELETE CASCADE,
  insight_type VARCHAR(50) NOT NULL, -- 'round_analysis', 'final_summary', 'pattern_recognition'
  content JSONB NOT NULL,
  confidence_score DECIMAL(3,2), -- 0.00 to 1.00
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_retrospectives_couple_id ON retrospectives(couple_id);
CREATE INDEX IF NOT EXISTS idx_retrospectives_status ON retrospectives(status);
CREATE INDEX IF NOT EXISTS idx_conversation_rounds_retrospective_id ON conversation_rounds(retrospective_id);
CREATE INDEX IF NOT EXISTS idx_conversation_rounds_round_number ON conversation_rounds(round_number);
CREATE INDEX IF NOT EXISTS idx_responses_round_id ON responses(round_id);
CREATE INDEX IF NOT EXISTS idx_responses_partner_email ON responses(partner_email);
CREATE INDEX IF NOT EXISTS idx_ai_insights_retrospective_id ON ai_insights(retrospective_id);

-- Row Level Security (RLS) policies
ALTER TABLE couples ENABLE ROW LEVEL SECURITY;
ALTER TABLE retrospectives ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (you can enhance these based on your auth strategy)
-- Allow authenticated users to read their own couple's data
CREATE POLICY "Users can view their couple data" ON couples
  FOR SELECT USING (auth.email() = partner_a_email OR auth.email() = partner_b_email);

CREATE POLICY "Users can view their retrospectives" ON retrospectives
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM couples 
      WHERE couples.id = retrospectives.couple_id 
      AND (couples.partner_a_email = auth.email() OR couples.partner_b_email = auth.email())
    )
  );

CREATE POLICY "Users can view their conversation rounds" ON conversation_rounds
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM retrospectives r
      JOIN couples c ON c.id = r.couple_id
      WHERE r.id = conversation_rounds.retrospective_id 
      AND (c.partner_a_email = auth.email() OR c.partner_b_email = auth.email())
    )
  );

CREATE POLICY "Users can view their responses" ON responses
  FOR ALL USING (
    partner_email = auth.email() OR
    EXISTS (
      SELECT 1 FROM conversation_rounds cr
      JOIN retrospectives r ON r.id = cr.retrospective_id
      JOIN couples c ON c.id = r.couple_id
      WHERE cr.id = responses.round_id 
      AND (c.partner_a_email = auth.email() OR c.partner_b_email = auth.email())
    )
  );

CREATE POLICY "Users can view their AI insights" ON ai_insights
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM retrospectives r
      JOIN couples c ON c.id = r.couple_id
      WHERE r.id = ai_insights.retrospective_id 
      AND (c.partner_a_email = auth.email() OR c.partner_b_email = auth.email())
    )
  );

-- Function to automatically update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for automatic timestamp updates
CREATE TRIGGER update_couples_updated_at BEFORE UPDATE ON couples
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_retrospectives_updated_at BEFORE UPDATE ON retrospectives
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversation_rounds_updated_at BEFORE UPDATE ON conversation_rounds
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();