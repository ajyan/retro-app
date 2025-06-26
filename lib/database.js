const { supabase } = require('./supabase')

// Couples operations
const createCouple = async (partnerAEmail, partnerBEmail = null) => {
  const { data, error } = await supabase
    .from('couples')
    .insert({ 
      partner_a_email: partnerAEmail, 
      partner_b_email: partnerBEmail 
    })
    .select()
    .single()
  
  if (error) throw error
  return data
}

const getCouple = async (coupleId) => {
  const { data, error } = await supabase
    .from('couples')
    .select('*')
    .eq('id', coupleId)
    .single()
  
  if (error) throw error
  return data
}

// Retrospectives operations
const createRetrospective = async (coupleId, theme) => {
  const { data, error } = await supabase
    .from('retrospectives')
    .insert({
      couple_id: coupleId,
      theme,
      status: 'in_progress',
      current_round: 1,
      round_count: 3
    })
    .select()
    .single()
  
  if (error) throw error
  return data
}

const updateRetrospective = async (retrospectiveId, updates) => {
  const { data, error } = await supabase
    .from('retrospectives')
    .update(updates)
    .eq('id', retrospectiveId)
    .select()
    .single()
  
  if (error) throw error
  return data
}

const getRetrospective = async (retrospectiveId) => {
  const { data, error } = await supabase
    .from('retrospectives')
    .select(`
      *,
      conversation_rounds (
        *,
        responses (*)
      )
    `)
    .eq('id', retrospectiveId)
    .single()
  
  if (error) throw error
  return data
}

const getRetrospectiveHistory = async (coupleId) => {
  const { data, error } = await supabase
    .from('retrospectives')
    .select(`
      id,
      theme,
      status,
      created_at,
      completed_at,
      tags,
      emotional_themes,
      ai_summary
    `)
    .eq('couple_id', coupleId)
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data
}

// Conversation rounds operations
const createConversationRound = async (retrospectiveId, roundNumber, question) => {
  const { data, error } = await supabase
    .from('conversation_rounds')
    .insert({
      retrospective_id: retrospectiveId,
      round_number: roundNumber,
      question
    })
    .select()
    .single()
  
  if (error) throw error
  return data
}

const updateConversationRound = async (roundId, updates) => {
  const { data, error } = await supabase
    .from('conversation_rounds')
    .update(updates)
    .eq('id', roundId)
    .select()
    .single()
  
  if (error) throw error
  return data
}

const getConversationRounds = async (retrospectiveId) => {
  const { data, error } = await supabase
    .from('conversation_rounds')
    .select('*')
    .eq('retrospective_id', retrospectiveId)
    .order('round_number', { ascending: true })
  
  if (error) throw error
  return data
}

// Response operations
const createResponse = async (roundId, partnerEmail, responseText, voiceUrl = null) => {
  const { data, error } = await supabase
    .from('responses')
    .insert({
      round_id: roundId,
      partner_email: partnerEmail,
      response_text: responseText,
      voice_recording_url: voiceUrl,
      transcription_text: responseText // Assuming text input or transcribed
    })
    .select()
    .single()
  
  if (error) throw error
  return data
}

const updateResponse = async (responseId, updates) => {
  const { data, error } = await supabase
    .from('responses')
    .update(updates)
    .eq('id', responseId)
    .select()
    .single()
  
  if (error) throw error
  return data
}

// AI insights operations
const createAIInsight = async (retrospectiveId, insightType, content, confidenceScore = null) => {
  const { data, error } = await supabase
    .from('ai_insights')
    .insert({
      retrospective_id: retrospectiveId,
      insight_type: insightType,
      content,
      confidence_score: confidenceScore
    })
    .select()
    .single()
  
  if (error) throw error
  return data
}

const getAIInsights = async (retrospectiveId) => {
  const { data, error } = await supabase
    .from('ai_insights')
    .select('*')
    .eq('retrospective_id', retrospectiveId)
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data
}

// Export all functions
module.exports = {
  createCouple,
  getCouple,
  createRetrospective,
  updateRetrospective,
  getRetrospective,
  getRetrospectiveHistory,
  createConversationRound,
  updateConversationRound,
  getConversationRounds,
  createResponse,
  updateResponse,
  createAIInsight,
  getAIInsights
}