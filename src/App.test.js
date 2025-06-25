import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

// Mock the questions.json file
jest.mock('./questions.json', () => [
  { question: "What's something your partner did this week that you appreciated?" },
  { question: "What's one thing you'd like to work on together in the coming week?" }
]);

// Mock the OpenAI module
jest.mock('openai', () => {
  // Create a mock implementation of the OpenAI class
  const mockCreateCompletion = jest.fn().mockResolvedValue({
    choices: [{ message: { content: 'This is a mock summary response' } }]
  });
  
  const mockCreateTranscription = jest.fn().mockResolvedValue({
    text: 'This is a mock transcription'
  });
  
  return {
    OpenAI: jest.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: mockCreateCompletion
        }
      },
      audio: {
        transcriptions: {
          create: mockCreateTranscription
        }
      }
    }))
  };
});

// Mock window.alert
global.alert = jest.fn();

// Create a mock stream for getUserMedia
const mockTracks = [{ stop: jest.fn() }];
const mockStream = {
  getTracks: jest.fn().mockReturnValue(mockTracks)
};

// Mock the getUserMedia API
Object.defineProperty(global.navigator, 'mediaDevices', {
  value: {
    getUserMedia: jest.fn().mockResolvedValue(mockStream)
  }
});

// Mock MediaRecorder
global.MediaRecorder = class {
  constructor() {
    this.ondataavailable = jest.fn();
    this.onstop = jest.fn();
  }
  start = jest.fn();
  stop = jest.fn().mockImplementation(function() {
    // Simulate data available event
    this.ondataavailable({ data: new Blob(['test audio data'], { type: 'audio/webm' }) });
    // Then simulate stop event
    setTimeout(() => {
      if (this.onstop) this.onstop();
    }, 100);
  });
};

// Mock environment variable
process.env.REACT_APP_OPENAI_API_KEY = 'test-api-key';

describe('Retro App Tests', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  test('should render the application with a question', () => {
    render(<App />);
    expect(screen.getByText(/Partner A's Response/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Start Recording/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Analyze Text/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Next: Partner B/i })).toBeInTheDocument();
  });

  test('should allow user to type and analyze text', async () => {
    render(<App />);
    
    // Type in the text area
    const textarea = screen.getByPlaceholderText(/Share your thoughts/i);
    await userEvent.type(textarea, 'This is a test response from Partner A');
    
    // Click analyze button
    const analyzeButton = screen.getByRole('button', { name: /Analyze Text/i });
    fireEvent.click(analyzeButton);
  });

  test('should handle recording and transcription', async () => {
    render(<App />);
    
    // Start recording
    const startRecordingButton = screen.getByRole('button', { name: /Start Recording/i });
    fireEvent.click(startRecordingButton);
    
    // Verify recording started
    expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({ audio: true });
    
    // Wait for the recording indicator to appear
    await waitFor(() => {
      const recordingIndicator = screen.queryByText(/Recording.../i);
      expect(recordingIndicator).toBeInTheDocument();
    });
    
    // Manually simulate the recording being stopped
    const stopRecordingButton = screen.getByRole('button', { name: /Stop Recording/i });
    fireEvent.click(stopRecordingButton);
    
    // Verify that getUserMedia was called
    expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalled();
  });

  test('should switch from Partner A to Partner B', async () => {
    render(<App />);
    
    // Type in Partner A's response
    const textarea = screen.getByPlaceholderText(/Share your thoughts/i);
    await userEvent.type(textarea, 'This is Partner A response');
    
    // Move to Partner B without analyzing (to simplify the test)
    const nextButton = screen.getByRole('button', { name: /Next: Partner B/i });
    fireEvent.click(nextButton);
    
    // Verify we're now on Partner B's section
    await waitFor(() => {
      expect(screen.getByText(/Partner B's Response/i)).toBeInTheDocument();
    });
    
    // Verify the textarea is empty for Partner B
    const partnerBTextarea = screen.getByPlaceholderText(/Share your thoughts/i);
    expect(partnerBTextarea.value).toBe('');
  });

  test('should complete retro when both partners have responded', async () => {
    render(<App />);
    
    // Partner A's response
    const textareaA = screen.getByPlaceholderText(/Share your thoughts/i);
    await userEvent.type(textareaA, 'This is Partner A response');
    
    // Move to Partner B without analyzing (to simplify the test)
    const nextButton = screen.getByRole('button', { name: /Next: Partner B/i });
    fireEvent.click(nextButton);
    
    // Verify we're now on Partner B's section
    await waitFor(() => {
      expect(screen.getByText(/Partner B's Response/i)).toBeInTheDocument();
    });
    
    // Partner B's response
    const textareaB = screen.getByPlaceholderText(/Share your thoughts/i);
    await userEvent.type(textareaB, 'This is Partner B response');
    
    // Complete retro - button text should be "Complete Retro" for Partner B
    const completeButton = screen.getByRole('button', { name: /Complete Retro/i });
    fireEvent.click(completeButton);
    
    // Verify we're on the summary page by checking for specific elements
    await waitFor(() => {
      // Check for the Start New Retro button which only appears on the final summary page
      expect(screen.getByRole('button', { name: /Start New Retro/i })).toBeInTheDocument();
    });
    
    // Check for both partner insights headers
    expect(screen.getByText(/Partner A's Insights/i)).toBeInTheDocument();
    expect(screen.getByText(/Partner B's Insights/i)).toBeInTheDocument();
  });
});
