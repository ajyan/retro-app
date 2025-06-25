import { useState, useEffect } from 'react'
// No need to import CSS here as it's imported in app/layout.js
import questions from './questions.json'
import useAudioRecording from './hooks/useAudioRecording'

import { Button } from "./components/ui/button"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "./components/ui/card"
import { Textarea } from "./components/ui/textarea"
import { Badge } from "./components/ui/badge"

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
      <div className="w-full space-y-4">
        <div className="text-center">
          <h3 className="text-xl font-medium text-primary">
            Partner {currentPartner}'s Response
          </h3>
        </div>
        
        <div className="space-y-4">
          <Textarea
            value={inputText}
            onChange={handleInputChange}
            placeholder="Share your thoughts or click 'Start Recording' to speak..."
            className="min-h-[120px] text-base"
          />
          
          <div className="flex flex-wrap gap-3 justify-center">
            <Button 
              onClick={isRecording ? handleStopRecordingClick : handleStartRecordingClick}
              variant={isRecording ? "destructive" : "default"}
              disabled={isProcessing}
              className="relative"
            >
              {isRecording ? 'Stop Recording' : 'Start Recording'}
              {isRecording && (
                <span className="absolute -top-2 -right-2 h-3 w-3 rounded-full bg-red-500 animate-pulse"></span>
              )}
            </Button>
            
            <Button 
              onClick={handleAnalyzeTextClick}
              variant="secondary"
              disabled={isProcessing || !inputText}
            >
              Analyze Text
            </Button>
            
            <Button
              onClick={handleSubmit}
              variant="outline"
              disabled={isProcessing || !inputText}
            >
              {currentPartner === 'A' ? 'Next: Partner B' : 'Complete Retro'}
            </Button>
            
            {isProcessing && (
              <div className="w-full text-center text-sm text-muted-foreground animate-pulse">
                Processing...
              </div>
            )}
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
      <div className="space-y-6 mt-6">
        {summary && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <span className="text-primary">👁️</span>
                Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>{summary}</p>
            </CardContent>
          </Card>
        )}
        
        {keyThemes.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <span className="text-primary">📊</span>
                Key Themes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {keyThemes.map((theme, index) => (
                  <Badge key={index} variant="secondary">
                    {theme}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    )
  }

  const renderRetroComplete = () => {
    return (
      <div className="w-full space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Partner A's Insights</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {summaryA && (
                <div>
                  <h4 className="text-sm font-medium text-primary flex items-center gap-2 mb-2">
                    <span>👁️</span>
                    Summary
                  </h4>
                  <p className="text-sm">{summaryA}</p>
                </div>
              )}
              
              {keyThemesA.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-primary flex items-center gap-2 mb-2">
                    <span>📊</span>
                    Key Themes
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {keyThemesA.map((theme, index) => (
                      <Badge key={index} variant="secondary">
                        {theme}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Partner B's Insights</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {summaryB && (
                <div>
                  <h4 className="text-sm font-medium text-primary flex items-center gap-2 mb-2">
                    <span>👁️</span>
                    Summary
                  </h4>
                  <p className="text-sm">{summaryB}</p>
                </div>
              )}
              
              {keyThemesB.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-primary flex items-center gap-2 mb-2">
                    <span>📊</span>
                    Key Themes
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {keyThemesB.map((theme, index) => (
                      <Badge key={index} variant="secondary">
                        {theme}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        <div className="flex justify-center">
          <Button
            onClick={handleNewQuestion}
            variant="default"
            size="lg"
          >
            Start New Retro
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-3xl shadow-lg">
        <CardHeader>
          <CardTitle className="text-center text-xl md:text-2xl italic text-primary">
            {currentQuestion || 'Loading question...'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!isRetroComplete ? renderPartnerInput() : renderRetroComplete()}
        </CardContent>
      </Card>
    </div>
  )
}

export default App
