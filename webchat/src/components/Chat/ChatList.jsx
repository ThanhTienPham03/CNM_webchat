import React from 'react';

const ChatList = ({ chats = [] }) => { // Đặt giá trị mặc định cho chats
  return (
    <div className="border rounded p-3 bg-light">
      <h5>Chat List</h5>
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