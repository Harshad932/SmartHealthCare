import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import SymptomChecker from './components/SymptomChecker';
import Registration from './components/Registration';
import Login from './components/Login';
import Home from './components/Home';

function App() {
  return (
    <Router>
      <Routes>

        <Route path="/" element={<Home />} />
        <Route path="/register" element={<Registration />} />
        <Route path="/chatBot" element={<SymptomChecker />} />
        <Route path="/login" element={<Login />} />

      </Routes>
    </Router>
  );
}

export default App;

