import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const MetricModal = ({ isOpen, onClose, metric, currentValues, onSubmit }) => {
  const [formValues, setFormValues] = useState({ ...currentValues });

  // Update form values when currentValues prop changes
  useEffect(() => {
    setFormValues({ ...currentValues });
  }, [currentValues]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {};
    
    // Prepare payload based on what's being edited
    if (metric === 'blood_pressure') {
      if (formValues.systolic_bp) payload.systolic_bp = Number(formValues.systolic_bp);
      if (formValues.diastolic_bp) payload.diastolic_bp = Number(formValues.diastolic_bp);
    } 
    else if (metric === 'all') {
      Object.keys(formValues).forEach(key => {
        if (formValues[key] !== null && formValues[key] !== '') {
          payload[key] = key === 'height' || key === 'weight' ? 
            Number(formValues[key]) : 
            Math.round(Number(formValues[key]));
        }
      });
    } 
    else if (formValues[metric] !== null && formValues[metric] !== '') {
      payload[metric] = metric === 'height' || metric === 'weight' ? 
        Number(formValues[metric]) : 
        Math.round(Number(formValues[metric]));
    }

    const success = await onSubmit(payload);
    if (success) onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-md relative max-h-[90vh] overflow-y-auto">
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
          aria-label="Close modal"
        >
          <X size={20} />
        </button>
        
        <div className="p-6">
          <h3 className="text-xl font-semibold mb-4">
            {metric === 'all' ? 'Update Health Metrics' : `Update ${metric.replace('_', ' ')}`}
          </h3>
          
          <form onSubmit={handleSubmit}>
            {/* Blood Pressure Fields */}
            {(metric === 'blood_pressure' || metric === 'all') && (
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Systolic BP</label>
                  <input
                    type="number"
                    value={formValues.systolic_bp || ''}
                    onChange={(e) => setFormValues({...formValues, systolic_bp: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md"
                    placeholder="120"
                    min="50"
                    max="200"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Diastolic BP</label>
                  <input
                    type="number"
                    value={formValues.diastolic_bp || ''}
                    onChange={(e) => setFormValues({...formValues, diastolic_bp: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md"
                    placeholder="80"
                    min="30"
                    max="150"
                    required
                  />
                </div>
              </div>
            )}

            {/* Blood Glucose Field */}
            {(metric === 'blood_glucose' || metric === 'all') && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">Blood Glucose (mg/dL)</label>
                <input
                  type="number"
                  value={formValues.blood_glucose || ''}
                  onChange={(e) => setFormValues({...formValues, blood_glucose: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md"
                  placeholder="90"
                  min="50"
                  max="300"
                />
              </div>
            )}

            {/* Weight Field */}
            {(metric === 'weight' || metric === 'all') && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">Weight (kg)</label>
                <input
                  type="number"
                  value={formValues.weight || ''}
                  onChange={(e) => setFormValues({...formValues, weight: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md"
                  placeholder="70"
                  min="30"
                  max="200"
                  step="0.1"
                />
              </div>
            )}

            {/* Height Field */}
            {(metric === 'height' || metric === 'all') && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">Height (cm)</label>
                <input
                  type="number"
                  value={formValues.height || ''}
                  onChange={(e) => setFormValues({...formValues, height: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md"
                  placeholder="175"
                  min="100"
                  max="250"
                />
              </div>
            )}

            {/* Daily Steps Field */}
            {(metric === 'daily_steps' || metric === 'all') && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">Daily Steps</label>
                <input
                  type="number"
                  value={formValues.daily_steps || ''}
                  onChange={(e) => setFormValues({...formValues, daily_steps: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md"
                  placeholder="8000"
                  min="0"
                  max="50000"
                />
              </div>
            )}

            {/* Heart Rate Field */}
            {(metric === 'heart_rate' || metric === 'all') && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">Heart Rate (bpm)</label>
                <input
                  type="number"
                  value={formValues.heart_rate || ''}
                  onChange={(e) => setFormValues({...formValues, heart_rate: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md"
                  placeholder="72"
                  min="40"
                  max="200"
                />
              </div>
            )}

            {/* Sleep Hours Field */}
            {(metric === 'sleep_hours' || metric === 'all') && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">Sleep (hours)</label>
                <input
                  type="number"
                  value={formValues.sleep_hours || ''}
                  onChange={(e) => setFormValues({...formValues, sleep_hours: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md"
                  placeholder="8"
                  min="0"
                  max="24"
                  step="0.1"
                />
              </div>
            )}

            {/* Oxygen Saturation Field */}
            {(metric === 'oxygen_saturation' || metric === 'all') && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">Oxygen Saturation (%)</label>
                <input
                  type="number"
                  value={formValues.oxygen_saturation || ''}
                  onChange={(e) => setFormValues({...formValues, oxygen_saturation: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md"
                  placeholder="98"
                  min="70"
                  max="100"
                />
              </div>
            )}

            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-slate-300 rounded-md text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default MetricModal;