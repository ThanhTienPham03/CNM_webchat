import React, { useEffect, useState } from 'react';
import ConversationApi from '../../api/conversationAPI';

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
    }, 1000); // Refresh every 5 seconds

    return () => clearInterval(interval);
  }, [userId, accessToken]);

  if (loading) return <div>Loading conversations...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!conversations || conversations.length === 0) return <div>No conversations found.</div>;

  return (
    <div className="chat-list">
      <h2>Danh sách cuộc trò chuyện</h2>
      <ul className="list-group">
        {conversations.map((conversation, index) => (
          <li
            key={conversation.id || index}
            className="list-group-item d-flex align-items-center"
            onClick={() => onConversationSelect(conversation.id, conversation.name)}
            style={{ cursor: 'pointer', padding: '10px', borderBottom: '1px solid #ddd' }}
          >
            <img
              src={conversation.avatar || '/OIP.png'}
              alt={`${conversation.name || 'User'}'s avatar`}
              className="rounded-circle me-3"
              style={{ width: '50px', height: '50px', objectFit: 'cover', border: '2px solid #007bff' }}
            />
            <div className="flex-grow-1">
              <div className="d-flex justify-content-between align-items-center">
                <strong style={{ fontSize: '1rem', color: '#333' }}>
                  {conversation.name || `Conversation ${index + 1}`}
                </strong>
                <small className="text-muted" style={{ fontSize: '0.8rem' }}>
                  {conversation.time || ''}
                </small>
              </div>
              <p className="text-muted mb-0" style={{ fontSize: '0.9rem', marginTop: '5px' }}>
                {typeof conversation.lastMessage === 'object' && conversation.lastMessage !== null
                  ? (conversation.lastMessage.status === 'REVOKED'
                      ? 'Tin nhắn đã được thu hồi'
                      : (conversation.lastMessage.content || conversation.lastMessage.updated_at || 'No message content'))
                  : (conversation.lastMessage || 'No message available')}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ChatList;