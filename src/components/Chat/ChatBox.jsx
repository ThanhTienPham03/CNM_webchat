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

  const cleanFileName = (fileName) => {
    if (!fileName) return "Unnamed File";
    
    // Remove timestamp if present
    fileName = fileName.replace(/^\d{2}:\d{2}:\d{2}\s/, '');
    
    // If the file name is just a UUID with extension, try to make it more readable
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}(\.[^.]+)?$/.test(fileName)) {
      const extension = fileName.includes('.') ? fileName.substring(fileName.lastIndexOf('.')) : '';
      return `File${extension}`;
    }
    
    // Clean up file name if it's a path
    if (fileName.includes('/')) {
      fileName = fileName.split('/').pop();
    }
    
    return fileName;
  };

  // Add function to manage file names in localStorage
  const storeFileName = (fileUrl, originalName) => {
    const fileNames = JSON.parse(localStorage.getItem('fileNames') || '{}');
    fileNames[fileUrl] = originalName;
    localStorage.setItem('fileNames', JSON.stringify(fileNames));
  };

  const getStoredFileName = (fileUrl) => {
    const fileNames = JSON.parse(localStorage.getItem('fileNames') || '{}');
    return fileNames[fileUrl];
  };

  const extractFileNameFromUrl = (url) => {
    if (!url) return "Unknown File";
    
    try {
      // Get the last part of the URL
      const urlParts = url.split('/');
      let fileName = urlParts[urlParts.length - 1];
      
      // Try to decode the URL-encoded name
      try {
        fileName = decodeURIComponent(fileName);
      } catch (e) {
        console.error('Error decoding filename:', e);
      }

      // Remove any query parameters
      fileName = fileName.split('?')[0];
      
      // If it's a UUID, try to make it more readable
      if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.[^.]+$/.test(fileName)) {
        const extension = fileName.substring(fileName.lastIndexOf('.'));
        return `Document${extension}`;
      }
      
      return fileName;
    } catch (e) {
      console.error('Error extracting filename:', e);
      return 'Unknown File';
    }
  };

  const normalizeMessage = (msg) => {
    console.log("Normalizing message input:", msg);
    
    let messageType = (msg.type || msg.message_type || "text").toLowerCase();
    if (messageType === "pdf") {
      messageType = "file";
    }
    // Normalize image_text to image type
    if (messageType === "image_text") {
      messageType = "image";
    }
    
    let fileUrl = null;
    let imageUrl = null;
    let fileName = null;
    let url = null;
    
    if (messageType === "file" || messageType === "image") {
      // Check all possible URL fields
      url = msg.url || msg.s3_url || msg.file_url || msg.image_url;
      console.log("Found URL:", url);

      if (messageType === "file") {
        fileUrl = url;
        fileName = getStoredFileName(fileUrl) ||
                  (msg.content && msg.content.includes('.') ? msg.content : null) ||
                  extractFileNameFromUrl(fileUrl);
      } else if (messageType === "image") {
        // For images, check content if it's a URL
        imageUrl = url;
        fileName = msg.fileName || msg.content || extractFileNameFromUrl(imageUrl);
      }
    }

    const normalized = {
      id: msg.message_id || msg.id,
      sender: Number(msg.sender),
      content: msg.content || "",
      image_url: imageUrl,
      file_url: fileUrl,
      url: url,
      timestamp: msg.created_at || msg.timestamp || new Date().toISOString(),
      status: msg.status || "SENT",
      message_type: messageType,
      conversation_id: msg.conversation_id,
      fileName: fileName
    };

    console.log("Normalized message output:", normalized);
    return normalized;
  };

  const formatFileName = (fileName) => {
    if (!fileName) return "Tải file";
    // Limit file name length and add ellipsis if too long
    const maxLength = 30;
    if (fileName.length > maxLength) {
      const extension = fileName.split('.').pop();
      const name = fileName.substring(0, maxLength - extension.length - 4);
      return `${name}...${extension}`;
    }
    return fileName;
  };

  const fetchMessages = useCallback(async () => {
    if (!conversationId || !token) return;
    setLoading(true);
    try {
      const data = await MessageAPI.fetchMessages(conversationId, token);
      console.log("Fetched messages raw:", data);
      
      const formattedMessages = data.map(msg => {
        // For image messages, ensure we have the URL in the content if not in other fields
        if ((msg.message_type?.toLowerCase() === "image" || msg.message_type?.toLowerCase() === "image_text") 
            && !msg.url && !msg.s3_url && !msg.image_url) {
          msg.url = msg.content;
        }
        const normalized = normalizeMessage(msg);
        console.log("Normalized fetched message:", normalized);
        return normalized;
      });
      
      setMessages(formattedMessages);
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

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "";
    try {
      return new Date(timestamp).toLocaleString('vi-VN');
    } catch (error) {
      console.error("Error formatting timestamp:", error);
      return "";
    }
  };

  const handleSend = async () => {
    if (!newMessage.trim() && !selectedImage && !selectedDocument) {
      alert("Vui lòng nhập nội dung gửi");
      return;
    }
  
    setLoading(true);
    try {
      const receivers = participants.filter((id) => id !== userId);
      if (selectedImage || selectedDocument) {
        const formData = new FormData();
        formData.append("conversation_id", conversationId);
        formData.append("sender", userId);
        receivers.forEach((id) => {
          formData.append("receivers[]", id);
        });

        const isImage = selectedImage !== null;
        const file = isImage ? selectedImage : selectedDocument;
        const type = isImage ? "IMAGE" : "FILE";
        
        console.log("Selected file:", {
          name: file.name,
          type: file.type,
          size: file.size
        });

        // Always use 'file' as the form field name
        formData.append("file", file);
        formData.append("type", type);
        formData.append("content", newMessage || file.name);
        
        const response = await MessageAPI.sendImageAndText(formData, token);
        console.log("Response from send file:", response);
        
        if (response) {
          // Store file name if it's a file
          if (response.file_url) {
            storeFileName(response.file_url, file.name);
          }
          
          const normalized = normalizeMessage({
            ...response,
            type: type,
            content: newMessage || file.name,
            url: response.url || response.file_url || response.image_url // Prioritize url field
          });

          console.log("Normalized new message:", normalized);
          setMessages(prev => [...prev, normalized]);
        }
      } else {
        const messageData = {
          conversation_id: conversationId,
          sender: Number(userId),
          receivers,
          content: newMessage,
          type: "TEXT",
        };
        await MessageAPI.sendMessage(messageData, token);
        await fetchMessages();
      }
  
      setNewMessage("");
      setSelectedImage(null);
      setSelectedDocument(null);
    } catch (error) {
      console.error("Gửi thất bại:", error);
      alert(error.response?.data?.message || "Gửi tin nhắn thất bại. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };
  

  const handleRevokeMessage = async (messageId) => {
    try {
      // Find the message that is being revoked
      const messageToRevoke = messages.find(msg => msg.id === messageId);
      if (!messageToRevoke) {
        console.error("Message not found:", messageId);
        return;
      }

      // Check if the current user is the sender
      if (Number(messageToRevoke.sender) !== Number(userId)) {
        alert("Bạn không thể thu hồi tin nhắn của người khác");
        return;
      }

      console.log("Revoking message:", {
        messageId,
        userId,
        conversationId,
        message: messageToRevoke
      });

      const response = await MessageAPI.revokeMessage(
        messageId, 
        { 
          sender: Number(userId),
          user_id: Number(userId), 
          conversation_id: conversationId 
        }, 
        token
      );

      console.log("Revoke response:", response);

      if (response) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === messageId
              ? {
                  ...msg,
                  status: "REVOKED",
                  content: "",
                  image_url: null,
                  file_url: null,
                  fileName: msg.message_type === "file" ? "File đã bị thu hồi" : null
                }
              : msg
          )
        );

        // Remove the file name from localStorage if it was a file
        if (messageToRevoke.file_url) {
          const fileNames = JSON.parse(localStorage.getItem('fileNames') || '{}');
          delete fileNames[messageToRevoke.file_url];
          localStorage.setItem('fileNames', JSON.stringify(fileNames));
        }
      }
    } catch (error) {
      console.error("Error revoking message:", error);
      const errorMessage = error?.response?.data?.message || 
                          error?.response?.data?.error ||
                          error.message ||
                          "Không thể thu hồi tin nhắn. Vui lòng thử lại.";
      alert(errorMessage);
    }
  };

  const handleDeleteMessage = async (messageId) => {
    try {
      // Find the message that is being deleted
      const messageToDelete = messages.find(msg => msg.id === messageId);
      if (!messageToDelete) {
        console.error("Message not found:", messageId);
        return;
      }

      // Check if the current user is the sender
      if (Number(messageToDelete.sender) !== Number(userId)) {
        alert("Bạn không thể xóa tin nhắn của người khác");
        return;
      }

      console.log("Deleting message:", {
        messageId,
        userId,
        conversationId,
        message: messageToDelete
      });

      const response = await MessageAPI.deleteMessage(
        messageId,
        {
          sender: Number(userId),
          user_id: Number(userId),
          conversation_id: conversationId
        },
        token
      );

      console.log("Delete response:", response);

      if (response) {
        // Remove the message from the messages array
        setMessages((prev) => prev.filter((msg) => msg.id !== messageId));

        // If it was a file message, remove from localStorage
        if (messageToDelete.file_url) {
          const fileNames = JSON.parse(localStorage.getItem('fileNames') || '{}');
          delete fileNames[messageToDelete.file_url];
          localStorage.setItem('fileNames', JSON.stringify(fileNames));
        }
      }
    } catch (error) {
      console.error("Error deleting message:", error);
      const errorMessage = error?.response?.data?.message ||
                          error?.response?.data?.error ||
                          error.message ||
                          "Không thể xóa tin nhắn. Vui lòng thử lại.";
      alert(errorMessage);
    }
  };

  const onEmojiClick = (emoji) => {
    if (emoji?.emoji) setNewMessage((prev) => prev + emoji.emoji);
    setShowEmojiPicker(false);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const isSender = (messageSender) => {
    return Number(messageSender) === Number(userId);
  };

  return (
    <div className="d-flex flex-column h-100 border rounded">
      <div className="p-3 bg-primary text-white d-flex justify-content-between align-items-center">
        <h5 className="mb-0">{conversationName || "Chọn cuộc trò chuyện"}</h5>
      </div>

      <div className="flex-grow-1 p-3 overflow-y-scroll custom-scroll bg-light" style={{ maxHeight: "500px" }}>
        {loading && messages.length === 0 ? (
          <p>Loading...</p>
        ) : messages.length === 0 ? (
          <p className="text-center text-muted">Chưa có tin nhắn nào</p>
        ) : (
          messages.map((msg, idx) => {
            if (msg.status === "DELETED") return null; // Skip rendering deleted messages
            
            // console.log("Rendering message:", msg);
            const messageType = msg.message_type?.toLowerCase();
            const isImage = messageType === "image" || messageType === "image_text";
            const isFile = messageType === "file";
            
            return (
              <div
                key={msg.id || idx}
                className={`d-flex mb-2 ${isSender(msg.sender) ? "justify-content-end" : "justify-content-start"}`}
                onContextMenu={(e) => {
                  e.preventDefault();
                  if (msg.id && isSender(msg.sender)) {
                    setContextMenu({ x: e.clientX, y: e.clientY, messageId: msg.id });
                  }
                }}
              >
                <div
                  className={`p-2 rounded ${isSender(msg.sender) ? "bg-primary text-white" : "bg-secondary text-white"}`}
                  style={{ maxWidth: "70%" }}
                >
                  {msg.status === "REVOKED" ? (
                    <div className="d-flex align-items-center">
                      <i className="bi bi-clock-history me-2"></i>
                      <i>
                        <p className="mb-0">
                          {isFile ? "File đã bị thu hồi" : "Tin nhắn đã bị thu hồi"}
                        </p>
                      </i>
                    </div>
                  ) : isImage ? (
                    <div>
                      <img 
                        src={msg.image_url || msg.url} 
                        alt="Sent" 
                        style={{ 
                          maxWidth: "100%", 
                          maxHeight: "300px", 
                          borderRadius: "10px",
                          cursor: "pointer",
                          display: "block",
                          marginBottom: msg.content ? "8px" : "0"
                        }}
                        onClick={() => window.open(msg.image_url || msg.url, '_blank')}
                        onError={(e) => {
                          console.error("Image load error for URL:", {
                            url: msg.url,
                            image_url: msg.image_url
                          });
                          e.target.style.display = 'none';
                        }}
                      />
                      {msg.content && msg.content !== msg.fileName && !msg.content.includes('https://') && (
                        <p className="mb-0 mt-1 text-break">{msg.content}</p>
                      )}
                    </div>
                  ) : isFile ? (
                    <div className="d-flex align-items-center">
                      <i className="bi bi-file-earmark-pdf me-2"></i>
                      <div className="d-flex flex-column">
                        <a 
                          href={msg.file_url} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="text-white text-decoration-none"
                          download={msg.fileName}
                          style={{ wordBreak: "break-word" }}
                          title={msg.fileName}
                          onClick={(e) => {
                            if (!msg.file_url) {
                              e.preventDefault();
                              console.error("No file URL available");
                              alert("Không thể tải file. URL không hợp lệ.");
                            }
                          }}
                        >
                          {msg.fileName}
                        </a>
                        {msg.content && msg.content !== msg.fileName && (
                          <small className="text-white-50">{msg.content}</small>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="mb-0 text-break">{msg.content}</p>
                  )}
                  <small className="text-white-50 d-block mt-1" style={{ fontSize: "0.8rem" }}>
                    {formatTimestamp(msg.timestamp)}
                  </small>
                </div>
              </div>
            );
          })
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
        <button className="btn btn-light me-2 bi bi-emoji-kiss-fill" onClick={() => setShowEmojiPicker((prev) => !prev)}>

        </button>
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
        <button className="btn btn-primary" onClick={handleSend} disabled={!conversationId || loading}>
          <i className="bi bi-send"></i>
          {loading && <span className="ms-2">Sending...</span>}
        </button>
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
            padding: "4px 0",
            boxShadow: "0 2px 5px rgba(0,0,0,0.2)"
          }}
          onMouseLeave={() => setContextMenu(null)}
        >
          <button
            className="dropdown-item d-flex align-items-center"
            onClick={() => {
              handleRevokeMessage(contextMenu.messageId);
              setContextMenu(null);
            }}
          >
            <i className="bi bi-clock-history me-2"></i>
            Thu hồi tin nhắn
          </button>
          <div className="dropdown-divider"></div>
          <button
            className="dropdown-item d-flex align-items-center text-danger"
            onClick={() => {
              if (window.confirm('Bạn có chắc chắn muốn xóa tin nhắn này?')) {
                handleDeleteMessage(contextMenu.messageId);
                setContextMenu(null);
              }
            }}
          >
            <i className="bi bi-trash me-2"></i>
            Xóa tin nhắn
          </button>
        </div>
      )}
    </div>
  );
};

export default ChatBox;
