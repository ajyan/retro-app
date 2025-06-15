import { useState, useRef } from 'react'
import { OpenAI } from 'openai'
import './App.css'

function App() {
  const [inputText, setInputText] = useState('')
  const [summary, setSummary] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const mediaRecorderRef = useRef(null)
  const chunksRef = useRef([])

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
        // After successful transcription, generate a summary
        await generateSummary(transcription.text, openai)
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
  
  const handleSummarize = async () => {
    const apiKey = process.env.REACT_APP_OPENAI_API_KEY
    
    if (!inputText || inputText.trim().length === 0) {
      alert('Please enter or record some text first')
      return
    }
    
    try {
      const openai = new OpenAI({
        apiKey: apiKey,
        dangerouslyAllowBrowser: true
      })
      
      await generateSummary(inputText, openai)
    } catch (error) {
      console.error('Error in handleSummarize:', error)
    }
  }

  return (
    <div className="App">
      <div className="voice-input-container">
        <h2>Voice or Text Input</h2>
        
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
              onClick={handleSummarize}
              disabled={isProcessing || !inputText}
              className="summarize-button"
            >
              Summarize Text
            </button>
            {isRecording && <div className="recording-indicator">Recording...</div>}
            {isProcessing && <div className="processing-indicator">Processing...</div>}
          </div>
        </div>
        
        {summary && (
          <div className="summary-container">
            <h3>Summary</h3>
            <div className="summary-text">
              {summary}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default App
