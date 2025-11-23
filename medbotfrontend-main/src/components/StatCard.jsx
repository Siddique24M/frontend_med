import React from 'react';

const StatCard = ({ title, value, icon, color }) => {
  return (
    <div className="bg-white rounded-lg shadow p-6 transition-all duration-300 hover:shadow-lg hover:translate-y-1">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-slate-600 font-medium">{title}</h3>
        <div className={`p-3 rounded-full ${color} bg-opacity-10`}>
          <div className={`text-white ${color}`}>
            {icon}
          </div>
        </div>
      </div>
      <div className="flex items-end justify-between">
        <div>
          <p className="text-2xl font-bold text-slate-800">{value}</p>
        </div>
      </div>
    </div>
  );
};

export default StatCard;