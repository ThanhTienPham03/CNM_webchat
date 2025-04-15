import React, { useEffect, useState, useCallback, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchMessages, sendMessage } from "../../redux/slices/messageSlice";
import "../../assets/styles.css";

const ChatBox = ({ conversationId, conversationName, userId, token }) => {
  const dispatch = useDispatch();
  const { messages, loading } = useSelector((state) => state.messages);
  const [newMessage, setNewMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (conversationId && token) {
      dispatch(fetchMessages({ conversationId, token }));
    }
  }, [conversationId, token, dispatch]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSendMessage = useCallback(() => {
    if (!newMessage.trim() && !selectedImage) return;
    if (token) {
      const messageData = {
        conversation_id: conversationId,
        sender: userId,
        content: newMessage || "[No Content]", // Ensure content is always set
      };

      if (selectedImage) {
        messageData.image = selectedImage; 
      }

      console.log("Sending message:", messageData); 

      dispatch(
        sendMessage({
          messageData,
          token,
        })
      );
    }
    setNewMessage("");
    setSelectedImage(null);
  }, [newMessage, selectedImage, conversationId, token, dispatch, userId]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    } else {
      setIsTyping(true);
      setTimeout(() => setIsTyping(false), 2000); 
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setSelectedImage(reader.result); // Store image as base64
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    console.log("Messages state:", messages); // Debug log
  }, [messages]);

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
      <div className="flex-grow-1 p-3 overflow-y-scroll custom-scroll bg-light" style={{ maxHeight: "500px" }}>
        {loading ? (
          <p>Loading...</p>
        ) : (
          messages.map((message, index) => {
            if (!message || typeof message.sender === 'undefined') {
              return null; 
            }
            return (
              <div
                key={index}
                className={`d-flex mb-2 ${message.sender === userId ? "justify-content-end" : "justify-content-start"}`}
              >
                <div
                  className={`p-2 rounded ${
                    message.sender === userId ? "bg-primary text-white" : "bg-secondary text-white"
                  }`}
                  style={{ maxWidth: "70%" }}
                >
                  <div>
                    {message.status === 'REVOKED'
                      ? 'Tin nhắn đã được thu hồi'
                      : message.image_url ? (
                          <img src={message.image_url} alt="Sent" style={{ maxWidth: "100%" }} />
                        ) : message.image ? (
                          <img src={message.image} alt="Sent" style={{ maxWidth: "100%" }} />
                        ) : (typeof message.content === 'string'
                          ? message.content
                          : message.content && typeof message.content === 'object'
                          ? JSON.stringify(message.content, null, 2)
                          : String(message.content || 'Invalid content'))}
                  </div>
                  <small className="text-muted d-block mt-1" style={{ fontSize: "0.8rem" }}>
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </small>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="d-flex p-3 border-top bg-white">
        <div className="d-flex align-items-center me-2">
          <label className="btn btn-light me-2" title="Attach File">
            📎
            <input
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={handleImageChange}
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
          disabled={!newMessage.trim() && !selectedImage}
        >
          <i className="bi bi-send"></i>
        </button>
      </div>
      {selectedImage && (
        <div className="p-3 border-top bg-light d-flex align-items-center">
          <img
            src={selectedImage}
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
      {isTyping && (
        <div className="text-muted" style={{ fontSize: "0.8rem" }}>
          Someone is typing...
        </div>
      )}
    </div>
  );
};

export default ChatBox;