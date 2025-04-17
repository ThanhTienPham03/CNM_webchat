import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/home';
import Resgister from './pages/register';
import Login from './pages/login';
import ResetPassword from './pages/resetPassword';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/home/*" element={<Home />} />
        <Route path="/register" element={<Resgister />} />
        <Route path="/" element={<Login />} />
        <Route path="/reset-password" element={<ResetPassword />} />
      </Routes>
    </Router>
  );
}

export default App
