import React, { useEffect, useState } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import ChatBox from "../components/Chat/ChatBox";
import ChatList from "../components/Chat/ChatList";
import FriendList from "../components/Friend/FriendList";
import "bootstrap/dist/css/bootstrap.min.css";
import Header from "../components/Header/Header";
import Navbar from "../components/Header/Navbar";
import { useSelector } from 'react-redux';
import axios from 'axios';
import NotificationPage from './NotificationPage';
import { initializeSocket } from '../utils/socket';
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        console.error("ErrorBoundary caught an error", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return <h1>Đã xảy ra lỗi. Vui lòng thử lại sau.</h1>;
        }

        return this.props.children;
    }
}

const Home = () => {
  const [chats, setChats] = useState([]);
  const [selectedConversationId, setSelectedConversationId] = useState(null);
  const [selectedConversationName, setSelectedConversationName] = useState(null);
  const [activeComponent, setActiveComponent] = useState("ChatList");
  const userId = localStorage.getItem("user_id");
  const accessToken = localStorage.getItem("access_token");
  const [conversationDetails, setConversationDetails] = useState([]);
  
  // Initialize navigate using useNavigate
  const navigate = useNavigate();
  const API_URL = "http://localhost:3000"; // Use environment variable or default to localhost
  const user = useSelector((state) => state.auth.user); // Get user from Redux store

  useEffect(() => {
    if (!userId || !accessToken) {
      console.error("User ID or token is missing. Please log in again.");
      alert("User ID or token is missing. Redirecting to login page.");
      window.location.href = "/";
      return;
    }
  }, [userId, accessToken]);

  useEffect(() => {
    // Re-fetch or update UI when user changes
    console.log("User information updated:", user);
  }, [user]);

  useEffect(() => {
    const socket = initializeSocket(accessToken);

      socket.on("connect", () => {
        console.log(`User ${userId} connected Socket`);
        //thong bao toi server user online
        socket.emit("online", { user: user });
      });
    const fetchConversationDetails = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/conversations/${userId}`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
        setConversationDetails(response.data);
      } catch (error) {
        console.error("Error fetching conversation details:", error);
      }
    };

    if (userId && accessToken) {
      fetchConversationDetails();
    }
  }, [userId, accessToken]);

  const handleConversationSelect = (conversationId, conversationName) => {
    setSelectedConversationId(conversationId);
    setSelectedConversationName(conversationName);
  };

  const renderComponent = () => {
    switch (activeComponent) {
      case "ChatList":
        return <ChatList userId={userId} accessToken={accessToken} chats={chats} onConversationSelect={handleConversationSelect} />;
      case "FriendList":
        return (
          <ErrorBoundary>
            <FriendList 
              userId={userId} 
              accessToken={accessToken} 
              navigate={navigate} 
              conversationDetails={conversationDetails} 
            />
          </ErrorBoundary>
        );
        case "Notifications":
        return <NotificationPage userId={userId} accessToken={accessToken} />;
      default:
        return null;
    }
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
              <Navbar onComponentChange={setActiveComponent} />
              {renderComponent()}
                
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
