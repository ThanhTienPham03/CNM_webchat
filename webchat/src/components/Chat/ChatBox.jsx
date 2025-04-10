import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';

const ChatBox = ({ messages = [], onSendMessage }) => { // Thêm giá trị mặc định cho messages
  const [newMessage, setNewMessage] = useState('');

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      onSendMessage(newMessage);
      setNewMessage('');
    }
  };

  return (
    <div className="d-flex flex-column h-100 border rounded">
      {/* Header */}
      <div className="p-3 bg-primary text-white">
        <h5 className="mb-0">Chat</h5>
      </div>

      {/* Messages Container */}
      <div className="flex-grow-1 p-3 overflow-auto bg-light">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`d-flex mb-2 ${message.isOwn ? 'justify-content-end' : 'justify-content-start'}`}
          >
            <div
              className={`p-2 rounded ${
                message.isOwn ? 'bg-primary text-white' : 'bg-secondary text-white'
              }`}
              style={{ maxWidth: '70%' }}
            >
              {message.text}
            </div>
          </div>
        ))}
      </div>

      {/* Input Container */}
      <div className="d-flex p-3 border-top bg-white">
        <input
          type="text"
          className="form-control me-2"
          placeholder="Type a message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
        />
        <button className="btn btn-primary" onClick={handleSendMessage}>
          Send
        </button>
      </div>
    </div>
  );
};

export default ChatBox;