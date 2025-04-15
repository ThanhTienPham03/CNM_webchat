import React, { useEffect, useState, useCallback, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchMessages, sendMessage } from "../../redux/slices/messageSlice";
import "../../assets/styles.css";

const ChatBox = ({ conversationId, conversationName, userId, token }) => {
  const dispatch = useDispatch();
  const { messages, loading } = useSelector((state) => state.messages);
  const [newMessage, setNewMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
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
    if (!newMessage.trim()) return;
    if (token) {
      dispatch(
        sendMessage({
          messageData: {
            conversation_id: conversationId,
            sender: userId,
            content: newMessage,
          },
          token,
        })
      );
    }
    setNewMessage("");
  }, [newMessage, conversationId, token, dispatch, userId]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    } else {
      setIsTyping(true);
      setTimeout(() => setIsTyping(false), 2000); 
    }
  };

  return (
    <div className="d-flex flex-column h-100 border rounded">
      <div className="p-3 bg-primary text-white">
        <h5 className="mb-0">{conversationName || "Chat"}</h5>
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
                  <div>{
                    typeof message.content === 'string' 
                      ? message.content 
                      : message.content && typeof message.content === 'object' 
                      ? JSON.stringify(message.content, null, 2) 
                      : String(message.content || 'Invalid content') // Fallback for unexpected cases
                  }</div>
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
          <button className="btn btn-light me-2" title="Attach File">
            📎
          </button>
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
          disabled={!newMessage.trim()}
        >
          Send
        </button>
      </div>
      {isTyping && (
        <div className="text-muted" style={{ fontSize: "0.8rem" }}>
          Someone is typing...
        </div>
      )}
    </div>
  );
};

export default ChatBox;