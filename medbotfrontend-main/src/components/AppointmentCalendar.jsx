import React, { useState, useEffect } from 'react';
import { Clock, User, MapPin, Calendar, Filter, Search, ChevronDown, ChevronLeft, ChevronRight, X } from 'lucide-react';
import axios from 'axios';
import AppointmentScheduler from '../pages/AppointmentScheduler';

const AppointmentCalendar = ({ onAppointmentChange }) => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showScheduler, setShowScheduler] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentView, setCurrentView] = useState('list');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedAppointment, setSelectedAppointment] = useState(null);

  // Fetch appointments from backend
  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/appointments/user_appointments/');
      
      const processedAppointments = response.data.map(apt => ({
        ...apt,
        id: apt.id,
        doctor: apt.doctor_name || 'Doctor not specified',
        specialty: apt.category_name || '',
        formattedDate: formatDateString(apt.appointment_date),
        time: formatTimeForDisplay(apt.appointment_time),
        status: apt.status || 'upcoming',
        category: apt.category_name,
        subcategory: apt.subcategory_name,
        location: apt.location_name
      }));
      
      setAppointments(processedAppointments);
      setError(null);
    } catch (err) {
      console.error('Error fetching appointments:', err);
      setError('Failed to load your appointments. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  // Helper functions
  const formatDateString = (dateStr) => {
    if (!dateStr) return '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
    const date = new Date(dateStr);
    return !isNaN(date.getTime()) ? date.toISOString().split('T')[0] : dateStr;
  };

  const formatTimeForDisplay = (timeStr) => {
    if (!timeStr) return '';
    if (/\d{1,2}:\d{2}\s*[AP]M/i.test(timeStr)) return timeStr;
    
    const match = timeStr.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?/);
    if (match) {
      let hours = parseInt(match[1]);
      const minutes = match[2];
      const period = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours % 12 || 12;
      return `${displayHours}:${minutes} ${period}`;
    }
    return timeStr;
  };

  const formatDateForDisplay = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      const date = new Date(dateStr);
      return isNaN(date.getTime()) ? 'Invalid Date' : 
        date.toLocaleDateString('en-US', { 
          weekday: 'short',
          month: 'short', 
          day: 'numeric',
          year: 'numeric'
        });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  // Filter appointments
  const filteredAppointments = appointments.filter(appointment => {
    const statusMap = {
      'scheduled': 'upcoming',
      'completed': 'completed',
      'cancelled': 'cancelled'
    };
    const frontendStatus = statusMap[appointment.status] || appointment.status;
    
    const matchesStatus = filterStatus === 'all' || frontendStatus === filterStatus;
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      searchTerm === '' || 
      (appointment.doctor && appointment.doctor.toLowerCase().includes(searchLower)) ||
      (appointment.specialty && appointment.specialty.toLowerCase().includes(searchLower)) ||
      (appointment.category && appointment.category.toLowerCase().includes(searchLower)) ||
      (appointment.subcategory && appointment.subcategory.toLowerCase().includes(searchLower));
    
    return matchesStatus && matchesSearch;
  });

  // Notify parent component of appointment changes
  const notifyAppointmentChange = () => {
    if (onAppointmentChange) {
      onAppointmentChange();
    }
  };

  // Appointment actions
  const handleCancelAppointment = async (appointmentId) => {
    if (window.confirm('Are you sure you want to cancel this appointment?')) {
      try {
        await axios.post(`/api/appointments/${appointmentId}/cancel/`);
        setAppointments(appointments.map(apt => 
          apt.id === appointmentId ? {...apt, status: 'cancelled'} : apt
        ));
        notifyAppointmentChange();
      } catch (err) {
        console.error('Error cancelling appointment:', err);
        setAppointments(appointments.map(apt => 
          apt.id === appointmentId ? {...apt, status: 'cancelled'} : apt
        ));
        notifyAppointmentChange();
      }
    }
  };

  const handleCloseScheduler = () => {
    setShowScheduler(false);
    fetchAppointments().then(() => {
      notifyAppointmentChange();
    });
  };

  // Calendar functions
  const navigateMonth = (direction) => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() + direction);
    setCurrentMonth(newMonth);
  };

  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];
    
    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push({ day: null, appointments: [] });
    }
    
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const date = new Date(year, month, day);
      const dateStr = date.toISOString().split('T')[0];
      const dayAppointments = appointments.filter(apt => 
        apt.formattedDate === dateStr
      );
      days.push({ day, date: dateStr, appointments: dayAppointments });
    }
    
    return days;
  };

  // View details modal
  const DetailsModal = () => (
    <div className="fixed inset-0 bg-gray-800 bg-opacity-75 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-md p-6">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-lg font-semibold">Appointment Details</h3>
          <button 
            onClick={() => setSelectedAppointment(null)}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-gray-700">Date & Time</h4>
            <p>{formatDateForDisplay(selectedAppointment.formattedDate)} at {selectedAppointment.time}</p>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-700">Doctor</h4>
            <p>{selectedAppointment.doctor}</p>
            <p className="text-sm text-gray-500">{selectedAppointment.specialty}</p>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-700">Service</h4>
            <p className="capitalize">
              {selectedAppointment.category?.toLowerCase()}
              {selectedAppointment.subcategory && ` (${selectedAppointment.subcategory.toLowerCase()})`}
            </p>
          </div>
          
          {selectedAppointment.notes && (
            <div>
              <h4 className="font-medium text-gray-700">Notes</h4>
              <p>{selectedAppointment.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (showScheduler) {
    return (
      <div className="fixed inset-0 bg-gray-800 bg-opacity-75 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg w-full max-w-2xl h-4/5 max-h-screen overflow-auto">
          <AppointmentScheduler onClose={handleCloseScheduler} />
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-center">
        {error}
        <button 
          onClick={() => window.location.reload()}
          className="block mx-auto mt-2 text-sm underline"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100">
      {/* Header */}
      <div className="border-b border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-xl font-semibold text-gray-800">My Appointments</h2>
          
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
              <input
                type="text"
                placeholder="Search appointments..."
                className="pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="relative">
              <button 
                className="flex items-center gap-1 px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter size={16} />
                Filter
                <ChevronDown size={16} />
              </button>
              
              {showFilters && (
                <div className="absolute top-full right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                  <div className="p-2">
                    <div className="mb-2 font-medium text-sm text-gray-700">Status</div>
                    <div className="space-y-1">
                      {['all', 'upcoming', 'completed', 'cancelled'].map(status => (
                        <button
                          key={status}
                          className={`block w-full text-left px-3 py-1.5 text-sm rounded ${
                            filterStatus === status ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-100'
                          }`}
                          onClick={() => {
                            setFilterStatus(status);
                            setShowFilters(false);
                          }}
                        >
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex border border-gray-300 rounded-md overflow-hidden">
              <button 
                className={`px-3 py-2 text-sm ${currentView === 'list' ? 'bg-blue-50 text-blue-700' : 'bg-white text-gray-700'}`}
                onClick={() => setCurrentView('list')}
              >
                List
              </button>
              <button 
                className={`px-3 py-2 text-sm ${currentView === 'calendar' ? 'bg-blue-50 text-blue-700' : 'bg-white text-gray-700'}`}
                onClick={() => setCurrentView('calendar')}
              >
                Calendar
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Calendar View */}
      {currentView === 'calendar' && (
        <div className="p-4">
          <div className="flex justify-between items-center mb-4">
            <button 
              onClick={() => navigateMonth(-1)}
              className="p-1 rounded-full hover:bg-gray-100"
            >
              <ChevronLeft size={20} />
            </button>
            
            <h3 className="text-lg font-medium">
              {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h3>
            
            <button 
              onClick={() => navigateMonth(1)}
              className="p-1 rounded-full hover:bg-gray-100"
            >
              <ChevronRight size={20} />
            </button>
          </div>
          
          <div className="grid grid-cols-7 gap-px bg-gray-200">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="bg-gray-100 py-2 text-center text-sm font-medium text-gray-600">
                {day}
              </div>
            ))}
            
            {generateCalendarDays().map((dayData, index) => (
              <div 
                key={index} 
                className={`bg-white min-h-20 p-1 ${dayData.day ? 'border-t border-gray-100' : ''}`}
              >
                {dayData.day && (
                  <>
                    <div className="text-right text-sm text-gray-500 mb-1">
                      {dayData.day}
                    </div>
                    
                    {dayData.appointments.length > 0 && (
                      <div className="space-y-1">
                        {dayData.appointments.map(apt => (
                          <div 
                            key={apt.id}
                            className={`text-xs p-1 rounded truncate ${
                              apt.status === 'cancelled' 
                                ? 'bg-red-50 text-red-700' 
                                : apt.status === 'completed'
                                ? 'bg-green-50 text-green-700'
                                : 'bg-blue-50 text-blue-700'
                            }`}
                            title={`${apt.time || 'Time N/A'} - ${apt.doctor || 'Doctor N/A'}`}
                          >
                            {apt.time?.split(' ')[0] || 'TBD'} {typeof apt.doctor === 'string' ? apt.doctor.split(' ')[1] || '' : ''}
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* List View */}
      {currentView === 'list' && (
        <div className="p-4">
          {filteredAppointments.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              {searchTerm || filterStatus !== 'all' 
                ? "No appointments match your filters" 
                : "You have no appointments scheduled"}
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm('')}
                  className="flex items-center gap-1 mx-auto mt-2 text-blue-600 text-sm"
                >
                  <X size={14} /> Clear search
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAppointments.map((appointment) => (
                <div 
                  key={appointment.id} 
                  className={`border rounded-lg p-4 hover:shadow-md transition-all ${
                    appointment.status === 'cancelled' 
                      ? 'border-red-100 bg-red-50' 
                      : appointment.status === 'completed'
                      ? 'border-green-100 bg-green-50'
                      : 'border-blue-100 bg-blue-50'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-lg font-semibold text-blue-700">
                        {formatDateForDisplay(appointment.formattedDate)}
                      </div>
                      <div className="flex items-center mt-1 text-slate-600">
                        <Clock size={14} className="mr-1" />
                        <span>{appointment.time || 'Time not specified'}</span>
                      </div>
                    </div>
                    
                    {(appointment.status === 'upcoming' || appointment.status === 'scheduled') && (
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleCancelAppointment(appointment.id)}
                          className="bg-white border border-red-300 hover:bg-red-50 text-red-600 text-sm py-1 px-4 rounded-full"
                        >
                          Cancel
                        </button>
                        <button 
                          onClick={() => setShowScheduler(true)}
                          className="bg-blue-500 hover:bg-blue-600 text-white text-sm py-1 px-4 rounded-full"
                        >
                          Reschedule
                        </button>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-4 space-y-2">
                    <div className="flex">
                      <User size={16} className="text-slate-400 mt-1 mr-2" />
                      <div>
                        <div className="font-medium">{appointment.doctor || 'Doctor not specified'}</div>
                        <div className="text-sm text-slate-500">{appointment.specialty || ''}</div>
                      </div>
                    </div>
                    
                    {(appointment.category || appointment.subcategory) && (
                      <div className="flex mt-2">
                        <div className="text-slate-400 mt-1 mr-2 w-4">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M11.644 1.59a.75.75 0 01.712 0l9.75 5.25a.75.75 0 010 1.32l-9.75 5.25a.75.75 0 01-.712 0l-9.75-5.25a.75.75 0 010-1.32l9.75-5.25z" />
                            <path d="M3.265 10.602l7.668 4.129a2.25 2.25 0 002.134 0l7.668-4.13 1.37.739a.75.75 0 010 1.32l-9.75 5.25a.75.75 0 01-.71 0l-9.75-5.25a.75.75 0 010-1.32l1.37-.738z" />
                            <path d="M10.933 19.231l-7.668-4.13-1.37.739a.75.75 0 000 1.32l9.75 5.25c.221.12.489.12.71 0l9.75-5.25a.75.75 0 000-1.32l-1.37-.738-7.668 4.13a2.25 2.25 0 01-2.134-.001z" />
                          </svg>
                        </div>
                        <div>
                          <div className="font-medium capitalize">
                            {appointment.category?.toLowerCase()}
                          </div>
                          {appointment.subcategory && (
                            <div className="text-sm text-slate-500 capitalize">
                              {appointment.subcategory.toLowerCase()}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-4 flex justify-between items-center">
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => setSelectedAppointment(appointment)}
                        className="text-sm bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 py-1 px-3 rounded"
                      >
                        Details
                      </button>
                      {(appointment.status === 'upcoming' || appointment.status === 'scheduled') && (
                        <button className="text-sm bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 py-1 px-3 rounded">
                          Join Virtual
                        </button>
                      )}
                    </div>
                    <div>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        appointment.status === 'cancelled' 
                          ? 'bg-red-100 text-red-800' 
                          : appointment.status === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {appointment.status === 'scheduled' ? 'Upcoming' : 
                         appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Footer with schedule button */}
      <div className="border-t border-gray-200 p-4 flex justify-end">
        <button 
          onClick={() => setShowScheduler(true)}
          className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg flex items-center justify-center"
        >
          <Calendar size={16} className="mr-2" />
          Schedule New Appointment
        </button>
      </div>

      {/* Details Modal */}
      {selectedAppointment && <DetailsModal />}
    </div>
  );
};

export default AppointmentCalendar;