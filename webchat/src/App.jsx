import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/home';
import Resgister from './pages/register';
import Login from './pages/login';
import 'bootstrap/dist/css/bootstrap.min.css';
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/home" element={<Home />} />
        {/* <Route path="/chat" element={<Chat />} /> */}
        <Route path="/register" element={<Resgister />} />
        <Route path="/" element={<Login />} />
      </Routes>
    </Router>
  );
}

export default App
