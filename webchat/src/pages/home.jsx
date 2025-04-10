import React, { useState } from 'react';
import ChatBox from '../components/Chat/ChatBox';
import ChatList from '../components/Chat/ChatList';
import 'bootstrap/dist/css/bootstrap.min.css'; // Import Bootstrap CSS
import Header from '../components/Header/Header'; // Import Header component

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

  const handleSendMessage = (message) => {
    setMessages([...messages, { text: message, isOwn: true }]);
  };

  return (
    <div className="container-fluid vh-100 d-flex flex-column">
      {/* Header */}
      <Header avatarUrl="https://example.com/avatar.jpg" userName="John Doe" />
      
      <div className="row flex-grow-1 h-100">
        {/* Chat List */}
        <div className="col-4 border-end overflow-auto">
          <ChatList chats={chats} />
        </div>
        {/* Chat Box */}
        <div className="col-8 d-flex flex-column">
          <ChatBox messages={messages} onSendMessage={handleSendMessage} />
        </div>
      </div>
    </div>
  );
};

export default Home;