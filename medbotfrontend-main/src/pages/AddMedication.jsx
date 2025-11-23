import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MedicationService } from '../services/MedicationService';
import { AlertCircle, ArrowLeft, Pill, Clock, Calendar, Package } from 'lucide-react';

const AddMedication = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    instructions: '',
    next_dose: '',
    refill_date: '',
    remaining: '',
    status: 'upcoming'
  });

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    
    try {
      await MedicationService.addMedication(formData);
      navigate('/'); // Redirect to dashboard after successful submission
    } catch (err) {
      setError('Failed to add medication. Please try again.');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClasses = "w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors";
  const labelClasses = "block text-sm font-medium text-gray-700 mb-1";

  return (
    <div className="max-w-md mx-auto p-4">
      <div className="flex items-center mb-6">
        <button 
          onClick={() => navigate('/')}
          className="mr-3 text-gray-500 hover:text-gray-700"
          aria-label="Go back"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-semibold text-gray-800 flex items-center">
          <Pill className="mr-2" size={20} />
          Add New Medication
        </h1>
      </div>
      
      {error && (
        <div className="bg-red-50 p-4 rounded-lg border border-red-200 text-red-700 flex items-center mb-4">
          <AlertCircle size={18} className="mr-2 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-4">
        <div>
          <label className={labelClasses} htmlFor="name">
            Medication Name
          </label>
          <input
            className={inputClasses}
            id="name"
            name="name"
            type="text"
            placeholder="e.g., Aspirin, Lisinopril"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>
        
        <div>
          <label className={labelClasses} htmlFor="instructions">
            Instructions
          </label>
          <textarea
            className={`${inputClasses} min-h-24`}
            id="instructions"
            name="instructions"
            placeholder="e.g., Take 1 tablet by mouth twice daily with food"
            value={formData.instructions}
            onChange={handleChange}
            required
            rows={3}
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClasses} htmlFor="next_dose">
              <span className="flex items-center">
                <Clock size={16} className="mr-1" />
                Next Dose Time
              </span>
            </label>
            <input
              className={inputClasses}
              id="next_dose"
              name="next_dose"
              type="time"
              value={formData.next_dose}
              onChange={handleChange}
              required
            />
          </div>
          
          <div>
            <label className={labelClasses} htmlFor="refill_date">
              <span className="flex items-center">
                <Calendar size={16} className="mr-1" />
                Refill Date
              </span>
            </label>
            <input
              className={inputClasses}
              id="refill_date"
              name="refill_date"
              type="date"
              value={formData.refill_date}
              onChange={handleChange}
              required
            />
          </div>
        </div>
        
        <div>
          <label className={labelClasses} htmlFor="remaining">
            <span className="flex items-center">
              <Package size={16} className="mr-1" />
              Remaining Amount
            </span>
          </label>
          <input
            className={inputClasses}
            id="remaining"
            name="remaining"
            type="text"
            placeholder="e.g., 30 tablets, 60 capsules"
            value={formData.remaining}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="flex justify-between pt-4">
          <button
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-md transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-gray-300"
            type="button"
            onClick={() => navigate('/')}
          >
            Cancel
          </button>
          <button
            className={`px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-blue-300 ${isSubmitting ? 'opacity-75 cursor-not-allowed' : ''}`}
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <span className="flex items-center">
                <span className="animate-pulse mr-2">•••</span>
                Adding
              </span>
            ) : 'Add Medication'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddMedication;