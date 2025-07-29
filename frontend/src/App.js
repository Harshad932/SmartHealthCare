import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import Home from './components/Home';

import PatientSymptomChecker from './components/patient/PatientSymptomChecker';
import PatientRegistration from './components/patient/PatientRegistration';
import PatientLogin from './components/patient/PatientLogin';
import PatientDashboard from './components/patient/PatientDashboard';
import AppointmentBooking from './components/patient/AppointmentBooking';

import DoctorRegistration from './components/doctor/DoctorRegistration';
import DoctorLogin from './components/doctor/DoctorLogin';
import DoctorDashboard from './components/doctor/DoctorDashboard';
import Aura from './components/doctor/Aura';

import AdminLogin from './components/admin/AdminLogin';
import AdminDashboard from './components/admin/AdminDashboard';

import Dosha from './components/dosha/Dosha'; // Import Dosha component

function App() {
  return (
    <Router>
      <Routes>

        <Route path="/" element={<Home />} />

        <Route path="/register" element={<PatientRegistration />} />
        <Route path="/chatBot" element={<PatientSymptomChecker />} />
        <Route path="/login" element={<PatientLogin />} />
        <Route path="/patient-dashboard" element={<PatientDashboard />} />
        <Route path="/appointment-booking" element={<AppointmentBooking />} />

        <Route path="/doctor-registration" element={<DoctorRegistration />} />
        <Route path="/doctor-login" element={<DoctorLogin />} />
        <Route path="/doctor-dashboard" element={<DoctorDashboard />} />
        <Route path="/aura" element={<Aura />} />
        
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />

        <Route path="/dosha" element={<Dosha />} />

      </Routes>
    </Router>
  );
}

export default App;

