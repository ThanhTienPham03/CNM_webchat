import React from 'react';
import { addConversation } from '../../services/friendService';

const ChatList = ({ chats = [] }) => {
  const handleAddConversation = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/conversations/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'SINGLE',
          participants: [1, 2],
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to add conversation');
      }

      const newConversation = await response.json();
      console.log('New conversation added:', newConversation);
      // Optionally, update the chat list state here if needed
    } catch (error) {
      console.error('Failed to add conversation:', error);
    }
  };

  return (
    <div className="border rounded p-3 bg-light">
      <h5>Chat List</h5>
      <button onClick={handleAddConversation} className="btn btn-primary mb-3">
        Add Conversation
      </button>
      <ul className="list-group">
        {chats.map((chat, index) => (
          <li key={index} className="list-group-item d-flex justify-content-between align-items-center">
            <span>{chat.name}</span>
            <small className="text-muted">{chat.lastMessage}</small>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ChatList;