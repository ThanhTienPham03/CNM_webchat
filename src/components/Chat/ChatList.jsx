import React, { useEffect, useState } from 'react';
import ConversationApi from '../../api/conversationAPI';
import Navbar from '../Header/Navbar';

const ChatList = ({ userId, accessToken, onConversationSelect }) => {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const getListConversation = async () => {
    try {
      if (!accessToken || !userId) throw new Error("Token or userId is missing");
      const data = await ConversationApi.fetchConversationsByUserId(userId, accessToken);
      setConversations(data || []);
    } catch (error) {
      setError(error.message);
      console.error("Fetch error:", error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getListConversation();
  }, [userId, accessToken]);

  useEffect(() => {
    const interval = setInterval(() => {
      getListConversation();
    }, 5000); // Refresh every 5 seconds

    return () => clearInterval(interval);
  }, [userId, accessToken]);

  const formatTime = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) return <div>Đang tải danh sách cuộc trò chuyện...</div>;
  if (error) return <div className="text-danger">Lỗi: {error}</div>;
  if (!conversations || conversations.length === 0) return <div>Không có cuộc trò chuyện nào.</div>;

  return (
    <div className="chat-list container " style={{ border: '1px solid #dee2e6', borderRadius: '8px', padding: '1rem' }}>
      {/* <Navbar /> */}
      <h2 className="text-start mb-2 text-primary">Danh sách cuộc trò chuyện</h2>

      <ul className="list-group">
        {conversations.map((conversation, index) => (
          <li
            key={conversation.id || index}
            className="list-group-item d-flex align-items-center conversation-item p-3"
            onClick={() => onConversationSelect(conversation.id, conversation.name)}
            style={{
              cursor: 'pointer',
              transition: 'background-color 0.3s',
              border: '1px solid #dee2e6',
              borderRadius: '8px',
              marginBottom: '0.5rem',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8f9fa')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'white')}
          >
            <img
              src={conversation.avatar || '/OIP.png'}
              alt="Avatar"
              className="rounded-circle me-3 border border-primary"
              style={{ width: '50px', height: '50px', objectFit: 'cover' }}
            />
            <div className="flex-grow-1">
              <div className="d-flex justify-content-between align-items-center">
                <strong className="text-primary fs-5">
                  {conversation.name || `Cuộc trò chuyện ${index + 1}`}
                </strong>
                <small className="text-muted">
                  {formatTime(conversation.time)}
                </small>
              </div>
              <p className="text-muted mb-0 mt-1" style={{ fontSize: '0.95rem' }}>
                {typeof conversation.lastMessage === 'object' && conversation.lastMessage !== null
                  ? conversation.lastMessage.status === 'REVOKED'
                    ? 'Tin nhắn đã được thu hồi'
                    : conversation.lastMessage.content || formatTime(conversation.lastMessage.updated_at)
                  : conversation.lastMessage || ''}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ChatList;
