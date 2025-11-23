import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import MedicalChatbot from './pages/MedicalChatbot';
import Dashboard from './pages/Dashboard';
import AddMedication from './pages/AddMedication'; // Import the new component

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-100">
        <Routes>
          <Route path="/chatbot" element={<MedicalChatbot />} />
          <Route path="/" element={<Dashboard />} />
          <Route path="/medications/add" element={<AddMedication />} /> {/* Add this new route */}
        </Routes>
      </div>
    </Router>
  );
}

export default App;