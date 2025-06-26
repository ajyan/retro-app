const OpenAI = require('openai')
require('dotenv').config()

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY
})

// Theme-based question templates for better consistency
const THEME_PROMPTS = {
  'Emotional Check-In': {
    system: "You are an expert relationship counselor who creates warm, open-ended questions for couples to explore their emotional connection.",
    examples: [
      "What's something you're grateful for in your partner this week?",
      "How are you feeling about our relationship lately?",
      "What's one way I could better support you emotionally right now?"
    ]
  },
  'Conflict Repair': {
    system: "You are a skilled mediator who helps couples process disagreements constructively and rebuild trust.",
    examples: [
      "What's one thing we handled well during our recent disagreement?",
      "How can we better communicate when we're feeling frustrated?",
      "What would help you feel more heard during conflicts?"
    ]
  },
  'Planning': {
    system: "You are a life coach who helps couples align on goals and create shared visions for their future.",
    examples: [
      "What's one goal we could work on together this month?",
      "How do you envision our life together in the next year?",
      "What's something new you'd like us to try as a couple?"
    ]
  },
  'Sex & Intimacy': {
    system: "You are a certified sex therapist who creates safe, respectful questions about physical and emotional intimacy.",
    examples: [
      "What makes you feel most connected to me physically?",
      "How can we better prioritize intimacy in our relationship?",
      "What's one way we could enhance our physical connection?"
    ]
  },
  'Finances': {
    system: "You are a financial counselor who helps couples navigate money conversations with trust and transparency.",
    examples: [
      "How are you feeling about our current financial situation?",
      "What's one financial goal we should prioritize together?",
      "How can we better communicate about money decisions?"
    ]
  },
  'Parenting': {
    system: "You are a family therapist who helps couples strengthen their partnership through parenting challenges.",
    examples: [
      "What's one thing we're doing really well as parents?",
      "How can we better support each other in our parenting roles?",
      "What's one parenting challenge we should tackle together?"
    ]
  }
}

/**
 * Generate an opening question based on theme
 * @param {string} theme - The conversation theme
 * @param {Array} previousQuestions - Optional array of previously used questions to avoid repeats
 * @returns {Promise<string>} Generated question
 */
async function generateQuestion(theme, previousQuestions = []) {
  try {
    const themeConfig = THEME_PROMPTS[theme] || THEME_PROMPTS['Emotional Check-In']
    
    const systemPrompt = `${themeConfig.system}
    
Create ONE thoughtful, open-ended question for couples to discuss. The question should:
- Be warm and non-judgmental
- Encourage vulnerability and connection
- Be specific enough to generate meaningful conversation
- Take 2-5 minutes for each partner to answer thoughtfully

${previousQuestions.length > 0 ? `Avoid repeating these previously used questions: ${previousQuestions.join(', ')}` : ''}

Return only the question, no additional text.`

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Generate a ${theme} question for couples.` }
      ],
      max_tokens: 100,
      temperature: 0.8
    })

    const question = completion.choices[0].message.content.trim()
    
    // Remove quotes if present
    return question.replace(/^["']|["']$/g, '')
    
  } catch (error) {
    console.error('Error generating question:', error)
    
    // Fallback to theme examples if API fails
    const themeConfig = THEME_PROMPTS[theme] || THEME_PROMPTS['Emotional Check-In']
    const availableQuestions = themeConfig.examples.filter(q => !previousQuestions.includes(q))
    
    if (availableQuestions.length > 0) {
      return availableQuestions[Math.floor(Math.random() * availableQuestions.length)]
    }
    
    return "What's something you appreciate about our relationship lately?"
  }
}

/**
 * Analyze responses to extract emotional themes and topics
 * @param {Array} responses - Array of response objects with {partnerEmail, text}
 * @param {string} question - The question that was answered
 * @returns {Promise<Object>} Analysis results
 */
async function analyzeResponses(responses, question) {
  try {
    const responseTexts = responses.map(r => r.text || r.response_text).join('\n\n---\n\n')
    
    const systemPrompt = `You are an expert relationship analyst. Analyze these couple responses to identify:
1. Emotional themes (e.g., "gratitude", "stress", "excitement", "concern")
2. Key topics mentioned (e.g., "work", "family", "future plans", "communication")
3. Overall sentiment for each partner (positive/neutral/negative)
4. Suggested areas for follow-up questions

Return a JSON object with this structure:
{
  "emotionalThemes": ["theme1", "theme2"],
  "keyTopics": ["topic1", "topic2"],
  "partnerSentiments": [{"partner": "A", "sentiment": "positive"}, {"partner": "B", "sentiment": "neutral"}],
  "suggestedFollowUps": ["area1", "area2"],
  "overallTone": "positive/neutral/concerning"
}`

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Question: ${question}\n\nResponses:\n${responseTexts}` }
      ],
      max_tokens: 300,
      temperature: 0.3
    })

    const analysisText = completion.choices[0].message.content.trim()
    
    try {
      return JSON.parse(analysisText)
    } catch (parseError) {
      console.error('Error parsing AI analysis:', parseError)
      // Return fallback analysis
      return {
        emotionalThemes: ["connection"],
        keyTopics: ["relationship"],
        partnerSentiments: [
          {"partner": "A", "sentiment": "positive"},
          {"partner": "B", "sentiment": "positive"}
        ],
        suggestedFollowUps: ["communication"],
        overallTone: "positive"
      }
    }
    
  } catch (error) {
    console.error('Error analyzing responses:', error)
    
    // Return minimal fallback analysis
    return {
      emotionalThemes: ["connection"],
      keyTopics: ["relationship"],
      partnerSentiments: [
        {"partner": "A", "sentiment": "neutral"},
        {"partner": "B", "sentiment": "neutral"}
      ],
      suggestedFollowUps: ["communication"],
      overallTone: "neutral"
    }
  }
}

/**
 * Generate follow-up questions based on previous rounds
 * @param {Object} context - Context object with theme, previousRounds, and analysis
 * @returns {Promise<string>} Generated follow-up question
 */
async function generateFollowUp(context) {
  try {
    const { theme, previousRounds, analysisContext } = context
    
    const roundSummary = previousRounds.map((round, index) => 
      `Round ${index + 1}: ${round.question}\nKey themes: ${round.ai_analysis?.emotionalThemes?.join(', ') || 'N/A'}`
    ).join('\n\n')
    
    const systemPrompt = `You are an expert relationship counselor creating adaptive follow-up questions.
    
Based on the conversation so far, create ONE follow-up question that:
- Builds on themes that emerged from previous responses
- Goes deeper into areas that need exploration
- Maintains the ${theme} focus
- Encourages actionable insights or connection

Previous conversation context:
${roundSummary}

${analysisContext ? `Recent analysis suggests focus on: ${analysisContext.suggestedFollowUps?.join(', ')}` : ''}

Return only the question, no additional text.`

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Generate a follow-up question for this ${theme} conversation.` }
      ],
      max_tokens: 100,
      temperature: 0.7
    })

    const question = completion.choices[0].message.content.trim()
    return question.replace(/^["']|["']$/g, '')
    
  } catch (error) {
    console.error('Error generating follow-up:', error)
    
    // Theme-based fallback questions
    const fallbacks = {
      'Emotional Check-In': "How can we better support each other based on what we've shared?",
      'Conflict Repair': "What's one thing we could do differently next time?",
      'Planning': "What's our next step toward making this happen?",
      'Sex & Intimacy': "How can we better prioritize this in our relationship?",
      'Finances': "What's one small step we could take this week?",
      'Parenting': "How can we support each other better in this area?"
    }
    
    return fallbacks[context.theme] || "What's one thing we could do together based on our conversation?"
  }
}

/**
 * Generate final summary and insights for completed conversation
 * @param {Array} allRounds - All conversation rounds with responses
 * @param {string} theme - The conversation theme
 * @returns {Promise<Object>} Summary and insights
 */
async function generateConversationSummary(allRounds, theme) {
  try {
    const conversationText = allRounds.map((round, index) => 
      `Round ${index + 1}: ${round.question}\nResponses: ${round.responses?.map(r => r.response_text).join(' | ') || 'No responses'}`
    ).join('\n\n')
    
    const systemPrompt = `You are a relationship expert creating a thoughtful summary of a couple's conversation.

Create a JSON summary with:
{
  "overallThemes": ["theme1", "theme2"],
  "keyInsights": ["insight1", "insight2"],
  "strengths": ["strength1", "strength2"],
  "growthAreas": ["area1", "area2"],
  "suggestedActions": ["action1", "action2"],
  "emotionalJourney": "A brief description of the emotional flow",
  "tags": ["tag1", "tag2"]
}

Keep insights positive and actionable. Focus on connection and growth.`

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Theme: ${theme}\n\nConversation:\n${conversationText}` }
      ],
      max_tokens: 400,
      temperature: 0.3
    })

    const summaryText = completion.choices[0].message.content.trim()
    
    try {
      return JSON.parse(summaryText)
    } catch (parseError) {
      console.error('Error parsing summary:', parseError)
      return {
        overallThemes: [theme.toLowerCase()],
        keyInsights: ["You both showed openness in sharing"],
        strengths: ["Good communication"],
        growthAreas: ["Continue these conversations"],
        suggestedActions: ["Schedule regular check-ins"],
        emotionalJourney: "A meaningful conversation about your relationship",
        tags: [theme.toLowerCase(), "connection"]
      }
    }
    
  } catch (error) {
    console.error('Error generating summary:', error)
    return {
      overallThemes: [theme.toLowerCase()],
      keyInsights: ["You completed a meaningful conversation together"],
      strengths: ["Commitment to reflection"],
      growthAreas: ["Continue building on this foundation"],
      suggestedActions: ["Plan your next retrospective"],
      emotionalJourney: "A step toward deeper connection",
      tags: [theme.toLowerCase(), "growth"]
    }
  }
}

module.exports = {
  generateQuestion,
  analyzeResponses,
  generateFollowUp,
  generateConversationSummary,
  THEME_PROMPTS
}