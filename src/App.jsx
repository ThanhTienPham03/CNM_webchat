import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/home';
import Resgister from './pages/register';
import Login from './pages/login';
import ChangePassword from './pages/changePassword';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/home/*" element={<Home />} />
        <Route path="/register" element={<Resgister />} />
        <Route path="/" element={<Login />} />
        <Route path="/changePassword" element={<ChangePassword />} />
      </Routes>
    </Router>
  );
}

export default App
