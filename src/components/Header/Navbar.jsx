import React, { useState } from 'react';

const Navbar = ({ onComponentChange }) => {
  const [activeButton, setActiveButton] = useState("Chats");

  const handleButtonClick = (componentName) => {
    setActiveButton(componentName);
    onComponentChange(componentName);
  };

  return (
    <div
      className="d-flex justify-content-between align-items-center mb-2"
      style={{ border: '1px solid #dee2e6', borderRadius: '8px', padding: '0.5rem' }}
    >
      <nav className="nav nav-pills">
        <button
          className={`btn btn-light me-2 ${activeButton === "Chats" ? "active" : ""}`}
          title="Chats"
          style={{ fontSize: '1.25rem', padding: '0.75rem 1.25rem', color: '#6a11cb' }}
          onClick={() => handleButtonClick("ChatList")}
        >
          <i className="bi bi-chat-text-fill"></i>
        </button>
        <button
          className={`btn btn-light ${activeButton === "Contacts" ? "active" : ""}`}
          title="Contacts"
          style={{ fontSize: '1.25rem', padding: '0.75rem 1.25rem', color: '#6a11cb' }}
          onClick={() => handleButtonClick("FriendList")}
        >
          <i className="bi bi-person-lines-fill"></i>
        </button>
        <button
          className={`btn btn-light ${activeButton === "Notifications" ? "active" : ""}`}
          title="Notifications"
          style={{ fontSize: '1.25rem', padding: '0.75rem 1.25rem', color: '#6a11cb' }}
          onClick={() => handleButtonClick("Notifications")}
        >
          <i className="bi bi-bell-fill"></i>
        </button>
      </nav>
    </div>
  );
};

export default Navbar;