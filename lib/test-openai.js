// Test OpenAI API integration
const { generateQuestion, analyzeResponses, generateFollowUp, generateConversationSummary } = require('./openai')

async function testQuestionGeneration() {
  console.log('🧪 Testing Question Generation...')
  
  try {
    // Test different themes
    const themes = ['Emotional Check-In', 'Planning', 'Conflict Repair']
    
    for (const theme of themes) {
      console.log(`\n📝 Testing ${theme} questions:`)
      
      const question1 = await generateQuestion(theme)
      console.log(`  Question 1: ${question1}`)
      
      // Test with previous questions to avoid repeats
      const question2 = await generateQuestion(theme, [question1])
      console.log(`  Question 2: ${question2}`)
      
      if (question1 === question2) {
        console.log(`  ⚠️  Warning: Questions are identical for ${theme}`)
      } else {
        console.log(`  ✅ Questions are different for ${theme}`)
      }
    }
    
    return true
  } catch (error) {
    console.error('❌ Question generation test failed:', error)
    return false
  }
}

async function testResponseAnalysis() {
  console.log('\n🧪 Testing Response Analysis...')
  
  try {
    const sampleResponses = [
      {
        partnerEmail: 'partner1@example.com',
        text: "I'm really grateful for how supportive you've been with my work stress lately. It means everything to have you listen and offer encouragement."
      },
      {
        partnerEmail: 'partner2@example.com', 
        text: "I appreciate that too. I've been feeling a bit overwhelmed with family stuff, but knowing we're a team helps me get through it."
      }
    ]
    
    const question = "What's something you're grateful for in your partner this week?"
    
    const analysis = await analyzeResponses(sampleResponses, question)
    
    console.log('📊 Analysis Results:')
    console.log(`  Emotional Themes: ${analysis.emotionalThemes?.join(', ')}`)
    console.log(`  Key Topics: ${analysis.keyTopics?.join(', ')}`)
    console.log(`  Overall Tone: ${analysis.overallTone}`)
    console.log(`  Suggested Follow-ups: ${analysis.suggestedFollowUps?.join(', ')}`)
    
    // Validate structure
    const hasRequiredFields = analysis.emotionalThemes && analysis.keyTopics && analysis.overallTone
    if (hasRequiredFields) {
      console.log('✅ Response analysis structure is valid')
      return true
    } else {
      console.log('❌ Response analysis missing required fields')
      return false
    }
    
  } catch (error) {
    console.error('❌ Response analysis test failed:', error)
    return false
  }
}

async function testFollowUpGeneration() {
  console.log('\n🧪 Testing Follow-up Generation...')
  
  try {
    const mockContext = {
      theme: 'Emotional Check-In',
      previousRounds: [
        {
          question: "What's something you're grateful for in your partner this week?",
          ai_analysis: {
            emotionalThemes: ['gratitude', 'support'],
            keyTopics: ['work stress', 'family challenges']
          }
        }
      ],
      analysisContext: {
        suggestedFollowUps: ['communication', 'stress management']
      }
    }
    
    const followUpQuestion = await generateFollowUp(mockContext)
    console.log(`📝 Generated follow-up: ${followUpQuestion}`)
    
    if (followUpQuestion && followUpQuestion.length > 10) {
      console.log('✅ Follow-up generation successful')
      return true
    } else {
      console.log('❌ Follow-up generation produced invalid result')
      return false
    }
    
  } catch (error) {
    console.error('❌ Follow-up generation test failed:', error)
    return false
  }
}

async function testConversationSummary() {
  console.log('\n🧪 Testing Conversation Summary...')
  
  try {
    const mockRounds = [
      {
        question: "What's something you're grateful for in your partner this week?",
        responses: [
          { response_text: "Your support with work stress" },
          { response_text: "How we handle family challenges together" }
        ]
      },
      {
        question: "How can we better support each other during stressful times?",
        responses: [
          { response_text: "Maybe check in more regularly" },
          { response_text: "I'd like more help with planning" }
        ]
      }
    ]
    
    const summary = await generateConversationSummary(mockRounds, 'Emotional Check-In')
    
    console.log('📋 Summary Results:')
    console.log(`  Overall Themes: ${summary.overallThemes?.join(', ')}`)
    console.log(`  Key Insights: ${summary.keyInsights?.join(', ')}`)
    console.log(`  Strengths: ${summary.strengths?.join(', ')}`)
    console.log(`  Growth Areas: ${summary.growthAreas?.join(', ')}`)
    
    // Validate structure
    const hasRequiredFields = summary.overallThemes && summary.keyInsights && summary.strengths
    if (hasRequiredFields) {
      console.log('✅ Conversation summary structure is valid')
      return true
    } else {
      console.log('❌ Conversation summary missing required fields')
      return false
    }
    
  } catch (error) {
    console.error('❌ Conversation summary test failed:', error)
    return false
  }
}

async function runAllTests() {
  console.log('🚀 Starting OpenAI Integration Tests...\n')
  
  const results = {
    questionGeneration: await testQuestionGeneration(),
    responseAnalysis: await testResponseAnalysis(),
    followUpGeneration: await testFollowUpGeneration(),
    conversationSummary: await testConversationSummary()
  }
  
  const passedTests = Object.values(results).filter(Boolean).length
  const totalTests = Object.keys(results).length
  
  console.log('\n📊 Test Results Summary:')
  console.log(`✅ Passed: ${passedTests}/${totalTests} tests`)
  
  if (passedTests === totalTests) {
    console.log('🎉 All OpenAI integration tests passed!')
    console.log('Ready to build Phase 2: Multi-Round UI Components')
  } else {
    console.log('⚠️  Some tests failed. Check your OpenAI API key and configuration.')
  }
  
  return passedTests === totalTests
}

// Run tests if called directly
if (require.main === module) {
  runAllTests()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Test suite failed:', error)
      process.exit(1)
    })
}

module.exports = { runAllTests }