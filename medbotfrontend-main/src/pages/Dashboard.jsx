import React, { useState, useEffect } from 'react';
import StatCard from '../components/StatCard';
import AppointmentCalendar from '../components/AppointmentCalendar';
import HealthTrackers from '../components/HealthTrackers';
import ChatbotAccess from '../components/ChatbotAccess';
import MedicationReminders from '../components/MedicationReminder';
import { Calendar, Activity, FileText, Bell, Clipboard } from 'lucide-react';
import { MedicationService } from '../services/MedicationService';
import axios from 'axios';

const Dashboard = () => {
  const [medicationCount, setMedicationCount] = useState(0);
  const [upcomingAppointmentsCount, setUpcomingAppointmentsCount] = useState(0);
  const [healthScore, setHealthScore] = useState(null);
  const [isLoading, setIsLoading] = useState({
    medications: true,
    appointments: true,
    healthScore: true
  });

  // Function to update medication count
  const updateMedicationCount = async () => {
    setIsLoading(prev => ({...prev, medications: true}));
    try {
      const data = await MedicationService.getTodayMedications();
      const activeMeds = data.filter(med => med.status !== 'taken');
      setMedicationCount(activeMeds.length);
    } catch (error) {
      console.error('Failed to update medication count:', error);
    } finally {
      setIsLoading(prev => ({...prev, medications: false}));
    }
  };

  // Function to update upcoming appointments count
  const updateAppointmentsCount = async () => {
    setIsLoading(prev => ({...prev, appointments: true}));
    try {
      const response = await axios.get('/api/appointments/user_appointments/');
      const upcoming = response.data.filter(apt => 
        apt.status === 'upcoming' || apt.status === 'scheduled'
      );
      setUpcomingAppointmentsCount(upcoming.length);
    } catch (error) {
      console.error('Failed to update appointments count:', error);
    } finally {
      setIsLoading(prev => ({...prev, appointments: false}));
    }
  };

  // Function to fetch health score
  const fetchHealthScore = async () => {
    setIsLoading(prev => ({...prev, healthScore: true}));
    try {
      const response = await axios.get('/api/health-metrics/latest/');
      setHealthScore(response.data?.health_score || 0);
    } catch (error) {
      console.error('Failed to fetch health score:', error);
    } finally {
      setIsLoading(prev => ({...prev, healthScore: false}));
    }
  };

  // Fetch all data when component mounts
  useEffect(() => {
    updateMedicationCount();
    updateAppointmentsCount();
    fetchHealthScore();
    
    // Set up refresh intervals
    const medInterval = setInterval(() => {
      updateMedicationCount();
    }, 30000); // Refresh every 30 seconds
    
    const aptInterval = setInterval(() => {
      updateAppointmentsCount();
    }, 60000); // Refresh every minute

    const healthInterval = setInterval(() => {
      fetchHealthScore();
    }, 60000); // Refresh health score every minute
    
    return () => {
      clearInterval(medInterval);
      clearInterval(aptInterval);
      clearInterval(healthInterval);
    };
  }, []);

  const stats = [
    { 
      title: 'Upcoming Appointments', 
      value: isLoading.appointments ? '...' : upcomingAppointmentsCount.toString(), 
      icon: <Calendar size={20} />, 
      color: 'bg-blue-500' 
    },
    { 
      title: 'Active Medications', 
      value: isLoading.medications ? '...' : medicationCount.toString(), 
      icon: <FileText size={20} />, 
      color: 'bg-green-500' 
    },
    { 
      title: 'Health Score', 
      value: isLoading.healthScore ? '...' : `${healthScore}%`, 
      icon: <Activity size={20} />, 
      color: 'bg-indigo-500' 
    }
  ];

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-800">My Health Dashboard</h1>
        <p className="text-slate-500">Welcome back</p>
      </div>

      {/* Quick Access to Chatbot */}
      <div className="mb-8">
        <ChatbotAccess />
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {stats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming Appointments */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="flex items-center text-xl font-semibold text-slate-800">
              <Calendar size={18} className="mr-2 text-blue-500" />
              Upcoming Appointments
            </h2>
            <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-0.5 rounded-full">
              {upcomingAppointmentsCount} upcoming
            </span>
          </div>
          <AppointmentCalendar onAppointmentChange={updateAppointmentsCount} />
        </div>

        {/* Medication Reminders */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="flex items-center text-xl font-semibold text-slate-800 mb-4">
            <Bell size={18} className="mr-2 text-green-500" />
            Medication Reminders
          </h2>
          <MedicationReminders onDataChange={updateMedicationCount} />
        </div>

        {/* Health Trackers */}
        <div className="lg:col-span-3 bg-white rounded-lg shadow p-6 mt-6">
          <h2 className="flex items-center text-xl font-semibold text-slate-800 mb-4">
            <Clipboard size={18} className="mr-2 text-indigo-500" />
            Health Trackers
          </h2>
          <HealthTrackers onMetricsUpdate={fetchHealthScore} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;