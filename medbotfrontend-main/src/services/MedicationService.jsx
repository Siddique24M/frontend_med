// MedicationService.js
import axios from 'axios';

const API_URL = '/api/medications/';

// Simplified axios instance without authentication
const authAxios = axios.create({
  headers: {
    'Content-Type': 'application/json',
  },
  // Add error handling for network issues
  timeout: 10000 // 10 seconds timeout
});

export const MedicationService = {
  // Get all medications
  getMedications: async () => {
    try {
      const response = await authAxios.get(API_URL);
      return response.data;
    } catch (error) {
      console.error('Error fetching medications:', error);
      throw error;
    }
  },

  // Get today's medications
  getTodayMedications: async () => {
    try {
      const response = await authAxios.get(`${API_URL}today/`);
      // Ensure we always return an array
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('Error fetching today medications:', error);
      // Return empty array instead of throwing to prevent app crashes
      return [];
    }
  },

  // Mark medication as taken
  markAsTaken: async (medicationId, notes = '') => {
    try {
      const response = await authAxios.post(
        `${API_URL}${medicationId}/mark_as_taken/`, 
        { notes }
      );
      return response.data;
    } catch (error) {
      console.error('Error marking medication as taken:', error);
      throw error;
    }
  },

  // Add new medication
  addMedication: async (medicationData) => {
    try {
      const response = await authAxios.post(API_URL, medicationData);
      return response.data;
    } catch (error) {
      console.error('Error adding medication:', error);
      throw error;
    }
  },

  // Update medication
  updateMedication: async (medicationId, medicationData) => {
    try {
      const response = await authAxios.put(`${API_URL}${medicationId}/`, medicationData);
      return response.data;
    } catch (error) {
      console.error('Error updating medication:', error);
      throw error;
    }
  },

  // Delete medication
  deleteMedication: async (medicationId) => {
    try {
      const response = await authAxios.delete(`${API_URL}${medicationId}/`);
      return response.data;
    } catch (error) {
      console.error('Error deleting medication:', error);
      throw error;
    }
  },

  // Get medication stats
  getMedicationStats: async () => {
    try {
      const response = await authAxios.get(`${API_URL}stats/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching medication stats:', error);
      // Return empty object instead of throwing
      return {
        total: 0,
        upcoming: 0,
        taken: 0,
        missed: 0,
        refill_soon: 0
      };
    }
  }
};