import React, { useEffect, useState, useCallback, useRef } from "react";
import "../../assets/styles.css";
import MessageAPI from "../../api/messageAPI";
import Picker from "emoji-picker-react";

const ChatBox = ({ conversationId, conversationName, userId, token }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messagesEndRef = useRef(null);

  const appendMessage = (msg) => {
    setMessages((prev) => [...prev, msg]);
  };

  useEffect(() => {
    const fetchMessages = async () => {
      if (conversationId && token) {
        setLoading(true);
        try {
          const fetchedMessages = await MessageAPI.fetchMessages(conversationId, token);
          const normalizedMessages = fetchedMessages.map((msg) => ({
            ...msg,
            id: msg.id || msg.message_id,
            sender: msg.sender?.id || msg.sender,
          }));
          setMessages(normalizedMessages);
        } catch (error) {
          console.error("Lỗi khi tải tin nhắn:", error);
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
      alert("Thiếu conversationId hoặc token");
      return;
    }

    if (!newMessage.trim() && !selectedImage && !selectedFile) return;

    const tempId = "temp-" + Date.now();
    const tempMessage = {
      id: tempId,
      sender: userId,
      content: newMessage,
      timestamp: new Date().toISOString(),
      message_type: selectedImage ? "image" : selectedFile ? "file" : "text",
      sending: true,
    };

    appendMessage(tempMessage);
    setNewMessage("");

    try {
      let response;
      if (selectedImage || selectedFile) {
        const formData = new FormData();

        // Kiểm tra dữ liệu trước khi gửi
        if (!conversationId || !userId) {
          alert("Thiếu conversationId hoặc userId");
          return;
        }
        if (!selectedImage && !selectedFile) {
          alert("Không có tệp tin nào được chọn");
          return;
        }

        // Log chi tiết tệp tin được chọn
        console.log("Selected Image:", selectedImage);
        console.log("Selected File:", selectedFile);

        // Kiểm tra tệp tin có hợp lệ không
        if (selectedImage && !(selectedImage instanceof File)) {
          alert("Tệp hình ảnh không hợp lệ");
          return;
        }
        if (selectedFile && !(selectedFile instanceof File)) {
          alert("Tệp tin không hợp lệ");
          return;
        }

        formData.append("conversation_id", conversationId);
        formData.append("sender", userId);
        formData.append("file", selectedImage || selectedFile);

        // Log dữ liệu trước khi gửi
        console.log("FormData keys:", Array.from(formData.keys()));
        console.log("FormData values:", Array.from(formData.entries()));

        try {
          response = await MessageAPI.sendImageMessage(formData, token);
          setSelectedImage(null);
          setSelectedFile(null);
        } catch (error) {
          console.error("Error sending file or image:", error);

          // Hiển thị thông báo lỗi chi tiết hơn
          const errorMessage = error.response?.data?.error || error.message || "Lỗi không xác định";
          alert(`Lỗi khi gửi tệp tin hoặc hình ảnh: ${errorMessage}`);
          return;
        }
      } else {
        const messageData = {
          conversation_id: conversationId,
          sender: userId,
          content: newMessage,
        };

        try {
          response = await MessageAPI.sendMessage(messageData, token);
        } catch (error) {
          console.error("Error sending message:", error);

          // Hiển thị thông báo lỗi chi tiết hơn
          const errorMessage = error.response?.data?.error || error.message || "Lỗi không xác định";
          alert(`Lỗi khi gửi tin nhắn: ${errorMessage}`);
          return;
        }
      }

      if (response?.id) {
        setMessages((prevMessages) =>
          prevMessages.map((msg) =>
            msg.id === tempId
              ? {
                  ...msg,
                  id: response.id,
                  timestamp: response.timestamp || new Date().toISOString(),
                  sending: false,
                  image_url: response.image_url || null,
                  file_url: response.file_url || null,
                }
              : msg
          )
        );
      }
    } catch (error) {
      console.error("Lỗi khi gửi tin nhắn:", error);
      setMessages((prev) => prev.filter((msg) => msg.id !== tempId));
      alert("Lỗi khi gửi tin nhắn");
    }
  }, [newMessage, selectedImage, selectedFile, conversationId, token, userId]);

  const formatTimestamp = (timestamp) => {
    if (!timestamp || isNaN(new Date(timestamp).getTime())) return "";
    try {
      return new Date(timestamp).toLocaleString();
    } catch (error) {
      console.error("Error formatting timestamp:", error);
      return "";
    }
  };

  const handleRevokeMessage = useCallback(
    async (messageId) => {
      if (!token || !conversationId || !userId) {
        alert("Thiếu thông tin xác thực.");
        return;
      }
      try {
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
        const errorMessage = error.response?.data?.error || error.message || "Lỗi không xác định";
        alert(errorMessage);
      }
    },
    [token, conversationId, userId]
  );

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

  const handleEmojiClick = (emoji) => {
    setNewMessage((prevMessage) => (prevMessage || "") + emoji);
  };

  const toggleEmojiPicker = () => {
    setShowEmojiPicker((prev) => !prev);
  };

  const onEmojiClick = (emojiObject) => {
    if (emojiObject && emojiObject.emoji) {
      handleEmojiClick(emojiObject.emoji);
    }
    setShowEmojiPicker(false);
  };

  // const handleImageError = (e) => {
  //   e.target.onerror = null;
  //   e.target.src = "/OIP.png";
  // };

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
            const isSender = message.sender?.toString() === userId.toString();
            return (
              <div
                key={index}
                className={`d-flex mb-2 ${isSender ? "justify-content-end" : "justify-content-start"}`}
                onContextMenu={(e) => handleContextMenu(e, message.id)}
              >
                <div
                  className={`p-2 rounded ${isSender ? "bg-primary text-white" : "bg-secondary text-white"}`}
                  style={{ maxWidth: "70%" }}
                >
                  <div>
                    {message.status === "REVOKED" ? (
                      <p><i>Tin nhắn được thu hồi.</i></p>
                    ) : message.image_url ? (
                      <img
                        src={message.image_url}
                        alt="Sent Image"
                        style={{ maxWidth: "100%", maxHeight: "300px", borderRadius: "10px" }}
                        // onError={handleImageError}
                      />
                    ) : message.message_type === "file" ? (
                      <a
                        href={message.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        download
                        style={{ color: "blue", textDecoration: "underline" }}
                      >
                        {message.content || "Click để mở file"}
                      </a>
                    ) : (
                      <p>{message.content} {message.sending && <small className="text-muted">...</small>}</p>
                    )}
                  </div>
                  <small className="text-muted d-block mt-1" style={{ fontSize: "0.8rem" }}>
                    {formatTimestamp(message.timestamp)}
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
            <input type="file" style={{ display: "none" }} onChange={handleFileInputChange} />
          </label>
          <button className="btn btn-light me-2" title="Insert Emoji" onClick={toggleEmojiPicker}>
            😊
          </button>
          {showEmojiPicker && (
            <div style={{ position: "absolute", bottom: "60px", left: "20px", zIndex: 1000 }}>
              <Picker onEmojiClick={onEmojiClick} />
            </div>
          )}
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
          <button className="btn btn-danger btn-sm" onClick={() => setSelectedImage(null)}>
            Remove
          </button>
        </div>
      )}
      {selectedFile && (
        <div className="p-3 border-top bg-light d-flex align-items-center">
          <p className="mb-0 me-2">{selectedFile.name}</p>
          <button className="btn btn-danger btn-sm" onClick={() => setSelectedFile(null)}>
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
          style={{
            top: contextMenu.y,
            left: contextMenu.x,
            position: "absolute",
            zIndex: 1000,
            background: "white",
            border: "1px solid #ccc",
            borderRadius: "4px",
            boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
          }}
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
