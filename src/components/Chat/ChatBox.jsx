import React, { useEffect, useState, useCallback, useRef } from "react";
import "../../assets/styles.css";
import MessageAPI from "../../api/messageAPI";

const ChatBox = ({ conversationId, conversationName, userId, token }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const fetchMessages = async () => {
      if (conversationId && token) {
        setLoading(true);
        try {
          const fetchedMessages = await MessageAPI.fetchMessages(conversationId, token);
          const normalizedMessages = fetchedMessages.map((msg) => ({
            ...msg,
            id: msg.id || msg.message_id,
          }));
          setMessages(normalizedMessages);
        } catch (error) {
          console.error("Error fetching messages:", error);
        } finally {
          setLoading(false);
        }
      }
    };
    fetchMessages();
  }, [conversationId, token]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSendMessage = useCallback(async () => {
    if (!conversationId || !token) {
      alert("Missing conversationId or token");
      return;
    }

    const formData = new FormData();
    formData.append("conversation_id", conversationId);
    formData.append("sender", userId);

    try {
      let response;
      if (selectedImage) {
        formData.append("image", selectedImage);
        response = await MessageAPI.sendFileOrImage(formData, token);
      } else if (selectedFile) {
        formData.append("file", selectedFile);
        response = await MessageAPI.sendFileOrImage(formData, token);
      } else if (newMessage.trim()) {
        const messageData = {
          conversation_id: conversationId,
          sender: userId,
          content: newMessage,
        };
        response = await MessageAPI.sendMessage(messageData, token);
      } else {
        return;
      }

      if (!response || response.error) {
        throw new Error(response?.error || "Unknown error occurred");
      }

      setMessages((prev) => [...prev, response]);
    } catch (error) {
      console.error("Error sending:", error);
      alert("Error sending message or file: " + error.message);
    } finally {
      setNewMessage("");
      setSelectedImage(null);
      setSelectedFile(null);
    }
  }, [newMessage, selectedImage, selectedFile, conversationId, token, userId]);

  const formatTimestamp = (timestamp) => {
    if (!timestamp || isNaN(new Date(timestamp).getTime())) {
      return "Invalid Date";
    }
    try {
      return new Date(timestamp).toLocaleString();
    } catch (error) {
      console.error("Error formatting timestamp:", error);
      return "Invalid Date";
    }
  };

  const handleRevokeMessage = useCallback(async (messageId) => {
    if (!token) {
      alert("Token không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.");
      return;
    }
    if (token && conversationId && userId) {
      try {
        console.log("Revoke Message Params:", { messageId, userId, conversationId, token });
        const data = { user_id: userId, conversation_id: conversationId };
        await MessageAPI.revokeMessage(messageId, data, token);
        setMessages((prevMessages) =>
          prevMessages.map((msg) =>
            msg.id === messageId ? { ...msg, status: "REVOKED" } : msg
          )
        );
        alert("Message revoked successfully");
      } catch (error) {
        console.error("Error revoking message:", error);
        const errorMessage = error.response?.data?.error || error.message || "An unknown error occurred";
        alert(errorMessage);
      }
    } else {
      alert("Missing token, userId, or conversationId. Cannot revoke message.");
    }
  }, [token, conversationId, userId]);

  const handleContextMenu = (e, messageId) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, messageId });
  };

  const handleCloseContextMenu = () => {
    setContextMenu(null);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    } else {
      setIsTyping(true);
      setTimeout(() => setIsTyping(false), 2000);
    }
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const fileType = file.type;
      if (fileType.startsWith("image/")) {
        setSelectedImage(file);
        setSelectedFile(null);
      } else {
        setSelectedFile(file);
        setSelectedImage(null);
      }
    }
  };

  return (
    <div className="d-flex flex-column h-100 border rounded">
      <div className="p-3 bg-primary text-white d-flex justify-content-between align-items-center">
        <h5 className="mb-0">{conversationName || "Chat"}</h5>
        <div>
          <button className="btn btn-outline-info me-2" title="Voice Call">
            <i className="bi bi-telephone"></i>
          </button>
          <button className="btn btn-outline-info" title="Video Call">
            <i className="bi bi-camera-video-fill"></i>
          </button>
        </div>
      </div>
      <div
        className="flex-grow-1 p-3 overflow-y-scroll custom-scroll bg-light"
        style={{ maxHeight: "500px" }}
      >
        {loading ? (
          <p>Loading...</p>
        ) : (
          messages.map((message, index) => (
            <div
              key={index}
              className={`d-flex mb-2 ${
                message.sender === userId
                  ? "justify-content-end"
                  : "justify-content-start"
              }`}
              onContextMenu={(e) => handleContextMenu(e, message.id)}
            >
              <div
                className={`p-2 rounded ${
                  message.sender === userId
                    ? "bg-primary text-white"
                    : "bg-secondary text-white"
                }`}
                style={{ maxWidth: "70%" }}
              >
                <div>
                  {message.status === "REVOKED" ? (
                    <p>
                      <i>Tin nhắn được thu hồi.</i>
                    </p>
                  ) : message.image_url ? (
                    <img
                      src={message.image_url}
                      alt="Sent"
                      style={{ width: '300px', height: '300px', borderRadius: '20px' }}
                    />
                  ) : (
                    <p>{message.content}</p>
                  )}
                </div>
                <small
                  className="text-muted d-block mt-1"
                  style={{ fontSize: "0.8rem" }}
                >
                  {formatTimestamp(message.timestamp)}
                </small>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="d-flex p-3 border-top bg-white">
        <div className="d-flex align-items-center me-2">
          <label className="btn btn-light me-2" title="Attach File">
            📎
            <input
              type="file"
              style={{ display: "none" }}
              onChange={handleFileInputChange}
            />
          </label>
          <button className="btn btn-light me-2" title="Insert Emoji">
            😊
          </button>
        </div>
        <input
          type="text"
          className="form-control me-2"
          placeholder="Type a message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button
          className="btn btn-primary"
          onClick={handleSendMessage}
          disabled={!newMessage.trim() && !selectedImage && !selectedFile}
        >
          <i className="bi bi-send"></i>
        </button>
      </div>
      {selectedImage && (
        <div className="p-3 border-top bg-light d-flex align-items-center">
          <img
            src={URL.createObjectURL(selectedImage)}
            alt="Preview"
            style={{ maxWidth: "100px", maxHeight: "100px", marginRight: "10px" }}
          />
          <button
            className="btn btn-danger btn-sm"
            onClick={() => setSelectedImage(null)}
          >
            Remove
          </button>
        </div>
      )}
      {selectedFile && (
        <div className="p-3 border-top bg-light d-flex align-items-center">
          <p className="mb-0 me-2">{selectedFile.name}</p>
          <button
            className="btn btn-danger btn-sm"
            onClick={() => setSelectedFile(null)}
          >
            Remove
          </button>
        </div>
      )}
      {isTyping && (
        <div className="text-muted" style={{ fontSize: "0.8rem" }}>
          Someone is typing...
        </div>
      )}
      {contextMenu && (
        <div
          className="context-menu"
          style={{ top: contextMenu.y, left: contextMenu.x, position: "absolute", zIndex: 1000, background: "white", border: "1px solid #ccc", borderRadius: "4px", boxShadow: "0 2px 5px rgba(0,0,0,0.2)" }}
          onMouseLeave={handleCloseContextMenu}
        >
          <button
            className="btn btn-link"
            onClick={() => {
              handleRevokeMessage(contextMenu.messageId);
              handleCloseContextMenu();
            }}
          >
            Thu hồi tin nhắn
          </button>
        </div>
      )}
    </div>
  );
};

export default ChatBox;