import React, { useState, useEffect } from 'react';
import { Clock, Check, Plus, AlertCircle, Pill, Edit } from 'lucide-react';
import { MedicationService } from '../services/MedicationService';
import MedicationModal from '../components/MedicationModal';

const MedicationReminders = ({ onDataChange }) => {
  const [medications, setMedications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [currentMedication, setCurrentMedication] = useState(null);
  const [nextRefresh, setNextRefresh] = useState(null);

  // Format time for display
  const formatTime = (timeStr) => {
    if (!timeStr) return 'N/A';
    try {
      const [hours, minutes] = timeStr.split(':');
      const hour = parseInt(hours);
      const period = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour % 12 || 12;
      return `${displayHour}:${minutes} ${period}`;
    } catch {
      return timeStr;
    }
  };

  // Fetch medications
  const fetchMedications = async () => {
    try {
      setLoading(true);
      const data = await MedicationService.getTodayMedications();
      
      // Process medication data
      const processedMeds = data.map(med => ({
        ...med,
        id: med.id || med._id,
        name: med.name || 'Unnamed Medication',
        instructions: med.instructions || '',
        next_dose: med.next_dose || '12:00',
        refill_date: med.refill_date || new Date().toISOString().split('T')[0],
        remaining: Number(med.remaining) || 0,
        status: med.status || 'upcoming'
      }));
      
      setMedications(processedMeds);
      setError(null);
      
      // Setup next refresh time
      setupAutoRefresh(processedMeds);
      
      if (onDataChange) onDataChange();
    } catch (err) {
      setError(err.message || 'Failed to load medications');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Setup auto refresh at next dose time
  const setupAutoRefresh = (meds) => {
    if (nextRefresh) clearTimeout(nextRefresh);
    
    const now = new Date();
    const upcomingMeds = meds.filter(m => m.status === 'upcoming' && m.remaining > 0);
    
    if (upcomingMeds.length > 0) {
      // Find the next medication time
      const nextTimes = upcomingMeds.map(m => {
        const [hours, minutes] = m.next_dose.split(':');
        const doseTime = new Date();
        doseTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        return doseTime;
      });
      
      const nextDoseTime = new Date(Math.min(...nextTimes.map(t => t.getTime())));
      
      if (nextDoseTime > now) {
        const timeout = setTimeout(() => {
          fetchMedications();
        }, nextDoseTime - now);
        
        setNextRefresh(timeout);
      }
    }
  };

  useEffect(() => {
    fetchMedications();
    
    // Also check every 5 minutes as fallback
    const interval = setInterval(fetchMedications, 5 * 60 * 1000);
    return () => {
      clearInterval(interval);
      if (nextRefresh) clearTimeout(nextRefresh);
    };
  }, []);

  // Handle marking medication as taken
  const handleMarkAsTaken = async (medicationId) => {
    try {
      const med = medications.find(m => m.id === medicationId);
      if (!med) return;
      
      // Calculate new remaining amount
      const newRemaining = Math.max(0, med.remaining - 1);
      const newStatus = newRemaining > 0 ? 'upcoming' : 'completed';
      
      // Optimistic update
      setMedications(prev => prev.map(m => 
        m.id === medicationId 
          ? { ...m, status: 'taken', remaining: newRemaining }
          : m
      ));
      
      // Show alert if low quantity
      if (newRemaining <= 3) {
        alert(`Warning: Only ${newRemaining} doses remaining for ${med.name}`);
      }
      
      // Update on server
      await MedicationService.markAsTaken(medicationId);
      await MedicationService.updateMedication(medicationId, {
        ...med,
        remaining: newRemaining,
        status: newStatus
      });
      
      // Refresh data
      fetchMedications();
    } catch (err) {
      setError('Failed to update medication status');
      fetchMedications(); // Revert changes
    }
  };

  // Open modal for editing
  const handleEditMedication = (medication) => {
    setCurrentMedication(medication);
    setModalOpen(true);
  };

  // Handle adding new medication
  const handleAddMedication = () => {
    setCurrentMedication(null);
    setModalOpen(true);
  };

  // Handle saving medication
  const handleSaveMedication = () => {
    fetchMedications();
    if (onDataChange) onDataChange();
  };

  // Handle deleting medication
  const handleDeleteMedication = (medicationId) => {
    setMedications(prev => prev.filter(m => m.id !== medicationId));
    if (onDataChange) onDataChange();
  };

  // Sort medications - upcoming first, then by time
  const sortedMedications = [...medications].sort((a, b) => {
    if (a.status === 'upcoming' && b.status !== 'upcoming') return -1;
    if (a.status !== 'upcoming' && b.status === 'upcoming') return 1;
    return a.next_dose.localeCompare(b.next_dose);
  });

  if (loading && medications.length === 0) return (
    <div className="flex items-center justify-center p-8 text-gray-500">
      <div className="animate-pulse flex space-x-2">
        <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
        <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
        <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
      </div>
      <span className="ml-2">Loading medications...</span>
    </div>
  );

  if (error) return (
    <div className="bg-red-50 p-4 rounded-lg border border-red-200 text-red-700 flex items-center">
      <AlertCircle size={20} className="mr-2" />
      <span>Error: {error}</span>
    </div>
  );

  return (
    <div className="max-w-md mx-auto">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">Today's Medications</h2>
      
      {sortedMedications.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Pill size={40} className="mx-auto mb-2 opacity-50" />
          <p>No medications scheduled for today</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedMedications.map((med) => (
            <div 
              key={med.id} 
              className={`bg-white rounded-lg shadow-sm border p-4 transition-all 
                ${med.status === 'taken' ? 'border-green-200 bg-green-50' : 
                  med.status === 'completed' ? 'border-gray-200 bg-gray-50' : 
                  'border-gray-200 hover:shadow'}`}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <h3 className="font-medium text-gray-800">{med.name}</h3>
                  <p className="text-sm text-gray-600">{med.instructions}</p>
                </div>
                
                <div className="flex items-center">
                  {med.status === 'taken' && (
                    <div className="bg-green-100 text-green-600 p-1 rounded-full">
                      <Check size={18} />
                    </div>
                  )}
                  
                  <button 
                    onClick={() => handleEditMedication(med)}
                    className="ml-2 p-1 text-gray-500 hover:text-gray-700"
                    aria-label="Edit medication"
                  >
                    <Edit size={16} />
                  </button>
                </div>
              </div>
              
              <div className="flex items-center text-sm text-gray-600 mb-2">
                <Clock size={14} className="mr-1" />
                <span>Next dose: {formatTime(med.next_dose)}</span>
              </div>
              
              <div className="text-sm text-gray-600 mb-3 flex justify-between">
                <span>Refill by: {new Date(med.refill_date).toLocaleDateString()}</span>
                <span className={med.remaining < 5 ? 'text-amber-600 font-medium' : ''}>
                  {med.remaining} remaining
                </span>
              </div>
              
              {med.status === 'upcoming' && med.remaining > 0 && (
                <button 
                  className="w-full mt-2 bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md transition-colors text-sm font-medium"
                  onClick={() => handleMarkAsTaken(med.id)}
                >
                  Mark as Taken
                </button>
              )}
            </div>
          ))}
        </div>
      )}
      
      <div className="mt-6">
        <button 
          onClick={handleAddMedication}
          className="flex items-center justify-center w-full py-3 px-4 rounded-md border border-dashed border-gray-300 text-blue-600 hover:bg-blue-50 transition-colors"
        >
          <Plus size={18} className="mr-1" />
          <span>Add Medication</span>
        </button>
      </div>
      
      <MedicationModal 
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        medication={currentMedication}
        onSave={handleSaveMedication}
        onDelete={handleDeleteMedication}
      />
    </div>
  );
};

export default MedicationReminders;