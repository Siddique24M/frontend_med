import React, { useState } from 'react';
import { MessageSquare, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ChatbotAccess = () => {
  const [showChatSummary, setShowChatSummary] = useState(true);
  const navigate = useNavigate();
  
  const handleChatClick = () => {
    console.log("Button clicked, navigating to /chatbot");
    navigate('/chatbot');
  };

  return (
    <div className="relative">
      {showChatSummary && (
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl p-4 text-white shadow-lg relative overflow-hidden">
          <button 
            onClick={() => setShowChatSummary(false)} 
            className="absolute top-2 right-2 p-1 rounded-full hover:bg-white hover:bg-opacity-20 z-10"
          >
            <X size={16} />
          </button>
          
          <div className="flex items-center mb-3">
            <MessageSquare size={24} className="mr-2" />
            <h2 className="text-lg font-semibold">Healthcare Assistant</h2>
          </div>
          
          <p className="mb-4 text-blue-100">
            Get instant help with your health questions, appointment scheduling, and medication information.
          </p>
          
          <div className="flex flex-wrap gap-2 mb-4">
            <button className="bg-white bg-opacity-20 hover:bg-opacity-30 px-3 py-1 rounded-full text-sm">
              Schedule appointment
            </button>
            <button className="bg-white bg-opacity-20 hover:bg-opacity-30 px-3 py-1 rounded-full text-sm">
              Medication help
            </button>
            <button className="bg-white bg-opacity-20 hover:bg-opacity-30 px-3 py-1 rounded-full text-sm">
              Symptom checker
            </button>
          </div>
          
          <div className="flex justify-between items-center relative z-10">
            <div className="text-sm text-blue-100">
              <span className="inline-block mr-2 w-2 h-2 bg-green-400 rounded-full"></span>
              Available 24/7
            </div>
            <button 
              onClick={handleChatClick}
              className="bg-white text-blue-600 font-medium px-4 py-2 rounded-lg hover:bg-blue-50 cursor-pointer"
            >
              Start Chat
            </button>
          </div>
          
          {/* Decorative elements - moved to lower z-index */}
          <div className="absolute -right-8 -bottom-8 w-32 h-32 rounded-full bg-white opacity-10 z-0"></div>
          <div className="absolute -left-4 -top-4 w-16 h-16 rounded-full bg-indigo-400 opacity-20 z-0"></div>
        </div>
      )}
      
      {!showChatSummary && (
        <button 
          onClick={() => setShowChatSummary(true)}
          className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg flex items-center"
        >
          <MessageSquare size={18} className="mr-2" />
          Open Healthcare Assistant
        </button>
      )}
    </div>
  );
};

export default ChatbotAccess;