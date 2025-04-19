import React, { useEffect, useState, useCallback, useRef } from "react";
import "../../assets/styles.css";
import MessageAPI from "../../api/messageAPI";
import Picker from "emoji-picker-react";
import axios from "axios";

const ChatBox = ({ conversationId, conversationName, userId, token }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [participants, setParticipants] = useState([]);

  const messagesEndRef = useRef(null);
  const baseURL = "http://localhost:3000";

  const fetchMessages = useCallback(async () => {
    if (!conversationId || !token) return;
    setLoading(true);
    try {
      const data = await MessageAPI.fetchMessages(conversationId, token);
      setMessages(data);
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setLoading(false);
    }
  }, [conversationId, token]);

  const fetchParticipants = useCallback(async () => {
    if (!conversationId || !token) return;
    try {
      const res = await axios.get(`${baseURL}/api/conversations/${conversationId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setParticipants(res.data.participants);
    } catch (error) {
      console.error("Error fetching participants:", error);
    }
  }, [conversationId, token]);

  useEffect(() => {
    fetchMessages();
    fetchParticipants();
  }, [fetchMessages, fetchParticipants]);

  const handleSend = async () => {
    if (!newMessage.trim() && !selectedImage && !selectedDocument) {
      alert("Vui lòng nhập nội dung gửi");
      return;
    }
  
    try {
      let response;
      const receivers = participants.filter((id) => id !== userId);
      if (selectedImage || selectedDocument) {
        const formData = new FormData();
        formData.append("conversation_id", conversationId);
        formData.append("sender", userId);
        receivers.forEach((id) => {
          formData.append("receivers[]", id);
        });
        if (newMessage) {
          formData.append("content", newMessage);
        }
        if (selectedImage) {
          formData.append("file", selectedImage); // Thêm trực tiếp đối tượng File
        } else if (selectedDocument) {
          formData.append("file", selectedDocument); // Thêm trực tiếp đối tượng File
        }
  
        // Gỡ lỗi: Ghi lại chi tiết các khóa và giá trị của FormData
        for (let pair of formData.entries()) {
          if (pair[1] instanceof File) {
            console.log(`${pair[0]}: Tên tệp - ${pair[1].name}, kích thước - ${pair[1].size}, loại - ${pair[1].type}`);
          } else {
            console.log(`${pair[0]}: ${pair[1]}`);
          }
        }
  
        response = await MessageAPI.sendImageAndText(formData, token);
        setMessages((prev) => [...prev, response]);
      } else {
        const data = {
          conversation_id: conversationId,
          sender: userId,
          receivers,
          content: newMessage,
          type: "TEXT",
        };
        await MessageAPI.sendMessage(data, token);
        fetchMessages();
      }
  
      setNewMessage("");
      setSelectedImage(null);
      setSelectedDocument(null);
    } catch (error) {
      console.error("Gửi thất bại:", error);
      alert("Gửi tin nhắn thất bại. Vui lòng thử lại.");
    }
  };
  

  const handleRevokeMessage = async (messageId) => {
    try {
      await MessageAPI.revokeMessage(messageId, { user_id: userId, conversation_id: conversationId }, token);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId
            ? { ...msg, status: "REVOKED", content: "", image_url: null, file_url: null }
            : msg
        )
      );
    } catch (error) {
      console.error("Error revoking message:", error);
      alert(error?.response?.data?.error || error.message || "Unknown error");
    }
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  const onEmojiClick = (emoji) => {
    if (emoji?.emoji) setNewMessage((prev) => prev + emoji.emoji);
    setShowEmojiPicker(false);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="d-flex flex-column h-100 border rounded">
      <div className="p-3 bg-primary text-white d-flex justify-content-between align-items-center">
        <h5 className="mb-0">{conversationName || "Chọn cuộc trò chuyện"}</h5>
      </div>

      <div className="flex-grow-1 p-3 overflow-y-scroll custom-scroll bg-light" style={{ maxHeight: "500px" }}>
        {loading ? (
          <p>Loading...</p>
        ) : (
          messages.map((msg, idx) => (
            <div
              key={msg.id || idx} // Ensure a unique key for each message
              className={`d-flex mb-2 ${msg.sender === userId ? "justify-content-end" : "justify-content-start"}`}
              onContextMenu={(e) => {
                e.preventDefault();
                if (msg.id) { // Check if msg.id exists
                  setContextMenu({ x: e.clientX, y: e.clientY, messageId: msg.id });
                }
              }}
              onClick={(e) => {
                if (msg.id) { // Check if msg.id exists
                  console.log(`Message ID: ${msg.id}`);
                  setContextMenu({ x: e.clientX, y: e.clientY, messageId: msg.id });
                }
              }}
            >
              <div
                className={`p-2 rounded ${msg.sender === userId ? "bg-primary text-white" : "bg-secondary text-white"}`}
                style={{ maxWidth: "70%", backgroundColor: "#f0f8ff" }}
              >
                {msg.status === "REVOKED" ? (
                  <i><p className="mb-0">Tin nhắn đã bị thu hồi.</p></i>
                ) : msg.image_url ? (
                  <img src={msg.image_url} alt="img" style={{ maxWidth: "100%", maxHeight: "300px", borderRadius: "10px" }} />
                ) : msg.message_type === "file" ? (
                  <a href={msg.file_url} target="_blank" rel="noreferrer" download>
                    {msg.content || "Click để tải file"}
                  </a>
                ) : (
                  <p className="mb-0">{msg.content}</p>
                )}
                <small className="text-muted d-block mt-1" style={{ fontSize: "0.8rem" }}>
                  {formatTimestamp(msg.timestamp)}
                </small>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-3 border-top bg-light d-flex align-items-center position-relative">
        <label className="btn btn-light me-2">
          <i className="bi bi-image"></i>
          <input type="file" accept="image/*" hidden onChange={(e) => setSelectedImage(e.target.files[0])} />
        </label>
        <label className="btn btn-light me-2">
          <i className="bi bi-file-earmark-code-fill"></i>
          <input type="file" hidden onChange={(e) => setSelectedDocument(e.target.files[0])} />
        </label>
        <button className="btn btn-light me-2" onClick={() => setShowEmojiPicker((prev) => !prev)}>😊</button>
        {showEmojiPicker && (
          <div style={{ position: "absolute", bottom: "60px", left: "20px", zIndex: 1000 }}>
            <Picker onEmojiClick={onEmojiClick} />
          </div>
        )}
        <input
          type="text"
          className="form-control me-2"
          placeholder="Type a message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
        />
        <button className="btn btn-primary" onClick={handleSend} disabled={!conversationId}>Send</button>
      </div>

      {(selectedImage || selectedDocument) && (
        <div className="p-3 border-top bg-light d-flex align-items-center">
          {selectedImage && (
            <>
              <img src={URL.createObjectURL(selectedImage)} alt="Preview" style={{ maxWidth: "100px", marginRight: "10px" }} />
              <button className="btn btn-danger btn-sm" onClick={() => setSelectedImage(null)}>Remove</button>
            </>
          )}
          {selectedDocument && (
            <>
              <span className="me-2">{selectedDocument.name}</span>
              <button className="btn btn-danger btn-sm" onClick={() => setSelectedDocument(null)}>Remove</button>
            </>
          )}
        </div>
      )}

      {contextMenu && (
        <div
          className="context-menu"
          style={{
            top: contextMenu.y,
            left: contextMenu.x,
            position: "absolute",
            zIndex: 1000,
            background: "#fff",
            border: "1px solid #ccc",
            borderRadius: "4px",
          }}
          onMouseLeave={() => setContextMenu(null)}
        >
          <button
            className="dropdown-item"
            onClick={() => {
              handleRevokeMessage(contextMenu.messageId);
              setContextMenu(null);
            }}
          >
            Revoke Message
          </button>
        </div>
      )}
    </div>
  );
};

export default ChatBox;
