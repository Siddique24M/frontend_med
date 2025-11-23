import React, { useState } from 'react';
import AppointmentScheduler from './AppointmentScheduler';
import MedicalChatbot from './MedicalChatbot'; // Your current chatbot component

const ChatInterface = () => {
  const [showAppointmentScheduler, setShowAppointmentScheduler] = useState(false);
  const [language, setLanguage] = useState('en'); // Default language
  
  // Toggle between regular chatbot and appointment scheduler
  const toggleAppointmentScheduler = () => {
    setShowAppointmentScheduler(prev => !prev);
  };
  
  // Function to change language
  const changeLanguage = (lang) => {
    setLanguage(lang);
  };
  
  return (
    <div className="h-screen flex flex-col">
      {/* Header with language selector */}
      <div className="bg-white shadow z-10">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <h1 className="text-xl font-bold text-blue-800">Medical Assistant</h1>
          
          <div className="flex items-center space-x-4">
            {/* Language Selector */}
            <select 
              value={language}
              onChange={(e) => changeLanguage(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm"
            >
              <option value="en">English</option>
              <option value="hi">हिंदी (Hindi)</option>
              {/* Add more languages as needed */}
            </select>
            
            {/* Schedule Appointment Button */}
            <button 
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg shadow transition-colors"
              onClick={toggleAppointmentScheduler}
            >
              {showAppointmentScheduler ? 'Back to Chat' : 'Schedule Appointment'}
            </button>
          </div>
        </div>
      </div>
      
      {/* Main content area */}
      <div className="flex-1 overflow-hidden">
        <div className="container mx-auto px-4 h-full py-4">
          {showAppointmentScheduler ? (
            <AppointmentScheduler 
              onClose={toggleAppointmentScheduler}
              language={language}
            />
          ) : (
            <MedicalChatbot 
                language={language} 
                startAppointmentFlow={toggleAppointmentScheduler}
                />
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;