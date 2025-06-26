import React, { createContext, useContext, useReducer, useEffect } from 'react'

// Conversation state shape
const initialState = {
  // Current conversation
  retrospectiveId: null,
  coupleId: null,
  theme: null,
  status: 'not_started', // 'not_started', 'in_progress', 'completed', 'paused'
  currentRound: 1,
  totalRounds: 3,
  
  // Current round data
  currentQuestion: null,
  currentRoundId: null,
  partnerAResponse: '',
  partnerBResponse: '',
  partnerASubmitted: false,
  partnerBSubmitted: false,
  
  // AI processing
  isAnalyzing: false,
  isGeneratingQuestion: false,
  
  // All rounds data
  rounds: [], // Array of completed rounds
  
  // Final summary
  finalSummary: null,
  
  // UI state
  currentUser: null, // 'partner_a' or 'partner_b'
  showPartnerResponse: false,
  
  // Error handling
  error: null,
  lastSaved: null
}

// Action types
const ACTIONS = {
  // Conversation lifecycle
  START_CONVERSATION: 'START_CONVERSATION',
  SET_THEME: 'SET_THEME',
  SET_CURRENT_USER: 'SET_CURRENT_USER',
  
  // Question management
  SET_QUESTION: 'SET_QUESTION',
  GENERATE_QUESTION_START: 'GENERATE_QUESTION_START',
  GENERATE_QUESTION_SUCCESS: 'GENERATE_QUESTION_SUCCESS',
  GENERATE_QUESTION_ERROR: 'GENERATE_QUESTION_ERROR',
  
  // Response management
  UPDATE_RESPONSE: 'UPDATE_RESPONSE',
  SUBMIT_RESPONSE: 'SUBMIT_RESPONSE',
  BOTH_RESPONSES_SUBMITTED: 'BOTH_RESPONSES_SUBMITTED',
  
  // Round progression
  START_AI_ANALYSIS: 'START_AI_ANALYSIS',
  COMPLETE_AI_ANALYSIS: 'COMPLETE_AI_ANALYSIS',
  ADVANCE_ROUND: 'ADVANCE_ROUND',
  COMPLETE_CONVERSATION: 'COMPLETE_CONVERSATION',
  
  // Data persistence
  SAVE_TO_DATABASE: 'SAVE_TO_DATABASE',
  LOAD_FROM_DATABASE: 'LOAD_FROM_DATABASE',
  
  // Error handling
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
  
  // Reset
  RESET_CONVERSATION: 'RESET_CONVERSATION'
}

// Reducer function
function conversationReducer(state, action) {
  switch (action.type) {
    case ACTIONS.START_CONVERSATION:
      return {
        ...initialState,
        retrospectiveId: action.payload.retrospectiveId,
        coupleId: action.payload.coupleId,
        theme: action.payload.theme,
        status: 'in_progress',
        currentUser: action.payload.currentUser
      }
    
    case ACTIONS.SET_THEME:
      return {
        ...state,
        theme: action.payload
      }
    
    case ACTIONS.SET_CURRENT_USER:
      return {
        ...state,
        currentUser: action.payload
      }
    
    case ACTIONS.GENERATE_QUESTION_START:
      return {
        ...state,
        isGeneratingQuestion: true,
        error: null
      }
    
    case ACTIONS.GENERATE_QUESTION_SUCCESS:
      return {
        ...state,
        isGeneratingQuestion: false,
        currentQuestion: action.payload.question,
        currentRoundId: action.payload.roundId
      }
    
    case ACTIONS.GENERATE_QUESTION_ERROR:
      return {
        ...state,
        isGeneratingQuestion: false,
        error: action.payload
      }
    
    case ACTIONS.UPDATE_RESPONSE:
      const { partner, response } = action.payload
      return {
        ...state,
        [partner === 'A' ? 'partnerAResponse' : 'partnerBResponse']: response
      }
    
    case ACTIONS.SUBMIT_RESPONSE:
      const { partner: submittingPartner } = action.payload
      const updatedState = {
        ...state,
        [submittingPartner === 'A' ? 'partnerASubmitted' : 'partnerBSubmitted']: true
      }
      
      // Check if both partners have submitted
      const bothSubmitted = submittingPartner === 'A' 
        ? updatedState.partnerBSubmitted 
        : updatedState.partnerASubmitted
      
      return bothSubmitted 
        ? { ...updatedState, showPartnerResponse: true }
        : updatedState
    
    case ACTIONS.START_AI_ANALYSIS:
      return {
        ...state,
        isAnalyzing: true
      }
    
    case ACTIONS.COMPLETE_AI_ANALYSIS:
      return {
        ...state,
        isAnalyzing: false,
        rounds: [
          ...state.rounds,
          {
            roundNumber: state.currentRound,
            question: state.currentQuestion,
            partnerAResponse: state.partnerAResponse,
            partnerBResponse: state.partnerBResponse,
            analysis: action.payload
          }
        ]
      }
    
    case ACTIONS.ADVANCE_ROUND:
      return {
        ...state,
        currentRound: state.currentRound + 1,
        currentQuestion: null,
        currentRoundId: null,
        partnerAResponse: '',
        partnerBResponse: '',
        partnerASubmitted: false,
        partnerBSubmitted: false,
        showPartnerResponse: false
      }
    
    case ACTIONS.COMPLETE_CONVERSATION:
      return {
        ...state,
        status: 'completed',
        finalSummary: action.payload
      }
    
    case ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        isAnalyzing: false,
        isGeneratingQuestion: false
      }
    
    case ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null
      }
    
    case ACTIONS.SAVE_TO_DATABASE:
      return {
        ...state,
        lastSaved: new Date().toISOString()
      }
    
    case ACTIONS.LOAD_FROM_DATABASE:
      return {
        ...state,
        ...action.payload,
        lastSaved: new Date().toISOString()
      }
    
    case ACTIONS.RESET_CONVERSATION:
      return initialState
    
    default:
      return state
  }
}

// Create context
const ConversationContext = createContext()

// Provider component
export function ConversationProvider({ children }) {
  const [state, dispatch] = useReducer(conversationReducer, initialState)
  
  // Auto-save to localStorage
  useEffect(() => {
    if (state.retrospectiveId && state.status !== 'not_started') {
      try {
        localStorage.setItem(`conversation-${state.retrospectiveId}`, JSON.stringify(state))
      } catch (error) {
        console.warn('Failed to save conversation state to localStorage:', error)
      }
    }
  }, [state])
  
  // Load from localStorage on mount
  useEffect(() => {
    const savedConversationId = localStorage.getItem('current-conversation-id')
    if (savedConversationId) {
      try {
        const savedState = localStorage.getItem(`conversation-${savedConversationId}`)
        if (savedState) {
          const parsedState = JSON.parse(savedState)
          dispatch({ type: ACTIONS.LOAD_FROM_DATABASE, payload: parsedState })
        }
      } catch (error) {
        console.warn('Failed to load conversation state from localStorage:', error)
      }
    }
  }, [])
  
  // Action creators
  const actions = {
    startConversation: (retrospectiveId, coupleId, theme, currentUser) => {
      localStorage.setItem('current-conversation-id', retrospectiveId)
      dispatch({ 
        type: ACTIONS.START_CONVERSATION, 
        payload: { retrospectiveId, coupleId, theme, currentUser } 
      })
    },
    
    setTheme: (theme) => {
      dispatch({ type: ACTIONS.SET_THEME, payload: theme })
    },
    
    setCurrentUser: (user) => {
      dispatch({ type: ACTIONS.SET_CURRENT_USER, payload: user })
    },
    
    generateQuestionStart: () => {
      dispatch({ type: ACTIONS.GENERATE_QUESTION_START })
    },
    
    generateQuestionSuccess: (question, roundId) => {
      dispatch({ 
        type: ACTIONS.GENERATE_QUESTION_SUCCESS, 
        payload: { question, roundId } 
      })
    },
    
    generateQuestionError: (error) => {
      dispatch({ type: ACTIONS.GENERATE_QUESTION_ERROR, payload: error })
    },
    
    updateResponse: (partner, response) => {
      dispatch({ 
        type: ACTIONS.UPDATE_RESPONSE, 
        payload: { partner, response } 
      })
    },
    
    submitResponse: (partner) => {
      dispatch({ 
        type: ACTIONS.SUBMIT_RESPONSE, 
        payload: { partner } 
      })
    },
    
    startAIAnalysis: () => {
      dispatch({ type: ACTIONS.START_AI_ANALYSIS })
    },
    
    completeAIAnalysis: (analysis) => {
      dispatch({ type: ACTIONS.COMPLETE_AI_ANALYSIS, payload: analysis })
    },
    
    advanceRound: () => {
      dispatch({ type: ACTIONS.ADVANCE_ROUND })
    },
    
    completeConversation: (summary) => {
      dispatch({ type: ACTIONS.COMPLETE_CONVERSATION, payload: summary })
    },
    
    setError: (error) => {
      dispatch({ type: ACTIONS.SET_ERROR, payload: error })
    },
    
    clearError: () => {
      dispatch({ type: ACTIONS.CLEAR_ERROR })
    },
    
    resetConversation: () => {
      localStorage.removeItem('current-conversation-id')
      if (state.retrospectiveId) {
        localStorage.removeItem(`conversation-${state.retrospectiveId}`)
      }
      dispatch({ type: ACTIONS.RESET_CONVERSATION })
    }
  }
  
  return (
    <ConversationContext.Provider value={{ state, actions, dispatch }}>
      {children}
    </ConversationContext.Provider>
  )
}

// Hook to use conversation context
export function useConversation() {
  const context = useContext(ConversationContext)
  if (!context) {
    throw new Error('useConversation must be used within a ConversationProvider')
  }
  return context
}

// Selector hooks for common state pieces
export function useConversationStatus() {
  const { state } = useConversation()
  return {
    status: state.status,
    currentRound: state.currentRound,
    totalRounds: state.totalRounds,
    isInProgress: state.status === 'in_progress',
    isCompleted: state.status === 'completed',
    canAdvance: state.partnerASubmitted && state.partnerBSubmitted
  }
}

export function useCurrentRound() {
  const { state } = useConversation()
  return {
    question: state.currentQuestion,
    roundNumber: state.currentRound,
    partnerAResponse: state.partnerAResponse,
    partnerBResponse: state.partnerBResponse,
    partnerASubmitted: state.partnerASubmitted,
    partnerBSubmitted: state.partnerBSubmitted,
    showPartnerResponse: state.showPartnerResponse,
    isAnalyzing: state.isAnalyzing,
    isGeneratingQuestion: state.isGeneratingQuestion
  }
}

export function useConversationHistory() {
  const { state } = useConversation()
  return {
    rounds: state.rounds,
    finalSummary: state.finalSummary,
    theme: state.theme
  }
}

export { ACTIONS }