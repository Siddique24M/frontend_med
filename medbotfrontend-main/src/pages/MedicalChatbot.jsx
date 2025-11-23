import React, { useState, useRef, useEffect } from 'react';
import { FaMicrophone, FaStopCircle, FaVolumeUp, FaVolumeMute, FaPause, FaPlay, FaUpload, FaPaperPlane, FaRobot, FaUser, FaTrash } from 'react-icons/fa';
import axios from 'axios';
import AppointmentScheduler from './AppointmentScheduler';

const MedicalChatbot = () => {
  // State variables
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageType, setImageType] = useState('injury');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);

  const [showAppointmentScheduler, setShowAppointmentScheduler] = useState(false);
  
  // State variables for audio recording
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [transcribedText, setTranscribedText] = useState(''); // New state for transcribed text
  const [selectedLanguage, setSelectedLanguage] = useState('en'); // Default language
  
  // Refs
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const currentUtteranceRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  
  // Available languages for speech recognition
  const availableLanguages = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
    { code: 'zh', name: 'Chinese' },
    { code: 'hi', name: 'Hindi' },
    { code: 'ar', name: 'Arabic' },
    { code: 'ru', name: 'Russian' },
    { code: 'ja', name: 'Japanese' },
    { code: 'pt', name: 'Portuguese' },
  ];

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  // Setup speech synthesis handlers
  useEffect(() => {
    if ('speechSynthesis' in window) {
      speechSynthesis.onvoiceschanged = () => {
        // Optional: Set preferred voice when voices load
      };
    }
    
    return () => {
      // Cancel any ongoing speech when component unmounts
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);
  
  // Monitor speaking state changes
  useEffect(() => {
    if ('speechSynthesis' in window) {
      const handleSpeechEnd = () => {
        if (!window.speechSynthesis.speaking) {
          setIsSpeaking(false);
          setIsPaused(false);
        }
      };
      
      const interval = setInterval(handleSpeechEnd, 100);
      return () => clearInterval(interval);
    }
  }, [isSpeaking]);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  // Add a message to the chat
  const addMessage = (content, type, imageUrl = null) => {
    setMessages(prevMessages => [...prevMessages, { content, type, imageUrl }]);
  };
  
  // Start recording audio
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm', // Most compatible format
      });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.addEventListener('dataavailable', event => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      });
      
      mediaRecorder.addEventListener('stop', () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(audioBlob);
        
        // Instead of immediately sending the audio, we'll transcribe it first
        processAudioForTranscription(audioBlob);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      });
      
      mediaRecorder.start();
      setIsRecording(true);
      setIsListening(true); // For UI feedback
      
    } catch (err) {
      console.error('Error accessing microphone:', err);
      alert('Could not access your microphone. Please check your browser permissions.');
      setIsListening(false);
    }
  };
  
  // Stop recording audio
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsListening(false);
    }
  };
  
  // Process audio for transcription only (new function)
  const processAudioForTranscription = async (audioBlob) => {
    if (!audioBlob) return;
    
    setIsLoading(true);
    
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      formData.append('language', selectedLanguage);
      formData.append('transcription_only', 'true'); // Signal to backend that we only want transcription
      
      // Call your backend API endpoint
      const response = await axios.post('/conversation/voice/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      });
      
      if (response.data && response.data.user_message) {
        // Set the transcribed text to the input field
        setInputText(response.data.user_message);
        // Also store it as transcribed text
        setTranscribedText(response.data.user_message);
      } else {
        // Handle error case
        alert('Sorry, I couldn\'t understand your speech. Please try again or type your message.');
      }
    } catch (error) {
      console.error('Error processing audio:', error);
      alert('Failed to process voice input. Please try again or type your message.');
    } finally {
      setIsLoading(false);
      setAudioBlob(null);
    }
  };
  
  // Process the user inputs and send to unified endpoint
  const processUserInput = async () => {
    // Block if already loading
    if (isLoading) return;

    const hasText = inputText.trim().length > 0;
    const hasImage = imageFile !== null;
    
    // Ensure we have at least one input type
    if (!hasText && !hasImage) {
      return;
    }

    // Prepare message content for display
    let userMessageContent = hasText ? inputText : "";
    
    // Add message to chat
    if (hasImage) {
      addMessage(
        userMessageContent ? `${userMessageContent} [Image attached]` : `Analyzing ${imageType} image...`, 
        'user', 
        imagePreview
      );
    } else if (userMessageContent) {
      addMessage(userMessageContent, 'user');
    }
    
    setIsLoading(true);
    
    try {
      // Prepare form data for the unified endpoint
      const formData = new FormData();
      
      if (hasText) {
        formData.append('text', inputText);
      }
      
      if (hasImage) {
        formData.append('image', imageFile);
      }
      
      // Send request to unified endpoint
      const response = await axios.post('/chatbot/query/', formData);
      
      // Process and display response
      if (response.data.ai_response) {
        addMessage(response.data.ai_response, 'bot');
        
        // Play audio response if enabled and available
        if (audioEnabled) {
          if (response.data.audio_url) {
            // Play server-generated audio if available
            playAudio(response.data.audio_url);
          } else {
            // Otherwise use browser TTS
            speakText(response.data.ai_response);
          }
        }
      } else {
        addMessage('Sorry, I couldn\'t process your request.', 'bot');
      }
      
      // Clear inputs
      setInputText('');
      setTranscribedText(''); // Clear transcribed text too
      clearImageUpload();
      
    } catch (error) {
      console.error('Request failed:', error);
      addMessage(`Failed to get a response: ${error.message}`, 'bot');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Play audio from URL
  const playAudio = (audioUrl) => {
    const audio = new Audio(audioUrl);
    audio.play();
    setIsSpeaking(true);
    
    audio.onended = () => {
      setIsSpeaking(false);
    };
  };
  
  // Helper function to break text into smaller chunks for better TTS performance
  const chunkText = (text, maxLength) => {
    if (text.length <= maxLength) return [text];
    
    const chunks = [];
    let currentChunk = "";
    const sentences = text.split(/(?<=[.!?])\s+/);
    
    for (const sentence of sentences) {
      // If adding this sentence would exceed maxLength, push the current chunk and start a new one
      if (currentChunk.length + sentence.length > maxLength && currentChunk.length > 0) {
        chunks.push(currentChunk.trim());
        currentChunk = sentence;
      } else {
        currentChunk += (currentChunk ? " " : "") + sentence;
      }
    }
    
    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }
    
    return chunks;
  };
  
  // Helper function to set the voice
  const setVoice = (speech, voices) => {
    // Try to find a voice in the selected language
    const preferredVoice = voices.find(voice => voice.lang.includes(selectedLanguage)) || voices[0];
    
    if (preferredVoice) {
      speech.voice = preferredVoice;
      console.log(`Using voice: ${preferredVoice.name} (${preferredVoice.lang})`);
    }
  };
  
  // Enhanced text-to-speech function using browser TTS
// Modify the speakText function to use selectedLanguage
const speakText = (text) => {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    
    const textChunks = chunkText(text, 200);
    
    textChunks.forEach((chunk, index) => {
      const speech = new SpeechSynthesisUtterance(chunk);
      
      // Use the currently selected language
      speech.lang = selectedLanguage; // Instead of hardcoding 'en-US'
      speech.rate = 1.0;
      speech.pitch = 1.0;
      speech.volume = 1.0;
      
      // Modify voice selection to use selected language
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        // Try to find a voice matching the selected language
        const matchingVoice = voices.find(voice => voice.lang.includes(selectedLanguage)) || voices[0];
        speech.voice = matchingVoice;
      }
      
      // Rest of the function remains the same
      if (index === 0) {
        setIsSpeaking(true);
        setIsPaused(false);
      }
      window.speechSynthesis.speak(speech);
      
      // For the last chunk, set the onend event
      if (index === textChunks.length - 1) {
        speech.onend = () => {
          setIsSpeaking(false);
          setIsPaused(false);
        };
      }
    });
    
    currentUtteranceRef.current = { isChunked: true };
  }
};
  
  // Speech controls
  const pauseSpeech = () => {
    if ('speechSynthesis' in window && window.speechSynthesis.speaking) {
      window.speechSynthesis.pause();
      setIsPaused(true);
    }
  };
  
  const resumeSpeech = () => {
    if ('speechSynthesis' in window && window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
    }
  };
  
  const cancelSpeech = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setIsPaused(false);
    }
  };
  
  const toggleAudio = () => {
    if (audioEnabled) {
      cancelSpeech();
    }
    setAudioEnabled(!audioEnabled);
  };
  
  // Handle file selection
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      
      // Create image preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };
  
  // Clear image upload
  const clearImageUpload = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const startAppointmentFlow = () => {
    setShowAppointmentScheduler(true);
  };
  
  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Main container with responsive padding */}
      <div className="flex flex-col max-w-5xl mx-auto w-full h-full p-4 md:p-6 lg:p-8">
        {/* Header with shadow and glass effect */}
        <header className="flex justify-between items-center mb-4 p-4 rounded-xl bg-white bg-opacity-80 backdrop-blur-sm shadow-md">
          <div className="flex items-center gap-3">
            <FaRobot className="text-blue-600 text-2xl" />
            <h2 className="text-2xl font-bold text-blue-800 tracking-tight">Medical Chatbot</h2>
          </div>
          <div className="flex gap-2">
            <button 
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg shadow transition-colors"
              onClick={() => startAppointmentFlow()}
            >
              Schedule Appointment
            </button>
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="p-2 rounded-lg border border-gray-200 text-sm bg-white"
              title="Select language for voice recognition"
            >
              {availableLanguages.map(lang => (
                <option key={lang.code} value={lang.code}>
                  {lang.name}
                </option>
              ))}
            </select>
            <button
              onClick={toggleAudio}
              className="p-2 rounded-full hover:bg-blue-100 transition-all"
              title={audioEnabled ? "Mute AI voice" : "Enable AI voice"}
            >
              {audioEnabled ? <FaVolumeUp size={20} className="text-blue-600" /> : <FaVolumeMute size={20} className="text-gray-500" />}
            </button>
          </div>
        </header>
        
        {/* Chat messages container with glass effect */}
        <div className="flex-1 bg-white bg-opacity-80 backdrop-blur-sm rounded-xl shadow-lg overflow-hidden mb-4 flex flex-col">
          <div className="flex-1 overflow-y-auto p-4">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-4">
                <FaRobot className="text-blue-200 text-5xl" />
                <p className="text-center max-w-md text-lg">
                  Hello! I'm your medical assistant. You can ask questions, upload images, or use voice to communicate with me.
                </p>
              </div>
            ) : (
              messages.map((message, index) => (
                <div 
                  key={index} 
                  className={`my-3 max-w-3/4 ${
                    message.type === 'user' 
                      ? 'ml-auto' 
                      : 'mr-auto'
                  }`}
                >
                  <div className={`flex items-start gap-2 p-3 rounded-xl shadow-sm ${
                    message.type === 'user' 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-white border border-gray-200 text-gray-800'
                  }`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      message.type === 'user' ? 'bg-blue-600' : 'bg-blue-100'
                    }`}>
                      {message.type === 'user' ? 
                        <FaUser className={message.type === 'user' ? 'text-white' : 'text-blue-600'} /> : 
                        <FaRobot className="text-blue-600" />
                      }
                    </div>
                    <div className="flex-1">
                      <div className="font-medium mb-1">
                        {message.type === 'user' ? 'You' : 'Medical Bot'}
                      </div>
                      <div className="whitespace-pre-wrap text-base">{message.content}</div>
                      
                      {/* Image preview if available */}
                      {message.imageUrl && (
                        <div className="mt-2 rounded-lg overflow-hidden border border-gray-200">
                          <img 
                            src={message.imageUrl} 
                            alt="Uploaded medical image" 
                            className="max-w-full h-auto max-h-64 object-contain"
                          />
                        </div>
                      )}
                    </div>
                    {message.type === 'bot' && message.content.length > 20 && (
                      <button
                        onClick={() => speakText(message.content)}
                        className={`ml-2 p-1 rounded-full hover:bg-gray-100 transition-colors ${
                          message.type === 'user' ? 'text-blue-200 hover:text-white' : 'text-blue-500 hover:text-blue-700'
                        }`}
                        title="Read this message aloud"
                      >
                        <FaVolumeUp size={16} />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
            
            {isLoading && (
              <div className="my-3 mr-auto">
                <div className="flex items-start gap-2 p-3 rounded-xl shadow-sm bg-white border border-gray-200">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <FaRobot className="text-blue-600" />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex space-x-1 items-center">
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                    <span className="text-gray-500 text-base">Thinking...</span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </div>
        
        {/* Voice controls with glass effect */}
        {isSpeaking && (
          <div className="bg-blue-100 bg-opacity-70 backdrop-blur-sm border border-blue-200 rounded-xl p-3 mb-4 flex justify-center gap-3 items-center shadow-md">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '300ms' }}></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '600ms' }}></div>
            </div>
            <span className="text-blue-700 font-medium text-base">Speaking</span>
            
            {!isPaused ? (
              <button
                onClick={pauseSpeech}
                className="p-2 rounded-full bg-white hover:bg-blue-50 text-blue-600 shadow-sm transition-colors"
                title="Pause speech"
              >
                <FaPause size={16} />
              </button>
            ) : (
              <button
                onClick={resumeSpeech}
                className="p-2 rounded-full bg-white hover:bg-blue-50 text-blue-600 shadow-sm transition-colors"
                title="Resume speech"
              >
                <FaPlay size={16} />
              </button>
            )}
            
            <button
              onClick={cancelSpeech}
              className="p-2 rounded-full bg-white hover:bg-red-50 text-red-500 shadow-sm transition-colors"
              title="Stop speech"
            >
              <FaStopCircle size={16} />
            </button>
          </div>
        )}
        
        {/* Recording indicator */}
        {isListening && (
          <div className="bg-red-100 bg-opacity-70 backdrop-blur-sm rounded-xl p-3 mb-4 flex justify-center items-center gap-3 shadow-md">
            <div className="relative">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <div className="absolute inset-0 w-3 h-3 bg-red-500 rounded-full animate-ping opacity-75"></div>
            </div>
            <span className="text-red-700 font-medium text-base">Recording your voice in {availableLanguages.find(l => l.code === selectedLanguage)?.name || 'selected language'}...</span>
            
            <button
              onClick={stopRecording}
              className="p-2 rounded-full bg-white hover:bg-red-50 text-red-500 shadow-sm transition-colors"
              title="Stop recording and process speech"
            >
              <FaStopCircle size={16} />
            </button>
          </div>
        )}
        
        {/* Display image preview if uploaded */}
        {imagePreview && (
          <div className="bg-amber-50 bg-opacity-70 backdrop-blur-sm rounded-xl p-3 mb-4 flex items-center gap-3 shadow-md">
            <div className="h-12 w-12 rounded-lg overflow-hidden flex-shrink-0">
              <img 
                src={imagePreview} 
                alt="Preview" 
                className="h-full w-full object-cover"
              />
            </div>
            <div className="flex-1">
              <div className="text-amber-700 font-medium text-base">Image ready: {imageType}</div>
              <div className="text-amber-600 text-sm truncate">
                {imageFile?.name}
              </div>
            </div>
            <button
              onClick={clearImageUpload}
              className="p-2 rounded-full bg-white hover:bg-red-50 text-red-500 shadow-sm transition-colors"
              title="Remove image"
            >
              <FaTrash size={16} />
            </button>
          </div>
        )}
        
        {/* Transcribed text indicator (New) */}
        {transcribedText && inputText && (
          <div className="bg-green-50 bg-opacity-70 backdrop-blur-sm rounded-xl p-3 mb-4 flex items-center gap-3 shadow-md">
            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
              <FaMicrophone className="text-green-600" />
            </div>
            <div className="flex-1">
              <div className="text-green-700 font-medium text-base">Transcribed Speech</div>
              <div className="text-green-600 text-sm truncate">
                {inputText}
              </div>
            </div>
          </div>
        )}
        
        {/* Input controls section with glass effect */}
        <div className="bg-white bg-opacity-80 backdrop-blur-sm rounded-xl shadow-lg p-4 space-y-4">
          {/* Text input and send button */}
          <div className="flex gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Type your medical query..."
              disabled={isLoading}
              className="flex-1 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-sm text-base"
              onKeyPress={(e) => {
                if (e.key === 'Enter' && (inputText.trim() || imageFile)) {
                  processUserInput();
                }
              }}
            />
            <button 
              onClick={processUserInput} 
              disabled={isLoading || (!inputText.trim() && !imageFile)} 
              className={`px-4 py-2 rounded-xl font-medium text-white flex items-center gap-2 shadow-sm ${
                isLoading || (!inputText.trim() && !imageFile) 
                  ? 'bg-gray-300 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700 transition-colors'
              }`}
            >
              <FaPaperPlane />
              <span className="hidden md:inline text-base">Send</span>
            </button>
          </div>
          
          <div className="flex flex-col md:flex-row gap-4">
            {/* Voice input buttons */}
            <div className="flex gap-2 md:w-1/2">
              <button
                onClick={isRecording ? stopRecording : startRecording}
                disabled={isLoading}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium text-white shadow-sm ${
                  isLoading
                    ? 'bg-gray-300 cursor-not-allowed' 
                    : isRecording
                    ? 'bg-red-500 hover:bg-red-600 transition-colors'
                    : 'bg-green-500 hover:bg-green-600 transition-colors'
                }`}
              >
                {isRecording ? <FaStopCircle /> : <FaMicrophone />}
                <span className="text-base">{isRecording ? 'Stop Recording' : 'Voice Input'}</span>
              </button>
            </div>
            
            {/* Image upload section */}
            <div className="flex gap-2 md:w-1/2">
              <div className="flex-1">
                <label className="flex items-center justify-center gap-2 w-full cursor-pointer py-3 border border-gray-200 rounded-xl text-center bg-white hover:bg-gray-50 transition-colors shadow-sm">
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleFileChange}
                    disabled={isLoading}
                    className="hidden"
                  />
                  <FaUpload className="text-blue-500" />
                  <span className="truncate text-base">
                    {imageFile ? imageFile.name : 'Upload Image'}
                  </span>
                </label>
              </div>
              
              <select
                value={imageType}
                onChange={(e) => setImageType(e.target.value)}
                disabled={isLoading}
                className="border border-gray-200 rounded-xl px-2 py-3 bg-white shadow-sm text-base"
              >
                <option value="injury">Injury</option>
                <option value="xray">X-Ray</option>
                <option value="mri">MRI</option>
                <option value="ct">CT Scan</option>
                <option value="dermatology">Skin/Rash</option>
                <option value="other">Other</option>
              </select>
              
              <button
                onClick={processUserInput}
                disabled={!imageFile || isLoading}
                className={`px-3 py-2 rounded-xl font-medium text-white shadow-sm ${
                  !imageFile || isLoading 
                    ? 'bg-gray-300 cursor-not-allowed' 
                    : 'bg-amber-500 hover:bg-amber-600 transition-colors'
                }`}
              >
                <FaUpload />
              </button>
            </div>
          </div>
        </div>
      </div>
      {showAppointmentScheduler && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="w-full max-w-3xl h-5/6">
      <AppointmentScheduler 
        onClose={() => setShowAppointmentScheduler(false)}
        language={selectedLanguage}
      />
    </div>
  </div>
)}
    </div>
  );
};

export default MedicalChatbot;