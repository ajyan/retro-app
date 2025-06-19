import { useState, useRef } from 'react';
import { OpenAI } from 'openai';

/**
 * Custom hook to handle audio recording and processing for both partners
 * @returns {Object} - Audio recording state and functions
 */
export default function useAudioRecording() {
  // Shared state
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Partner A state
  const [inputTextA, setInputTextA] = useState('');
  const [summaryA, setSummaryA] = useState('');
  const [keyThemesA, setKeyThemesA] = useState([]);
  const [isRecordingA, setIsRecordingA] = useState(false);
  const mediaRecorderRefA = useRef(null);
  const chunksRefA = useRef([]);
  
  // Partner B state
  const [inputTextB, setInputTextB] = useState('');
  const [summaryB, setSummaryB] = useState('');
  const [keyThemesB, setKeyThemesB] = useState([]);
  const [isRecordingB, setIsRecordingB] = useState(false);
  const mediaRecorderRefB = useRef(null);
  const chunksRefB = useRef([]);

  /**
   * Generates a summary of the input text
   * @param {string} text - The text to summarize
   * @param {OpenAI} openai - OpenAI client instance
   * @param {string} partner - The partner ('A' or 'B')
   * @returns {Promise<string>} - The generated summary
   */
  const generateSummary = async (text, openai, partner) => {
    if (!text || text.trim().length === 0) {
      if (partner === 'A') {
        setSummaryA('');
      } else {
        setSummaryB('');
      }
      return '';
    }
    
    try {
      setIsProcessing(true);
      
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
      });
      
      let summary = '';
      if (completion.choices && completion.choices.length > 0) {
        summary = completion.choices[0].message.content;
        if (partner === 'A') {
          setSummaryA(summary);
        } else {
          setSummaryB(summary);
        }
      }
      return summary;
    } catch (error) {
      console.error('Error generating summary:', error);
      const errorMessage = 'Failed to generate summary';
      if (partner === 'A') {
        setSummaryA(errorMessage);
      } else {
        setSummaryB(errorMessage);
      }
      return errorMessage;
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Generates key themes from the input text
   * @param {string} text - The text to analyze
   * @param {OpenAI} openai - OpenAI client instance
   * @param {string} partner - The partner ('A' or 'B')
   * @returns {Promise<string[]>} - The generated themes
   */
  const generateKeyThemes = async (text, openai, partner) => {
    if (!text || text.trim().length === 0) {
      if (partner === 'A') {
        setKeyThemesA([]);
      } else {
        setKeyThemesB([]);
      }
      return [];
    }
    
    try {
      setIsProcessing(true);
      
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
      });
      
      let themes = [];
      if (completion.choices && completion.choices.length > 0) {
        const themesText = completion.choices[0].message.content;
        // Parse the themes from the response - assuming they could be in different formats
        
        // Try to parse as a list with bullet points, numbers, or just lines
        // eslint-disable-next-line
        const listMatch = themesText.match(/[•\-*\d][\s\.]+(.*?)(?=\n|$)/g);
        if (listMatch) {
          // eslint-disable-next-line
          themes = listMatch.map(item => item.replace(/^[•\-*\d][\s\.]+/, '').trim());
        } else {
          // If not a list, split by commas or newlines
          themes = themesText.split(/[,\n]+/).map(item => item.trim())
          .filter(item => item && !item.startsWith('Themes:') && !item.startsWith('Key themes:'));
        }
        
        // Clean up any remaining punctuation and filter empty items
        themes = themes.map(theme => theme.replace(/[":;.]/g, '').trim())
          .filter(theme => theme.length > 0)
          .slice(0, 3); // Limit to 3 themes max
        
        if (partner === 'A') {
          setKeyThemesA(themes);
        } else {
          setKeyThemesB(themes);
        }
      }
      return themes;
    } catch (error) {
      console.error('Error generating key themes:', error);
      if (partner === 'A') {
        setKeyThemesA([]);
      } else {
        setKeyThemesB([]);
      }
      return [];
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Handles the analyze text action
   * @param {string} currentPartner - The current partner ('A' or 'B')
   */
  const handleAnalyzeText = async (currentPartner) => {
    const inputText = currentPartner === 'A' ? inputTextA : inputTextB;
    
    if (!inputText || inputText.trim().length === 0) {
      alert('Please enter or record some text first');
      return;
    }
    
    try {
      setIsProcessing(true);
      const openai = new OpenAI({
        apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
        dangerouslyAllowBrowser: true
      });
      
      await Promise.all([
        generateSummary(inputText, openai, currentPartner),
        generateKeyThemes(inputText, openai, currentPartner)
      ]);
    } catch (error) {
      console.error('Error in handleAnalyze:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Transcribes audio and generates summary and key themes
   * @param {Blob} audioBlob - The audio blob to transcribe
   * @param {string} currentPartner - The current partner ('A' or 'B')
   */
  const handleAudioBlob = async (audioBlob, currentPartner) => {
    try {
      setIsProcessing(true);
      
      // Convert the blob to a File object
      const audioFile = new File([audioBlob], 'recording.webm', { type: 'audio/webm' });
      
      const openai = new OpenAI({
        apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
        dangerouslyAllowBrowser: true
      });
      
      const transcription = await openai.audio.transcriptions.create({
        file: audioFile,
        model: 'whisper-1',
      });
      
      if (transcription.text) {
        if (currentPartner === 'A') {
          setInputTextA(transcription.text);
          // After successful transcription, generate a summary and key themes
          await Promise.all([
            generateSummary(transcription.text, openai, 'A'),
            generateKeyThemes(transcription.text, openai, 'A')
          ]);
        } else {
          setInputTextB(transcription.text);
          // After successful transcription, generate a summary and key themes
          await Promise.all([
            generateSummary(transcription.text, openai, 'B'),
            generateKeyThemes(transcription.text, openai, 'B')
          ]);
        }
        return transcription.text;
      }
      return '';
    } catch (error) {
      console.error('Error transcribing audio:', error);
      alert(`Error transcribing audio: ${error.message}`);
      return '';
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Starts recording audio from the user's microphone
   * @param {string} currentPartner - The current partner ('A' or 'B')
   */
  const startRecording = async (currentPartner) => {
    const chunksRef = currentPartner === 'A' ? chunksRefA : chunksRefB;
    chunksRef.current = [];
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      if (currentPartner === 'A') {
        mediaRecorderRefA.current = new MediaRecorder(stream);
        mediaRecorderRefA.current.ondataavailable = (e) => {
          if (e.data.size > 0) {
            chunksRef.current.push(e.data);
          }
        };
        
        mediaRecorderRefA.current.onstop = async () => {
          const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
          await handleAudioBlob(audioBlob, currentPartner);
          
          // Stop all tracks to release the microphone
          stream.getTracks().forEach(track => track.stop());
        };
        
        mediaRecorderRefA.current.start();
        setIsRecordingA(true);
      } else {
        mediaRecorderRefB.current = new MediaRecorder(stream);
        mediaRecorderRefB.current.ondataavailable = (e) => {
          if (e.data.size > 0) {
            chunksRef.current.push(e.data);
          }
        };
        
        mediaRecorderRefB.current.onstop = async () => {
          const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
          await handleAudioBlob(audioBlob, currentPartner);
          
          // Stop all tracks to release the microphone
          stream.getTracks().forEach(track => track.stop());
        };
        
        mediaRecorderRefB.current.start();
        setIsRecordingB(true);
      }
    } catch (error) {
      console.error('Error accessing microphone:', error);
    }
  };

  /**
   * Stops recording audio
   * @param {string} currentPartner - The current partner ('A' or 'B')
   */
  const stopRecording = (currentPartner) => {
    if (currentPartner === 'A' && mediaRecorderRefA.current && isRecordingA) {
      mediaRecorderRefA.current.stop();
      setIsRecordingA(false);
    } else if (currentPartner === 'B' && mediaRecorderRefB.current && isRecordingB) {
      mediaRecorderRefB.current.stop();
      setIsRecordingB(false);
    }
  };

  /**
   * Updates the text input for the current partner
   * @param {Event} e - The input change event
   * @param {string} currentPartner - The current partner ('A' or 'B')
   */
  const handleTextChange = (e, currentPartner) => {
    if (currentPartner === 'A') {
      setInputTextA(e.target.value);
    } else {
      setInputTextB(e.target.value);
    }
  };

  /**
   * Resets all state for a new retro session
   */
  const resetState = () => {
    setInputTextA('');
    setSummaryA('');
    setKeyThemesA([]);
    setInputTextB('');
    setSummaryB('');
    setKeyThemesB([]);
    setIsProcessing(false);
  };

  return {
    // State
    inputTextA,
    inputTextB,
    summaryA,
    summaryB,
    keyThemesA,
    keyThemesB,
    isRecordingA,
    isRecordingB,
    isProcessing,
    
    // Methods
    handleTextChange,
    startRecording,
    stopRecording,
    handleAnalyzeText,
    resetState
  };
} 