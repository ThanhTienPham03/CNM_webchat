import React, { useState } from 'react';
import { Button } from 'react-bootstrap';
import CreateGroupChat from '../Chat/CreateGroupChat';

const Navbar = ({ onComponentChange }) => {
  const [activeButton, setActiveButton] = useState("Chats");
  const [showCreateGroup, setShowCreateGroup] = useState(false);

  const handleButtonClick = (componentName) => {
    setActiveButton(componentName);
    onComponentChange(componentName);
  };

  const handleCreateGroupClick = () => {
    setShowCreateGroup(true);
  };

  const handleCloseCreateGroup = () => {
    setShowCreateGroup(false);
  };

  return (
    <>
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
            className={`btn btn-light me-2 ${activeButton === "Contacts" ? "active" : ""}`}
            title="Contacts"
            style={{ fontSize: '1.25rem', padding: '0.75rem 1.25rem', color: '#6a11cb' }}
            onClick={() => handleButtonClick("FriendList")}
          >
            <i className="bi bi-person-lines-fill"></i>
          </button>
          <button
            className={`btn btn-light me-2 ${activeButton === "Notifications" ? "active" : ""}`}
            title="Notifications"
            style={{ fontSize: '1.25rem', padding: '0.75rem 1.25rem', color: '#6a11cb' }}
            onClick={() => handleButtonClick("Notifications")}
          >
            <i className="bi bi-bell-fill"></i>
          </button>
          <Button
            variant="light"
            title="Create Group"
            style={{ fontSize: '1.25rem', padding: '0.75rem 1.25rem', color: '#6a11cb' }}
            onClick={handleCreateGroupClick}
          >
            <i className="bi bi-people-fill"></i>
          </Button>
        </nav>
      </div>

      {showCreateGroup && (
        <div className="modal" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Tạo nhóm chat mới</h5>
                <button type="button" className="btn-close" onClick={handleCloseCreateGroup}></button>
              </div>
              <div className="modal-body">
                <CreateGroupChat 
                  userId={localStorage.getItem('user_id')}
                  accessToken={localStorage.getItem('access_token')}
                  onClose={handleCloseCreateGroup}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;