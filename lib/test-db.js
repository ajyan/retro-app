// Test database connection and operations
const { supabase } = require('./supabase')
const { createCouple, createRetrospective, createConversationRound } = require('./database')

async function testDatabaseConnection() {
  try {
    console.log('Testing Supabase connection...')
    
    // Test basic connection
    const { data, error } = await supabase
      .from('couples')
      .select('count')
      .limit(1)
    
    if (error) {
      console.error('Database connection failed:', error)
      return false
    }
    
    console.log('✅ Database connection successful!')
    return true
    
  } catch (error) {
    console.error('Connection test failed:', error)
    return false
  }
}

async function testFullWorkflow() {
  try {
    console.log('Testing full conversation workflow...')
    
    // 1. Create a test couple
    const couple = await createCouple('test@example.com', 'partner@example.com')
    console.log('✅ Couple created:', couple.id)
    
    // 2. Create a retrospective
    const retrospective = await createRetrospective(couple.id, 'Emotional Check-In')
    console.log('✅ Retrospective created:', retrospective.id)
    
    // 3. Create first conversation round
    const round1 = await createConversationRound(
      retrospective.id, 
      1, 
      "What's something you're grateful for in your partner this week?"
    )
    console.log('✅ Round 1 created:', round1.id)
    
    console.log('🎉 Full workflow test passed!')
    return true
    
  } catch (error) {
    console.error('Workflow test failed:', error)
    return false
  }
}

// Run tests if called directly
if (typeof window === 'undefined') {
  testDatabaseConnection()
    .then(() => testFullWorkflow())
    .catch(console.error)
}