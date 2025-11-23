import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const AppointmentScheduler = ({ onClose, language = 'en' }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState('initial');
  const [options, setOptions] = useState([]);
  const [formFields, setFormFields] = useState([]);
  const [formData, setFormData] = useState({});
  const [selectionHistory, setSelectionHistory] = useState({});
  
  const chatContainerRef = useRef(null);

  // Initialize chatbot
  useEffect(() => {
    startChatbot();
  }, []);

  // Auto scroll to bottom when messages update
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const startChatbot = async () => {
    setLoading(true);
    try {
      const response = await axios.post('/api/appointment-chatbot/', {
        step: 'initial',
        language
      });

      setMessages([
        { type: 'bot', content: response.data.message }
      ]);
      setOptions(response.data.options || []);
      setCurrentStep(response.data.next_step);
    } catch (error) {
      console.error('Error starting chatbot:', error);
      setMessages([
        { type: 'bot', content: 'Sorry, there was an error connecting to the appointment system. Please try again later.' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleOptionSelect = async (option) => {
    // Add user message
    setMessages(prev => [
      ...prev,
      { type: 'user', content: option.name }
    ]);

    // Save selection in history
    const updatedHistory = {
      ...selectionHistory,
      [`selected_${currentStep.replace('_selected', '')}`]: option.name,
      [`selected_${currentStep.replace('_selected', '')}_id`]: option.id
    };
    setSelectionHistory(updatedHistory);

    setLoading(true);
    try {
      // Prepare the payload with all selection history
      const payload = {
        step: currentStep,
        selection_id: option.id,
        language,
        ...updatedHistory
      };

      const response = await axios.post('/api/appointment-chatbot/', payload);

      // Add bot response
      setMessages(prev => [
        ...prev,
        { type: 'bot', content: response.data.message }
      ]);

      // Update state based on response
      setOptions(response.data.options || []);
      setFormFields(response.data.form_fields || []);
      setCurrentStep(response.data.next_step);

      // Save any additional selection data returned
      if (response.data.selected_category) {
        setSelectionHistory(prev => ({
          ...prev,
          selected_category: response.data.selected_category,
          selected_category_id: response.data.selected_category_id
        }));
      }
      if (response.data.selected_subcategory) {
        setSelectionHistory(prev => ({
          ...prev,
          selected_subcategory: response.data.selected_subcategory,
          selected_subcategory_id: response.data.selected_subcategory_id
        }));
      }
      if (response.data.selected_location) {
        setSelectionHistory(prev => ({
          ...prev,
          selected_location: response.data.selected_location,
          selected_location_id: response.data.selected_location_id
        }));
      }
      if (response.data.selected_doctor) {
        setSelectionHistory(prev => ({
          ...prev,
          selected_doctor: response.data.selected_doctor,
          selected_doctor_id: response.data.selected_doctor_id
        }));
      }
      if (response.data.selected_date) {
        setSelectionHistory(prev => ({
          ...prev,
          selected_date: response.data.selected_date
        }));
      }
      if (response.data.selected_time) {
        setSelectionHistory(prev => ({
          ...prev,
          selected_time: response.data.selected_time
        }));
      }

      // Check if we reached a follow-up message
      if (response.data.follow_up_message) {
        setTimeout(() => {
          setMessages(prev => [
            ...prev,
            { type: 'bot', content: response.data.follow_up_message }
          ]);
        }, 1000);
      }
    } catch (error) {
      console.error('Error in chatbot flow:', error);
      setMessages(prev => [
        ...prev,
        { type: 'bot', content: 'Sorry, there was an error processing your selection. Please try again.' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    // Show user input summary
    const formSummary = formFields.map(field => 
      `${field.name}: ${formData[field.name]}`
    ).join(', ');
    
    setMessages(prev => [
      ...prev,
      { type: 'user', content: `Submitting my information: ${formSummary}` }
    ]);

    setLoading(true);
    try {
      // Combine form data with selection history
      const payload = {
        step: currentStep,
        language,
        ...selectionHistory,
        ...formData
      };

      const response = await axios.post('/api/appointment-chatbot/', payload);

      // Add bot response
      setMessages(prev => [
        ...prev,
        { type: 'bot', content: response.data.message }
      ]);

      // If there's a confirmation step, update the UI
      if (response.data.next_step === 'confirmation') {
        setCurrentStep('confirmation');
        setOptions([]);
        setFormFields([]);

        // Add follow-up message if provided
        if (response.data.follow_up_message) {
          setTimeout(() => {
            setMessages(prev => [
              ...prev,
              { type: 'bot', content: response.data.follow_up_message }
            ]);
          }, 1000);
        }
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      setMessages(prev => [
        ...prev,
        { type: 'bot', content: 'Sorry, there was an error booking your appointment. Please try again.' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Render messages and input options
  return (
    <div className="flex flex-col h-full bg-gray-50 rounded-lg shadow-lg">
      {/* Header */}
      <div className="py-3 px-4 bg-blue-600 text-white rounded-t-lg flex justify-between items-center">
        <h2 className="text-lg font-semibold">Schedule Appointment</h2>
        <button 
          onClick={onClose}
          className="text-white hover:bg-blue-700 rounded-full p-1"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Chat Messages */}
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {messages.map((message, index) => (
          <div 
            key={index} 
            className={`${
              message.type === 'bot' 
                ? 'bg-white border border-gray-200' 
                : 'bg-blue-100 ml-8'
            } rounded-lg p-3 max-w-[85%] ${
              message.type === 'user' ? 'ml-auto' : ''
            }`}
          >
            {message.content}
          </div>
        ))}
        {loading && (
          <div className="flex space-x-2 p-3 bg-gray-100 rounded-lg max-w-[60%]">
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
          </div>
        )}
      </div>

      {/* Options or Form */}
      <div className="border-t border-gray-200 p-4">
        {options.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {options.map((option) => (
              <button
                key={option.id}
                onClick={() => handleOptionSelect(option)}
                disabled={loading}
                className="py-2 px-4 bg-white hover:bg-gray-100 border border-gray-300 rounded-lg text-left transition-colors"
              >
                {option.name}
              </button>
            ))}
          </div>
        )}

        {formFields.length > 0 && (
          <form onSubmit={handleFormSubmit} className="space-y-4">
            {formFields.map((field) => (
              <div key={field.name} className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">
                  {field.label} {field.required && '*'}
                </label>
                <input
                  type={field.type}
                  name={field.name}
                  value={formData[field.name] || ''}
                  onChange={handleFormChange}
                  required={field.required}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            ))}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg shadow transition-colors disabled:opacity-50"
            >
              Book Appointment
            </button>
          </form>
        )}

        {currentStep === 'confirmation' && (
          <div className="flex justify-center">
            <button
              onClick={onClose}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg shadow transition-colors"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AppointmentScheduler;