import { useState, useRef, useEffect } from 'react'
import { OpenAI } from 'openai'
import './App.css'
import questions from './questions.json'

function App() {
  const [inputText, setInputText] = useState('')
  const [summary, setSummary] = useState('')
  const [keyThemes, setKeyThemes] = useState([])
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [currentQuestion, setCurrentQuestion] = useState('')
  const mediaRecorderRef = useRef(null)
  const chunksRef = useRef([])

  // Select a random question when the component mounts
  useEffect(() => {
    selectRandomQuestion()
  }, [])

  const selectRandomQuestion = () => {
    const randomIndex = Math.floor(Math.random() * questions.length)
    setCurrentQuestion(questions[randomIndex].question)
  }

  const handleTextChange = (e) => {
    setInputText(e.target.value)
  }

  const startRecording = async () => {
    chunksRef.current = []
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaRecorderRef.current = new MediaRecorder(stream)
      
      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data)
        }
      }
      
      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' })
        await transcribeAudio(audioBlob)
        
        // Stop all tracks to release the microphone
        stream.getTracks().forEach(track => track.stop())
      }
      
      mediaRecorderRef.current.start()
      setIsRecording(true)
    } catch (error) {
      console.error('Error accessing microphone:', error)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
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
        setInputText(transcription.text)
        // After successful transcription, generate a summary and key themes
        await Promise.all([
          generateSummary(transcription.text, openai),
          generateKeyThemes(transcription.text, openai)
        ])
      }
    } catch (error) {
      console.error('Error transcribing audio:', error)
      alert(`Error transcribing audio: ${error.message}`)
    } finally {
      setIsProcessing(false)
    }
  }
  
  const generateSummary = async (text, openai) => {
    if (!text || text.trim().length === 0) {
      setSummary('')
      return
    }
    
    try {
      setIsProcessing(true)
      
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          { 
            role: "system", 
            content: "You are a helpful therapist that summarizes someone answering an emotional question concisely. Provide a brief summary of the text in 1-2 sentences."
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
        setSummary(completion.choices[0].message.content)
      }
    } catch (error) {
      console.error('Error generating summary:', error)
      setSummary('Failed to generate summary')
    } finally {
      setIsProcessing(false)
    }
  }

  const generateKeyThemes = async (text, openai) => {
    if (!text || text.trim().length === 0) {
      setKeyThemes([])
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
          .slice(0, 5) // Limit to 5 themes max
        
        setKeyThemes(themes)
      }
    } catch (error) {
      console.error('Error generating key themes:', error)
      setKeyThemes([])
    } finally {
      setIsProcessing(false)
    }
  }
  
  const handleAnalyze = async () => {
    const apiKey = process.env.REACT_APP_OPENAI_API_KEY
    
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
        generateSummary(inputText, openai),
        generateKeyThemes(inputText, openai)
      ])
    } catch (error) {
      console.error('Error in handleAnalyze:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleNewQuestion = () => {
    selectRandomQuestion()
    setInputText('')
    setSummary('')
    setKeyThemes([])
  }

  return (
    <div className="App">
      <div className="voice-input-container">
        <h2 className="reflection-question">{currentQuestion}</h2>
        
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
              onClick={handleNewQuestion}
              className="new-question-button"
              disabled={isProcessing}
            >
              New Question
            </button>
            {isRecording && <div className="recording-indicator">Recording...</div>}
            {isProcessing && <div className="processing-indicator">Processing...</div>}
          </div>
        </div>
        
        {(summary || keyThemes.length > 0) && (
          <div className="ai-insights">
            {summary && (
              <div className="summary-container">
                <div className="insight-header">
                  <span className="insight-icon">👁️</span>
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
                  <span className="insight-icon">📊</span>
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
        )}
      </div>
    </div>
  )
}

export default App
