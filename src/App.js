import { useState, useRef } from 'react'
import { OpenAI } from 'openai'
import './App.css'

function App() {
  const [inputText, setInputText] = useState('')
  const [isRecording, setIsRecording] = useState(false)
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
      }
    } catch (error) {
      console.error('Error transcribing audio:', error)
      alert(`Error transcribing audio: ${error.message}`)
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
            placeholder="Type here or use voice input..."
            rows={5}
          />
          
          <div className="voice-controls">
            <button 
              onClick={isRecording ? stopRecording : startRecording}
              className={isRecording ? 'recording' : ''}
            >
              {isRecording ? 'Stop Recording' : 'Start Recording'}
            </button>
            {isRecording && <div className="recording-indicator">Recording...</div>}
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
