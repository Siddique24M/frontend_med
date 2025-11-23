import React, { useState, useEffect } from 'react';
import { Heart, Droplet, Activity, Edit } from 'lucide-react';
import axios from 'axios';
import MetricModal from './MetricModal';// Import the separate Modal component

const HealthTrackers = ({ onMetricsUpdate }) => {
  const [metrics, setMetrics] = useState({
    systolic_bp: null,
    diastolic_bp: null,
    blood_glucose: null,
    weight: null,
    height: null,
    daily_steps: null,
    heart_rate: null,
    sleep_hours: null,
    oxygen_saturation: null,
    health_score: null
  });
  const [loading, setLoading] = useState(true);
  const [editingMetric, setEditingMetric] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchMetrics = async () => {
    try {
      const response = await axios.get('/api/health-metrics/latest/');
      setMetrics(response.data);
    } catch (error) {
      console.error('Error fetching metrics:', error);
      setMetrics(prev => ({
        ...prev,
        health_score: 0
      }));
    } finally {
      setLoading(false);
    }
  };

  const updateMetrics = async (updatedValues) => {
    try {
      const payload = {};
      Object.keys(updatedValues).forEach(key => {
        if (updatedValues[key] !== null && updatedValues[key] !== undefined) {
          payload[key] = updatedValues[key];
        }
      });

      let response;
      if (metrics?.id) {
        response = await axios.patch(`/api/health-metrics/${metrics.id}/`, payload);
      } else {
        response = await axios.post('/api/health-metrics/', payload);
      }
      
      await fetchMetrics();
      if (onMetricsUpdate) onMetricsUpdate();
      return true;
    } catch (error) {
      console.error('Error updating metrics:', error.response?.data || error.message);
      return false;
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  if (loading && !metrics.id) {
    return <div className="text-center py-8">Loading health data...</div>;
  }

  return (
    <div>
      {/* Health Score Card */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-slate-800">Your Health Score</h2>
          <button 
            onClick={() => {
              setEditingMetric('all');
              setIsModalOpen(true);
            }}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Update Metrics
          </button>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="relative w-full">
            <div className="h-4 bg-slate-200 rounded-full overflow-hidden">
              <div 
                className={`h-full ${
                  metrics.health_score >= 80 ? 'bg-green-500' :
                  metrics.health_score >= 60 ? 'bg-yellow-500' :
                  'bg-red-500'
                }`}
                style={{ width: `${metrics.health_score || 0}%` }}
              ></div>
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-800 min-w-[60px]">
            {metrics.health_score || 0}%
          </div>
        </div>
        
        <div className="mt-3 flex justify-between items-center">
          <span className={`text-sm px-2 py-1 rounded-full ${
            metrics.health_score >= 80 ? 'text-green-800 bg-green-100' :
            metrics.health_score >= 60 ? 'text-yellow-800 bg-yellow-100' :
            'text-red-800 bg-red-100'
          }`}>
            {metrics.health_score >= 80 ? 'Excellent' :
             metrics.health_score >= 60 ? 'Good' :
             'Needs Improvement'}
          </span>
          <span className="text-xs text-slate-500">Last updated: Just now</span>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard
          title="Blood Pressure"
          icon={<Heart size={16} className="text-red-500 mr-2" />}
          value={metrics.systolic_bp && metrics.diastolic_bp 
            ? `${metrics.systolic_bp}/${metrics.diastolic_bp}` 
            : '--/--'}
          unit="mmHg"
          onEdit={() => {
            setEditingMetric('blood_pressure');
            setIsModalOpen(true);
          }}
        />
        
        <MetricCard
          title="Blood Glucose"
          icon={<Droplet size={16} className="text-blue-500 mr-2" />}
          value={metrics.blood_glucose || '--'}
          unit="mg/dL"
          onEdit={() => {
            setEditingMetric('blood_glucose');
            setIsModalOpen(true);
          }}
        />
        
        <MetricCard
          title="Daily Activity"
          icon={<Activity size={16} className="text-indigo-500 mr-2" />}
          value={metrics.daily_steps ? metrics.daily_steps.toLocaleString() : '--'}
          unit="steps"
          onEdit={() => {
            setEditingMetric('daily_steps');
            setIsModalOpen(true);
          }}
        />
      </div>

      {/* Additional Metrics */}
      <div className="mt-6 bg-white p-4 border border-slate-200 rounded-lg">
        <h3 className="text-lg font-medium text-slate-800 mb-4">All Health Metrics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricButton
            title="Weight"
            value={metrics.weight ? `${metrics.weight} kg` : '--'}
            onClick={() => {
              setEditingMetric('weight');
              setIsModalOpen(true);
            }}
          />
          <MetricButton
            title="Heart Rate"
            value={metrics.heart_rate ? `${metrics.heart_rate} bpm` : '--'}
            onClick={() => {
              setEditingMetric('heart_rate');
              setIsModalOpen(true);
            }}
          />
          <MetricButton
            title="Sleep"
            value={metrics.sleep_hours ? `${metrics.sleep_hours} hrs` : '--'}
            onClick={() => {
              setEditingMetric('sleep_hours');
              setIsModalOpen(true);
            }}
          />
          <MetricButton
            title="Oxygen"
            value={metrics.oxygen_saturation ? `${metrics.oxygen_saturation}%` : '--'}
            onClick={() => {
              setEditingMetric('oxygen_saturation');
              setIsModalOpen(true);
            }}
          />
        </div>
      </div>

      {/* Edit Modal */}
      <MetricModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        metric={editingMetric}
        currentValues={metrics}
        onSubmit={updateMetrics}
      />
    </div>
  );
};

// Sub-components
const MetricCard = ({ title, icon, value, unit, onEdit }) => (
  <div className="bg-white border border-slate-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
    <div className="flex justify-between items-center mb-3">
      <h3 className="font-medium text-slate-800 flex items-center">
        {icon}
        {title}
      </h3>
      <button 
        onClick={onEdit}
        className="text-xs text-blue-600 hover:text-blue-800 flex items-center"
      >
        <Edit size={14} className="mr-1" /> Edit
      </button>
    </div>
    <div className="text-center py-2">
      <div className="text-3xl font-bold text-slate-900">{value}</div>
      <div className="text-sm text-slate-500">{unit}</div>
    </div>
  </div>
);

const MetricButton = ({ title, value, onClick }) => (
  <button 
    onClick={onClick}
    className="border border-slate-200 rounded-lg p-3 hover:bg-slate-50 text-left flex flex-col"
  >
    <div className="text-sm text-slate-500">{title}</div>
    <div className="font-medium mt-1">{value}</div>
  </button>
);

export default HealthTrackers;