import { OpenAI } from 'openai';

/**
 * Generates a summary of the input text
 * @param {string} text - The text to summarize
 * @param {OpenAI} openai - OpenAI client instance
 * @param {string} partner - The partner ('A' or 'B')
 * @param {Function} setIsProcessing - State setter for processing status
 * @param {Function} setSummaryA - State setter for Partner A's summary
 * @param {Function} setSummaryB - State setter for Partner B's summary
 * @returns {Promise<string>} - The generated summary
 */
export const generateSummary = async (
  text,
  openai,
  partner,
  setIsProcessing,
  setSummaryA,
  setSummaryB
) => {
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
 * @param {Function} setIsProcessing - State setter for processing status
 * @param {Function} setKeyThemesA - State setter for Partner A's key themes
 * @param {Function} setKeyThemesB - State setter for Partner B's key themes
 * @returns {Promise<string[]>} - The generated themes
 */
export const generateKeyThemes = async (
  text,
  openai,
  partner,
  setIsProcessing,
  setKeyThemesA,
  setKeyThemesB
) => {
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
 * @param {string} apiKey - OpenAI API key
 * @param {string} currentPartner - The current partner ('A' or 'B')
 * @param {string} inputTextA - Partner A's input text
 * @param {string} inputTextB - Partner B's input text
 * @param {Function} setIsProcessing - State setter for processing status
 * @param {Function} generateSummaryFn - Function to generate summary
 * @param {Function} generateKeyThemesFn - Function to generate key themes
 */
export const handleAnalyze = async (
  apiKey,
  currentPartner,
  inputTextA,
  inputTextB,
  setIsProcessing,
  generateSummaryFn,
  generateKeyThemesFn
) => {
  const inputText = currentPartner === 'A' ? inputTextA : inputTextB;
  
  if (!inputText || inputText.trim().length === 0) {
    alert('Please enter or record some text first');
    return;
  }
  
  try {
    setIsProcessing(true);
    const openai = new OpenAI({
      apiKey: apiKey,
      dangerouslyAllowBrowser: true
    });
    
    await Promise.all([
      generateSummaryFn(inputText, openai, currentPartner),
      generateKeyThemesFn(inputText, openai, currentPartner)
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
 * @param {string} apiKey - OpenAI API key
 * @param {Function} setIsProcessing - State setter for processing status
 * @param {Function} setInputTextA - State setter for Partner A's input text
 * @param {Function} setInputTextB - State setter for Partner B's input text
 * @param {Function} generateSummaryFn - Function to generate summary
 * @param {Function} generateKeyThemesFn - Function to generate key themes
 * @returns {Promise<string>} - The transcribed text
 */
export const transcribeAudio = async (
  audioBlob,
  currentPartner,
  apiKey,
  setIsProcessing,
  setInputTextA,
  setInputTextB,
  generateSummaryFn,
  generateKeyThemesFn
) => {
  try {
    setIsProcessing(true);
    
    // Convert the blob to a File object
    const audioFile = new File([audioBlob], 'recording.webm', { type: 'audio/webm' });
    
    const openai = new OpenAI({
      apiKey: apiKey,
      dangerouslyAllowBrowser: true // Note: In production, you should use a backend proxy
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
          generateSummaryFn(transcription.text, openai, 'A'),
          generateKeyThemesFn(transcription.text, openai, 'A')
        ]);
      } else {
        setInputTextB(transcription.text);
        // After successful transcription, generate a summary and key themes
        await Promise.all([
          generateSummaryFn(transcription.text, openai, 'B'),
          generateKeyThemesFn(transcription.text, openai, 'B')
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
 * Stops recording audio
 * @param {string} currentPartner - The current partner ('A' or 'B')
 * @param {Object} mediaRecorderRefA - Ref for Partner A's media recorder
 * @param {Object} mediaRecorderRefB - Ref for Partner B's media recorder
 * @param {boolean} isRecordingA - Recording status for Partner A
 * @param {boolean} isRecordingB - Recording status for Partner B
 * @param {Function} setIsRecordingA - State setter for Partner A's recording status
 * @param {Function} setIsRecordingB - State setter for Partner B's recording status
 */
export const stopRecording = (
  currentPartner,
  mediaRecorderRefA,
  mediaRecorderRefB,
  isRecordingA,
  isRecordingB,
  setIsRecordingA,
  setIsRecordingB
) => {
  if (currentPartner === 'A' && mediaRecorderRefA.current && isRecordingA) {
    mediaRecorderRefA.current.stop();
    setIsRecordingA(false);
  } else if (currentPartner === 'B' && mediaRecorderRefB.current && isRecordingB) {
    mediaRecorderRefB.current.stop();
    setIsRecordingB(false);
  }
};

/**
 * Starts recording audio from the user's microphone
 * @param {string} currentPartner - The current partner ('A' or 'B')
 * @param {Object} mediaRecorderRefA - Ref for Partner A's media recorder
 * @param {Object} mediaRecorderRefB - Ref for Partner B's media recorder
 * @param {Object} chunksRefA - Ref for Partner A's audio chunks
 * @param {Object} chunksRefB - Ref for Partner B's audio chunks
 * @param {Function} setIsRecordingA - State setter for Partner A's recording status
 * @param {Function} setIsRecordingB - State setter for Partner B's recording status
 * @param {Function} onStopCallback - Callback function to call when recording stops
 */
export const startRecording = async (
  currentPartner,
  mediaRecorderRefA,
  mediaRecorderRefB,
  chunksRefA,
  chunksRefB,
  setIsRecordingA,
  setIsRecordingB,
  onStopCallback
) => {
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
        await onStopCallback(audioBlob);
        
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
        await onStopCallback(audioBlob);
        
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