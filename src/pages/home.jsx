import React, { useEffect, useState } from "react";
import { Routes, Route } from "react-router-dom";
import ChatBox from "../components/Chat/ChatBox";
import ChatList from "../components/Chat/ChatList";
import "bootstrap/dist/css/bootstrap.min.css";
import Header from "../components/Header/Header";
import UserProfile from "../components/UserProfile/UserProfile";
import ConversationApi from "../api/conversationAPI";
import FriendList from "../components/Friend/FriendList";

const Home = () => {
  const [chats, setChats] = useState([]);
  const [selectedConversationId, setSelectedConversationId] = useState(null);
  const [selectedConversationName, setSelectedConversationName] = useState(null);
  const userId = localStorage.getItem("user_id");
  const accessToken = localStorage.getItem("access_token");

  useEffect(() => {
    if (!userId || !accessToken) {
      console.error("User ID or token is missing. Please log in again.");
      alert("User ID or token is missing. Redirecting to login page.");
      window.location.href = "/login";
      return;
    }
  }, [userId, accessToken]);

  const handleConversationSelect = (conversationId, conversationName) => {
    setSelectedConversationId(conversationId);
    setSelectedConversationName(conversationName);
  };

  const handleFriendSearch = (searchTerm) => {
    // Logic to handle friend search
    console.log("Searching for friend:", searchTerm);
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
                <div className="d-flex align-items-center mb-3">
                  <input
                    type="text"
                    className="form-control me-2"
                    placeholder="Search friends..."
                    onChange={(e) => handleFriendSearch(e.target.value)}
                  />
                  <button
                    className="btn btn-primary d-flex align-items-center justify-content-center"
                    onClick={() => handleFriendSearch(document.querySelector('input[placeholder="Search friends..."]').value)}
                  >
                    <i className="bi bi-search"></i>
                  </button>
                </div>
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
                  userId={userId}
                  token={accessToken}
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