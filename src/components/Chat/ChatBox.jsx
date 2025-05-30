import React, { useEffect, useState, useCallback, useRef } from "react";
import "../../assets/styles.css";
import MessageAPI from "../../api/messageAPI";
import Picker from "emoji-picker-react";
import axios from "axios";
import { useSocket } from "../../hooks/useSocket";

// Hàm debounce để giới hạn tần suất gọi hàm
const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      func(...args);
    }, delay);
  };
};

const ChatBox = ({ conversationId, conversationName, userId, token }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [lastSeenMessageId, setLastSeenMessageId] = useState(null);
  const [userStatuses, setUserStatuses] = useState({});
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editingContent, setEditingContent] = useState("");
  const [lastKey, setLastKey] = useState(null);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [shouldRefresh, setShouldRefresh] = useState(false);
  const [justSentMessage, setJustSentMessage] = useState(false);
  const [viewingImageUrl, setViewingImageUrl] = useState(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const isFetchingRef = useRef(false); // Cờ kiểm soát gọi API
  const baseURL = "http://18.141.182.181:3000";
  const { 
    socket, 
    sendMessage, 
    updateMessage, 
    sendTyping, 
    sendSeen, 
    isTyping, 
    typingUser 
  } = useSocket(conversationId);

  const cleanFileName = (fileName) => {
    if (!fileName) return "Unnamed File";
    fileName = fileName.replace(/^\d{2}:\d{2}:\d{2}\s/, '');
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}(\.[^.]+)?$/.test(fileName)) {
      const extension = fileName.includes('.') ? fileName.substring(fileName.lastIndexOf('.')) : '';
      return `File${extension}`;
    }
    if (fileName.includes('/')) {
      fileName = fileName.split('/').pop();
    }
    return fileName;
  };

  const storeFileName = (fileUrl, originalName) => {
    const fileNames = JSON.parse(localStorage.getItem('fileNames') || '{}');
    fileNames[fileUrl] = originalName;
    localStorage.setItem('fileNames', JSON.stringify(fileNames));
  };

  const getStoredFileName = (fileUrl) => {
    const fileNames = JSON.parse(localStorage.getItem('fileNames') || '{}');
    return fileNames[fileUrl];
  };

  const normalizeParticipants = (participants) => {
    if (Array.isArray(participants)) return participants;
    if (participants && typeof participants === 'object' && participants.values) {
      return Array.isArray(participants.values) ? participants.values : [];
    }
    return [];
  };

  const extractFileNameFromUrl = (url) => {
    if (!url) return "Unknown File";
    try {
      const urlParts = url.split('/');
      let fileName = urlParts[urlParts.length - 1];
      try {
        fileName = decodeURIComponent(fileName);
      } catch (e) {
        console.error('Error decoding filename:', e);
      }
      fileName = fileName.split('?')[0];
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
    let messageType = (msg.type || msg.message_type || "text").toLowerCase();
    if (messageType === "pdf") {
      messageType = "file";
    }
    if (messageType === "image_text") {
      messageType = "image";
    }
    
    let fileUrl = null;
    let imageUrl = null;
    let fileName = null;
    let url = null;
    
    if (messageType === "file" || messageType === "image") {
      url = msg.url || msg.file_url || msg.image_url;
      if (messageType === "file") {
        fileUrl = url;
        fileName = getStoredFileName(fileUrl) ||
                  (msg.content && msg.content.includes('.') ? msg.content : null) ||
                  extractFileNameFromUrl(fileUrl);
      } else if (messageType === "image") {
        imageUrl = url;
        fileName = msg.fileName || msg.content || extractFileNameFromUrl(imageUrl);
      }
    }

    return {
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
  };

  const formatFileName = (fileName) => {
    if (!fileName) return "Tải file";
    const maxLength = 30;
    if (fileName.length > maxLength) {
      const extension = fileName.split('.').pop();
      const name = fileName.substring(0, maxLength - extension.length - 4);
      return `${name}...${extension}`;
    }
    return fileName;
  };

  // Sửa fetchMessages để nhận lastKeyArg làm tham số
  const fetchMessages = useCallback(async (lastKeyArg = null) => {
    if (!conversationId || !token || isFetchingRef.current) return;
    isFetchingRef.current = true;
    setLoading(true);
    try {
      const { messages: newMessages, lastKey: newLastKey } = await MessageAPI.fetchMessages(conversationId, token, lastKeyArg);
      console.log("Total messages fetched:", newMessages.length);

      const formattedMessages = newMessages.map(msg => normalizeMessage(msg)).reverse();
      setMessages(prev => {
        const existingIds = new Set(prev.map(m => m.id));
        const newUniqueMessages = formattedMessages.filter(m => !existingIds.has(m.id));
        const updatedMessages = [ ...newUniqueMessages, ...prev ];
        console.log("Fetched messages:", {
          count: formattedMessages.length,
          lastKey: newLastKey,
          hasMore: !!newLastKey,
          currentMessagesCount: updatedMessages.length
        });
        return updatedMessages;
      });
      setLastKey(newLastKey);
      setHasMoreMessages(!!newLastKey);
    } catch (error) {
      console.error("Error fetching messages:", error);
      setLastKey(null);
      setHasMoreMessages(false);
    } finally {
      setLoading(false);
      setShouldRefresh(false); 
      isFetchingRef.current = false;
    }
  }, [conversationId, token]);

  const fetchParticipants = useCallback(async () => {
    if (!conversationId || !token) return;
    try {
      const res = await axios.get(`${baseURL}/api/conversations/${conversationId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      let rawParticipants = normalizeParticipants(res.data.participants);
      // Nếu participant là object có fullname/avatar_url thì dùng luôn, nếu không thì fetch từng user
      const userDetails = await Promise.all(
        rawParticipants.map(async (p) => {
          if (typeof p === 'object' && (p.fullname || p.avatar_url)) {
            return {
              id: p.id,
              fullname: p.fullname || p.name || `Unknown User (ID: ${p.id})`,
              avatar_url: p.avatar_url || p.avatar || '/default-avatar.png',
            };
          }
          // Nếu chỉ là ID, fetch user
          try {
            const userRes = await axios.get(`${baseURL}/api/users/${p}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            const user = userRes.data;
            return {
              id: user.id || p,
              fullname: user.fullname || user.name || `Unknown User (ID: ${p})`,
              avatar_url: user.avatar_url || user.avatar || '/default-avatar.png',
            };
          } catch (e) {
            return { id: p, fullname: `Unknown User (ID: ${p})`, avatar_url: '/default-avatar.png' };
          }
        })
      );
      setParticipants(userDetails);
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

  useEffect(() => {
    if (socket) {
      socket.on('new message', (message) => {
        if (message.conversation_id === conversationId) {
          const normalized = normalizeMessage(message);
          setMessages(prev => {
            if (prev.some(msg => msg.id === normalized.id)) return prev;
            return [...prev, normalized];
          });
          // Không gọi fetchMessages ở đây
        }
      });
      socket.on('message revoked', message => {
        if (message.conversation_id === conversationId) {
          setMessages(prev => 
            prev.map(msg => 
              msg.id === message.message_id 
                ? message : msg
            )
          );
        }
      }); 
      socket.on('message deleted', (message_id) => {
        console.log("Message deleted:", message_id);
        setMessages(prev => prev.filter(msg => msg.id !== message_id));
      });

      socket.on('message updated', (updatedMessage) => {
        if (updatedMessage.conversation_id === conversationId) {
          setMessages(prev =>
            prev.map(msg =>
              msg.id === updatedMessage.id
                ? { ...msg, content: updatedMessage.content, status: updatedMessage.status }
                : msg
            )
          );
        }
      });

      socket.on('user online', (userId) => {
        setUserStatuses((prev) => ({ ...prev, [userId]: 'online' }));
      });

      socket.on('user offline', (userId) => {
        setUserStatuses((prev) => ({ ...prev, [userId]: 'offline' }));
      });

      return () => {
        socket.off('new message');
        socket.off('message updated');
        socket.off('message revoked');
        socket.off('message deleted');
        socket.off('user online');
        socket.off('user offline');
      };
    }
  }, [socket, conversationId]);

  // Chỉ gọi fetchMessages khi shouldRefresh thay đổi
  useEffect(() => {
    if (shouldRefresh && !isFetchingRef.current) {
      fetchMessages(lastKey);
    }
  }, [shouldRefresh, fetchMessages, lastKey]);

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
        
        formData.append("file", file);
        formData.append("type", type);
        formData.append("content", newMessage );
        
        const response = await MessageAPI.sendImageAndText(formData, token);
        socket.emit('send message', response.message);
        socket.emit('update conversation', response.updatedConversation)
        if (response) {
          if (response.file_url) {
            storeFileName(response.file_url, file.name);
          }
          socket.emit('send message', response);
          setShouldRefresh(true); // Kích hoạt làm mới một lần
        }
      } else {
        const messageData = {
          conversation_id: conversationId,
          sender: Number(userId),
          receivers,
          content: newMessage,
          type: "TEXT",
        };
        const response = await MessageAPI.sendMessage(messageData, token);
        socket.emit('send message', response.message);
        socket.emit('update conversation', response.updatedConversation)
        setShouldRefresh(true); // Kích hoạt làm mới một lần
      }
  
      setNewMessage("");
      setSelectedImage(null);
      setSelectedDocument(null);
      setJustSentMessage(true); // Đánh dấu vừa gửi tin nhắn
    } catch (error) {
      console.error("Gửi thất bại:", error);
      alert(error.response?.data?.message || "Gửi tin nhắn thất bại. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeMessage = async (messageId) => {
    try {
      const messageToRevoke = messages.find(msg => msg.id === messageId);
      if (!messageToRevoke) {
        console.error("Message not found:", messageId);
        return;
      }

      if (Number(messageToRevoke.sender) !== Number(userId)) {
        alert("Bạn không thể thu hồi tin nhắn của người khác");
        return;
      }

      const response = await MessageAPI.revokeMessage(
        messageId, 
        { 
          sender: Number(userId),
          user_id: Number(userId), 
          conversation_id: conversationId 
        }, 
        token
      );

      socket.emit('revoke message', response.revokedMessage);
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

      if (messageToRevoke.file_url) {
        const fileNames = JSON.parse(localStorage.getItem('fileNames') || '{}');
        delete fileNames[messageToRevoke.file_url];
        localStorage.setItem('fileNames', JSON.stringify(fileNames));
      }
    } catch (error) {
      console.error("Error revoking message:", error);
      alert(error?.response?.data?.message || "Không thể thu hồi tin nhắn. Vui lòng thử lại.");
    }
  };

  const handleDeleteMessage = async (messageId) => {
    try {
      const messageToDelete = messages.find(msg => msg.id === messageId);
      if (!messageToDelete) {
        console.error("Message not found:", messageId);
        return;
      }

      if (Number(messageToDelete.sender) !== Number(userId)) {
        alert("Bạn không thể xóa tin nhắn của người khác");
        return;
      }

      const response = await MessageAPI.deleteMessage(
        messageId,
        {
          sender: Number(userId),
          user_id: Number(userId),
          conversation_id: conversationId
        },
        token
      );

      const socketData = {
        message_id: response.id,
        conversation_id: conversationId,
      };
      socket.emit('delete message', socketData);
      setMessages((prev) => prev.filter((msg) => msg.id !== messageId));

      if (messageToDelete.file_url) {
        const fileNames = JSON.parse(localStorage.getItem('fileNames') || '{}');
        delete fileNames[messageToDelete.file_url];
        localStorage.setItem('fileNames', JSON.stringify(fileNames));
      }
    } catch (error) {
      console.error("Error deleting message:", error);
      alert(error?.response?.data?.message || "Không thể xóa tin nhắn. Vui lòng thử lại.");
    }
  };

  const handleEditMessage = async (messageId) => {
    try {
      const messageToEdit = messages.find(msg => msg.id === messageId);
      if (!messageToEdit) return;
      if (editingContent.trim() === "") {
        alert("Nội dung không được để trống");
        return;
      }
      // Chỉ gửi content, tránh gửi dư thừa trường backend không cần
      const response = await MessageAPI.updateMessage(
        messageId,
        {
          conversation_id: conversationId,
          user_id: Number(userId),
          content: editingContent
        },
        token
      );
      if (response) {
        socket.emit('update message', response); // Gửi socket event để các client khác cập nhật
        setMessages(prev => prev.map(msg => msg.id === messageId ? { ...msg, content: editingContent, status: response.status } : msg));
        setEditingMessageId(null);
        setEditingContent("");
      }
    } catch (error) {
      // Hiển thị lỗi chi tiết hơn nếu có
      if (error?.response?.data?.message) {
        alert(error.response.data.message);
      } else if (error?.message) {
        alert(error.message);
      } else {
        alert("Cập nhật tin nhắn thất bại");
      }
    }
  };

  const onEmojiClick = (emoji) => {
    if (emoji?.emoji) setNewMessage((prev) => prev + emoji.emoji);
    setShowEmojiPicker(false);
  };

  const isSender = (messageSender) => {
    return Number(messageSender) === Number(userId);
  };

  const handleTyping = useCallback(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    sendTyping();
    typingTimeoutRef.current = setTimeout(() => {}, 1000);
  }, [sendTyping]);

  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.id !== lastSeenMessageId && lastMessage.sender !== userId) {
        sendSeen(lastMessage.id);
        setLastSeenMessageId(lastMessage.id);
      }
    }
  }, [messages, lastSeenMessageId, userId, sendSeen]);

  const handleInputChange = (e) => {
    setNewMessage(e.target.value);
    handleTyping();
  };

  // Scroll to bottom when conversationId changes or messages loaded for that conversation
  useEffect(() => {
    if (messagesEndRef.current && messages.length > 0) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
    setJustSentMessage(false);
  }, [conversationId, messages.length]);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    let prevScrollHeight = 0;
    let isFetching = false;
    const threshold = 100;

    const handleScroll = async () => {
      if (container.scrollTop < threshold && lastKey && !loading && !isFetching && !isFetchingRef.current) {
        isFetching = true;
        prevScrollHeight = container.scrollHeight;
        
        try {
          await fetchMessages(lastKey);
          requestAnimationFrame(() => {
            if (container) {
              const newScrollHeight = container.scrollHeight;
              container.scrollTop = newScrollHeight - prevScrollHeight;
            }
          });
        } catch (error) {
          console.error("Error in scroll handler:", error);
        } finally {
          isFetching = false;
        }
      }
    };

    let scrollTimeout;
    const debouncedScroll = () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(handleScroll, 100);
    };

    container.addEventListener('scroll', debouncedScroll);
    return () => {
      container.removeEventListener('scroll', debouncedScroll);
      clearTimeout(scrollTimeout);
    };
  }, [lastKey, loading, fetchMessages]);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    let startY = 0;
    let isDragging = false;
    let dragDistance = 0;
    let isLoadingByDrag = false;
    const threshold = 60;
    let loadingDiv = null;

    const onMouseDown = (e) => {
      if (container.scrollTop === 0 && e.button === 0 && !loading && lastKey && !isFetchingRef.current) {
        isDragging = true;
        startY = e.clientY;
        dragDistance = 0;
      }
    };

    const onMouseMove = (e) => {
      if (isDragging && !loading) {
        dragDistance = e.clientY - startY;
        if (dragDistance > 0) {
          if (!loadingDiv) {
            loadingDiv = document.createElement('div');
            loadingDiv.className = 'text-center text-muted mb-2';
            loadingDiv.style.transition = 'height 0.2s';
            loadingDiv.style.height = '0px';
            loadingDiv.style.overflow = 'hidden';
            container.prepend(loadingDiv);
          }
          
          const newHeight = Math.min(dragDistance, threshold);
          loadingDiv.style.height = newHeight + 'px';
          
          if (dragDistance > threshold) {
            loadingDiv.innerText = 'Thả chuột để tải thêm tin nhắn';
            loadingDiv.style.color = '#0d6efd';
          } else {
            loadingDiv.innerText = 'Kéo xuống để tải thêm tin nhắn...';
            loadingDiv.style.color = '#6c757d';
          }
        }
      }
    };

    const onMouseUp = async (e) => {
      if (isDragging) {
        isDragging = false;
        if (dragDistance > threshold && lastKey && !loading && !isLoadingByDrag && !isFetchingRef.current) {
          isLoadingByDrag = true;
          if (loadingDiv) {
            loadingDiv.innerText = 'Đang tải...';
            loadingDiv.style.color = '#0d6efd';
          }
          
          try {
            await fetchMessages(lastKey);
          } catch (error) {
            console.error('Error loading more messages:', error);
            if (loadingDiv) {
              loadingDiv.innerText = 'Lỗi khi tải tin nhắn';
              loadingDiv.style.color = '#dc3545';
            }
          } finally {
            if (loadingDiv) {
              setTimeout(() => {
                loadingDiv.remove();
                loadingDiv = null;
              }, 1000);
            }
            isLoadingByDrag = false;
          }
        } else {
          if (loadingDiv) {
            loadingDiv.style.height = '0px';
            setTimeout(() => {
              loadingDiv.remove();
              loadingDiv = null;
            }, 200);
          }
        }
        dragDistance = 0;
      }
    };

    container.addEventListener('mousedown', onMouseDown);
    container.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    return () => {
      container.removeEventListener('mousedown', onMouseDown);
      container.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      if (loadingDiv) loadingDiv.remove();
    };
  }, [lastKey, loading, fetchMessages]);

  const getAvatarUrl = (sender) => {
    if (!sender) return '/OIP.png';
    if (sender.avatar_url) return sender.avatar_url;
    if (sender.UserDetails && sender.UserDetails.avatar_url) return sender.UserDetails.avatar_url;
    return '/OIP.png';
  };

  // Thêm hàm fetchUserDetailIfNeeded ở ngoài render
  const fetchUserDetailIfNeeded = useCallback(async (userIdToFetch) => {
    if (!userIdToFetch || participants.some(p => Number(p.id) === Number(userIdToFetch))) return;
    try {
      const res = await axios.get(`${baseURL}/api/userDetails/${userIdToFetch}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const user = res.data;
      setParticipants(prev => {
        if (prev.some(p => Number(p.id) === Number(user.id))) return prev;
        return [
          ...prev,
          {
            id: user.id,
            fullname: user.fullname || user.name || `Unknown User (ID: ${user.id})`,
            avatar_url: user.avatar_url || user.avatar || '/default-avatar.png',
          },
        ];
      });
    } catch (e) {
      // Không làm gì nếu lỗi
    }
  }, [participants, token, baseURL]);

  // Fetch user detail cho các sender chưa có trong participants
  useEffect(() => {
    const missingUserIds = messages
      .map(m => m.sender)
      .filter(senderId => senderId && !participants.some(p => Number(p.id) === Number(senderId)));
    if (missingUserIds.length > 0) {
      missingUserIds.forEach(uid => fetchUserDetailIfNeeded(uid));
    }
  }, [messages, participants, fetchUserDetailIfNeeded]);

  // Debounce handleSend để chống spam khi nhấn Enter liên tục
  const debouncedHandleSend = useRef(null);
  useEffect(() => {
    debouncedHandleSend.current = debounce(() => {
      if (!loading) handleSend();
    }, 500); // 500ms giữa 2 lần gửi
  }, [loading, handleSend]);

  return (
    <div className="d-flex flex-column h-100 border rounded">
      <div className="p-3 bg-primary text-white d-flex justify-content-between align-items-center">
        <div className="d-flex align-items-center">
          {/* Hiển thị avatar của đối phương (nếu là chat 1-1) hoặc avatar nhóm */}
          {participants.length === 2 && (() => {
            const other = participants.find(p => String(p.id) !== String(userId));
            return other ? (
              <img
                key={other.id}
                src={other.avatar_url || '/OIP.png'}
                alt="Avatar"
                className="rounded-circle me-2"
                style={{ width: 40, height: 40, objectFit: 'cover', background: '#fff' }}
                onError={e => { e.target.src = '/OIP.png'; }}
              />
            ) : null;
          })()}
          {participants.length > 2 && (
            <img
              src={'/OIP.png'}
              alt="Group Avatar"
              className="rounded-circle me-2"
              style={{ width: 40, height: 40, objectFit: 'cover', background: '#fff' }}
              onError={e => { e.target.src = '/OIP.png'; }}
            />
          )}
          <div>
            <h5 className="mb-0">{conversationName || "Chọn cuộc trò chuyện"}</h5>
            
          </div>
        </div>
        {isTyping && typingUser && (
          <small className="text-white-50">
            {participants.find(p => p.id === typingUser)?.fullname || 'Someone'} đang nhập...
          </small>
        )}
      </div>

      <div 
        id="messagesContainer"
        ref={messagesContainerRef}
        className="flex-grow-1 p-3 overflow-y-scroll custom-scroll bg-light" 
        style={{ maxHeight: "500px", display: "flex", flexDirection: "column" }}
      >
        {loading && messages.length === 0 ? (
          <div className="text-center">
            <div className="spinner-border" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-2">Đang tải tin nhắn...</p>
          </div>
        ) : messages.length === 0 ? (
          <p className="text-center text-muted">Chưa có tin nhắn nào</p>
        ) : (
          messages.map((msg, idx) => {
            if (msg.status === "DELETED") return null;

            const messageType = msg.message_type?.toLowerCase();
            const isImage = messageType === "image" || messageType === "image_text";
            const isFile = messageType === "file";
            const sender = participants.find(p => Number(p.id) === Number(msg.sender));
            const avatarUrl = sender && sender.avatar_url ? sender.avatar_url : '/OIP.png';
            let senderName = 'Unknown User';
            if (sender) {
              senderName = sender.fullname || sender.name || `Unknown User (ID: ${sender.id ?? msg.sender})`;
            } else if (msg.sender !== undefined && msg.sender !== null) {
              senderName = `Unknown User (ID: ${msg.sender})`;
            }

            return (
              <div
                key={msg.id || idx}
                className={`d-flex mb-2 ${isSender(msg.sender) ? "justify-content-end" : "justify-content-start"}`}
                onContextMenu={(e) => {
                  e.preventDefault();
                  if (isSender(msg.sender) && msg.status !== "REVOKED") {
                    setContextMenu({ x: e.clientX, y: e.clientY, messageId: msg.id });
                  }
                }}
              >
                {/* Hiển thị avatar user cho tin nhắn không phải của mình */}
                {!isSender(msg.sender) && (
                  <div className="me-2 text-center" style={{ minWidth: 40, maxWidth: 40 }}>
                    <img
                      src={avatarUrl}
                      alt="Avatar"
                      className="rounded-circle mb-1"
                      style={{ width: "40px", height: "40px", objectFit: "cover", background: "#fff" }}
                      onError={e => { e.target.src = '/OIP.png'; }}
                    />
                  </div>
                )}
                <div
                  className={`p-2 rounded ${isSender(msg.sender) ? "bg-primary text-white" : "bg-secondary text-white"}`}
                  style={{ maxWidth: "70%" }}
                >
                  {editingMessageId === msg.id ? (
                    <div className="d-flex align-items-center">
                      <input
                        type="text"
                        className="form-control me-2"
                        value={editingContent}
                        onChange={e => setEditingContent(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === "Enter") {
                            handleEditMessage(msg.id);
                          } else if (e.key === "Escape") {
                            setEditingMessageId(null);
                            setEditingContent("");
                          }
                        }}
                        autoFocus
                      />
                      <button className="btn btn-success btn-sm me-1" onClick={() => handleEditMessage(msg.id)}>Lưu</button>
                      <button className="btn btn-secondary btn-sm" onClick={() => { setEditingMessageId(null); setEditingContent(""); }}>Hủy</button>
                    </div>
                  ) : msg.status === "REVOKED" ? (
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
                      {(msg.image_url || msg.url) ? (
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
                          onClick={() => setViewingImageUrl(msg.image_url || msg.url)}
                          onError={(e) => {
                            console.error("Image load error for URL:", {
                              url: msg.url,
                              image_url: msg.image_url
                            });
                            e.target.style.display = 'none';
                          }}
                        />
                      ) : null}
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
                          {formatFileName(msg.fileName)}
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
        {loading && messages.length > 0 && lastKey && (
          <div className="text-center text-muted mb-2">
            <div className="spinner-border spinner-border-sm me-2" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            Đang tải thêm tin nhắn...
          </div>
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
        <button className="btn btn-light me-2 bi bi-emoji-kiss-fill" onClick={() => setShowEmojiPicker((prev) => !prev)}></button>
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
          onChange={handleInputChange}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !loading) {
              debouncedHandleSend.current();
            }
          }}
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
            onClick={async () => {
              const msg = messages.find(m => m.id === contextMenu.messageId);
              if (msg) {
                let text = msg.content;
                if ((!text || text.trim() === "") && msg.message_type === "image") text = msg.image_url || msg.url;
                if ((!text || text.trim() === "") && msg.message_type === "file") text = msg.file_url;
                if (text) {
                  try {
                    await navigator.clipboard.writeText(text);
                    // Optional: thông báo nhỏ
                  } catch {
                    alert("Không thể sao chép vào clipboard");
                  }
                }
              }
              setContextMenu(null);
            }}
          >
            <i className="bi bi-clipboard me-2"></i>
            Sao chép
          </button>
          <div className="dropdown-divider"></div>
          <button
            className="dropdown-item d-flex align-items-center"
            onClick={() => {
              setEditingMessageId(contextMenu.messageId);
              const msg = messages.find(m => m.id === contextMenu.messageId);
              setEditingContent(msg?.content || "");
              setContextMenu(null);
            }}
          >
            <i className="bi bi-pencil-square me-2"></i>
            Chỉnh sửa
          </button>
          <div className="dropdown-divider"></div>
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

      {viewingImageUrl && (
        <div
          className="modal show d-block"
          tabIndex="-1"
          style={{ background: "rgba(0,0,0,0.7)", position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center" }}
          onClick={() => setViewingImageUrl(null)}
        >
          <ZoomableImageModal imageUrl={viewingImageUrl} onClose={() => setViewingImageUrl(null)} />
        </div>
      )}
    </div>
  );
};

export default ChatBox;

// Thêm component ZoomableImageModal ở cuối file
const ZoomableImageModal = ({ imageUrl, onClose }) => {
  const [zoom, setZoom] = useState(1);
  const [drag, setDrag] = useState({ x: 0, y: 0, startX: 0, startY: 0, isDragging: false });
  const imgRef = useRef(null);
  const containerRef = useRef(null);

  // Zoom bằng chuột
  const handleWheel = (e) => {
    e.preventDefault();
    setZoom(z => {
      let next = e.deltaY < 0 ? Math.min(z + 0.1, 3) : Math.max(z - 0.1, 0.2);
      return Math.round(next * 100) / 100;
    });
  };

  // Kéo ảnh khi zoom lớn hơn 1
  const handleMouseDown = (e) => {
    if (zoom <= 1) return;
    setDrag(d => ({ ...d, isDragging: true, startX: e.clientX - d.x, startY: e.clientY - d.y }));
    document.body.style.cursor = 'grab';
  };
  const handleMouseMove = (e) => {
    if (!drag.isDragging) return;
    setDrag(d => ({ ...d, x: e.clientX - d.startX, y: e.clientY - d.startY }));
  };
  const handleMouseUp = () => {
    if (drag.isDragging) {
      setDrag(d => ({ ...d, isDragging: false }));
      document.body.style.cursor = '';
    }
  };
  useEffect(() => {
    if (drag.isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [drag.isDragging]);

  // Reset zoom và vị trí khi đổi ảnh
  useEffect(() => {
    setZoom(1);
    setDrag({ x: 0, y: 0, startX: 0, startY: 0, isDragging: false });
  }, [imageUrl]);

  // Đảm bảo ảnh không bị kéo ra ngoài quá nhiều
  useEffect(() => {
    if (zoom <= 1) setDrag({ x: 0, y: 0, startX: 0, startY: 0, isDragging: false });
  }, [zoom]);

  // Phím tắt ESC để đóng
  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  // Nút zoom
  const handleZoomIn = () => setZoom(z => Math.min(z + 0.2, 3));
  const handleZoomOut = () => setZoom(z => Math.max(z - 0.2, 0.2));
  const handleReset = () => { setZoom(1); setDrag({ x: 0, y: 0, startX: 0, startY: 0, isDragging: false }); };

  return (
    <div
      ref={containerRef}
      style={{
        position: "relative",
        maxWidth: "90vw",
        maxHeight: "90vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        margin: "auto",
        marginTop: "70px",
        background: "#222",
        borderRadius: 16,
        boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
        overflow: "hidden"
      }}
      onClick={e => e.stopPropagation()}
    >
      <img
        ref={imgRef}
        src={imageUrl}
        alt="Full size"
        style={{
          maxWidth: "100%",
          maxHeight: "80vh",
          borderRadius: "10px",
          background: "#fff",
          display: "block",
          margin: "auto",
          boxShadow: "0 2px 16px rgba(0,0,0,0.25)",
          cursor: zoom > 1 ? (drag.isDragging ? 'grabbing' : 'grab') : 'auto',
          transform: `scale(${zoom}) translate(${drag.x / zoom}px, ${drag.y / zoom}px)`,
          transition: drag.isDragging ? 'none' : 'transform 0.2s',
          userSelect: 'none',
        }}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        draggable={false}
      />
      <button
        onClick={onClose}
        style={{ position: "absolute", top: 10, right: 10, background: "rgba(0,0,0,0.6)", color: "#fff", border: "none", borderRadius: "50%", width: 36, height: 36, fontSize: 22, cursor: "pointer", boxShadow: "0 2px 8px rgba(0,0,0,0.2)" }}
        aria-label="Đóng"
      >
        ×
      </button>
      <a
        href={imageUrl}
        download={(() => {
          try {
            const urlParts = imageUrl.split("/");
            let fileName = urlParts[urlParts.length - 1].split('?')[0];
            return decodeURIComponent(fileName) || 'image.jpg';
          } catch {
            return 'image.jpg';
          }
        })()}
        target="_blank"
        rel="noopener noreferrer"
        style={{ position: "absolute", top: 10, left: 10, background: "rgba(0,0,0,0.6)", color: "#fff", border: "none", borderRadius: "50%", width: 36, height: 36, fontSize: 18, cursor: "pointer", boxShadow: "0 2px 8px rgba(0,0,0,0.2)", display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}
        title="Tải ảnh này"
      >
        <i className="bi bi-download"></i>
      </a>
      <div style={{ position: "absolute", bottom: 24, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 12, background: "rgba(0,0,0,0.4)", borderRadius: 24, padding: "6px 18px", boxShadow: "0 2px 8px rgba(0,0,0,0.15)" }}>
        <button className="btn btn-light btn-sm" style={{ fontWeight: 700, fontSize: 18, width: 32, height: 32, borderRadius: "50%" }} onClick={handleZoomOut} title="Thu nhỏ">−</button>
        <button className="btn btn-light btn-sm" style={{ fontWeight: 700, fontSize: 15, width: 40, borderRadius: 16 }} onClick={handleReset} title="Về mặc định">100%</button>
        <button className="btn btn-light btn-sm" style={{ fontWeight: 700, fontSize: 18, width: 32, height: 32, borderRadius: "50%" }} onClick={handleZoomIn} title="Phóng to">+</button>
      </div>
      <div style={{ position: "absolute", bottom: 8, right: 24, color: "#fff", fontSize: 13, opacity: 0.7, textShadow: "0 1px 4px #000" }}>
        <span>{Math.round(zoom * 100)}%</span>
      </div>
    </div>
  );
};

