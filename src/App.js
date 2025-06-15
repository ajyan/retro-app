import { useState, useRef, useEffect } from 'react'
import { OpenAI } from 'openai'
import './App.css'
import questions from './questions.json'

function App() {
  // Shared state
  const [currentQuestion, setCurrentQuestion] = useState('')
  const [currentPartner, setCurrentPartner] = useState('A') // 'A' or 'B'
  const [isProcessing, setIsProcessing] = useState(false)
  
  // Partner A state
  const [inputTextA, setInputTextA] = useState('')
  const [summaryA, setSummaryA] = useState('')
  const [keyThemesA, setKeyThemesA] = useState([])
  const [isRecordingA, setIsRecordingA] = useState(false)
  const mediaRecorderRefA = useRef(null)
  const chunksRefA = useRef([])
  
  // Partner B state
  const [inputTextB, setInputTextB] = useState('')
  const [summaryB, setSummaryB] = useState('')
  const [keyThemesB, setKeyThemesB] = useState([])
  const [isRecordingB, setIsRecordingB] = useState(false)
  const mediaRecorderRefB = useRef(null)
  const chunksRefB = useRef([])
  
  // Final state
  const [isRetroComplete, setIsRetroComplete] = useState(false)

  // Select a random question when the component mounts
  useEffect(() => {
    selectRandomQuestion()
  }, [])

  const selectRandomQuestion = () => {
    const randomIndex = Math.floor(Math.random() * questions.length)
    setCurrentQuestion(questions[randomIndex].question)
  }

  const handleTextChange = (e) => {
    if (currentPartner === 'A') {
      setInputTextA(e.target.value)
    } else {
      setInputTextB(e.target.value)
    }
  }

  const startRecording = async () => {
    const chunksRef = currentPartner === 'A' ? chunksRefA : chunksRefB
    chunksRef.current = []
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      
      if (currentPartner === 'A') {
        mediaRecorderRefA.current = new MediaRecorder(stream)
        mediaRecorderRefA.current.ondataavailable = (e) => {
          if (e.data.size > 0) {
            chunksRef.current.push(e.data)
          }
        }
        
        mediaRecorderRefA.current.onstop = async () => {
          const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' })
          await transcribeAudio(audioBlob)
          
          // Stop all tracks to release the microphone
          stream.getTracks().forEach(track => track.stop())
        }
        
        mediaRecorderRefA.current.start()
        setIsRecordingA(true)
      } else {
        mediaRecorderRefB.current = new MediaRecorder(stream)
        mediaRecorderRefB.current.ondataavailable = (e) => {
          if (e.data.size > 0) {
            chunksRef.current.push(e.data)
          }
        }
        
        mediaRecorderRefB.current.onstop = async () => {
          const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' })
          await transcribeAudio(audioBlob)
          
          // Stop all tracks to release the microphone
          stream.getTracks().forEach(track => track.stop())
        }
        
        mediaRecorderRefB.current.start()
        setIsRecordingB(true)
      }
    } catch (error) {
      console.error('Error accessing microphone:', error)
    }
  }

  const stopRecording = () => {
    if (currentPartner === 'A' && mediaRecorderRefA.current && isRecordingA) {
      mediaRecorderRefA.current.stop()
      setIsRecordingA(false)
    } else if (currentPartner === 'B' && mediaRecorderRefB.current && isRecordingB) {
      mediaRecorderRefB.current.stop()
      setIsRecordingB(false)
    }
  }

  const transcribeAudio = async (audioBlob) => {
    const apiKey = process.env.REACT_APP_OPENAI_API_KEY
    
    try {
      setIsProcessing(true)
      
      // Convert the blob to a File object
      const audioFile = new File([audioBlob], 'recording.webm', { type: 'audio/webm' })
      
      const openai = new OpenAI({
        apiKey: apiKey,
        dangerouslyAllowBrowser: true // Note: In production, you should use a backend proxy
      })
      
      const transcription = await openai.audio.transcriptions.create({
        file: audioFile,
        model: 'whisper-1',
      })
      
      if (transcription.text) {
        if (currentPartner === 'A') {
          setInputTextA(transcription.text)
          // After successful transcription, generate a summary and key themes
          await Promise.all([
            generateSummary(transcription.text, openai, 'A'),
            generateKeyThemes(transcription.text, openai, 'A')
          ])
        } else {
          setInputTextB(transcription.text)
          // After successful transcription, generate a summary and key themes
          await Promise.all([
            generateSummary(transcription.text, openai, 'B'),
            generateKeyThemes(transcription.text, openai, 'B')
          ])
        }
      }
    } catch (error) {
      console.error('Error transcribing audio:', error)
      alert(`Error transcribing audio: ${error.message}`)
    } finally {
      setIsProcessing(false)
    }
  }
  
  const generateSummary = async (text, openai, partner) => {
    if (!text || text.trim().length === 0) {
      if (partner === 'A') {
        setSummaryA('')
      } else {
        setSummaryB('')
      }
      return
    }
    
    try {
      setIsProcessing(true)
      
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          { 
            role: "system", 
            content: "You are a helpful therapist that summarizes a partner in a relationship answering an emotional question. Provide a concise summary of the text in 1-2 sentences."
          },
          { 
            role: "user", 
            content: `Summarize this text: ${text}`
          }
        ],
        temperature: 0.7,
        max_tokens: 100
      })
      
      if (completion.choices && completion.choices.length > 0) {
        if (partner === 'A') {
          setSummaryA(completion.choices[0].message.content)
        } else {
          setSummaryB(completion.choices[0].message.content)
        }
      }
    } catch (error) {
      console.error('Error generating summary:', error)
      if (partner === 'A') {
        setSummaryA('Failed to generate summary')
      } else {
        setSummaryB('Failed to generate summary')
      }
    } finally {
      setIsProcessing(false)
    }
  }

  const generateKeyThemes = async (text, openai, partner) => {
    if (!text || text.trim().length === 0) {
      if (partner === 'A') {
        setKeyThemesA([])
      } else {
        setKeyThemesB([])
      }
      return
    }
    
    try {
      setIsProcessing(true)
      
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          { 
            role: "system", 
            content: "You are a relationship therapist that identifies key emotional themes from someone's personal reflection. Extract 3-5 key themes as single words or short phrases (2-3 words maximum per theme)."
          },
          { 
            role: "user", 
            content: `Identify key themes from this text: ${text}`
          }
        ],
        temperature: 0.7,
        max_tokens: 100
      })
      
      if (completion.choices && completion.choices.length > 0) {
        const themesText = completion.choices[0].message.content
        // Parse the themes from the response - assuming they could be in different formats
        let themes = []
        
        // Try to parse as a list with bullet points, numbers, or just lines
        // eslint-disable-next-line
        const listMatch = themesText.match(/[•\-*\d][\s\.]+(.*?)(?=\n|$)/g)
        if (listMatch) {
          // eslint-disable-next-line
          themes = listMatch.map(item => item.replace(/^[•\-*\d][\s\.]+/, '').trim())
        } else {
          // If not a list, split by commas or newlines
          themes = themesText.split(/[,\n]+/).map(item => item.trim())
          .filter(item => item && !item.startsWith('Themes:') && !item.startsWith('Key themes:'))
        }
        
        // Clean up any remaining punctuation and filter empty items
        themes = themes.map(theme => theme.replace(/[":;.]/g, '').trim())
          .filter(theme => theme.length > 0)
          .slice(0, 3) // Limit to 3 themes max
        
        if (partner === 'A') {
          setKeyThemesA(themes)
        } else {
          setKeyThemesB(themes)
        }
      }
    } catch (error) {
      console.error('Error generating key themes:', error)
      if (partner === 'A') {
        setKeyThemesA([])
      } else {
        setKeyThemesB([])
      }
    } finally {
      setIsProcessing(false)
    }
  }
  
  const handleAnalyze = async () => {
    const apiKey = process.env.REACT_APP_OPENAI_API_KEY
    const inputText = currentPartner === 'A' ? inputTextA : inputTextB
    
    if (!inputText || inputText.trim().length === 0) {
      alert('Please enter or record some text first')
      return
    }
    
    try {
      setIsProcessing(true)
      const openai = new OpenAI({
        apiKey: apiKey,
        dangerouslyAllowBrowser: true
      })
      
      await Promise.all([
        generateSummary(inputText, openai, currentPartner),
        generateKeyThemes(inputText, openai, currentPartner)
      ])
    } catch (error) {
      console.error('Error in handleAnalyze:', error)
    } finally {
      setIsProcessing(false)
    }
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
    setInputTextA('')
    setSummaryA('')
    setKeyThemesA([])
    setInputTextB('')
    setSummaryB('')
    setKeyThemesB([])
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
            onChange={handleTextChange}
            placeholder="Share your thoughts or click 'Start Recording' to speak..."
            rows={5}
          />
          
          <div className="voice-controls">
            <button 
              onClick={isRecording ? stopRecording : startRecording}
              className={isRecording ? 'recording' : ''}
              disabled={isProcessing}
            >
              {isRecording ? 'Stop Recording' : 'Start Recording'}
            </button>
            <button 
              onClick={handleAnalyze}
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
        <h2 className="reflection-question">{currentQuestion}</h2>
        
        {!isRetroComplete ? renderPartnerInput() : renderRetroComplete()}
      </div>
    </div>
  )
}

export default App
