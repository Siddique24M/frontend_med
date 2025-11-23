import React from 'react';

const HealthScoreCard = ({ score, onEdit }) => {
  const getStatus = () => {
    if (score >= 90) return { text: 'Excellent', color: 'bg-green-500' };
    if (score >= 80) return { text: 'Very Good', color: 'bg-green-400' };
    if (score >= 70) return { text: 'Good', color: 'bg-yellow-400' };
    if (score >= 60) return { text: 'Fair', color: 'bg-orange-400' };
    return { text: 'Needs Improvement', color: 'bg-red-400' };
  };

  const status = getStatus();

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-slate-800">Your Health Score</h2>
        <button 
          onClick={onEdit}
          className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
        >
          <span>Update Metrics</span>
        </button>
      </div>
      
      <div className="flex items-center space-x-4">
        <div className="relative w-full">
          <div className="h-4 bg-slate-200 rounded-full overflow-hidden">
            <div 
              className={`h-full ${status.color} transition-all duration-500`}
              style={{ width: `${score}%` }}
            ></div>
          </div>
        </div>
        <div className="text-2xl font-bold text-slate-800 min-w-[60px]">
          {score}%
        </div>
      </div>
      
      <div className="mt-3 flex justify-between items-center">
        <span className={`text-sm px-2 py-1 rounded-full ${status.color.replace('bg', 'text')} ${status.color.replace('bg', 'bg-opacity-20')}`}>
          {status.text}
        </span>
        <span className="text-xs text-slate-500">Last updated: Just now</span>
      </div>
    </div>
  );
};

export default HealthScoreCard;