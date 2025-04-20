import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/home';
import Resgister from './pages/register';
import Login from './pages/login';
import ChangePassword from './pages/changePassword';
import ChatList from './components/Chat/ChatList';
import FriendList from './components/Friend/FriendList';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/home/*" element={<Home />} />
        <Route path="/register" element={<Resgister />} />
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/changePassword" element={<ChangePassword />} />
        <Route path="/chats" element={<ChatList />} />
        <Route path="/contacts" element={<FriendList />} />
      </Routes>
    </Router>
  );
}

export default App
