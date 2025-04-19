import React, { useEffect, useState } from "react";
import { Routes, Route } from "react-router-dom";
import ChatBox from "../components/Chat/ChatBox";
import ChatList from "../components/Chat/ChatList";
import "bootstrap/dist/css/bootstrap.min.css";
import Header from "../components/Header/Header";
import { useSelector } from 'react-redux';

const Home = () => {
  const [chats, setChats] = useState([]);
  const [selectedConversationId, setSelectedConversationId] = useState(null);
  const [selectedConversationName, setSelectedConversationName] = useState(null);
  const userId = localStorage.getItem("user_id");
  const accessToken = localStorage.getItem("access_token");

  const user = useSelector((state) => state.auth.user); // Get user from Redux store

  useEffect(() => {
    if (!userId || !accessToken) {
      console.error("User ID or token is missing. Please log in again.");
      alert("User ID or token is missing. Redirecting to login page.");
      window.location.href = "/login";
      return;
    }
  }, [userId, accessToken]);

  useEffect(() => {
    // Re-fetch or update UI when user changes
    console.log("User information updated:", user);
  }, [user]);

  const handleConversationSelect = (conversationId, conversationName) => {
    setSelectedConversationId(conversationId);
    setSelectedConversationName(conversationName);
  };

  return (
    <div className="container-fluid vh-100 d-flex flex-column">
      <Header />
      <Routes>
        <Route
          path="/"
          element={
            <div className="row flex-grow-1 h-100">
              <div className="col-4 border-end overflow-auto">
                <ChatList
                  userId={userId}
                  accessToken={accessToken} 
                  chats={chats}
                  onConversationSelect={handleConversationSelect}
                />
              </div>
              <div className="col-8 d-flex flex-column">
                <ChatBox
                  conversationId={selectedConversationId}
                  conversationName={selectedConversationName}
                  token={accessToken}
                  userId={userId}
                  user={user}
                />
              </div>
            </div>
          }
        />
      </Routes>
    </div>
  );
};

export default Home;
