import { useState, useEffect } from 'react'
import './App.css'
import questions from './questions.json'
import useAudioRecording from './hooks/useAudioRecording'

function App() {
  // Shared state
  const [currentQuestion, setCurrentQuestion] = useState('')
  const [currentPartner, setCurrentPartner] = useState('A') // 'A' or 'B'
  const [isRetroComplete, setIsRetroComplete] = useState(false)
  
  // Use our custom hook for audio recording and processing
  const {
    inputTextA,
    inputTextB,
    summaryA,
    summaryB,
    keyThemesA,
    keyThemesB,
    isRecordingA,
    isRecordingB,
    isProcessing,
    handleTextChange,
    startRecording,
    stopRecording,
    handleAnalyzeText,
    resetState
  } = useAudioRecording()

  // Select a random question when the component mounts
  useEffect(() => {
    selectRandomQuestion()
  }, [])

  const selectRandomQuestion = () => {
    // Use a stable seed or index when component initially renders
    // This ensures consistent rendering between server and client
    const randomIndex = Math.floor(Math.random() * questions.length)
    setCurrentQuestion(questions[randomIndex].question)
  }

  const handleInputChange = (e) => {
    handleTextChange(e, currentPartner)
  }

  const handleStartRecordingClick = async () => {
    await startRecording(currentPartner)
  }

  const handleStopRecordingClick = () => {
    stopRecording(currentPartner)
  }

  const handleAnalyzeTextClick = async () => {
    await handleAnalyzeText(currentPartner)
  }

  const handleSubmit = () => {
    const inputText = currentPartner === 'A' ? inputTextA : inputTextB
    
    if (!inputText || inputText.trim().length === 0) {
      alert('Please enter or record some text first')
      return
    }
    
    if (currentPartner === 'A') {
      setCurrentPartner('B')
    } else {
      setIsRetroComplete(true)
    }
  }

  const handleNewQuestion = () => {
    selectRandomQuestion()
    resetState()
    setCurrentPartner('A')
    setIsRetroComplete(false)
  }

  const renderPartnerInput = () => {
    const isRecording = currentPartner === 'A' ? isRecordingA : isRecordingB
    const inputText = currentPartner === 'A' ? inputTextA : inputTextB
    
    return (
      <div className="partner-section">
        <div className="partner-header">
          <h3>Partner {currentPartner}'s Response</h3>
        </div>
        
        <div className="input-area">
          <textarea
            value={inputText}
            onChange={handleInputChange}
            placeholder="Share your thoughts or click 'Start Recording' to speak..."
            rows={5}
          />
          
          <div className="voice-controls">
            <button 
              onClick={isRecording ? handleStopRecordingClick : handleStartRecordingClick}
              className={isRecording ? 'recording' : ''}
              disabled={isProcessing}
            >
              {isRecording ? 'Stop Recording' : 'Start Recording'}
            </button>
            <button 
              onClick={handleAnalyzeTextClick}
              disabled={isProcessing || !inputText}
              className="summarize-button"
            >
              Analyze Text
            </button>
            <button
              onClick={handleSubmit}
              className="submit-button"
              disabled={isProcessing || !inputText}
            >
              {currentPartner === 'A' ? 'Next: Partner B' : 'Complete Retro'}
            </button>
            {isRecording && <div className="recording-indicator">Recording...</div>}
            {isProcessing && <div className="processing-indicator">Processing...</div>}
          </div>
        </div>
        
        {renderInsights()}
      </div>
    )
  }

  const renderInsights = () => {
    const summary = currentPartner === 'A' ? summaryA : summaryB
    const keyThemes = currentPartner === 'A' ? keyThemesA : keyThemesB
    
    return (summary || keyThemes.length > 0) && (
      <div className="ai-insights">
        {summary && (
          <div className="summary-container">
            <div className="insight-header">
              <span className="insight-icon" aria-hidden="true">👁️</span>
              <h3>Summary</h3>
            </div>
            <div className="summary-text">
              {summary}
            </div>
          </div>
        )}
        
        {keyThemes.length > 0 && (
          <div className="themes-container">
            <div className="insight-header">
              <span className="insight-icon" aria-hidden="true">📊</span>
              <h3>Key Themes</h3>
            </div>
            <div className="themes-tags">
              {keyThemes.map((theme, index) => (
                <span key={index} className="theme-tag">
                  {theme}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  const renderRetroComplete = () => {
    return (
      <div className="retro-complete">
        
        <div className="partner-responses">
          <div className="partner-response">
            <h3>Partner A's Insights</h3>
            <div className="ai-insights">
              {summaryA && (
                <div className="summary-container">
                  <div className="insight-header">
                    <span className="insight-icon" aria-hidden="true">👁️</span>
                    <h3>Summary</h3>
                  </div>
                  <div className="summary-text">
                    {summaryA}
                  </div>
                </div>
              )}
              
              {keyThemesA.length > 0 && (
                <div className="themes-container">
                  <div className="insight-header">
                    <span className="insight-icon" aria-hidden="true">📊</span>
                    <h3>Key Themes</h3>
                  </div>
                  <div className="themes-tags">
                    {keyThemesA.map((theme, index) => (
                      <span key={index} className="theme-tag">
                        {theme}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="partner-response">
            <h3>Partner B's Insights</h3>
            <div className="ai-insights">
              {summaryB && (
                <div className="summary-container">
                  <div className="insight-header">
                    <span className="insight-icon" aria-hidden="true">👁️</span>
                    <h3>Summary</h3>
                  </div>
                  <div className="summary-text">
                    {summaryB}
                  </div>
                </div>
              )}
              
              {keyThemesB.length > 0 && (
                <div className="themes-container">
                  <div className="insight-header">
                    <span className="insight-icon" aria-hidden="true">📊</span>
                    <h3>Key Themes</h3>
                  </div>
                  <div className="themes-tags">
                    {keyThemesB.map((theme, index) => (
                      <span key={index} className="theme-tag">
                        {theme}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <button
          onClick={handleNewQuestion}
          className="new-question-button"
        >
          Start New Retro
        </button>
      </div>
    )
  }

  return (
    <div className="App">
      <div className="voice-input-container">
        <h2 className="reflection-question">{currentQuestion || 'Loading question...'}</h2>
        
        {!isRetroComplete ? renderPartnerInput() : renderRetroComplete()}
      </div>
    </div>
  )
}

export default App
