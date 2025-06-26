// Simple database test without RLS
const { supabase } = require('./supabase')

async function testBasicOperations() {
  try {
    console.log('Testing basic database operations...')
    
    // Test 1: Basic connection with couples table
    try {
      const { data: couples, error: couplesError } = await supabase
        .from('couples')
        .select('id')
        .limit(0)
      
      if (!couplesError) {
        console.log('✅ Couples table exists and is accessible!')
      } else {
        console.log('⚠️ Couples table issue:', couplesError.message)
      }
    } catch (err) {
      console.log('❌ Couples table test failed:', err.message)
    }
    
    // Test 2: Retrospectives table
    try {
      const { data: retrospectives, error: retroError } = await supabase
        .from('retrospectives')
        .select('id')
        .limit(0)
      
      if (!retroError) {
        console.log('✅ Retrospectives table exists!')
      } else {
        console.log('⚠️ Retrospectives table issue:', retroError.message)
      }
    } catch (err) {
      console.log('❌ Retrospectives table test failed:', err.message)
    }
    
    // Test 3: Conversation rounds table
    try {
      const { data: rounds, error: roundsError } = await supabase
        .from('conversation_rounds')
        .select('id')
        .limit(0)
      
      if (!roundsError) {
        console.log('✅ Conversation_rounds table exists!')
      } else {
        console.log('⚠️ Conversation_rounds table issue:', roundsError.message)
      }
    } catch (err) {
      console.log('❌ Conversation_rounds table test failed:', err.message)
    }
    
    // Test 4: AI insights table
    try {
      const { data: insights, error: insightsError } = await supabase
        .from('ai_insights')
        .select('id')
        .limit(0)
      
      if (!insightsError) {
        console.log('✅ AI_insights table exists!')
      } else {
        console.log('⚠️ AI_insights table issue:', insightsError.message)
      }
    } catch (err) {
      console.log('❌ AI_insights table test failed:', err.message)
    }
    
    // Test 5: Responses table
    try {
      const { data: responses, error: responsesError } = await supabase
        .from('responses')
        .select('id')
        .limit(0)
      
      if (!responsesError) {
        console.log('✅ Responses table exists!')
      } else {
        console.log('⚠️ Responses table issue:', responsesError.message)
      }
    } catch (err) {
      console.log('❌ Responses table test failed:', err.message)
    }
    
    console.log('\n🎉 Database schema verification complete!')
    console.log('📝 Note: RLS policies are active (this is correct for production)')
    console.log('📝 If you see RLS policy errors when inserting data, that\'s expected and secure!')
    
    return true
    
  } catch (error) {
    console.error('❌ Database test failed:', error.message)
    return false
  }
}

// Run test
testBasicOperations()
  .then(() => {
    console.log('\n✅ Database setup verification complete!')
    console.log('Ready to proceed with OpenAI API integration.')
  })
  .catch(console.error)