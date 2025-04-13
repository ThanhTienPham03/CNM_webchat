import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import ChatBox from '../components/Chat/ChatBox';
import ChatList from '../components/Chat/ChatList';
import 'bootstrap/dist/css/bootstrap.min.css';
import Header from '../components/Header/Header';
import UserProfile from '../components/UserProfile/UserProfile';
import friendService from '../services/friendService';

const Home = () => {
  const [messages, setMessages] = useState([
    { text: 'Hello!', isOwn: false },
    { text: 'Hi there!', isOwn: true },
  ]);

  const [chats, setChats] = useState([
    { name: 'John Doe', lastMessage: 'Hello!' },
    { name: 'Jane Smith', lastMessage: 'How are you?' },
    { name: 'Alice Johnson', lastMessage: 'See you later!' },
  ]);

  const [friends, setFriends] = useState([]);

  useEffect(() => {
    const fetchFriends = async () => {
      const userId = 'currentUserId'; // Replace with actual user ID
      const friendList = await friendService.getAllFriends(userId);
      setFriends(friendList);
    };

    fetchFriends();
  }, []);

  const handleSendMessage = (message) => {
    setMessages([...messages, { text: message, isOwn: true }]);
  };

  const handleAddFriend = async () => {
    const friendId = prompt('Enter the ID of the friend you want to add:');
    if (friendId) {
      const result = await friendService.addFriend('currentUserId', friendId); // Replace with actual user ID
      if (result) {
        alert('Friend request sent!');
      } else {
        alert('Failed to send friend request.');
      }
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
                <ChatList chats={chats} />
                <div className="mt-3">
                  <h5>Friends</h5>
                  <ul>
                    {(Array.isArray(friends) ? friends : []).map((friend, index) => (
                      <li key={index}>{friend.friend_id} ({friend.status})</li>
                    ))}
                  </ul>
                  <button className="btn btn-primary mt-2" onClick={handleAddFriend}>
                    Add Friend
                  </button>
                </div>
              </div>
              <div className="col-8 d-flex flex-column">
                <ChatBox messages={messages} onSendMessage={handleSendMessage} />
              </div>
            </div>
          }
        />
      </Routes>
    </div>
  );
};

export default Home;